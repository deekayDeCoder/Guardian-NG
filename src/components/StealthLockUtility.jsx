import React, { useState, useEffect } from 'react';
import { Clock, MapPin, BookOpen, ShieldAlert, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const StealthLockUtility = ({ onUnlock }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);
  const [weather, setWeather] = useState({ temp: null, desc: null, wind: null });

  // Warnings from security agencies (displayed one at a time)
  const warnings = [
    {
      agency: 'NSCDC',
      title: 'Heightened Patrols Across Highway Routes',
      message: 'NSCDC advises commuters to use designated checkpoints and avoid unlit roads between 19:00–05:00 until further notice.',
      date: '2026-07-08'
    },
    {
      agency: 'Nigeria Police',
      title: 'Community Alert: Vehicle Checkpoints',
      message: 'Police will conduct random vehicle verifications across Gusau and surrounding LGAs. Carry ID and agency documents.',
      date: '2026-07-09'
    },
    {
      agency: 'FRSC',
      title: 'Road Safety Advisory',
      message: 'High winds and dust reduce visibility on major arterials. Reduce speed and keep headlights on.',
      date: '2026-07-09'
    },
    {
      agency: 'Civil Defence',
      title: 'Public Safety Notice',
      message: 'Report suspicious packages to local authorities. Do not touch or move unknown objects.',
      date: '2026-07-07'
    }
  ];

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // Open-Meteo weather code mapping
  function mapWeatherCodeToText(code) {
    const map = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      80: 'Rain showers',
      95: 'Thunderstorm'
    };
    return map[code] || 'Partly cloudy';
  }

  // Fetch current weather using browser geolocation then Open-Meteo
  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data && data.current_weather) {
          const code = data.current_weather.weathercode;
          const desc = mapWeatherCodeToText(code);
          setWeather({ temp: Math.round(data.current_weather.temperature), desc, wind: data.current_weather.windspeed });
        }
      } catch (err) {
        console.warn('Weather fetch failed', err);
      }
    };

    const fallback = { lat: 12.1628, lon: 6.6614 }; // Gusau
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => fetchWeather(fallback.lat, fallback.lon),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(fallback.lat, fallback.lon);
    }
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

  // Compute current Islamic (Hijri) date from current Gregorian date
  const gregorianToJulianDay = (y, m, d) => {
    const a = Math.floor((14 - m) / 12);
    const yy = y + 4800 - a;
    const mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  };

  const julianToHijri = (jd) => {
    // Based on the Hijri conversion algorithm (astronomical approximation)
    let l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    l = l - 10631 * n + 354;
    let j = (Math.floor((10985 - l) / 5316)) * (Math.floor((50 * l) / 17719)) + (Math.floor(l / 5670)) * (Math.floor((43 * l) / 15238));
    l = l - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    const m = Math.floor((24 * l) / 709);
    const d = l - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return { day: d, month: m, year: y };
  };

  const hijriMonthNames = [
    'Muharram', 'Safar', 'Rabiʿ al-awwal', 'Rabiʿ ath-thani', 'Jumada al-ula', 'Jumada ath-thaniya',
    'Rajab', 'Shaʿban', 'Ramadan', 'Shawwal', 'Dhu al-Qiʿdah', 'Dhu al-Hijjah'
  ];

  const computeHijriString = (dateObj) => {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1; // JS months 0-11
    const d = dateObj.getDate();
    const jd = gregorianToJulianDay(y, m, d);
    const h = julianToHijri(jd);
    const monthName = hijriMonthNames[(h.month - 1) % 12] || 'Muharram';
    return `${monthName} ${h.day}, ${h.year} AH`;
  };

  const hijriDate = language === 'en'
    ? computeHijriString(currentTime)
    : computeHijriString(currentTime).replace(' AH', ' bayan Hijra');

  const prayerTimes = [
    { name: language === 'en' ? 'Fajr (Subhi)' : 'Asuba (Fajr)', time: '05:08 am' },
    { name: language === 'en' ? 'Dhuhr (Sallahar Rana)' : 'Azahar (Dhuhr)', time: '12:42 pm' },
    { name: language === 'en' ? 'Asr (La’asar)' : 'La’asar (Asr)', time: '04:04 pm' },
    { name: language === 'en' ? 'Maghrib (Lisha)' : 'Magariba (Maghrib)', time: '06:58 pm' },
    { name: language === 'en' ? 'Isha’i' : 'Lisha’i (Isha)', time: '08:12 pm' },
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
            <h2 className="text-3xl font-black font-sans tracking-tight">{weather.temp !== null ? `${weather.temp}°C` : '—°C'}</h2>
            <p className="text-xs font-semibold text-gray-600">
              {weather.desc ? `${weather.desc} • Wind ${Math.round(weather.wind || 0)} km/h` : (language === 'en' ? 'Loading weather...' : 'Ana loda yanayi...')}
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

        {/* Warnings carousel - single warning shown at a time with nav */}
        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-emerald-800 font-black uppercase">{warnings[currentWarningIndex].agency}</div>
              <h4 className="text-sm font-black text-emerald-900 mt-1">{warnings[currentWarningIndex].title}</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWarningIndex((i) => (i - 1 + warnings.length) % warnings.length)}
                className="px-2 py-1 bg-white rounded-md border border-emerald-100 text-emerald-800 font-bold"
                aria-label="Previous warning"
              >
                ◀
              </button>
              <button
                onClick={() => setCurrentWarningIndex((i) => (i + 1) % warnings.length)}
                className="px-2 py-1 bg-white rounded-md border border-emerald-100 text-emerald-800 font-bold"
                aria-label="Next warning"
              >
                ▶
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-emerald-900 font-semibold">{warnings[currentWarningIndex].message}</p>
          <div className="mt-3 text-[10px] text-emerald-700 font-black">{warnings[currentWarningIndex].date}</div>
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
