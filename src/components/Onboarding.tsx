import React, { useState } from "react";
import { ChevronRight, DollarSign, Wallet, Map, Camera } from "lucide-react";

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Split Expenses Effortlessly",
      desc: "Track every penny. Split bills fairly with friends without the awkward math.",
      icon: <DollarSign className="w-16 h-16 text-teal-500 mb-6" />,
      color: "bg-teal-50"
    },
    {
      title: "Pool Money for Goals",
      desc: "Planning a trip? Create a shared pool and let everyone pitch in their equal share.",
      icon: <Wallet className="w-16 h-16 text-emerald-500 mb-6" />,
      color: "bg-emerald-50"
    },
    {
      title: "Settle Up with UPI",
      desc: "No more 'I'll pay you later'. Settle balances instantly using any UPI app.",
      icon: <Camera className="w-16 h-16 text-orange-500 mb-6" />,
      color: "bg-orange-50"
    },
    {
      title: "AI Itineraries",
      desc: "Let AI plan your perfect tropical getaway, complete with flights and stays.",
      icon: <Map className="w-16 h-16 text-rose-500 mb-6" />,
      color: "bg-rose-50"
    }
  ];

  const nextStep = () => {
    if (step === slides.length - 1) {
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden animate-fade-in">
      <div className={`flex-1 flex items-center justify-center transition-colors duration-500 ${slides[step].color} p-8 relative`}>
        {/* Abstract background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-xl animate-float delay-300"></div>
        </div>
        
        <div className="text-center max-w-sm relative z-10 animate-slide-up" key={step}>
          <div className="flex justify-center">{slides[step].icon}</div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">{slides[step].title}</h2>
          <p className="text-slate-600 font-medium text-lg leading-relaxed">{slides[step].desc}</p>
        </div>
      </div>
      
      <div className="bg-white p-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-3xl -mt-6 relative z-20">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-teal-600' : 'w-2 bg-gray-200'}`}
              />
            ))}
          </div>
          <button 
            onClick={onComplete}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip
          </button>
        </div>
        
        <button 
          onClick={nextStep}
          className="w-full py-4 rounded-2xl gradient-tropical text-white font-black text-lg shadow-lg hover:shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {step === slides.length - 1 ? "Let's Go! 🌴" : "Next"}
          {step !== slides.length - 1 && <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
