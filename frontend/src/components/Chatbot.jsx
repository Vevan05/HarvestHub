import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Globe } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Hello! I\'m your AI farming assistant. I can help you with crop yield predictions, weather impacts, soil management, and platform guidance. How can I assist you today?',
      language: 'en'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ta', name: 'தமிழ்' },
    { code: 'te', name: 'తెలుగు' },
    { code: 'ml', name: 'മലയാളം' },
    { code: 'or', name: 'ଓଡ଼ିଆ' },
    { code: 'gu', name: 'ગુજરાતી' }
  ];

  const thresholds = {
    "rice":   {"moisture_threshold": 30, "temp_min": 20, "temp_max": 32, "N": 80, "P": 40, "K": 40},
    "maize":       {"moisture_threshold": 27, "temp_min": 20, "temp_max": 34, "N": 80, "P": 40, "K": 40},
    "groundnut":   {"moisture_threshold": 27, "temp_min": 20, "temp_max": 32, "N": 20, "P": 40, "K": 40},
    "mustard":     {"moisture_threshold": 22, "temp_min": 8,  "temp_max": 25, "N": 60, "P": 30, "K": 30},
    "sesamum":     {"moisture_threshold": 22, "temp_min": 25, "temp_max": 35, "N": 40, "P": 20, "K": 20},
    "sugarcane":   {"moisture_threshold": 35, "temp_min": 22, "temp_max": 32, "N": 200, "P": 60, "K": 100},
    "cotton":      {"moisture_threshold": 27, "temp_min": 20, "temp_max": 32, "N": 150, "P": 60, "K": 60},
    "greengram":   {"moisture_threshold": 22, "temp_min": 25, "temp_max": 34, "N": 20, "P": 40, "K": 40},
    "vegetable":   {"moisture_threshold": 28, "temp_min": 18, "temp_max": 30, "N": 110, "P": 80, "K": 100}
  };

  const checkCropRules = (crop, soil_moisture_pct, nitrogen, phosphorus, potassium, air_temp_c) => {
    const cfg = thresholds[crop.toLowerCase()];
    if (!cfg) {
      return ["No thresholds for this crop — use soil test / local KVK data."];
    }

    const recs = [];

    if (soil_moisture_pct < cfg["moisture_threshold"]) {
      recs.append("Irrigation needed: soil moisture is below crop-specific threshold.");
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
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const { crop, soil_moisture, nitrogen, phosphorus, potassium, temperature, language } = cropData;
      
      const recommendations = checkCropRules(
        crop,
        soil_moisture_pct = soil_moisture,
        nitrogen = nitrogen,
        phosphorus = phosphorus,
        potassium = potassium,
        air_temp_c = temperature
      );

      if (recommendations.length === 0) {
        recommendations.push("No immediate action needed. Conditions are optimal.");
      }

      const prompt = `
Crop: ${crop}
Soil Moisture: ${soil_moisture}%
Nitrogen: ${nitrogen} kg/ha
Phosphorus: ${phosphorus} kg/ha
Potassium: ${potassium} kg/ha
Temperature: ${temperature}°C

Recommendations:
- ${recommendations.join('\n- ')}

Task:
According to the crop give the type of fertilizer to use and the amount required, also specify the type and amount of irrigation required.
Give specific instructions to the farmer to take specific actions.
Convert these recommendations into farmer-friendly advice in ${language} in about 50-60 words.
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return "I'm sorry, I'm having trouble generating crop recommendations right now. Please try again later.";
    }
  };

  const callGeminiChatAPI = async (message) => {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Gemini API key not found');
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `According to the crop give the type of fertilizer to use and the amount required, also specify the type and amount of irrigation required
Give specific instructions to the farmer to take specific actions, also if the npk values are negative that means there is excess of it so also suggest an idea for that
Convert these recommendations into farmer-friendly advice in only this simple {language} in about 50-60 words.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return getPredefinedResponse(message);
    }
  };

  // Fallback responses if API fails
  const getPredefinedResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    const currentLangResponses = responses[currentLanguage] || responses.en;
    
    if (lowerMessage.includes('yield') || lowerMessage.includes('prediction') || lowerMessage.includes('forecast')) {
      return currentLangResponses.yieldPrediction;
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('rain') || lowerMessage.includes('climate')) {
      return currentLangResponses.weather;
    } else if (lowerMessage.includes('soil') || lowerMessage.includes('fertilizer') || lowerMessage.includes('nutrient')) {
      return currentLangResponses.soil;
    } else if (lowerMessage.includes('rice') || lowerMessage.includes('paddy') || lowerMessage.includes('धान') || lowerMessage.includes('நெல்')) {
      return currentLangResponses.rice;
    } else if (lowerMessage.includes('platform') || lowerMessage.includes('how to') || lowerMessage.includes('help') || lowerMessage.includes('feature')) {
      return currentLangResponses.platform;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('phone')) {
      return currentLangResponses.contact;
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('namaste')) {
      return currentLangResponses.greeting;
    } else {
      return currentLangResponses.default;
    }
  };

  // Predefined responses (kept as fallback)
  const responses = {
    en: {
      greeting: "Hello! I'm your AI farming assistant. How can I help you today?",
      yieldPrediction: "I can help you with crop yield predictions! Our AI analyzes weather data, soil conditions, and historical yields to provide accurate forecasts. Would you like to know about specific crops like rice, cotton, or sugarcane?",
      weather: "Weather plays a crucial role in crop yields. Heavy rainfall can affect rice harvesting, while drought conditions impact cotton production. I recommend checking our real-time weather integration feature in the prediction tool.",
      soil: "Soil management is key to good yields! For Odisha's varied soil types: Alluvial soils are great for rice, Black cotton soils suit cotton crops, and Red soils work well for groundnut. Regular soil testing every 2-3 years is recommended.",
      rice: "Rice cultivation tips for Odisha: Use certified seeds, maintain 2-3cm water depth during initial growth, apply NPK fertilizers as per soil test, and watch for brown planthopper and blast disease. Average yield target is 4-5 tons/hectare.",
      platform: "Our platform offers: AI-powered yield predictions, weather integration, multilingual support, expert recommendations, and 24/7 chatbot assistance. You can access the prediction tool from the main page.",
      contact: "You can reach our support team at support@aicropyield.odisha.gov.in or call +91-674-2536425. We're available Monday-Friday 9 AM-6 PM.",
      default: "I can help with yield predictions, weather impacts, soil management, rice cultivation, and platform support. What specific topic interests you?"
    },
    gu: {
      greeting: "નમસ્તે! હું તમારી AI ખેતી સહાયક છું. આજે હું તમારી કેવી રીતે મદદ કરી શકું?",
      yieldPrediction: "હું તમને પાક ઉપજ અનુમાનમાં મદદ કરી શકું છું! અમારી AI હવામાન ડેટા, માટીની સ્થિતિ અને ઐતિહાસિક ઉપજનું વિશ્લેષણ કરીને ચોક્કસ અનુમાનો પ્રદાન કરે છે.",
      weather: "હવામાન પાક ઉપજમાં નિર્ણાયક ભૂમિકા ભજવે છે. ભારે વરસાદ ડાંગરની કાપણીને અસર કરી શકે છે, જ્યારે દુષ્કાળની પરિસ્થિતિઓ કપાસ ઉત્પાદનને પ્રભાવિત કરે છે.",
      soil: "સારી ઉપજ માટે માટી વ્યવસ્થાપન મુખ્ય છે! ઓડિશાની વિવિધ માટીના પ્રકારો માટે: જલોઢ માટી ડાંગર માટે ઉત્તમ છે, કાળી કપાસ માટી કપાસ માટે યોગ્ય છે.",
      rice: "ઓડિશામાં ડાંગર ખેતીની ટીપ્સ: પ્રમાણિત બીજનો ઉપયોગ કરો, પ્રારંભિક વૃદ્ધિ દરમ્યાન 2-3 સેમી પાણીની ઊંડાઈ જાળવો, માટી પરીક્ષણ મુજબ NPK ખાતરો લાગુ કરો.",
      platform: "અમારું પ્લેટફોર્મ પ્રદાન કરે છે: AI-સંચાલિત ઉપજ અનુમાન, હવામાન એકીકરણ, બહુભાષી સમર્થન, નિષ્ણાત ભલામણો.",
      contact: "તમે અમારી સપોર્ટ ટીમને support@aicropyield.odisha.gov.in પર સંપર્ક કરી શકો છો અથવા +91-674-2536425 પર કોલ કરી શકો છો.",
      default: "હું ઉપજ અનુમાન, હવામાન પ્રભાવ, માટી વ્યવસ્થાપન, ડાંગર ખેતી અને પ્લેટફોર્મ સપોર્ટમાં મદદ કરી શકું છું."
    }
    // Add other language responses as needed
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Parse crop data from user message
  const parseCropData = (message) => {
    const lowerMessage = message.toLowerCase();
    
    // Check if message contains crop data pattern
    if (lowerMessage.includes('crop:') || lowerMessage.includes('soil:') || 
        lowerMessage.includes('moisture:') || lowerMessage.includes('temperature:')) {
      
      // Extract data using regex patterns
      const cropMatch = message.match(/crop:\s*(\w+)/i);
      const moistureMatch = message.match(/moisture:\s*(\d+)/i);
      const nitrogenMatch = message.match(/nitrogen:\s*(\d+)/i);
      const phosphorusMatch = message.match(/phosphorus:\s*(\d+)/i);
      const potassiumMatch = message.match(/potassium:\s*(\d+)/i);
      const tempMatch = message.match(/temperature:\s*(\d+)/i);
      
      return {
        crop: cropMatch ? cropMatch[1] : 'cotton', // Default to cotton if not specified
        soil_moisture: moistureMatch ? parseInt(moistureMatch[1]) : 18,
        nitrogen: nitrogenMatch ? parseInt(nitrogenMatch[1]) : 25,
        phosphorus: phosphorusMatch ? parseInt(phosphorusMatch[1]) : 15,
        potassium: potassiumMatch ? parseInt(potassiumMatch[1]) : 20,
        temperature: tempMatch ? parseInt(tempMatch[1]) : 38,
        language: currentLanguage
      };
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '') return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      let response;
      const cropData = parseCropData(inputMessage);
      
      if (cropData) {
        // If crop data is detected, use the crop recommendation API
        response = await callGeminiCropAPI(cropData);
      } else {
        // Otherwise, use the general chat API
        response = await callGeminiChatAPI(inputMessage);
      }
      
      const botMessage = {
        type: 'bot',
        content: response,
        language: currentLanguage
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const fallbackResponse = getPredefinedResponse(inputMessage);
      const botMessage = {
        type: 'bot',
        content: fallbackResponse,
        language: currentLanguage
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const changeLanguage = (langCode) => {
    setCurrentLanguage(langCode);
    const welcomeMessage = {
      type: 'bot',
      content: responses[langCode]?.greeting || responses.en.greeting,
      language: langCode
    };
    setMessages([welcomeMessage]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-96 h-96 flex flex-col border border-gray-200">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Farm Assistant</h3>
                <p className="text-xs text-orange-100">Powered by Gemini AI</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <button className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                  <Globe className="h-4 w-4" />
                </button>
                <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border py-2 hidden group-hover:block z-10">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        currentLanguage === lang.code ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-xs ${
                    message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  
                  <div
                    className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      message.type === 'user'
                        ? 'bg-orange-600 text-black rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg rounded-bl-none">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-black"
              />
              <button
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === ''}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors duration-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;