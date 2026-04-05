import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User, Globe } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: "Hello! I'm your AI farming assistant. How can I help you today?",
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
    rice: { moisture_threshold: 30, temp_min: 20, temp_max: 32, N: 80, P: 40, K: 40 },
    maize: { moisture_threshold: 27, temp_min: 20, temp_max: 34, N: 80, P: 40, K: 40 },
    groundnut: { moisture_threshold: 27, temp_min: 20, temp_max: 32, N: 20, P: 40, K: 40 },
    mustard: { moisture_threshold: 22, temp_min: 8, temp_max: 25, N: 60, P: 30, K: 30 },
    sesamum: { moisture_threshold: 22, temp_min: 25, temp_max: 35, N: 40, P: 20, K: 20 },
    sugarcane: { moisture_threshold: 35, temp_min: 22, temp_max: 32, N: 200, P: 60, K: 100 },
    cotton: { moisture_threshold: 27, temp_min: 20, temp_max: 32, N: 150, P: 60, K: 60 },
    greengram: { moisture_threshold: 22, temp_min: 25, temp_max: 34, N: 20, P: 40, K: 40 },
    vegetable: { moisture_threshold: 28, temp_min: 18, temp_max: 30, N: 110, P: 80, K: 100 }
  };

  const checkCropRules = (crop, soil_moisture, nitrogen, phosphorus, potassium, temperature) => {
    const cfg = thresholds[crop.toLowerCase()];
    if (!cfg) return ["No thresholds available for this crop."];

    const recs = [];

    if (soil_moisture < cfg.moisture_threshold) {
      recs.push("Irrigation needed: soil moisture is low.");
    }

    if (nitrogen < cfg.N) {
      recs.push(`Add ${cfg.N - nitrogen} kg N/ha.`);
    }

    if (phosphorus < cfg.P) {
      recs.push(`Add ${cfg.P - phosphorus} kg P₂O₅/ha.`);
    }

    if (potassium < cfg.K) {
      recs.push(`Add ${cfg.K - potassium} kg K₂O/ha.`);
    }

    if (temperature < cfg.temp_min || temperature > cfg.temp_max) {
      recs.push("Temperature stress risk.");
    }

    return recs.length ? recs : ["Conditions are optimal."];
  };

  const callGeminiCropAPI = async (data) => {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      const recs = checkCropRules(
        data.crop,
        data.soil_moisture,
        data.nitrogen,
        data.phosphorus,
        data.potassium,
        data.temperature
      );

      const prompt = `
Crop: ${data.crop}
Moisture: ${data.soil_moisture}
N: ${data.nitrogen}, P: ${data.phosphorus}, K: ${data.potassium}
Temp: ${data.temperature}

Recommendations:
- ${recs.join("\n- ")}

Give simple farmer advice in ${data.language} (50 words).
`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const json = await res.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    } catch {
      return "Error generating recommendation.";
    }
  };

  const callGeminiChatAPI = async (message) => {
    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

      const prompt = `
User: ${message}

Reply in ${currentLanguage} with simple farming advice (50 words).
`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const json = await res.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
    } catch {
      return "Error.";
    }
  };

  const parseCropData = (msg) => {
    if (!msg.toLowerCase().includes("crop:")) return null;

    const get = (key) => {
      const match = msg.match(new RegExp(`${key}:\\s*([a-zA-Z0-9\\s]+)`, "i"));
      return match ? match[1].trim() : null;
    };

    return {
      crop: get("crop") || "cotton",
      soil_moisture: parseInt(get("moisture")) || 20,
      nitrogen: parseInt(get("nitrogen")) || 20,
      phosphorus: parseInt(get("phosphorus")) || 20,
      potassium: parseInt(get("potassium")) || 20,
      temperature: parseInt(get("temperature")) || 30,
      language: currentLanguage
    };
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = { type: "user", content: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    const cropData = parseCropData(inputMessage);
    const reply = cropData
      ? await callGeminiCropAPI(cropData)
      : await callGeminiChatAPI(inputMessage);

    setMessages(prev => [...prev, { type: "bot", content: reply }]);
    setIsTyping(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="bg-orange-600 text-white p-4 rounded-full">
          <MessageCircle />
        </button>
      )}

      {isOpen && (
        <div className="w-96 h-96 bg-white rounded-xl flex flex-col shadow-xl">
          <div className="p-3 bg-orange-600 text-white flex justify-between">
            <span>AI Farm Assistant</span>
            <button onClick={() => setIsOpen(false)}><X /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div key={i} className={m.type === "user" ? "text-right" : "text-left"}>
                <span className={m.type === "user" ? "bg-orange-600 text-white px-2 py-1 rounded" : "bg-gray-200 px-2 py-1 rounded"}>
                  {m.content}
                </span>
              </div>
            ))}
            {isTyping && <div>Typing...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-2 flex">
            <input
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              className="flex-1 border px-2"
            />
            <button onClick={sendMessage} className="bg-orange-600 text-white px-3">
              <Send />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;