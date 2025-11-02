import argparse
import json
import os
import sys
import math
import csv
from typing import List, Optional

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from collections import deque
import random
from tqdm import tqdm

# Use a non-interactive backend for headless servers
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# -------------------------- Environment -------------------------
class WateringEnv:
    def __init__(self, weather_forecast, crop_need,
                 initial_moisture=0.5,
                 wilting_point=0.20, saturation=0.80, max_days=7):
        self.weather_forecast = weather_forecast
        self.crop_need = crop_need
        self.wilting_point = wilting_point
        self.saturation = saturation
        self.max_days = max_days
        self.reset(initial_moisture)  # Use reset to initialize all fields

    def reset(self, initial_moisture=None):
        # Allow initial_moisture to be specified for testing/demo
        if initial_moisture is not None:
            self.moisture = float(initial_moisture)
        else:
            # Random initial moisture for training
            self.moisture = np.random.uniform(0.3, 0.7)
       
        self.prev_moisture = self.moisture
        self.day = 0
        self.done = False
        return self.get_state()

    def get_state(self):
        # Max forecast is 7 days (index 0 to 6), total 14 features (7 rain, 7 et)
        max_forecast_len = 7
        remaining_forecast_days = min(max_forecast_len, self.max_days - self.day)

        rain = [self.weather_forecast[self.day + i]['rain']
                for i in range(remaining_forecast_days)]
        et = [self.weather_forecast[self.day + i]['et']
              for i in range(remaining_forecast_days)]
       
        # Pad to max length (7 days of rain + 7 days of ET = 14)
        flat = np.array(rain + et, dtype=np.float32)
        flat = np.pad(flat, (0, 14 - len(flat)), constant_values=0.0)
       
        delta = self.moisture - self.prev_moisture
        return np.concatenate(([self.moisture, delta, self.crop_need], flat))

    def step(self, action_idx):
        # 21 actions: 0.0, 0.5, 1.0, ..., 10.0 mm
        water = action_idx * 0.5
        wth = self.weather_forecast[self.day]

        # Soil Moisture Balance: Rain + Irrigation - Evapotranspiration (ET)
        delta = (wth['rain'] + water - wth['et']) / 100.0 # /100.0 to convert mm change to fraction of 1.0
        self.prev_moisture = self.moisture
        self.moisture = np.clip(self.moisture + delta, 0.0, 1.0)

        # ---- Improved reward shaping ----
        reward = -water * 0.1  # cost per mm

        # Penalty near wilting (0.30 - 0.20 range)
        if self.moisture < 0.30:
            dist_to_warn = 0.30 - self.moisture
            reward -= 50 * dist_to_warn ** 2 # Increased penalty weight for stability

        # Hard terminal wilt
        if self.moisture < self.wilting_point:
            reward -= 200 # Increased terminal penalty
            self.done = True

        # Over-watering penalty
        if self.moisture > self.saturation:
            dist_to_sat = self.moisture - self.saturation
            reward -= 10 * dist_to_sat # Increased penalty

        self.day += 1
        self.done = self.done or (self.day >= self.max_days)
        return self.get_state(), reward, self.done, {}

# --------------------------- DQN Model -------------------------
class DQN(nn.Module):
    def __init__(self, state_size, action_size):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_size, 128), nn.ReLU(),
            nn.Linear(128, 128), nn.ReLU(),
            nn.Linear(128, action_size)
        )

    def forward(self, x):
        return self.net(x)

# --------------------------- Replay Buffer --------------------
class ReplayBuffer:
    def __init__(self, capacity=100000):
        self.buf = deque(maxlen=capacity)

    def push(self, *data):
        self.buf.append(tuple(data))

    def sample(self, batch_size):
        batch = random.sample(self.buf, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        return np.stack(states), np.stack(actions), np.stack(rewards), np.stack(next_states), np.stack(dones)

    def __len__(self):
        return len(self.buf)

# --------------------------- Training Loop --------------------
def train_dqn(env, episodes=10000, batch_size=128, tau=0.005, gamma=0.99, lr=3e-4, seed: Optional[int]=None, use_tqdm=True):
    if seed is not None:
        random.seed(seed)
        np.random.seed(seed)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

    state_size = len(env.get_state())
    action_size = 21
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    policy_net = DQN(state_size, action_size).to(device)
    target_net = DQN(state_size, action_size).to(device)
    target_net.load_state_dict(policy_net.state_dict())
    target_net.eval()

    optimizer = optim.Adam(policy_net.parameters(), lr=lr)
    memory = ReplayBuffer(capacity=100000)
    losses = []

    eps = 1.0
    eps_min = 0.05
    eps_decay = 0.9995 # Slower decay for more exploration

    pbar = tqdm(range(episodes), desc="Training", disable=not use_tqdm)

    for ep in pbar:
        state = env.reset()
        total_r = 0.0
        done = False

        while not done:
            state_t = torch.FloatTensor(state).unsqueeze(0).to(device)

            if random.random() < eps:
                action = random.randint(0, action_size - 1)
            else:
                with torch.no_grad():
                    action = policy_net(state_t).argmax(1).item()

            next_state, reward, done, _ = env.step(action)
            memory.push(state, action, reward, next_state, done)
            state = next_state
            total_r += reward

            if len(memory) >= batch_size:
                s, a, r, ns, d = memory.sample(batch_size)
               
                # Convert to Tensors
                s = torch.FloatTensor(s).to(device)
                ns = torch.FloatTensor(ns).to(device)
                a = torch.LongTensor(a).to(device).unsqueeze(1)
                r = torch.FloatTensor(r).to(device)
                d = torch.FloatTensor(d).to(device)

                # Double DQN (Standard implementation)
                with torch.no_grad():
                    # Select best action from POLICY net for next state
                    next_actions = policy_net(ns).argmax(1, keepdim=True)
                    # Evaluate best action using TARGET net
                    next_q = target_net(ns).gather(1, next_actions).squeeze(1)
                    target = r + gamma * next_q * (1 - d)

                current_q = policy_net(s).gather(1, a).squeeze(1)
                loss = nn.SmoothL1Loss()(current_q, target)

                optimizer.zero_grad()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(policy_net.parameters(), 1.0)
                optimizer.step()

                # Soft target update
                for target_param, policy_param in zip(target_net.parameters(), policy_net.parameters()):
                    target_param.data.copy_(tau * policy_param.data + (1.0 - tau) * target_param.data)

                losses.append(loss.item())

        eps = max(eps_min, eps * eps_decay)

        if use_tqdm and ep % 100 == 0:
            pbar.set_postfix({
                'R': f'{total_r:+.1f}',
                'ε': f'{eps:.3f}',
                'L': f'{np.mean(losses[-100:]):.3f}' if losses else ''
            })

    return policy_net, losses

# --------------------- Policy Runner ---------------------
def run_policy(env, net, start_moisture=0.5):
    env.reset(start_moisture)
    state = env.get_state()
    schedule = []
    total_water = 0.0
    moistures = [env.moisture] # Initial moisture at Day 0
    device = next(net.parameters()).device

    while not env.done:
        s_t = torch.FloatTensor(state).unsqueeze(0).to(device)
        with torch.no_grad():
            action_idx = net(s_t).argmax(1).item()
       
        water = action_idx * 0.5
        schedule.append(water)
        total_water += water
       
        # Take step, get next state, reward, done
        state, _, done, _ = env.step(action_idx)
       
        # Append moisture after the step (end of day)
        moistures.append(env.moisture)

    return schedule, total_water, moistures

# --------------------- Helpers to parse inputs ---------------------
def parse_series_arg(arg: str) -> List[float]:
    # Accept "1,2,3", path.json, or path.csv (single column or with header)
    arg = arg.strip()
    if os.path.isfile(arg):
        if arg.lower().endswith(".json"):
            with open(arg, "r", encoding="utf-8") as f:
                data = json.load(f)
            # If the JSON is just a list, return it; if it has a key "et" assume that
            if isinstance(data, list):
                return [float(x) for x in data]
            elif isinstance(data, dict):
                # pick first list field
                for key in ("et","rain","series","data"):
                    if key in data and isinstance(data[key], list):
                        return [float(x) for x in data[key]]
                raise ValueError("JSON file must contain a list or a key with a list (e.g., 'et').")
            else:
                raise ValueError("Unsupported JSON format for series.")
        elif arg.lower().endswith(".csv"):
            vals = []
            with open(arg, newline='', encoding="utf-8") as f:
                reader = csv.reader(f)
                for row in reader:
                    # skip empty lines
                    row = [c for c in row if c.strip() != ""]
                    if not row:
                        continue
                    # take first numeric cell
                    vals.append(float(row[0]))
            if not vals:
                raise ValueError("CSV appears empty.")
            return vals
        else:
            raise ValueError("Only .json or .csv files are supported for series input.")
    # Comma/space separated inline list
    parts = [p for p in arg.replace(";", ",").replace("|", ",").replace(" ", ",").split(",") if p.strip() != ""]
    if not parts:
        raise ValueError("Empty series.")
    return [float(p) for p in parts]

def make_forecast(et: List[float], rain: Optional[List[float]], max_days: Optional[int]) -> List[dict]:
    if max_days is None:
        max_days = len(et)
    if rain is None:
        rain = [0.0] * max_days
    if len(et) < max_days:
        raise ValueError(f"ET length ({len(et)}) shorter than max_days ({max_days}).")
    if len(rain) < max_days:
        raise ValueError(f"Rain length ({len(rain)}) shorter than max_days ({max_days}).")
    return [{'rain': float(rain[i]), 'et': float(et[i])} for i in range(max_days)]

# --------------------- CLI ---------------------
def main():
    ap = argparse.ArgumentParser(description="Train and run a DQN watering policy.")
    ap.add_argument("--crop-need", type=float, required=True, help="Crop need (e.g., 3.0).")
    ap.add_argument("--et", type=str, required=True, help="ET time-series: '5,5,5' or path to .json/.csv")
    ap.add_argument("--rain", type=str, default=None, help="Rain time-series (optional): '0,0,0' or path to .json/.csv")
    ap.add_argument("--initial-moisture", type=float, default=0.5, help="Initial soil moisture fraction [0..1].")
    ap.add_argument("--max-days", type=int, default=None, help="Simulation days (defaults to len(ET)).")
    ap.add_argument("--episodes", type=int, default=1000, help="Training episodes.")
    ap.add_argument("--batch-size", type=int, default=128, help="Batch size.")
    ap.add_argument("--tau", type=float, default=0.005, help="Soft target update factor.")
    ap.add_argument("--gamma", type=float, default=0.99, help="Discount factor.")
    ap.add_argument("--lr", type=float, default=3e-4, help="Learning rate.")
    ap.add_argument("--seed", type=int, default=None, help="Random seed.")
    ap.add_argument("--save-model", type=str, default=None, help="Path to save trained model (.pt).")
    ap.add_argument("--save-plot", type=str, default=None, help="Path to save moisture plot (PNG).")
    ap.add_argument("--no-tqdm", action="store_true", help="Disable progress bar.")
    ap.add_argument("--json-out", type=str, default=None, help="Path to write JSON result; defaults to stdout.")
    args = ap.parse_args()

    et_list = parse_series_arg(args.et)
    rain_list = parse_series_arg(args.rain) if args.rain else None
    forecast = make_forecast(et_list, rain_list, args.max_days)
    max_days = len(forecast)

    env = WateringEnv(forecast, crop_need=args.crop_need, initial_moisture=args.initial_moisture, max_days=max_days)

    policy_net, loss_history = train_dqn(
        env,
        episodes=args.episodes,
        batch_size=args.batch_size,
        tau=args.tau,
        gamma=args.gamma,
        lr=args.lr,
        seed=args.seed,
        use_tqdm=not args.no_tqdm and sys.stdout.isatty()
    )

    schedule, total_water, moistures = run_policy(env, policy_net, start_moisture=args.initial_moisture)

    # Optionally save model
    if args.save_model:
        torch.save({
            "state_dict": policy_net.state_dict(),
            "state_size": len(env.get_state()),
            "action_size": 21,
        }, args.save_model)

    # Optionally save plot
    if args.save_plot:
        plt.figure(figsize=(9,5))
        days = list(range(len(moistures)))
        plt.plot(days, moistures, 'o-', label='Soil Moisture', color='blue')
        plt.axhspan(env.wilting_point, env.saturation, color='lightgreen', alpha=0.3, label='Comfort Zone')
        plt.axhline(env.wilting_point, color='red', linestyle='--', label='Wilting Point')
        plt.axhline(env.saturation, color='orange', linestyle='--', label='Saturation')
        plt.title("Soil Moisture Trajectory (Learned Policy)")
        plt.xlabel("Day")
        plt.ylabel("Moisture Level")
        plt.xticks(days)
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(args.save_plot, dpi=150)
        plt.close()

    result = {
        "schedule_mm": schedule,
        "total_water_mm": round(float(total_water), 3),
        "final_moisture": round(float(moistures[-1]), 4),
        "avg_loss_last_500": (float(np.mean(loss_history[-500:])) if loss_history else None),
        "episodes": args.episodes,
        "days": max_days
    }

    out_str = json.dumps(result)
    if args.json_out:
        with open(args.json_out, "w", encoding="utf-8") as f:
            f.write(out_str)
    else:
        print(out_str)

if __name__ == "__main__":
    main()