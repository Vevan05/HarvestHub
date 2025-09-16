import React, { useState } from 'react';
import { MapPin, Droplets, Thermometer, Calendar, TrendingUp, CloudSun, Navigation } from 'lucide-react';

const PredictionTool = () => {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telegu)' },
    { code: 'ml', name: 'മലയാളം (Malayalam)' },
    { code: 'or', name: 'ଓଡ଼ିଆ (Oriya)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'ur', name: 'اردو (Urdu)' },
    { code: 'as', name: 'অসমীয়া (Assamese)' },
    { code: 'kok', name: 'कोंकणी (Konkani)' },
    { code: 'mai', name: 'मैथिली (Maithili)' },
    { code: 'sd', name: 'सिंधी (Sindhi)' },
    { code: 'doi', name: 'डोगरी (Dogri)' },
    { code: 'ks', name: 'कश्मीरी (Kashmiri)' },
    { code: 'mni', name: 'মৈতৈলোন (Manipuri)' },
    { code: 'sat', name: 'संथाली (Santali)' },
    { code: 'brx', name: 'बोडो (Bodo)' },
    { code: 'lus', name: 'मिजो (Mizo)' },
  ];

  const thresholds = {
    rice: { moisture_threshold: 30, temp_min: 20, temp_max: 32, N: 80, P: 40, K: 40 },
    maize: { moisture_threshold: 27, temp_min: 20, temp_max: 34, N: 80, P: 40, K: 40 },
    groundnut: { moisture_threshold: 27, temp_min: 20, temp_max: 32, N: 20, P: 40, K: 40 },
    mustard: { moisture_threshold: 22, temp_min: 8, temp_max: 25, N: 60, P: 30, K: 30 },
    sesamum: { moisture_threshold: 22, temp_min: 25, temp_max: 35, N: 40, P: 20, K: 20 },
    sugarcane: { moisture_threshold: 35, temp_min: 22, temp_max: 32, N: 200, P: 60, K: 100 },
    cotton: { moisture_threshold: 27, temp_min: 20, temp_max: 32, N: 150, P: 60, K: 60 },
    greengram: { moisture_threshold: 22, temp_min: 25, temp_max: 34, N: 20, P: 40, K: 40 },
    vegetable: { moisture_threshold: 28, temp_min: 18, temp_max: 30, N: 110, P: 80, K: 100 },
  };

  const [formData, setFormData] = useState({
    Crop: '', Season: '', State: '', Pesticide: '',
    N_Level: '', P_Level: '', K_Level: '', Soil_Moisture: '', Language: languages[0].code
  });
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [geminiAdvice, setGeminiAdvice] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [weatherData, setWeatherData] = useState({
    Annual_Rainfall: '',
    Temperature: ''
  });

  const crops = ['Arecanut', 'Arhar/Tur', 'Castor seed', 'Coconut ', 'Cotton(lint)', 
    'Dry chillies', 'Gram', 'Jute', 'Linseed', 'Maize', 'Mesta', 'Niger seed', 'Onion', 
    'Other  Rabi pulses', 'Potato', 'Rapeseed &Mustard', 'Rice', 'Sesamum', 'Small millets', 
    'Sugarcane', 'Sweet potato', 'Tapioca', 'Tobacco', 'Turmeric', 'Wheat', 'Bajra', 
    'Black pepper', 'Cardamom', 'Coriander', 'Garlic', 'Ginger', 'Groundnut', 'Horse-gram', 
    'Jowar', 'Ragi', 'Cashewnut', 'Banana', 'Soyabean', 'Barley', 'Khesari', 'Masoor', 
    'Moong(Green Gram)', 'Other Kharif pulses', 'Safflower', 'Sannhamp', 'Sunflower', 
    'Urad', 'Peas & beans (Pulses)', 'other oilseeds', 'Other Cereals', 'Cowpea(Lobia)', 
    'Oilseeds total', 'Guar seed', 'Other Summer Pulses', 'Moth']

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 
    'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "User denied the request for geolocation.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "The request to get user location timed out.";
              break;
            default:
              errorMessage = "An unknown error occurred.";
              break;
          }
          reject(new Error(errorMessage));
        },
        { timeout: 10000 }
      );
    });
  };

  const fetchWeatherData = async (lat, lon) => {
    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) throw new Error('Weather API key not found');

      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=14`
      );
      
      if (!res.ok) throw new Error('Failed to fetch weather data');
      const data = await res.json();
      return data;
    } catch (err) {
      throw new Error(`Weather API error: ${err.message}`);
    }
  };

  const checkCropRules = (crop, soil_moisture_pct, nitrogen, phosphorus, potassium, air_temp_c) => {
    const cfg = thresholds[crop.toLowerCase()];
    if (!cfg) {
      return ["No thresholds for this crop — use soil test / local KVK data."];
    }

    const recs = [];

    if (soil_moisture_pct < cfg["moisture_threshold"]) {
      recs.push("Irrigation needed: soil moisture is below crop-specific threshold.");
    }

    if (nitrogen < cfg["N"]) {
      recs.push(`Apply approx ${cfg['N'] - nitrogen} kg N/ha (adjust after soil test).`);
    }

    if (phosphorus < cfg["P"]) {
      recs.push(`Apply approx ${cfg['P'] - phosphorus} kg P₂O₅/ha.`);
    }

    if (potassium < cfg["K"]) {
      recs.push(`Apply approx ${cfg['K'] - potassium} kg K₂O/ha.`);
    }

    if (air_temp_c < cfg["temp_min"] || air_temp_c > cfg["temp_max"]) {
      recs.push("Temperature outside preferred band — watch for stress/pests/diseases.");
    }

    return recs;
  };

  const callGeminiCropAPI = async (cropData) => {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (!apiKey) throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.');

      const { crop, soil_moisture, nitrogen, phosphorus, potassium, temperature, language } = cropData;

      const recommendations = checkCropRules(
        crop,
        parseFloat(soil_moisture) || 0,
        parseFloat(nitrogen) || 0,
        parseFloat(phosphorus) || 0,
        parseFloat(potassium) || 0,
        parseFloat(temperature) || 0
      ) || [];

      if (recommendations.length === 0) {
        recommendations.push("No immediate action needed. Conditions are optimal.");
      }

      const prompt = `
        Based on the following data, provide actionable, farmer-friendly advice.
        Crop: ${crop}
        Soil Moisture: ${soil_moisture}%
        Nitrogen: ${nitrogen} kg/ha
        Phosphorus: ${phosphorus} kg/ha
        Potassium: ${potassium} kg/ha
        Temperature: ${temperature}°C

        Recommendations:
        - ${recommendations.join('\n- ')}

        Task:
        Give specific instructions to the farmer to take specific actions. If a nutrient level is negative, that means there is an excess; suggest ways to manage this.
        Convert these recommendations into farmer-friendly advice in ${language} in about 50-60 words.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(errorData.error.message || `API request failed with status: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No recommendations returned by API.";
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error("I'm sorry, I'm having trouble generating crop recommendations right now. Please check your API key and try again later.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLocationError('');
    setGeminiAdvice(null);
    setForecastData(null);
    
    try {
      // Get user's current location
      const location = await getCurrentLocation();
      
      // Fetch weather data using the obtained location
      const weatherDataResponse = await fetchWeatherData(location.lat, location.lon);
      setForecastData(weatherDataResponse);
      
      // Extract weather data
      const annualRainfall = weatherDataResponse.forecast?.forecastday?.reduce((sum, d) => sum + d.day.totalprecip_mm, 0) || 0;
      const temperature = weatherDataResponse.current?.temp_c || 0;
      
      setWeatherData({
        Annual_Rainfall: annualRainfall,
        Temperature: temperature
      });

      // Prepare payloads for APIs
      const flaskPayload = {
        Annual_Rainfall: annualRainfall,
        Pesticide: parseFloat(formData.Pesticide),
        Crop: formData.Crop,
        Season: formData.Season.charAt(0).toUpperCase() + formData.Season.slice(1),
        State: formData.State,
      };
      
      const geminiPayload = {
        crop: formData.Crop,
        soil_moisture: formData.Soil_Moisture,
        nitrogen: formData.N_Level,
        phosphorus: formData.P_Level,
        potassium: formData.K_Level,
        temperature: temperature,
        language: formData.Language,
      };

      // Call Flask API for prediction
      const flaskResponse = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flaskPayload),
      });
      
      if (!flaskResponse.ok) {
        const errorData = await flaskResponse.json();
        throw new Error(errorData.error || `HTTP error! status: ${flaskResponse.status}`);
      }
      
      const flaskData = await flaskResponse.json();
      setPrediction(flaskData.Prediction);
      
      // Call Gemini API for advice
      const geminiResponse = await callGeminiCropAPI(geminiPayload);
      setGeminiAdvice(geminiResponse);
      
    } catch (err) {
      if (err.message.includes('geolocation') || err.message.includes('location')) {
        setLocationError(err.message);
        setError('Please enable location access to get accurate predictions.');
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormComplete = Object.values(formData).every(v => v !== '');

  return (
    <section id="prediction" className="py-20 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">AI Crop Yield Prediction Tool</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enter your farm details below to get accurate AI-powered crop yield predictions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Farm Details</h3>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Navigation className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Location Services</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                We'll use your current location to fetch accurate weather data when you generate predictions.
                Temperature and rainfall data will be automatically filled from your location.
              </p>
              {locationError && (
                <div className="mt-2 bg-red-50 text-red-700 p-2 rounded-md text-sm">
                  Location Error: {locationError}
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  name="Language"
                  value={formData.Language}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Crop and State */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Crop</label>
                  <select
                    name="Crop"
                    value={formData.Crop}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  >
                    <option value="">Select Crop</option>
                    {crops.map(crop => <option key={crop} value={crop}>{crop}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    name="State"
                    value={formData.State}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  >
                    <option value="">Select State</option>
                    {states.map(state => <option key={state} value={state}>{state}</option>)}
                  </select>
                </div>
              </div>

              {/* Season */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" /> Season
                </label>
                <select
                  name="Season"
                  value={formData.Season}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                >
                  <option value="">Select Season</option>
                  <option value="kharif">Kharif</option>
                  <option value="rabi">Rabi</option>
                  <option value="zaid">Zaid</option>
                </select>
              </div>

              {/* Pesticide */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pesticide (kg/ha)</label>
                <input
                  type="number"
                  name="Pesticide"
                  value={formData.Pesticide}
                  onChange={handleInputChange}
                  placeholder="e.g., 5"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  required
                />
              </div>

              {/* Nutrients */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nitrogen Level (ppm)</label>
                  <input
                    type="number"
                    name="N_Level"
                    value={formData.N_Level}
                    onChange={handleInputChange}
                    placeholder="e.g., 90"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phosphorus Level (ppm)</label>
                  <input
                    type="number"
                    name="P_Level"
                    value={formData.P_Level}
                    onChange={handleInputChange}
                    placeholder="e.g., 42"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Potassium Level (ppm)</label>
                  <input
                    type="number"
                    name="K_Level"
                    value={formData.K_Level}
                    onChange={handleInputChange}
                    placeholder="e.g., 43"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soil Moisture (%)</label>
                  <input
                    type="number"
                    name="Soil_Moisture"
                    value={formData.Soil_Moisture}
                    onChange={handleInputChange}
                    placeholder="e.g., 65"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  />
                </div>
              </div>

              {/* Weather Data Display (Read-only) */}
              {weatherData.Annual_Rainfall && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Weather Data from Your Location:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Temperature</label>
                      <div className="text-blue-900">{weatherData.Temperature}°C</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-700 mb-1">Annual Rainfall</label>
                      <div className="text-blue-900">{weatherData.Annual_Rainfall.toFixed(1)} mm</div>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg">
                  Error: {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !isFormComplete}
                className="w-full bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    <span>Generate Prediction</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {prediction !== null && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">AI Predictions</h3>
                <p className="text-xl font-bold text-green-700 mb-4">
                  Predicted Yield: {Number(prediction).toFixed(2)} tons/ha
                </p>
                {geminiAdvice && (
                  <div className="mt-6 text-left">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Expert Advice from Gemini:</h4>
                    <p className="text-gray-600 leading-relaxed">{geminiAdvice}</p>
                  </div>
                )}
              </div>
            )}
            {prediction === null && (
              <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                <Thermometer className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">No Prediction Yet</h3>
                <p className="text-gray-500 mt-2">Fill the form to get AI-powered insights</p>
              </div>
            )}

            {forecastData && (
              <div className="bg-blue-100 rounded-xl p-4 border border-blue-300 text-blue-900">
                <div className="font-medium flex items-center mb-2">
                  <CloudSun className="h-5 w-5 mr-1" />
                  Weather Forecast for Next 3 Days:
                </div>
                {forecastData.forecast?.forecastday?.map(day => (
                  <div key={day.date} className="border-b last:border-b-0 py-2 text-sm flex flex-col sm:flex-row sm:justify-between">
                    <div>{new Date(day.date).toLocaleDateString()}</div>
                    <div>{day.day.condition.text}, {day.day.avgtemp_c}°C, 💧 {day.day.totalprecip_mm}mm</div>
                  </div>
                ))}
                <div className="text-xs mt-2 text-blue-800">For full agri safety, check locally for actual soil moisture</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PredictionTool;