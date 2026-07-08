import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    title: "Guardian-NG",
    subtitle: "Zamfara Community Emergency Response System",
    audienceCitizen: "Citizen Portal",
    audienceDispatcher: "Dispatcher Control",
    switchAudience: "Switch Interface",
    stealthModeOn: "Stealth Lock Active",
    stealthModeDesc: "This is a standard utility view. Tap unlock to return to the rescue interface.",
    stealthUnlock: "Unlock Interface",
    holdToTrigger: "HOLD FOR 3 SECONDS TO TRIGGER PANIC ALERT",
    secondsRemaining: "Hold for {n}s...",
    releaseToCancel: "Release to Cancel",
    alertSentSuccess: "Critical alert sent securely to Zamfara Security Control!",
    alertSentOffline: "Network down. Alert queued locally and converted to optimized SMS string!",
    categories: {
      banditry: "Banditry / Attack",
      kidnapping: "Kidnapping",
      robbery: "Armed Robbery",
      fire: "Fire Outbreak"
    },
    hotlineTitle: "Emergency Hotline Directory",
    hotlineSubtitle: "Direct telephone connections to frontline security commands",
    callNow: "TAP TO CALL NOW",
    statusLabels: {
      Pending: "Pending Review",
      Verified: "Incident Verified",
      Dispatched: "Forces Dispatched",
      Resolved: "Resolved / Safe"
    },
    threatLevel: "Threat Level",
    threatHigh: "CRITICAL (3+ Co-located Alerts)",
    threatNormal: "Standard Incident",
    coordinates: "Coordinates",
    timeReported: "Time Reported",
    anonymousToken: "Hashed ID",
    voiceNote: "5s Distress Audio",
    noIncidents: "No active incidents reported in this sector.",
    dispatchAction: "Dispatch Forces",
    resolveAction: "Mark Resolved",
    verifyAction: "Verify Incident",
    distanceCheckInfo: "Automatic geospatial cluster logic active (2km radius threat escalation).",
    
    // Additional UI translations for 100% coverage
    voiceDistressTitle: "Voice Distress Note (5s Limit)",
    voiceDistressDesc: "Optional audio snippet: record tactical details or immediate environmental sounds to send with coordinates. Clears automatically.",
    recordingState: "RECORDING: {n}s / 5s (TAP TO SAVE)",
    rerecordVoice: "RE-RECORD VOICE SNIPPET",
    tapToRecord: "TAP TO RECORD 5S SNIPPET",
    requiresHold: "Requires 3-second secure continuous press to avoid false dispatches.",
    criticalResponseSystem: "CRITICAL RESPONSE SYSTEM",
    secureWebLink: "SECURE WEB LINK ACTIVE",
    smsFallbackTelemetry: "SMS FALLBACK TELEMETRY RUNNING",
    hqCommandLocation: "HQ Command: Gusau, Zamfara",
    selectedCrisisCategory: "SELECTED CRISIS CATEGORY",
    stealthLock: "STEALTH LOCK",
    hausaToggle: "HAUSA (HA)",
    englishToggle: "ENGLISH (EN)",
    
    // Dispatcher Panel translations
    dispatcherTitle: "Security Control & Response Center",
    dispatcherSubtitle: "Zamfara State Command & Dispatch Room",
    opsState: "OPS STATE: ACTIVE MONITOR",
    totalReceived: "TOTAL RECEIVED",
    highThreatClusters: "HIGH THREAT CLUSTERS",
    activeAlerts: "ACTIVE ALERTS",
    pendingTriage: "PENDING TRIAGE",
    filterControls: "FILTER CONTROLS:",
    categoryLabel: "CATEGORY:",
    statusLabel: "STATUS:",
    viewSatelliteMap: "VIEW SATELLITE MAP",
    archivedSecurely: "ARCHIVED SECURELY",
    allCategories: "All Categories",
    allStatuses: "All Statuses",
    voiceNoteActive: "5s Distress Audio Active",
    secureTacticalAudio: "Secure military-grade tactical audio payload",
    playAudio: "PLAY AUDIO",
    stopAudio: "STOP (05s)",
    readyText: "READY",
    voiceDistressSuccess: "✓ VOICE DISTRESS SECURELY TRANSMITTED TO GUSAU COMMAND CENTRE!",
    sendVoiceNoteBtn: "SUBMIT SECURE VOICE DISTRESS",
    submittingVoice: "SUBMITTING AUDIO...",
    dismissAlert: "Acknowledge & Wipe Footprint",
    dispatchedTitle: "DISPATCHED",
    errorTitle: "ERROR",
    systemTime: "SYSTEM TIME"
  },
  ha: {
    title: "Guardian-NG",
    subtitle: "Tsarin Daukar Matakin Gaggawa na Jihar Zamfara",
    audienceCitizen: "Kofark Citizen (Jama'a)",
    audienceDispatcher: "Kofark Dispatcher (Masu Ba da Umarni)",
    switchAudience: "Sauya Kofa",
    stealthModeOn: "Kariyar Stealth Kulle Take",
    stealthModeDesc: "Wannan shafi ne na yau da kullum (Hali da Lokutan Sallah). Taba 'Bude' domin komawa dandalin gaggawa.",
    stealthUnlock: "Bude Kofa",
    holdToTrigger: "DANNA KUMA KA RIQE NA SAKANDI 3 DOMIN AIKARA DA SAKON GAGGAWA",
    secondsRemaining: "Riqe na tsawon {n}s...",
    releaseToCancel: "Saki domin fasa aikawa",
    alertSentSuccess: "An tura sakon gaggawa cikin sirri ga jami'an tsaron Zamfara!",
    alertSentOffline: "Babu raga. An adana sakon a wayarku don tura shi ta sako na musamman (SMS)!",
    categories: {
      banditry: "Harin 'Yan Bindiga / Barayi",
      kidnapping: "Garkuwa da Mutane",
      robbery: "Fashi da Makami",
      fire: "Gobara"
    },
    hotlineTitle: "Lissafin Lambobin Gaggawa",
    hotlineSubtitle: "Sadarwa ta kai tsaye zuwa ga jami'an tsaro na gaba-gaba",
    callNow: "TABA DOMIN KIRA YANZU",
    statusLabels: {
      Pending: "Akwai Bukatar Dubawa",
      Verified: "An Tabbatar da Lamarin",
      Dispatched: "An Tura Jami'an Tsaro",
      Resolved: "An Magance / Lafiya"
    },
    threatLevel: "Matakin Hatsari",
    threatHigh: "MAI MATUQAR HADSARI (Sako 3+ kusa da juna)",
    threatNormal: "Hatsari Na Daidai",
    coordinates: "Gurbi (GPS)",
    timeReported: "Lokacin Rahoto",
    anonymousToken: "Sirrarren Hoto (Hashed ID)",
    voiceNote: "Muryar Gaggawa (5s)",
    noIncidents: "Babu wani rahoto na gaggawa a wannan sashe.",
    dispatchAction: "Tura Runduna",
    resolveAction: "An Magance",
    verifyAction: "Tabbatar da Lamarin",
    distanceCheckInfo: "Tsarin duba tazara na atomatik yana aiki (Hatsari ya ninka idan akwai rahotanni 3+ cikin 2km).",
    
    // Additional UI translations for 100% coverage
    voiceDistressTitle: "Muryar Gaggawa (Iyaka Sakandi 5)",
    voiceDistressDesc: "Kayan muryar gaggawa: yi muryar tattaunawa ko karar dake kusa don tura ta tare da gurbinku na GPS. Ana gogewa ta atomatik.",
    recordingState: "ANA RECORDING: {n}s / 5s (TABA DOMIN ADANAWA)",
    rerecordVoice: "SANYA SABUWAR MURYAR GAGGAWA",
    tapToRecord: "TABA DOMIN YIN MURYAR SAKANDI 5",
    requiresHold: "Ana bukatar latsawa na tsawon sakandi 3 don kiyaye aikawa cikin kuskure.",
    criticalResponseSystem: "TSARIN AMSA MATSALAR GAGGAWA",
    secureWebLink: "HANYAR SADARWA TA YANAR GIZO TANA AIKI",
    smsFallbackTelemetry: "TSARIN SAKO (SMS) MAI TAIMAKAWA YANA AIKI",
    hqCommandLocation: "Hedkwatar Tsaro: Gusau, Zamfara",
    selectedCrisisCategory: "ABIN DA YA FARU",
    stealthLock: "KULLE SIRRI",
    hausaToggle: "HAUSA (HA)",
    englishToggle: "ENGLISH (EN)",
    
    // Dispatcher Panel translations
    dispatcherTitle: "Sashin Kula da Tsaro da Bayar da Umarni",
    dispatcherSubtitle: "Dakin Kula da Ayyukan Tsaro na Jihar Zamfara",
    opsState: "OPS STATE: KULAWA TANA TAFIYA",
    totalReceived: "DUKKAN RAHOTANNI",
    highThreatClusters: "MATSALOLIN MASU MATUQAR HATSARI",
    activeAlerts: "ALOLIN GAGGAWA MASU AIKI",
    pendingTriage: "ALOLIN DA KE JIRAN DUBAWA",
    filterControls: "FILTARWA:",
    categoryLabel: "SASHE:",
    statusLabel: "MATAKIN AIKI:",
    viewSatelliteMap: "DUBA TASWIRA (SATELLITE)",
    archivedSecurely: "AN ADANA SHI CIKIN SIRRI CIKAKKE",
    allCategories: "Dukkan Sashe",
    allStatuses: "Dukkan Matakan Aiki",
    voiceNoteActive: "Muryar Gaggawa Sakandi 5 Tana Aiki",
    secureTacticalAudio: "Amintaccen sakon muryar sirri na jami'an tsaro",
    playAudio: "SAURI MURYA",
    stopAudio: "TSAYARDA",
    readyText: "SHIRYAYYE",
    voiceDistressSuccess: "✓ AN TURA MURYAR GAGGAWA CIKIN SIRRI ZUWA HEDKWATAR GUSAU!",
    sendVoiceNoteBtn: "TURA MURYAR GAGGAWA CIKIN SIRRI",
    submittingVoice: "ANA TURA MURYA...",
    dismissAlert: "Gane Kuma Goge Sawun Kafa",
    dispatchedTitle: "AN TURA JAMI'AI",
    errorTitle: "KUSKURE",
    systemTime: "LOKACIN WAYAR"
  }
};

const LanguageContext = createContext(undefined);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en');

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ha' : 'en'));
  };

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
