import React from 'react';
import { Phone, Shield, ShieldAlert, Award, Flame, ShieldAlertIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const HotlineDirectory = () => {
  const { t, language } = useLanguage();

  const hotlines = [
    {
      id: "cpg",
      name: language === 'en' ? "Zamfara State Security Outfit (Community Protection Guards)" : "Sojojin Sa-Kai na Zamfara (Askarawan Jihar Zamfara)",
      desc: language === 'en' ? "Frontline community protection forces stationed across all 14 LGAs" : "Rundunar sa-kai dake dukkan kananan hukumomi 14 na jihar",
      phone: "08166694590",
      displayPhone: "08166694590 (CPG Zamfara)",
      icon: Shield,
      color: "bg-emerald-50 border-emerald-100 text-emerald-800"
    },
    {
      id: "police",
      name: language === 'en' ? "Nigeria Police Force State Command" : "Rundunar 'Yansandan Jihar Zamfara",
      desc: language === 'en' ? "State-wide anti-robbery and general security operations dispatch room" : "Dakin karbar rahotannin gaggawa na fashi da sauran matsaloli",
      phone: "08106580123",
      displayPhone: "08106580123 (NPF Control)",
      icon: ShieldAlert,
      color: "bg-blue-50 border-blue-100 text-blue-800"
    },
    {
      id: "sema",
      name: language === 'en' ? "State Emergency Management Agency (SEMA)" : "Hukumar Agajin Gaggawa ta Jihar Zamfara (SEMA)",
      desc: language === 'en' ? "Fire breakout control, disaster response, and medical evacuation" : "Gudanar da gobarori, kariya, da tura ma'aikatan lafiya da agaji",
      phone: "07043521434",
      displayPhone: "07043521434",
      icon: Flame,
      color: "bg-red-50 border-red-100 text-red-800"
    },
    {
      id: "nscdc",
      name: language === 'en' ? "Nigeria Security and Civil Defence Corps" : "Jami'an Tsaro Masu Kare Yan Kasa Na Nigeria (Civil Defence)",
      desc: language === 'en' ? "Fire breakout control, disaster response, and medical evacuation" : "Gudanar da gobarori, kariya, da tura ma'aikatan lafiya da agaji",
      phone: "07067692146",
      displayPhone: "07067692146 (NSCDC)",
      icon: ShieldAlertIcon,
      color: "bg-red-50 border-red-100 text-red-800"
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-5">
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
        <div className="p-2.5 rounded-2xl bg-emerald-50 text-[#2E7D32]">
          <Phone className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-black text-lg text-gray-900 leading-tight tracking-tight">
            {t.hotlineTitle}
          </h2>
          <p className="text-xs text-gray-400 font-semibold">
            {t.hotlineSubtitle}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {hotlines.map((hotline) => {
          const IconComponent = hotline.icon;
          return (
            <div 
              key={hotline.id} 
              id={`hotline-card-${hotline.id}`}
              className="border border-gray-100 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-emerald-200 hover:shadow-sm transition-all bg-gray-50/50 hover:bg-white"
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${hotline.color}`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-gray-800 leading-tight">
                    {hotline.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                    {hotline.desc}
                  </p>
                </div>
              </div>

              {/* Action Tap to Call Dialing protocol */}
              <a 
                href={`tel:${hotline.phone}`}
                className="w-full flex items-center justify-center space-x-2 py-3 px-3.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-2xl text-xs font-black tracking-wider sm:tracking-widest transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 cursor-pointer overflow-hidden"
                title={`${hotline.name}: Dial ${hotline.phone}`}
              >
                <Phone className="h-3.5 w-3.5 fill-current animate-pulse shrink-0" />
                <span className="truncate text-center">
                  {t.callNow.toUpperCase()} <span className="font-mono font-bold">({hotline.displayPhone.replace(/\s*\(.*\)/, '')})</span>
                  <span className="hidden sm:inline-block ml-1 opacity-90 text-[10px] font-sans font-black">
                    - {hotline.displayPhone.match(/\(([^)]+)\)/)?.[1]}
                  </span>
                </span>
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
};
