# 🌾 Harvest Hub — Smart Crop Yield Prediction & Optimization Platform

**Harvest Hub** is a full-stack web application that helps farmers and agricultural planners **predict crop yield** and receive **AI-driven farming advice** using machine learning, real-time weather data, and Google Gemini AI.

It combines a modern **Vite + React frontend** with a powerful **Flask + Machine Learning backend** to deliver accurate predictions and localized recommendations.

---

## 🚀 Features

- 🌱 **Crop Yield Prediction** using trained ML model  
- 🛰️ **Automatic Location Detection** (Geolocation API)  
- ☁️ **Real-time Weather Integration** via WeatherAPI  
- 🤖 **AI Farming Advice** using Google Gemini (multi-language support)  
- 📊 Clean & Interactive React UI  
- 🔗 RESTful API architecture

---

## 🧱 Tech Stack

### Frontend
- Vite + React  
- JavaScript  
- HTML, CSS  
- Geolocation API  
- WeatherAPI  
- Google Gemini API

### Backend
- Python  
- Flask  
- Scikit-Learn / Machine Learning Model  
- REST API

---

## 🧩 System Architecture

User (Browser)
↓
Vite + React Frontend
↓
POST /predict
↓
Flask Backend + ML Model
↓
Predicted Yield (JSON)
↓
Displayed in UI

### Additional Integrations:
1. Frontend → WeatherAPI → Weather Data → Backend
2. Frontend → Google Gemini → AI Farming Advice → UI

## 🔄 Data Flow

1. User selects **crop, state, season, soil & nutrient details**.
2. App captures **user's location** and fetches:
   - Current temperature
   - Forecasted rainfall (WeatherAPI)
3. Frontend sends all data as JSON to POST/predict
4. Flask backend processes the data using the ML model.
5. Backend returns predicted yield.
6. Frontend sends crop & soil data to **Google Gemini**.
7. Gemini returns **localized, farmer-friendly advice**.
8. Results are displayed on the dashboard.


## 🛠️ Installation & Setup
1. Clone Repository
```bash
git clone https://github.com/your-username/harvest-hub.git
cd harvest-hub
```
2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
3. Frontend setup
```bash
cd frontend
npm install
npm run dev

```
