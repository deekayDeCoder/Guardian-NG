import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  Volume2, 
  User, 
  Layers, 
  Filter, 
  Radio, 
  Check, 
  Activity, 
  AlertTriangle,
  Play,
  Square,
  X,
  Shield,
  ShieldCheck,
  FileText,
  Building,
  CheckSquare,
  Sparkles,
  ThumbsUp,
  EyeOff
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const DispatcherPanel = ({ incidents, onUpdateStatus, currentUser, onLogout }) => {
  const { t, language } = useLanguage();
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [activeSubPanel, setActiveSubPanel] = useState('stream'); // 'stream' | 'forms'

  const audioPlaybackRef = useRef(null);

  // Clean up any active playback on unmount
  useEffect(() => {
    return () => {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
    };
  }, []);

  // Dispatch Force Modal states
  const [dispatchIncident, setDispatchIncident] = useState(null);
  const [dispatchAgency, setDispatchAgency] = useState('cpg');
  const [dispatchUnit, setDispatchUnit] = useState('');
  const [dispatchMessage, setDispatchMessage] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState('idle'); // 'idle' | 'transmitting' | 'success' | 'failure'
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [dispatchReceipt, setDispatchReceipt] = useState(null);
  const [dispatchError, setDispatchError] = useState('');

  // Structured Agencies and Units mapping
  const agencyUnits = {
    cpg: {
      name: language === 'en' ? 'Zamfara Community Protection Guards (CPG)' : 'Askarawan Zamfara (CPG)',
      units: [
        { id: 'alpha', name: language === 'en' ? 'Sector Alpha Response Command' : 'Rundunar Amon Amosan na Sashen Alpha' },
        { id: 'rural', name: language === 'en' ? 'Rural Patrol Guard Force' : 'Rundunar Sintiri ta Karkara' },
        { id: 'mobile', name: language === 'en' ? 'Mobile Escort Division' : 'Sashin Masu Taimakon Gaggawa na Musamman' }
      ]
    },
    army: {
      name: language === 'en' ? 'Nigeria Security And Civil Defence Corps' : 'Rundunar Civil Defence (Operation Hadarin Daji)',
      units: [
        { id: 'swat', name: language === 'en' ? 'SWAT Unit' : 'Rundunar Jamiai ta Musamman' },
        { id: 'agro rangers', name: language === 'en' ? 'Agro Rangers Squad' : 'Jamiai masu bawa manoma da makiyaya tsaro' },
        { id: 'ctu', name: language === 'en' ? 'Counter Terrorism Unit' : 'Reshen yaki da hanamiyagun laifuka' }
      ]
    },
    police: {
      name: language === 'en' ? 'Nigeria Police Force (State Command)' : 'Rundunar \'Yan Sandan Najeriya (Rundunar Jihar)',
      units: [
        { id: 'anti', name: language === 'en' ? 'Anti-Kidnapping & Banditry Squad' : 'Rundunar Yaki da Garkuwa da Mutane' },
        { id: 'rrs', name: language === 'en' ? 'Rapid Response Squad (RRS)' : 'Sashen Amon Amosa na \'Yan Sanda (RRS)' },
        { id: 'highway', name: language === 'en' ? 'Highway Security Patrol' : 'Sintiri na Babban Hanya' }
      ]
    },
    sema: {
      name: language === 'en' ? 'State Emergency Management Agency (SEMA)' : 'Hukumar Ba da Agajin Gaggawa ta Jihar (SEMA)',
      units: [
        { id: 'medevac', name: language === 'en' ? 'Medical Evacuation Squadron' : 'Sashin Kwashe Marasa Lafiya' },
        { id: 'fire', name: language === 'en' ? 'Fire Containment Team' : 'Rundunar Kashe Gobara' },
        { id: 'relief', name: language === 'en' ? 'Disaster Relief Group' : 'Kungiyar Ba da Agajin Bala\'i' }
      ]
    }
  };

  const handleOpenDispatch = (incident) => {
    setDispatchIncident(incident);
    setDispatchAgency('cpg');
    setDispatchUnit(agencyUnits['cpg'].units[0].name);
    setDispatchMessage('');
    setDispatchStatus('idle');
    setSimulateFailure(false);
    setDispatchReceipt(null);
    setDispatchError('');
  };

  const handleAgencyChange = (agencyKey) => {
    setDispatchAgency(agencyKey);
    setDispatchUnit(agencyUnits[agencyKey].units[0].name);
  };

  const executeDispatchTransmit = (e) => {
    e.preventDefault();
    setDispatchStatus('transmitting');

    // Simulate satellite telemetry encryption and broadcasting handshake
    setTimeout(() => {
      if (simulateFailure) {
        setDispatchStatus('failure');
        setDispatchError(
          language === 'en'
            ? 'TACTICAL BROADBAND RETRY TIMEOUT: Encrypted secure gateway failed to establish immediate voice/data connection. Resending via alternative SMS emergency transceiver...'
            : 'KUSKUREN SAMUN LOKACI: Hanyar sadarwa ta sirri ta kasa hada sautin magana/bayanai yanzu. Ana sake gwadawa ta hanyar sako na gaggawa (SMS)...'
        );
      } else {
        // Successful dispatch payload receipt
        const receiptId = `ZMF-SEC-${Math.floor(100000 + Math.random() * 900000)}-${dispatchAgency.toUpperCase()}`;
        setDispatchReceipt({
          receiptId,
          agencyName: agencyUnits[dispatchAgency].name,
          unitName: dispatchUnit,
          message: dispatchMessage || (language === 'en' ? 'Tactical emergency dispatch active.' : 'An tura runduna ta musamman.'),
          timestamp: new Date().toLocaleTimeString(),
          coordinates: `LAT: ${dispatchIncident.location.coordinates[1].toFixed(5)} • LNG: ${dispatchIncident.location.coordinates[0].toFixed(5)}`
        });
        setDispatchStatus('success');
      }
    }, 1800);
  };

  const confirmAndCommitDispatch = () => {
    // Notify parent state of dispatched status
    onUpdateStatus(dispatchIncident._id, 'Dispatched');
    // Close modal
    setDispatchIncident(null);
  };

  // Filter incidents list
  const filteredIncidents = incidents.filter(inc => {
    const matchCat = filterCategory === 'All' || inc.category === filterCategory || inc.category.startsWith(filterCategory);
    const matchStatus = filterStatus === 'All' || inc.status === filterStatus;
    return matchCat && matchStatus;
  });

  // Calculate high-level summary metrics
  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(inc => inc.threatPriority === 'High' || inc.nearbyAlertCount >= 3).length;
  const activeCount = incidents.filter(inc => inc.status !== 'Resolved').length;
  const pendingReview = incidents.filter(inc => inc.status === 'Pending').length;

  // Filter form-based incidents specifically for the Form Reports Evaluation Panel
  const formBasedIncidents = incidents.filter(inc => inc.isFormReport || inc.description || inc.locationDetails);

  const handleAudioPlayback = (id) => {
    if (playingAudioId === id) {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
      setPlayingAudioId(null);
    } else {
      // Pause any ongoing playback first
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }

      // Locate the incident with this ID and retrieve its audio reference
      const incident = incidents.find(inc => inc._id === id);
      if (!incident || !incident.audioRef) {
        console.warn("No valid audio reference found for this incident:", id);
        return;
      }

      try {
        setPlayingAudioId(id);
        const audio = new Audio(incident.audioRef);
        audioPlaybackRef.current = audio;

        audio.onended = () => {
          setPlayingAudioId(null);
          audioPlaybackRef.current = null;
        };

        audio.onerror = (e) => {
          console.error("Dispatcher playback error:", e);
          setPlayingAudioId(null);
          audioPlaybackRef.current = null;
        };

        audio.play().catch(err => {
          console.error("Dispatcher audio play failed:", err);
          setPlayingAudioId(null);
          audioPlaybackRef.current = null;
        });

      } catch (err) {
        console.error("Failed to construct audio element:", err);
        setPlayingAudioId(null);
      }
    }
  };

  const getStatusBadgeStyles = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-50 text-[#B71C1C] border-red-100';
      case 'Verified':
        return 'bg-amber-50 text-[#FFB300] border-amber-100';
      case 'Dispatched':
        return 'bg-blue-50 text-blue-800 border-blue-100';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-100';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full bg-[#F5F5F5] min-h-screen p-4 md:p-8 space-y-6 font-sans animate-fade-in">
      
      {/* Operations Room Command Banner */}
      <div className="bg-[#212121] text-white rounded-3xl p-6 shadow-md border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-[#B71C1C]">
            <Radio className="h-5 w-5 animate-pulse" />
            <span className="text-[10px] font-black tracking-widest uppercase text-red-500">
              {t.dispatcherSubtitle.toUpperCase()}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {t.dispatcherTitle}
          </h1>
          <p className="text-xs text-gray-400 font-semibold leading-normal">
            {t.distanceCheckInfo}
          </p>
        </div>

        {/* Admin info & Actions bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {currentUser && (
            <div className="flex flex-col bg-gray-900 border border-gray-800 p-3 rounded-2xl text-xs font-semibold text-gray-300">
              <div className="text-[8px] font-black uppercase text-[#B71C1C] tracking-widest mb-0.5">
                {language === 'en' ? 'COMMANDING OFFICER' : 'JAMI\'I MAI BAYAR DA UMARNI'}
              </div>
              <div className="font-extrabold text-white text-xs">{currentUser.name}</div>
              <div className="text-[10px] text-gray-400 font-mono font-bold mt-0.5">{currentUser.agencyId}</div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center justify-center bg-gray-800 border border-gray-700 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-inner">
              <Activity className="h-4 w-4 text-[#B71C1C] mr-2 animate-pulse" />
              <span>{t.opsState.toUpperCase()}</span>
            </div>
            
            {onLogout && (
              <button
                id="dispatcher-logout-btn"
                onClick={onLogout}
                className="px-4 py-1.5 bg-[#B71C1C] hover:bg-red-800 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shadow-sm cursor-pointer text-center"
              >
                {language === 'en' ? 'LOG OUT OF SESSION' : 'FITA DAGA SHAFIN'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            {t.totalReceived}
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-gray-900 tracking-tight">{totalIncidents}</span>
            <span className="text-xs font-semibold text-gray-500">
              {language === 'en' ? 'Alerts' : 'Hatsari'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#B71C1C] uppercase tracking-widest block">
            {t.highThreatClusters}
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-[#B71C1C] tracking-tight">{criticalCount}</span>
            <span className="text-xs font-black text-[#B71C1C]">
              {language === 'en' ? 'CRITICAL' : 'MAI MATUQAR'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block">
            {t.activeAlerts}
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-amber-600 tracking-tight">{activeCount}</span>
            <span className="text-xs font-semibold text-gray-500 font-bold">
              {language === 'en' ? 'Unresolved' : 'Ba a gama ba'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
            {t.pendingTriage}
          </span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-emerald-800 tracking-tight">{pendingReview}</span>
            <span className="text-xs font-semibold text-gray-500 font-bold">
              {language === 'en' ? 'Awaiting Rev' : 'Akwai bukata'}
            </span>
          </div>
        </div>

      </div>

      {/* Sub-panel Selector Tabs */}
      <div className="grid grid-cols-2 p-1.5 bg-gray-200/60 rounded-2xl border border-gray-300 shadow-inner">
        <button
          id="subpanel-btn-stream"
          type="button"
          onClick={() => {
            setActiveSubPanel('stream');
            if (navigator.vibrate) navigator.vibrate(20);
          }}
          className={`py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeSubPanel === 'stream'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 font-extrabold'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>{language === 'en' ? 'Core Real-time Incident Stream' : 'Hanyar Rahotan Gaggawa'}</span>
        </button>
        <button
          id="subpanel-btn-forms"
          type="button"
          onClick={() => {
            setActiveSubPanel('forms');
            if (navigator.vibrate) navigator.vibrate(20);
          }}
          className={`py-3.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeSubPanel === 'forms'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 font-extrabold'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>{language === 'en' ? 'Detailed Form Intake Panel' : 'Kwamitin Binciken Fom'}</span>
          {formBasedIncidents.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full animate-pulse">
              {formBasedIncidents.length}
            </span>
          )}
        </button>
      </div>

      {activeSubPanel === 'stream' ? (
        <>
          {/* Filter and Control Toolbar */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2 text-xs font-black text-gray-700 w-full md:w-auto">
              <Filter className="h-4 w-4 text-gray-500" />
              <span>{t.filterControls}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-gray-400">{t.categoryLabel}</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs font-bold py-2 px-4 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="All">{t.allCategories}</option>
                  <option value="Banditry">{t.categories.banditry}</option>
                  <option value="Kidnapping">{t.categories.kidnapping}</option>
                  <option value="Armed Robbery">{t.categories.robbery}</option>
                  <option value="Fire Outbreak">{t.categories.fire}</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-gray-400">{t.statusLabel}</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-xs font-bold py-2 px-4 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="All">{t.allStatuses}</option>
                  <option value="Pending">{t.statusLabels.Pending}</option>
                  <option value="Verified">{t.statusLabels.Verified}</option>
                  <option value="Dispatched">{t.statusLabels.Dispatched}</option>
                  <option value="Resolved">{t.statusLabels.Resolved}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Incidents Stream */}
          <div className="space-y-4">
            {filteredIncidents.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 space-y-3">
                <Layers className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="text-sm font-black text-gray-500">
                  {t.noIncidents}
                </p>
              </div>
            ) : (
              filteredIncidents.map((incident) => {
                const isCritical = incident.threatPriority === 'High' || incident.nearbyAlertCount >= 3;
                
                // Format Category string for translation
                let translatedCategory = incident.category;
                if (incident.category.startsWith('Banditry')) {
                  translatedCategory = t.categories.banditry;
                } else if (incident.category.startsWith('Kidnapping')) {
                  translatedCategory = t.categories.kidnapping;
                } else if (incident.category.startsWith('Armed Robbery')) {
                  translatedCategory = t.categories.robbery;
                } else if (incident.category.startsWith('Fire')) {
                  translatedCategory = t.categories.fire;
                }

                if (incident.category.includes('Voice')) {
                  translatedCategory += ` (${language === 'en' ? 'Voice' : 'Murya'})`;
                }
                
                return (
                  <div 
                    key={incident._id} 
                    id={`incident-row-${incident._id}`}
                    className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                      isCritical 
                        ? 'border-l-8 border-l-[#B71C1C] border-red-100 shadow-[0_0_20px_rgba(183,28,28,0.03)]' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Header Information */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                      <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                        <span className="text-xs font-black tracking-wider bg-[#212121] text-white px-3 py-1.5 rounded-xl border border-gray-800">
                          {translatedCategory.toUpperCase()}
                        </span>
                        
                        {incident.isOfflineReport && (
                          <span className="text-[10px] font-black tracking-wider bg-amber-600 text-white px-2.5 py-1 rounded-lg border border-amber-700 animate-pulse">
                            {language === 'en' ? 'OFFLINE / USSD DISPATCH' : 'Offline / USSD Gateway'}
                          </span>
                        )}

                        <span className={`text-[10px] font-black px-2.5 py-1 border rounded-lg tracking-wider ${getStatusBadgeStyles(incident.status)}`}>
                          {t.statusLabels[incident.status].toUpperCase()}
                        </span>

                        {isCritical && (
                          <span className="text-[10px] font-black text-white bg-[#B71C1C] px-3 py-1.5 rounded-xl animate-pulse flex items-center border border-red-700">
                            <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                            <span>{language === 'en' ? `CRITICAL CLUSTER (${incident.nearbyAlertCount} REPORTS)` : `MATUQAR HATSARI (ALOLIN 3+)`}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-semibold">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Core Geospatial / Sender Details Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                      
                      {/* Sender Security Anonymization */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <User className="h-3.5 w-3.5 mr-1" />
                          {t.anonymousToken}
                        </div>
                        <p className="text-xs font-mono font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 overflow-hidden truncate">
                          {incident.senderToken}
                        </p>
                      </div>

                      {/* Geolocation Coordinates */}
                      <div className="space-y-1 col-span-2">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1" />
                          {t.coordinates} (GPS Location)
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100 text-xs">
                          <span className="font-mono font-bold text-gray-700 pl-2">
                            LAT: {incident.location.coordinates[1].toFixed(5)} • LNG: {incident.location.coordinates[0].toFixed(5)}
                          </span>
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            className="text-[10px] font-black text-red-700 hover:underline bg-red-50/50 px-3 py-1.5 rounded-xl border border-red-100 transition-colors"
                          >
                            {t.viewSatelliteMap}
                          </a>
                        </div>
                      </div>

                    </div>

                    {/* Voice Distress Note Section (if present) */}
                    {incident.audioRef && (
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 mb-5 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2.5 rounded-xl bg-emerald-50 text-[#2E7D32]">
                            <Volume2 className="h-4.5 w-4.5" />
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-gray-800 block leading-tight">
                              {t.voiceNoteActive}
                            </span>
                            <span className="text-[10px] text-gray-500 font-semibold block">
                              {t.secureTacticalAudio}
                            </span>
                          </div>
                        </div>

                        <button
                          id={`play-audio-btn-${incident._id}`}
                          type="button"
                          onClick={() => handleAudioPlayback(incident._id)}
                          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition-colors cursor-pointer"
                        >
                          {playingAudioId === incident._id ? (
                            <>
                              <Square className="h-3.5 w-3.5 fill-current" />
                              <span>{t.stopAudio}</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>{t.playAudio}</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Dispatch / Update Operations Bar */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-gray-100 pt-4">
                      {incident.status === 'Pending' && (
                        <button
                          id={`verify-btn-${incident._id}`}
                          type="button"
                          onClick={() => onUpdateStatus(incident._id, 'Verified')}
                          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer"
                        >
                          {t.verifyAction.toUpperCase()}
                        </button>
                      )}

                      {(incident.status === 'Pending' || incident.status === 'Verified') && (
                        <button
                          id={`dispatch-btn-${incident._id}`}
                          type="button"
                          onClick={() => handleOpenDispatch(incident)}
                          className="px-4 py-2 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-xs font-black tracking-wider transition-all shadow-md border border-red-700 cursor-pointer"
                        >
                          {t.dispatchAction.toUpperCase()}
                        </button>
                      )}

                      {incident.status !== 'Resolved' && (
                        <button
                          id={`resolve-btn-${incident._id}`}
                          type="button"
                          onClick={() => onUpdateStatus(incident._id, 'Resolved')}
                          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-black tracking-wider transition-all shadow-md border border-emerald-700 cursor-pointer"
                        >
                          {t.resolveAction.toUpperCase()}
                        </button>
                      )}

                      {incident.status === 'Resolved' && (
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center shadow-inner">
                          <Check className="h-4 w-4 mr-1.5" /> {t.archivedSecurely}
                        </span>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Form Reports Evaluation Panel */
        <div className="space-y-6">
          <div className="bg-[#212121] text-white p-5 rounded-3xl border border-gray-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-red-500 mb-0.5">
                <Sparkles className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="text-[9px] font-black tracking-widest uppercase">{language === 'en' ? 'Frontline Intelligence Hub' : 'Sashin Lura na Sirri'}</span>
              </div>
              <h3 className="text-base font-black tracking-tight">{language === 'en' ? 'Detailed Form Intake & Threat Assessment' : 'Auna Hatsari Daga Fom Din Gaggawa'}</h3>
              <p className="text-xs text-gray-400 font-semibold leading-normal">
                {language === 'en' 
                  ? 'Review deep situational descriptions, landmarks, and reporter profiles. Urgency level keyword scanning is active.' 
                  : 'Bincika rubutaccen bayani, sunan mai tura sako da alamomin gari da aka bayyana don bawa jami\'an tsaro ainihin abin da ke faruwa.'}
              </p>
            </div>
            <div className="text-xs font-bold text-gray-400 bg-gray-900 border border-gray-800 px-3.5 py-2 rounded-xl font-mono shrink-0">
              FORM COUNT: <span className="text-white font-black">{formBasedIncidents.length}</span>
            </div>
          </div>

          {formBasedIncidents.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-200 space-y-3">
              <FileText className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="text-sm font-black text-gray-500">
                {language === 'en' ? 'No detailed form-based reports received in this session.' : 'Babu cikakken rahoton fom da aka tura a wannan lokacin.'}
              </p>
            </div>
          ) : (
            formBasedIncidents.map((incident) => {
              const descLower = (incident.description || '').toLowerCase();
              const landmarkLower = (incident.locationDetails || '').toLowerCase();
              const isUrgent = descLower.match(/(gunfire|shot|bandit|fire|kidnap|attack|kill|danger|garkuwa|bindiga|harbi|gobara)/i) || 
                               landmarkLower.match(/(gunfire|shot|bandit|fire|kidnap|attack|kill|danger|garkuwa|bindiga|harbi|gobara)/i);
              const isCritical = incident.threatPriority === 'High' || incident.nearbyAlertCount >= 3;
              
              let translatedCategory = incident.category;
              if (incident.category.startsWith('Banditry')) {
                translatedCategory = t.categories.banditry;
              } else if (incident.category.startsWith('Kidnapping')) {
                translatedCategory = t.categories.kidnapping;
              } else if (incident.category.startsWith('Armed Robbery')) {
                translatedCategory = t.categories.robbery;
              } else if (incident.category.startsWith('Fire')) {
                translatedCategory = t.categories.fire;
              }

              return (
                <div 
                  key={incident._id} 
                  id={`form-evaluation-card-${incident._id}`}
                  className={`bg-white rounded-3xl p-6 shadow-md border transition-all ${
                    isCritical || isUrgent 
                      ? 'border-l-8 border-l-red-600 border-red-100 shadow-[0_0_20px_rgba(183,28,28,0.05)] animate-pulse-subtle' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4 mb-5">
                    <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                      <span className="text-[10px] font-black tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-lg border border-slate-800">
                        {translatedCategory.toUpperCase()}
                      </span>
                      
                      <span className={`text-[10px] font-black px-2.5 py-1 border rounded-lg tracking-wider ${getStatusBadgeStyles(incident.status)}`}>
                        {t.statusLabels[incident.status].toUpperCase()}
                      </span>

                      {isUrgent && (
                        <span className="text-[10px] font-black text-red-900 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg flex items-center animate-pulse">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-[#B71C1C]" />
                          <span>{language === 'en' ? 'SEVERE THREAT DETECTED' : 'ALAMAR TSANANI AN GANO'}</span>
                        </span>
                      )}

                      {isCritical && (
                        <span className="text-[10px] font-black text-white bg-[#B71C1C] px-2.5 py-1 rounded-lg flex items-center border border-red-700">
                          <span>{language === 'en' ? 'CRITICAL BENTO CLUSTER' : 'HATSARI NA KUSA'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 text-xs text-gray-400 font-semibold font-mono">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Core Card Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-5">
                    
                    {/* Reporter Info & Location Coordinates */}
                    <div className="md:col-span-4 space-y-4">
                      {/* Name Card */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <User className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {language === 'en' ? 'REPORTER PROFILE' : 'BAYANIN MAI TURA RAHOTO'}
                        </span>
                        {incident.reporterName && incident.reporterName !== 'Anonymous' ? (
                          <div className="text-xs font-extrabold text-blue-900 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                            {incident.reporterName}
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-800 bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5 flex items-center">
                            <EyeOff className="h-3.5 w-3.5 text-emerald-600 mr-1.5" />
                            {language === 'en' ? 'Stealth Anonymous' : 'Cikin Sirri (Babu Suna)'}
                          </div>
                        )}
                        <span className="text-[9px] text-gray-400 font-mono block truncate pl-1">
                          HASH ID: {incident.senderToken}
                        </span>
                      </div>

                      {/* GPS Coordinates & Map Link */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {language === 'en' ? 'TACTICAL COORDINATES' : 'GURBIN GPS SOJOJI'}
                        </span>
                        <div className="text-xs font-mono font-bold text-gray-700 bg-white p-2.5 rounded-xl border border-gray-150">
                          LAT: {incident.location.coordinates[1].toFixed(5)}°<br />
                          LNG: {incident.location.coordinates[0].toFixed(5)}°
                        </div>
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${incident.location.coordinates[1]},${incident.location.coordinates[0]}`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-[10px] font-black rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{t.viewSatelliteMap}</span>
                        </a>
                      </div>
                    </div>

                    {/* Landmark & Situation Details (Wider Area) */}
                    <div className="md:col-span-8 space-y-4">
                      {/* Specific Landmark details */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-1.5 text-xs font-semibold">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                          <Building className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          {language === 'en' ? 'LANDMARK & PHYSICAL SITE DETAILS' : 'ALAMOMI KO TABBATACCEN SHAIDA NA WURI'}
                        </span>
                        {incident.locationDetails ? (
                          <p className="text-gray-800 bg-white p-3 rounded-xl border border-gray-150 leading-relaxed font-bold">
                            {incident.locationDetails}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic bg-white p-3 rounded-xl border border-gray-150">
                            {language === 'en' ? 'No additional landmark details provided.' : 'Babu ƙarin bayanin alamomin wuri da aka bayar.'}
                          </p>
                        )}
                      </div>

                      {/* Situation Description text */}
                      <div className="bg-red-50/10 border border-red-200/50 rounded-2xl p-4 space-y-2 text-xs font-semibold">
                        <span className="text-[9px] font-black text-[#B71C1C] uppercase tracking-widest flex items-center">
                          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-[#B71C1C]" />
                          {language === 'en' ? 'DETAILED SITUATION LOGS' : 'CIKAKKEN BAYANIN HALIN DA AKE CIKI'}
                        </span>
                        {incident.description ? (
                          <div className="text-gray-950 bg-white p-3.5 rounded-xl border border-red-100 leading-relaxed text-sm font-black border-l-4 border-l-red-600 whitespace-pre-line">
                            "{incident.description}"
                          </div>
                        ) : (
                          <p className="text-gray-400 italic bg-white p-3 rounded-xl border border-gray-150">
                            {language === 'en' ? 'No situation text description provided.' : 'Babu wani rubutaccen bayani da aka bayar.'}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Threat Evaluation Controls & Operations Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-150 pt-4 mt-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-200">
                    <div className="flex items-center text-[10px] font-black uppercase text-gray-500">
                      <CheckSquare className="h-4 w-4 mr-1.5 text-[#B71C1C]" />
                      <span>{language === 'en' ? 'Threat Evaluation Checklist' : 'Matakin Bincike na Jami\'ai'}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {incident.status === 'Pending' && (
                        <button
                          id={`verify-btn-form-${incident._id}`}
                          type="button"
                          onClick={() => {
                            onUpdateStatus(incident._id, 'Verified');
                            if (navigator.vibrate) navigator.vibrate(30);
                          }}
                          className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <ThumbsUp className="h-3.5 w-3.5 text-amber-700" />
                          <span>{t.verifyAction.toUpperCase()}</span>
                        </button>
                      )}

                      {(incident.status === 'Pending' || incident.status === 'Verified') && (
                        <button
                          id={`dispatch-btn-form-${incident._id}`}
                          type="button"
                          onClick={() => handleOpenDispatch(incident)}
                          className="px-4 py-2 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-xs font-black tracking-wider transition-all shadow-md border border-red-700 cursor-pointer flex items-center space-x-1"
                        >
                          <Activity className="h-3.5 w-3.5 text-white" />
                          <span>{t.dispatchAction.toUpperCase()}</span>
                        </button>
                      )}

                      {incident.status !== 'Resolved' && (
                        <button
                          id={`resolve-btn-form-${incident._id}`}
                          type="button"
                          onClick={() => {
                            onUpdateStatus(incident._id, 'Resolved');
                            if (navigator.vibrate) navigator.vibrate(40);
                          }}
                          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-black tracking-wider transition-all shadow-md border border-emerald-700 cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="h-3.5 w-3.5 text-white" />
                          <span>{t.resolveAction.toUpperCase()}</span>
                        </button>
                      )}

                      {incident.status === 'Resolved' && (
                        <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center shadow-inner">
                          <Check className="h-4 w-4 mr-1.5 text-emerald-600" /> {t.archivedSecurely}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* Dispatch Unit Force Modal */}
      {dispatchIncident && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-gray-150 relative my-8">
            
            {/* Absolute Brand Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#B71C1C]" />

            {/* Close Button */}
            <button
              id="close-dispatch-modal"
              onClick={() => setDispatchIncident(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#B71C1C] text-white flex items-center justify-center shadow-md">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">
                  {language === 'en' ? 'FORCE COMMAND DISPATCH UNIT' : 'AIKA SHASHIN RUNDUNAR CETO'}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {language === 'en' ? 'Secured Tactical Deployment Stream' : 'Amintaccen Hanyar Tura Runduna ta Musamman'}
                </p>
              </div>
            </div>

            {/* Loading / Transmitting state */}
            {dispatchStatus === 'transmitting' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-4 border-red-200 border-t-[#B71C1C] animate-spin" />
                  <Radio className="absolute inset-0 m-auto h-6 w-6 text-[#B71C1C] animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                    {language === 'en' ? 'ENCRYPTING TELEMETRY...' : 'ANA KULLE BAYANAI (ENCRYPTING)...'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-semibold max-w-xs leading-relaxed mx-auto">
                    {language === 'en' 
                      ? 'Establishing military-grade satellite gateway, pairing coordinate vectors, and broadcasting encrypted payload.' 
                      : 'Ana hada lambobin sirri na soji, hada bayanai da GPS, da tura dukkan bayanan gaggawa.'}
                  </p>
                </div>
              </div>
            )}

            {/* Failure state */}
            {dispatchStatus === 'failure' && (
              <div className="space-y-5 animate-fade-in text-center py-6">
                <div className="w-14 h-14 rounded-full bg-red-50 text-[#B71C1C] flex items-center justify-center mx-auto border border-red-100 shadow-sm animate-bounce">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-base font-black text-[#B71C1C] uppercase tracking-wide">
                    {language === 'en' ? 'DISPATCH TELEMETRY FAILURE' : 'KUSKURE WAJEN TURA RUNDUNA'}
                  </h4>
                  <p className="text-xs text-gray-600 font-semibold bg-gray-50 p-4 rounded-2xl border border-gray-150 leading-relaxed text-left font-mono">
                    {dispatchError}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    id="dispatch-retry-btn"
                    onClick={() => setDispatchStatus('idle')}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'MODIFY & RETRY' : 'GYARA & SAKE GWADAWA'}
                  </button>
                  <button
                    id="dispatch-fail-dismiss-btn"
                    onClick={() => setDispatchIncident(null)}
                    className="flex-1 py-3 bg-[#B71C1C] text-white rounded-xl text-xs font-black tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'ABORT COMMAND' : 'FASA AYYUKAN'}
                  </button>
                </div>
              </div>
            )}

            {/* Success state - satisfies "acknowledgement of success" */}
            {dispatchStatus === 'success' && dispatchReceipt && (
              <div className="space-y-5 animate-fade-in py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                
                <div className="text-center space-y-1">
                  <h4 className="text-base font-black text-emerald-800 uppercase tracking-wide">
                    {language === 'en' ? 'DISPATCH COMMAND SENT SUCCESSFULLY' : 'AN TURA UMARNI CIKIN NASARA'}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    {language === 'en' 
                      ? 'Secure receipt received from field command. Response force dispatched.' 
                      : 'An karbi rasi na musamman daga bakin jami\'ai. An tura rundunar ceto yanzu.'}
                  </p>
                </div>

                {/* Military styled dispatch receipt */}
                <div className="bg-gray-950 text-emerald-400 font-mono text-[11px] rounded-2xl p-5 border border-emerald-950 space-y-2.5 shadow-inner">
                  <div className="border-b border-emerald-950 pb-2 text-center text-xs font-black uppercase text-white tracking-widest flex items-center justify-center space-x-1.5">
                    <Radio className="h-4.5 w-4.5 animate-pulse" />
                    <span>{language === 'en' ? 'TACTICAL DISPATCH RECEIPT' : 'RASIDIN TURA RUNDUNA'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-y-1.5 font-semibold text-gray-400">
                    <span className="text-emerald-500 font-bold uppercase">RECEIPT ID:</span>
                    <span className="col-span-2 text-white font-bold select-all">{dispatchReceipt.receiptId}</span>

                    <span className="text-emerald-500 font-bold uppercase">ASSIGNED FORCE:</span>
                    <span className="col-span-2 text-white font-bold">{dispatchReceipt.agencyName}</span>

                    <span className="text-emerald-500 font-bold uppercase">ACTIVE UNIT:</span>
                    <span className="col-span-2 text-white font-bold">{dispatchReceipt.unitName}</span>

                    <span className="text-emerald-500 font-bold uppercase">COORDINATES:</span>
                    <span className="col-span-2 text-white font-bold select-all">{dispatchReceipt.coordinates}</span>

                    <span className="text-emerald-500 font-bold uppercase">SYSTEM TIME:</span>
                    <span className="col-span-2 text-white font-bold">{dispatchReceipt.timestamp}</span>

                    <span className="text-emerald-500 font-bold uppercase">TACTICAL NOTES:</span>
                    <span className="col-span-2 text-white text-[10px] italic">{dispatchReceipt.message}</span>
                  </div>
                </div>

                <button
                  id="dispatch-receipt-commit-btn"
                  onClick={confirmAndCommitDispatch}
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-md cursor-pointer"
                >
                  {language === 'en' ? 'ACKNOWLEDGE & COMMIT TO LEDGER' : 'GANE KUMA SANYA A CIKIN LITTAFI'}
                </button>
              </div>
            )}

            {/* Idle Form */}
            {dispatchStatus === 'idle' && (
              <form onSubmit={executeDispatchTransmit} className="space-y-4">
                
                {/* Incident Coordinates display */}
                <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {language === 'en' ? 'TARGET INCIDENT TELEMETRY' : 'BAYANAI NA ABIN DA YA FARU'}
                  </span>
                  <div className="text-xs font-bold text-gray-800 space-y-1">
                    <div>
                      {language === 'en' ? 'Category:' : 'Sashin Matsala:'}{' '}
                      <span className="text-red-700 uppercase">{dispatchIncident.category}</span>
                    </div>
                    <div className="font-mono text-[11px] text-gray-500 font-black">
                      GPS: LAT {dispatchIncident.location.coordinates[1].toFixed(5)} • LNG {dispatchIncident.location.coordinates[0].toFixed(5)}
                    </div>
                  </div>
                </div>

                {/* Agency Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {language === 'en' ? 'Select Tactical Force Agency' : 'Zabi Hukumar Tsaro'}
                  </label>
                  <select
                    value={dispatchAgency}
                    onChange={(e) => handleAgencyChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-bold py-2.5 px-4 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent cursor-pointer"
                  >
                    <option value="cpg">{agencyUnits.cpg.name}</option>
                    <option value="army">{agencyUnits.army.name}</option>
                    <option value="police">{agencyUnits.police.name}</option>
                    <option value="sema">{agencyUnits.sema.name}</option>
                  </select>
                </div>

                {/* Unit Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {language === 'en' ? 'Select Operational Unit' : 'Zabi Runduna Ta Musamman'}
                  </label>
                  <select
                    value={dispatchUnit}
                    onChange={(e) => setDispatchUnit(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-bold py-2.5 px-4 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent cursor-pointer"
                  >
                    {agencyUnits[dispatchAgency].units.map((unit) => (
                      <option key={unit.id} value={unit.name}>{unit.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tactical Dispatch Message */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                    {language === 'en' ? 'Tactical Dispatch Notes (Optional)' : 'Bayanan Tura Runduna (Na Zabi)'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={language === 'en' ? 'Enter route directions, tactical objectives, or coordinate details...' : 'Sanya bayanan hanya, ko sauran muhimman bayanai...'}
                    value={dispatchMessage}
                    onChange={(e) => setDispatchMessage(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent"
                  />
                </div>

                {/* Simulate Failure Switch - satisfies the "success OR failure" of dispatch */}
                <div className="flex items-center justify-between bg-red-50/50 border border-red-100 p-3 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-[#B71C1C] uppercase tracking-wider block">
                      {language === 'en' ? 'Simulate Satellite Link Failure' : 'Gwada Kuskuren Sadarwa ta Sama'}
                    </span>
                    <span className="text-[9px] text-gray-500 font-semibold block">
                      {language === 'en' ? 'Force a broadband linkage transmission error.' : 'Sanya kuskuren sadarwa don gwada tsarin.'}
                    </span>
                  </div>
                  <input
                    id="simulate-failure-checkbox"
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    id="dispatch-cancel-btn"
                    type="button"
                    onClick={() => setDispatchIncident(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-black tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {language === 'en' ? 'CANCEL' : 'FASAWA'}
                  </button>
                  <button
                    id="dispatch-transmit-btn"
                    type="submit"
                    className="flex-1 py-3 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-all shadow-md cursor-pointer"
                  >
                    {language === 'en' ? 'TRANSMIT FORCE COMMAND' : 'TURA RUNDUNA GA KUMA'}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
