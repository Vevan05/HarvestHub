import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import PredictionTool from './components/PredictionTool';
import Resources from './components/Resources';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Hero />
        <Features />
        <PredictionTool />
        <Resources />
        <Contact />
        <Chatbot />
      </main>
      <Footer />
    </div>
  );
}

export default App;