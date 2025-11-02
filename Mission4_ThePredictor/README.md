# 🌾 Mission 4 – *The Learning Roots*
**WiEmpower Hackathon 2025**

## 🤖 Overview
Mission 4 introduces an **AI agent that learns how to water crops optimally** using **Reinforcement Learning (Deep Q-Network, DQN)**.  

Instead of manually setting irrigation rules, this model **learns from simulation** — balancing between saving water and maintaining soil moisture in the healthy range 🌱.

The environment simulates **7-day weather**, **crop needs**, and **soil moisture dynamics**, teaching the model how to make daily irrigation decisions.

---

## 🧠 Core Idea

The DQN agent interacts with a virtual environment (`WateringEnv`) that models the **soil–plant–atmosphere** system.

Every day:
1. It observes the state (soil moisture, crop need, weather forecast)
2. Chooses how much water to apply (0 → 10 mm/day)
3. Receives a reward:
   - ✅ Positive for maintaining healthy soil moisture  
   - ⚠️ Negative for over-watering or letting the plant wilt  
   - 💰 Small penalty for using excess water  

Over thousands of simulated days, the agent **learns a water-efficient policy** that can generalize to real-world conditions.

---

## 🧩 System Architecture

```text
                ┌──────────────────────────────────┐
                │        DQN Irrigation Agent       │
                │----------------------------------│
                │ Learns optimal irrigation policy  │
                │ Uses Deep Neural Network (PyTorch)│
                └──────────────┬───────────────────┘
                               │ actions (0–10 mm)
                               ▼
   ┌────────────────────────────────────────────────┐
   │                WateringEnv (Simulator)          │
   │------------------------------------------------│
   │ - Rain, ET, Crop Need (from backend/API)        │
   │ - Soil Moisture Balance (Rain + Irrigation - ET)│
   │ - Reward based on crop health & water usage     │
   └────────────────────────────────────────────────┘
```

---

## ⚙️ Features

✅ Realistic **soil moisture simulation**  
✅ **Reward shaping** encourages sustainable irrigation  
✅ Integrates with backend API for **ET & crop data**  
✅ Visualizes **learning performance** and **moisture trajectory**  
✅ Built with **PyTorch + Numpy + Matplotlib**  
✅ Modular: can connect to **Mission 1–3 outputs**  

---

## 🧠 Reinforcement Learning Details

| Parameter | Description |
|------------|-------------|
| **Algorithm** | Deep Q-Network (DQN) |
| **State** | Soil moisture, delta moisture, crop need, 7-day rain & ET forecast |
| **Action space** | 21 discrete actions (0.0–10.0 mm/day) |
| **Reward** | - Negative for excessive watering or wilting <br> - Mild penalty for small deviations <br> - Goal: maintain 0.3 ≤ moisture ≤ 0.8 |
| **Episodes** | 1,000–10,000 simulated weeks |
| **Optimization** | Adam optimizer, SmoothL1 loss |
| **Exploration decay** | ε-greedy (decays from 1.0 → 0.05) |

---

## 🧮 Environment: `WateringEnv`

### Inputs:
- `weather_forecast`: list of dicts with daily `rain` and `et` (mm)
- `crop_need`: plant-specific water demand (mm/day)
- `initial_moisture`: initial soil water fraction (0.0–1.0)
- `wilting_point`: minimum survival threshold (default 0.20)
- `saturation`: maximum safe threshold (default 0.80)

### Dynamics:
```text
moisture_next = moisture + (rain + irrigation - ET) / 100
```

---

## ⚙️ Requirements

**Install dependencies:**
```bash
pip install torch numpy matplotlib tqdm requests
```

**Python version:** ≥ 3.9  
**GPU:** optional (auto-detected by PyTorch)

---

## 🚀 How to Run

### 1️⃣ Fetch ET & Crop Data from Backend
The script queries your backend for real-time config:

```python
BACKEND_URL = "http://localhost:5000/api/config"
```

Expected JSON response:
```json
{
  "et": 5.2,
  "crop_need": 3.0
}
```

If unavailable, fallback defaults are used.

---

### 2️⃣ Train the DQN Agent
Run the script (or notebook):

```bash
python mission4_dqn_irrigation.py
```

Training will run for 1000+ episodes with progress shown via tqdm:
```
Training: 100%|████████████████████| 1000/1000 [R:+45.6 ε:0.231 L:0.053]
```

---

### 3️⃣ View Results
After training, the policy is tested on a 7-day dry period:

```
FINAL POLICY RESULTS
=======================================================
Schedule (mm/day): [2, 0, 3, 0, 1, 0, 0]
Total Water Used : 6.0 mm
Final Moisture   : 0.52
Avg Loss (last 500): 0.0452
```

---

### 4️⃣ Visualize Soil Moisture

The script automatically plots:

- Soil moisture evolution over 7 days  
- Wilting and saturation thresholds  
- Healthy zone visualization  

Example plot:

![Soil Moisture Chart](https://user-images.githubusercontent.com/placeholder/soil_moisture_chart.png)

---

## 🌾 Integration Example (with Mission 1)
| Mission | Role |
|----------|------|
| **Mission 1** | Provides ET₀, Kc, and real weather data |
| **Mission 4** | Learns to optimize irrigation schedule dynamically |
| Together | Adaptive irrigation system powered by AI & environmental data |

---

## 🏆 Hackathon Value

💧 **Saves water:** Learns to minimize irrigation cost  
🌱 **Protects crops:** Avoids under-watering & wilting  
📈 **Continuously improves:** Learns from feedback  
🛰️ **Integrates sensors + weather + AI**  
🤝 **Scalable:** Works for different crops, soils, and climates  

This mission demonstrates **AI-driven sustainable agriculture** — a bridge between data science, climate tech, and precision farming 🌍.

---

## 📁 File Structure
```
Mission4/
│
├── mission4_dqn_irrigation.py     # Main training & testing script
├── README.md                      # This file
├── models/                        # (optional) trained weights
└── plots/                         # (optional) moisture and reward curves
```
