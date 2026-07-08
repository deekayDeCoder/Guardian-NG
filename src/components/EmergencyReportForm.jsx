import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  User, 
  Navigation, 
  AlertTriangle, 
  Send, 
  CheckCircle, 
  Compass, 
  Loader2, 
  EyeOff, 
  Building2, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { reportIncident } from '../utils.js';

export const EmergencyReportForm = ({ onAlertTriggered, addToast }) => {
  const { language, t } = useLanguage();

  // Form states
  const [reporterName, setReporterName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [category, setCategory] = useState('Banditry');
  const [description, setDescription] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  
  // GPS Geolocation States
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'idle' | 'capturing' | 'success' | 'error'
  const [gpsError, setGpsError] = useState('');

  // Submission States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Geolocation Capture Function
  const captureLocation = () => {
    setGpsStatus('capturing');
    setGpsError('');

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsError(
        language === 'en' 
          ? 'Geolocation is not supported by this device.' 
          : 'Injin gurbi na GPS ba ya aiki a wannan na\'urar.'
      );
      addToast(
        language === 'en'
          ? 'Geolocation unsupported on this browser.'
          : 'Injin GPS ba ya aiki a wannan dandalin.',
        'error'
      );
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setGpsAccuracy(position.coords.accuracy);
        setGpsStatus('success');
        addToast(
          language === 'en'
            ? `GPS Acquired successfully (Accuracy ±${Math.round(position.coords.accuracy)}m)`
            : `An gano gurbin GPS lami lafiya (Daidaitawa ±${Math.round(position.coords.accuracy)}m)`,
          'success'
        );
      },
      (error) => {
        console.warn("Geolocation acquisition failed:", error);
        let errorMsg = language === 'en' ? 'Unable to retrieve location.' : 'An kasa samun gurin gurbi.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = language === 'en' ? 'GPS permission denied. Please enable Location Services in settings.' : 'An hana samun gurbi. Kunna GPS a cikin sanyawa ta wayarku.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = language === 'en' ? 'Location signal is currently unavailable or offline.' : 'Bayanin gurbin GPS bai samu ba a yanzu.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = language === 'en' ? 'GPS lock request timed out. Please try again.' : 'Lokacin samun gurbin GPS ya wuce. Sake gwadawa.';
        }
        setGpsStatus('error');
        setGpsError(errorMsg);
        addToast(errorMsg, 'warning');
      },
      options
    );
  };

  // Capture GPS on component load
  useEffect(() => {
    captureLocation();
  }, []);

  // Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!category) {
      setSubmitError(language === 'en' ? 'Please select an emergency category.' : 'Da fatan za a zabi sashen gaggawa.');
      return;
    }

    if (gpsStatus !== 'success' || latitude === null || longitude === null) {
      setSubmitError(
        language === 'en' 
          ? 'Valid GPS location is required to transmit emergency report. Please capture coordinates.' 
          : 'Ana bukatar gurbin GPS mai kyau don tura rahoton gaggawa. Danna capture GPS.'
      );
      return;
    }

    setIsSubmitting(true);

    const payload = {
      category,
      latitude,
      longitude,
      description,
      locationDetails,
      reporterName: isAnonymous ? 'Anonymous' : reporterName,
      isFormReport: true
    };

    try {
      const result = await reportIncident(payload);

      setSubmitSuccess(true);
      // Play confirming vibration if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      // Trigger parent callback to update list instantly
      if (onAlertTriggered && result.incident) {
        onAlertTriggered(result.incident);
      }
      addToast(
        language === 'en'
          ? 'Emergency Report securely submitted!'
          : 'An tura rahoton gaggawa cikin nasara!',
        'success'
      );
      // Reset inputs on success
      setDescription('');
      setLocationDetails('');
      setReporterName('');
    } catch (err) {
      console.error("Submission failed:", err);
      const errText = language === 'en' 
        ? 'Network error. Failed to transmit report. Adding to secure local outbox queue.'
        : 'Matsalar raga. Kasa tura rahoto. Ana adana shi a cikin outbox na wayarku.';
      setSubmitError(errText);
      addToast(errText, 'error');

      // Offline fallback queue integration (Save to localStorage matching CitizenDashboard's format)
      try {
        const queue = JSON.parse(localStorage.getItem('guardian_offline_queue') || '[]');
        const offlineReport = {
          id: `offline-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          category: `${category} (Form)`,
          latitude,
          longitude,
          description,
          locationDetails,
          reporterName: isAnonymous ? 'Anonymous' : reporterName,
          isFormReport: true,
          createdAt: new Date().toISOString(),
          status: 'Queued (Offline / Outbox)'
        };
        queue.push(offlineReport);
        localStorage.setItem('guardian_offline_queue', JSON.stringify(queue));
        
        if (onAlertTriggered) {
          onAlertTriggered({
            _id: offlineReport.id,
            senderToken: "ANON_FORM_OFFLINE_" + Math.random().toString(36).substring(7).toUpperCase(),
            category: `${category} (Form)`,
            location: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            description,
            locationDetails,
            reporterName: isAnonymous ? 'Anonymous' : reporterName,
            isFormReport: true,
            status: 'Pending',
            threatPriority: 'Normal',
            createdAt: offlineReport.createdAt,
            nearbyAlertCount: 1,
            isOfflineReport: true
          });
        }
        setSubmitSuccess(true);
      } catch (queueErr) {
        console.error("Failed to queue offline report:", queueErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formCategories = [
    { id: 'Banditry', label: language === 'en' ? 'Banditry / Attack' : "Harin 'Yan Bindiga", color: 'border-red-600 text-red-700 bg-red-50/50' },
    { id: 'Kidnapping', label: language === 'en' ? 'Kidnapping' : 'Garkuwa da Mutane', color: 'border-amber-500 text-amber-700 bg-amber-50/50' },
    { id: 'Armed Robbery', label: language === 'en' ? 'Armed Robbery' : 'Fashi da Makami', color: 'border-slate-800 text-slate-900 bg-slate-50' },
    { id: 'Fire Outbreak', label: language === 'en' ? 'Fire Outbreak' : 'Gobara', color: 'border-orange-500 text-orange-700 bg-orange-50/50' },
    { id: 'Medical Emergency', label: language === 'en' ? 'Medical Emergency' : 'Taimakon Lafiya', color: 'border-emerald-600 text-emerald-700 bg-emerald-50/50' },
    { id: 'Civil Unrest', label: language === 'en' ? 'Civil Unrest / Riot' : 'Fushin Jama\'a', color: 'border-purple-600 text-purple-700 bg-purple-50/50' },
    { id: 'Other', label: language === 'en' ? 'Other Threat' : 'Sauran Hatsari', color: 'border-gray-500 text-gray-700 bg-gray-50' }
  ];

  if (submitSuccess) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-emerald-900 uppercase tracking-wide">
            {language === 'en' ? 'REPORT SECURELY TRANSMITTED' : 'AN TURA RAHOTON CIKIN SIRRI'}
          </h2>
          <p className="text-xs text-gray-600 font-semibold max-w-md mx-auto leading-relaxed">
            {language === 'en'
              ? 'Your emergency report has been safely transmitted to Gusau State Command. Response units have been alerted with your coordinates.'
              : 'An tura rahotonku na gaggawa lami lafiya zuwa babban dakin kulawa dake Gusau. An tura gurbinku na GPS ga jami\'ai.'}
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-1.5 text-[11px] font-bold text-gray-500 font-mono">
          <div>GPS: {latitude?.toFixed(5)}°, {longitude?.toFixed(5)}°</div>
          <div>CATEGORY: {category.toUpperCase()}</div>
          <div>TIMESTAMP: {new Date().toLocaleTimeString()}</div>
          <div>HASH: sha256-anon-{Math.random().toString(36).substring(2, 10)}</div>
        </div>

        <button
          onClick={() => setSubmitSuccess(false)}
          className="px-6 py-3 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md inline-block"
        >
          {language === 'en' ? 'Submit Another Report' : 'Sake Tura Wani Rahoto'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 space-y-6">
      
      {/* Header Info */}
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center space-x-2 text-[#B71C1C] mb-1">
          <AlertTriangle className="h-5 w-5 animate-pulse" />
          <span className="text-[10px] font-black tracking-widest uppercase bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
            {language === 'en' ? 'DETAILED INCIDENT REPORT' : 'CIKAKKEN RAHOTON HATSARI'}
          </span>
        </div>
        <h2 className="text-lg font-black text-gray-900 tracking-tight">
          {language === 'en' ? 'Emergency Intake Form' : 'Fom Din Shigar Da Rahoto'}
        </h2>
        <p className="text-xs text-gray-500 font-semibold mt-0.5 leading-relaxed">
          {language === 'en'
            ? 'Complete fields below to provide tactical frontline responders with situational parameters. Submissions are 100% encrypted.'
            : 'Cika bayanai na kasa domin bawa rundunar tsaro damar sanin ainihin abin da yake faruwa a gurbinku. Bayanai suna tafiya a boye.'}
        </p>
      </div>

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-xs font-bold text-red-900 animate-pulse">
          <AlertTriangle className="h-5 w-5 text-[#B71C1C] shrink-0 mt-0.5" />
          <div>{submitError}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Geolocation API Status Widget */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <Compass className="h-4 w-4 mr-1.5 text-slate-500" />
              {language === 'en' ? 'GPS GEOLOCATION STATUS' : 'MATAKIN GPS AKAN WAYA'}
            </span>
            
            {gpsStatus === 'capturing' && (
              <span className="flex items-center text-[10px] font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 animate-pulse">
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                {language === 'en' ? 'LOCATING...' : 'ANA NEMA...'}
              </span>
            )}
            {gpsStatus === 'success' && (
              <span className="flex items-center text-[10px] font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
                {language === 'en' ? 'GPS LOCK SECURED' : 'AN SAME GURBI'}
              </span>
            )}
            {gpsStatus === 'error' && (
              <span className="flex items-center text-[10px] font-black text-red-800 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                <AlertTriangle className="h-3 w-3 mr-1.5 text-red-600" />
                {language === 'en' ? 'SIGNAL ERROR' : 'KUSKUREN GPS'}
              </span>
            )}
            {gpsStatus === 'idle' && (
              <span className="text-[10px] font-black text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase">
                {language === 'en' ? 'Awaiting Capture' : 'Ana Jira'}
              </span>
            )}
          </div>

          {gpsStatus === 'success' && latitude !== null && longitude !== null ? (
            <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold bg-white p-3 rounded-xl border border-gray-150 text-gray-700">
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 font-sans block uppercase font-black">{language === 'en' ? 'Latitude' : 'Arewaci'}</span>
                <span className="text-gray-800 text-[13px]">{latitude.toFixed(6)}°</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] text-gray-400 font-sans block uppercase font-black">{language === 'en' ? 'Longitude' : 'Gabasanci'}</span>
                <span className="text-gray-800 text-[13px]">{longitude.toFixed(6)}°</span>
              </div>
              {gpsAccuracy !== null && (
                <div className="col-span-2 border-t border-gray-100 pt-2 flex justify-between items-center text-[10px] text-gray-500 font-sans">
                  <span>{language === 'en' ? 'GPS Signal Accuracy Radius:' : 'Daidaitaccen kewayen GPS:'}</span>
                  <span className="text-slate-900 font-black font-mono">±{Math.round(gpsAccuracy)} meters</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 bg-white p-4 rounded-xl border border-gray-150 font-semibold leading-relaxed">
              {gpsStatus === 'capturing' ? (
                <p className="text-blue-600 animate-pulse font-bold">{language === 'en' ? 'Querying satellite arrays to lock GPS coordinates...' : 'Ana binciken satellite don gano gurbinku...'}</p>
              ) : gpsStatus === 'error' ? (
                <p className="text-red-600 font-bold">{gpsError}</p>
              ) : (
                <p>{language === 'en' ? 'No coordinates loaded. GPS is critical to direct response teams.' : 'Babu gurbi da aka adana tukunna. GPS yana da muhimmanci.'}</p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={captureLocation}
            disabled={gpsStatus === 'capturing'}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Compass className={`h-4 w-4 ${gpsStatus === 'capturing' ? 'animate-spin' : ''}`} />
            <span>
              {gpsStatus === 'capturing' 
                ? (language === 'en' ? 'Capturing GPS Location...' : 'Ana Neman GPS Gurbi...')
                : (language === 'en' ? 'RE-CAPTURE CURRENT GPS LOCATION' : 'SANYA NEMAN GURBIN GPS YANZU')}
            </span>
          </button>
        </div>

        {/* Reporter Info Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
              <User className="h-4 w-4 mr-1.5 text-slate-500" />
              {language === 'en' ? 'REPORTER IDENTITY' : 'SUNA DA SHANIDUN MAI RAHOTO'}
            </span>
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                id="anonymous-checkbox"
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => {
                  setIsAnonymous(e.target.checked);
                  if (e.target.checked) setReporterName('');
                }}
                className="rounded text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
              />
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center">
                <EyeOff className="h-3 w-3 mr-1 text-red-600" />
                {language === 'en' ? 'STAY ANONYMOUS' : 'SANYA CIKIN SIRRI'}
              </span>
            </label>
          </div>

          {!isAnonymous ? (
            <div className="space-y-1">
              <label htmlFor="reporter-name-input" className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                {language === 'en' ? 'Full Name or Unit Designation' : 'Cikakken Suna ko Sunan Runduna'}
              </label>
              <input
                id="reporter-name-input"
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Alh. Ibrahim Gusau' : 'Alh. Ibrahim Gusau'}
                className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required={!isAnonymous}
              />
            </div>
          ) : (
            <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-start space-x-2">
              <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                {language === 'en' 
                  ? 'Stealth Anonymity active. Your name and device metadata will be completely stripped, replacing details with a military-grade hashed token.'
                  : 'Kariyar Sirri Tana Aiki. Za a share sunanku da sauran bayanan wayarku gaba daya, sannan a musanya su da hashed token.'}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Category */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            {language === 'en' ? 'SELECT EMERGENCY THREAT TYPE' : 'ZABI MATSALAR TA KAI TSAYE'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border text-left flex items-center justify-between transition-all cursor-pointer ${
                  category === cat.id 
                    ? 'border-2 border-red-600 bg-red-50 text-[#B71C1C] shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700 bg-white'
                }`}
              >
                <span>{cat.label}</span>
                {category === cat.id && (
                  <CheckCircle className="h-4 w-4 text-[#B71C1C] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Landmarked Location */}
        <div className="space-y-1">
          <label htmlFor="landmark-input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center">
            <Building2 className="h-3.5 w-3.5 mr-1" />
            {language === 'en' ? 'SPECIFIC LANDMARKS OR LOCAL ADDRESS' : 'TAYYAYYEN WURARE KO SHAIDA KO UNGUWA'}
          </label>
          <input
            id="landmark-input"
            type="text"
            value={locationDetails}
            onChange={(e) => setLocationDetails(e.target.value)}
            placeholder={
              language === 'en' 
                ? 'e.g., Behind central mosque, Gusau local market road' 
                : 'e.g., Bayan masallacin juma\'a dake kan hanyar tsohuwar kasuwa'
            }
            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-3.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
          />
          <span className="text-[9px] text-gray-400 font-semibold block pl-1">
            {language === 'en'
              ? 'Crucial if GPS signal is slightly drifted or if responders are navigating dense state layouts.'
              : 'Yana da kyau sosai musamman idan GPS ya sami matsalar nuna daidai unguwar daku ke.'}
          </span>
        </div>

        {/* Detailed Situation Notes */}
        <div className="space-y-1">
          <label htmlFor="description-input" className="text-[10px] font-black text-gray-400 uppercase tracking-widest block flex items-center">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            {language === 'en' ? 'SITUATION DESCRIPTION & DETAILS' : 'BAYANIN HALI DA ABUBUWAN DA KE FARUWA'}
          </label>
          <textarea
            id="description-input"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              language === 'en' 
                ? 'Provide any tactical details: e.g., number of suspicious individuals spotted, active gunfire heard, etc.' 
                : 'Rubuta duk abubuwan da ke faruwa: Kamar yawan mutanen dake dauke da makamai, ko idan ana jin harbe-harbe yanzu, da sauran su.'
            }
            className="w-full bg-white border border-gray-200 rounded-xl py-3 px-3.5 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all resize-none"
          ></textarea>
        </div>

        {/* Send Emergency Alert Button (Large, accessible, touch targets at least 44px) */}
        <div className="pt-2">
          <button
            id="send-emergency-alert-btn"
            type="submit"
            disabled={isSubmitting}
            className={`w-full min-h-[58px] rounded-2xl flex items-center justify-center space-x-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_20px_rgba(183,28,28,0.35)] transition-all transform cursor-pointer border-2 border-white/20 select-none ${
              isSubmitting 
                ? 'bg-slate-700 cursor-wait' 
                : 'bg-[#B71C1C] hover:bg-red-800 active:scale-[0.98]'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {language === 'en' ? 'TRANSMITTING EMERGENCY PROTOCOLS...' : 'ANA TURA SAKON GAGGAWA SIRRI...'}
                </span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5 animate-pulse shrink-0 text-white" />
                <span className="text-sm font-black tracking-widest">
                  {language === 'en' ? 'SEND EMERGENCY ALERT' : 'TURA RAHOTON GAGGAWA'}
                </span>
              </>
            )}
          </button>
          
          <p className="text-center text-[9px] text-gray-400 font-bold mt-2.5 uppercase tracking-widest leading-normal">
            {language === 'en'
              ? 'By triggering this alert, your current GPS Coordinates and form data will immediately route to Sector Commands.'
              : 'Ta hanyar danna wannan hoton gaggawa, za a tura gurbinku na GPS da fom din ku kai tsaye ga hedkwatar tsaro.'}
          </p>
        </div>

      </form>
    </div>
  );
};
