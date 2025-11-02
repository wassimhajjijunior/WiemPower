# 🌱 Mission 1 – *The Curious Soil*
**WiEmpower Hackathon 2025**

## 💧 Overview
This project is a smart irrigation assistant designed to help farmers like *Mabrouka* decide **when and how much to water** their crops.  

Using real-time data from:
- 🌤️ **Weather APIs** (Open-Meteo)
- 🌡️ **Soil sensors** (moisture, temperature)
- 🌾 **Crop parameters** (type, growth stage, and coefficient Kc)

…the system estimates **evapotranspiration (ETc)** and **soil water deficit**, then recommends the **exact irrigation amount (mm/day)**.

---

## 🧠 Core Idea
The solution is based on the **FAO-56 Penman–Monteith model**, an internationally recognized method for calculating crop water needs.  

It integrates:  
1. **Weather data** from Open-Meteo API  
2. **Plant coefficients (Kc)** from crop type & age  
3. **Soil properties** (field capacity, wilting point)  
4. **Sensor readings** for real soil moisture  

Result → “How much water should be applied *right now*?”

---

## ⚙️ Features
✅ Real-time weather fetch (no API key required)  
✅ Automatic location lookup via Open-Meteo Geocoding  
✅ ETc computation (Penman-Monteith FAO-56 standard)  
✅ Soil-water balance model (TAW, RAW, MAD)  
✅ Clear irrigation recommendation (“Irrigate now” / “No irrigation needed”)  
✅ Ready for integration with IoT sensors or pumps  

---

## 🧩 System Workflow

```text
   ┌──────────────────────────────┐
   │     User Inputs (or Sensors) │
   │  ──────────────────────────  │
   │  • Location / City Name      │
   │  • Soil Moisture (%)         │
   │  • Crop Coefficient (Kc)     │
   │  • Field Capacity & WP (%)   │
   └────────────┬─────────────────┘
                │
                ▼
   ┌──────────────────────────────┐
   │  Weather API (Open-Meteo)    │
   │  → Temp, Humidity, Radiation │
   │  → Wind speed, Elevation     │
   └────────────┬─────────────────┘
                │
                ▼
   ┌──────────────────────────────┐
   │  FAO-56 Penman–Monteith ETc  │
   │  → Compute Crop Water Need   │
   └────────────┬─────────────────┘
                │
                ▼
   ┌──────────────────────────────┐
   │ Soil Water Balance Model     │
   │ → Compare vs. Available Water│
   └────────────┬─────────────────┘
                │
                ▼
   ┌──────────────────────────────┐
   │ 💧 Irrigation Recommendation │
   │ → “Apply X mm of water”      │
   └──────────────────────────────┘
```

---

## 🧮 Key Equations

### **1️⃣ FAO-56 Penman–Monteith (ET₀)**
\[
ET₀ = \frac{0.408Δ(R_n - G) + γ\frac{900}{T + 273}u_2(e_s - e_a)}{Δ + γ(1 + 0.34u_2)}
\]

Then:
\[
ET_c = K_c × ET₀
\]

### **2️⃣ Soil-Water Balance**
\[
TAW = (θ_{FC} - θ_{WP}) × Z_r
\]
\[
RAW = MAD × TAW
\]
\[
\text{Irrigation Needed} = \min(Deficit, 1.1 × ET_c)
\]

---

## 🧰 Requirements

**Libraries used:**
```bash
pip install requests
```

**Python version:** ≥ 3.8  

No API keys required (uses Open-Meteo’s free public endpoints).

---

## 🚀 How to Run

### **1️⃣ In Google Colab or local environment**
Copy the full script into a new `.py` or `.ipynb` file.

### **2️⃣ Example usage**
```python
location = "Zaghouan"
data = get_location_data(location)

result = get_daily_irrigation_recommendation(
    lat=data['latitude'],
    lon=data['longitude'],
    z=data['elevation'],
    soil_moisture_percent=18.0,  # from soil sensor
    Kc=1.15,                     # crop coefficient (e.g., mid-season cotton)
    root_depth_mm=500
)

print("\nDAILY IRRIGATION REPORT")
print("-" * 40)
for k, v in result.items():
    print(f"{k.replace('_', ' ').title():25}: {v}")
```

### **3️⃣ Example Output**
```
DAILY IRRIGATION REPORT
----------------------------------------
Date                     : 2025-11-01
ETc Mm Per Day           : 5.62
Soil Moisture Percent    : 18.0
Irrigation Needed Mm     : 3.74
Status                   : Irrigate now
Recommendation           : Apply 3.74 mm of water today.
```

---

## 🌍 Inputs Summary
| Source | Parameter | Description |
|--------|------------|-------------|
| **API** | T°, Humidity, Wind, Radiation, Elevation | From Open-Meteo |
| **Sensors** | Soil Moisture, Temperature | Real-time ground data |
| **User** | Crop type (Kc), Soil type, Root depth | Optional setup |

---

## 🌿 Example Scenarios
| Crop | Kc (mid-season) | Root Depth (mm) |
|------|------------------|-----------------|
| Wheat | 1.15 | 600 |
| Tomato | 1.05 | 400 |
| Citrus | 0.95 | 800 |
| Olive | 0.70 | 1000 |

---

## 🏆 Hackathon Value
This Mission 1 script **empowers small farmers** by:
- Reducing water waste 🌊  
- Increasing yield stability 🌾  
- Operating autonomously with sensors and free APIs 💡  
- Providing explainable, physics-based recommendations 🧠  

It is **fully open-source**, offline-ready, and forms the foundation for Missions 2 & 3 (IoT automation + planning).

---

## 📁 File Structure
```
Mission1/
│
├── mission1_irrigation.py        # Main script
├── README.md                     # This file
└── example_output.txt            # Optional saved report
```
