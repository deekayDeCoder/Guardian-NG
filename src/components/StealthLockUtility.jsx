import React, { useState, useEffect } from 'react';
import { Clock, MapPin, BookOpen, ShieldAlert, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const StealthLockUtility = ({ onUnlock }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true 
  });

  const formattedDate = currentTime.toLocaleDateString(language === 'en' ? 'en-US' : 'ha-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Islamic Hijri Date approximation for Zamfara community relevance
  const hijriDate = language === 'en' 
    ? "Muharram 17, 1448 AH" 
    : "Al-Muharram 17, 1448 bayan Hijra";

  const prayerTimes = [
    { name: language === 'en' ? 'Fajr (Subhi)' : 'Asuba (Fajr)', time: '05:08' },
    { name: language === 'en' ? 'Dhuhr (Sallahar Rana)' : 'Azahar (Dhuhr)', time: '12:42' },
    { name: language === 'en' ? 'Asr (La’asar)' : 'La’asar (Asr)', time: '16:04' },
    { name: language === 'en' ? 'Maghrib (Lisha)' : 'Magariba (Maghrib)', time: '18:58' },
    { name: language === 'en' ? 'Isha’i' : 'Lisha’i (Isha)', time: '20:12' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-sans flex flex-col justify-between px-6 py-4">
      {/* Top Utility Bar */}
      <header className="flex justify-between items-center max-w-md mx-auto w-full border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-1">
          <div className="h-2 w-2 rounded-full bg-[#2E7D32]" />
          <span className="text-[10px] tracking-widest text-gray-400 font-black uppercase">
            {language === 'en' ? 'UTILITY MONITOR' : 'KULA DA TSARI'}
          </span>
        </div>

        <div className="flex space-x-2">
          {/* Subtle language toggle */}
          <button 
            id="stealth-lang-toggle"
            onClick={toggleLanguage}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 cursor-pointer"
            title="Toggle Language"
          >
            <Languages className="h-4 w-4" />
          </button>
          
          <button
            id="stealth-unlock-trigger"
            onClick={onUnlock}
            className="flex items-center space-x-1 px-3 py-1 bg-red-50 text-[#B71C1C] rounded-lg text-[10px] font-black border border-red-100 uppercase tracking-wider hover:bg-red-100 transition-colors cursor-pointer"
          >
            <ShieldAlert className="h-3 w-3" />
            <span>{t.stealthUnlock}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 my-6 space-y-6 max-w-md mx-auto w-full">
        {/* Weather Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-gray-500 font-semibold space-x-1">
              <MapPin className="h-3.5 w-3.5 text-[#B71C1C]" />
              <span>Gusau, Zamfara State</span>
            </div>
            <h2 className="text-3xl font-black font-sans tracking-tight">34°C</h2>
            <p className="text-xs font-semibold text-gray-600">
              {language === 'en' ? 'Sunny & Hazy • Harmattan' : 'Rana da Hazo • Iskar Arewa'}
            </p>
          </div>
        </div>

        {/* Big Clock Disguise */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-center space-y-3">
          <div className="inline-flex items-center justify-center space-x-1 text-xs text-[#2E7D32] font-semibold bg-emerald-50 px-3 py-1 rounded-full">
            <Clock className="h-3.5 w-3.5" />
            <span>{t.systemTime.toUpperCase()}</span>
          </div>
          <h1 className="text-4xl font-black font-sans tracking-tight text-gray-800">
            {formattedTime}
          </h1>
          <p className="text-xs text-gray-400 font-semibold">
            {formattedDate} • <span className="text-[#2E7D32] font-black">{hijriDate}</span>
          </p>
        </div>

        {/* Muslim Prayer Times schedule (extremely relevant in Zamfara) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-black text-sm flex items-center space-x-2 text-gray-800 tracking-tight">
              <BookOpen className="h-4.5 w-4.5 text-[#2E7D32]" />
              <span>{language === 'en' ? 'Prayer Schedule' : 'Lokutan Sallah'}</span>
            </h3>
            <span className="text-[10px] uppercase tracking-widest font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">
              GUSAU ZONE
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {prayerTimes.map((prayer, idx) => (
              <div key={idx} className="flex justify-between items-center py-3">
                <span className="text-xs font-bold text-gray-600">{prayer.name}</span>
                <span className="text-xs font-mono font-black text-gray-800">{prayer.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tiny, educational, standard-looking news headline to complete the stealth look */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-emerald-800 font-semibold leading-relaxed">
            {language === 'en' 
              ? '🌾 Zamfara Agro-Consult: Harmattan haze likely to persist. Farmers advised to irrigate early.' 
              : '🌾 Shawarwari: Hazo zai ci gaba. Ana shawartar manoma da su gudanar da ban-ruwa da wuri.'}
          </p>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center py-2 max-w-md mx-auto w-full">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">
          {language === 'en' ? 'ZAMFARA SYSTEM UTILITIES © 2026' : 'TSARIN HARKOKIN WAJE NA ZAMFARA © 2026'}
        </p>
      </footer>
    </div>
  );
};
