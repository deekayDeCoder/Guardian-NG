import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  UserX, 
  ShieldAlert, 
  ShieldCheck,
  Radio, 
  Mic, 
  EyeOff, 
  Languages, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Navigation,
  Volume2,
  Play,
  Square,
  AlertTriangle,
  Shield,
  X,
  Smartphone,
  HelpCircle,
  Phone,
  Delete
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { HotlineDirectory } from './HotlineDirectory';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { EmergencyReportForm } from './EmergencyReportForm';
import { reportIncident } from '../utils.js';

// Pure JS synthesizer to generate a valid WAV blob with a professional tactical walkie-talkie distress signal
// Replaces screeching, loud siren sweeps with elegant dual military beeps and gentle open channel air static
const generateSyntheticEmergencyWav = () => {
  const sampleRate = 8000; // compact but perfectly clear for telephone/distress signal representation
  const duration = 5; // 5 seconds
  const numSamples = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (v, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + numSamples * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw PCM) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, 1, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, numSamples * 2, true);

  // Highly realistic military-style walkie-talkie open signal sweeps
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    if (t < 0.15) {
      // First tactical beep (smooth envelope to avoid clicking)
      const envelope = Math.sin(Math.PI * (t / 0.15));
      sampleVal = Math.sin(2 * Math.PI * 550 * t) * envelope * 0.35;
    } else if (t >= 0.15 && t < 0.22) {
      // Short signal pause
      sampleVal = 0;
    } else if (t >= 0.22 && t < 0.37) {
      // Second tactical beep
      const envelope = Math.sin(Math.PI * ((t - 0.22) / 0.15));
      sampleVal = Math.sin(2 * Math.PI * 550 * (t - 0.22)) * envelope * 0.35;
    } else {
      // Realistic open walkie-talkie channel background hiss & hum
      // Gradually fades out in the final 0.3 seconds to end cleanly
      let fade = 1.0;
      if (duration - t < 0.3) {
        fade = (duration - t) / 0.3;
      }
      const hum = Math.sin(2 * Math.PI * 60 * t) * 0.008; // 60Hz hum
      const whiteNoise = (Math.random() * 2 - 1) * 0.03; // gentle air static
      sampleVal = (hum + whiteNoise) * fade;
    }

    const val = Math.max(-32768, Math.min(32767, sampleVal * 32767));
    view.setInt16(offset, val, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return blob;
};

export const CitizenDashboard = ({ onStealthLock, onAlertTriggered, onAdminClick, addToast }) => {
  const { t, language, toggleLanguage } = useLanguage();
  
  // App views tab for reporting form
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'form'
  
  // Selected category state
  const [selectedCategory, setSelectedCategory] = useState('Banditry');
  
  // Holding state for main Panic button
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [secondsLeft, setSecondsLeft] = useState(3.0);
  const holdIntervalRef = useRef(null);
  
  // Voice Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [activeStream, setActiveStream] = useState(null);
  const recordIntervalRef = useRef(null);
  
  // Direct Voice Submission states
  const [isSubmittingVoice, setIsSubmittingVoice] = useState(false);
  const [voiceSubmitSuccess, setVoiceSubmitSuccess] = useState(false);
  const [voiceSenderToken, setVoiceSenderToken] = useState('');
  
  // Playback simulated audio state
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const playbackTimeoutRef = useRef(null);

  // Real Audio API refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioStreamRef = useRef(null);
  const audioPlaybackRef = useRef(null);

  // Clean up recording/playback on unmount
  useEffect(() => {
    return () => {
      if (audioPlaybackRef.current) {
        audioPlaybackRef.current.pause();
        audioPlaybackRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordIntervalRef.current) {
        clearInterval(recordIntervalRef.current);
      }
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, []);

  // Global Alert Status state
  const [alertStatus, setAlertStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Network connection status & Offline simulation mode
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessNotice, setSyncSuccessNotice] = useState('');
  
  // USSD/SMS Backup Modal states
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupDetails, setBackupDetails] = useState(null);
  const [showUssdAccessModal, setShowUssdAccessModal] = useState(false);
  
  // Interactive USSD Terminal simulator states
  const [ussdSessionActive, setUssdSessionActive] = useState(false);
  const [ussdStep, setUssdStep] = useState(0); // 0: dialed, 1: select option, 2: select LGA, 3: completed
  const [ussdInput, setUssdInput] = useState('');
  const [ussdLogs, setUssdLogs] = useState([]);
  const [ussdCategory, setUssdCategory] = useState('');
  const [ussdLga, setUssdLga] = useState('');
  
  // Live USSD Dialer states
  const [ussdDialString, setUssdDialString] = useState('');
  const [ussdSessionStep, setUssdSessionStep] = useState('');
  const [ussdSessionText, setUssdSessionText] = useState('');
  const [ussdInputText, setUssdInputText] = useState('');
  const [ussdError, setUssdError] = useState('');

  const effectiveOnline = isOnline && !simulateOffline;

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Load local offline queue on mount
    const queue = JSON.parse(localStorage.getItem('guardian_offline_queue') || '[]');
    setOfflineQueue(queue);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync queued reports when connection is active & stable
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setSyncSuccessNotice('');
    
    let successCount = 0;
    const currentQueue = [...offlineQueue];
    const remainingQueue = [];
    
    for (const report of currentQueue) {
      const payload = {
        category: report.category,
        latitude: report.latitude,
        longitude: report.longitude,
        audioPayload: report.audioPayload || undefined
      };
      
      try {
        const result = await reportIncident(payload);
        onAlertTriggered(result.incident);
        successCount++;
      } catch (err) {
        console.error("Failed to sync queued incident: ", err);
        remainingQueue.push(report);
      }
    }
    
    setOfflineQueue(remainingQueue);
    localStorage.setItem('guardian_offline_queue', JSON.stringify(remainingQueue));
    setIsSyncing(false);
    
    if (successCount > 0) {
      setSyncSuccessNotice(
        language === 'en'
          ? `Broadband satellite uplink active! Transmitted ${successCount} queued emergency report(s) to Sector Command.`
          : `Kafar sadarwa ta satellite tana aiki! An tura rahotanni guda ${successCount} da aka ajiye zuwa babban dakin kwamando.`
      );
      setTimeout(() => setSyncSuccessNotice(''), 6000);
    }
  };

  // Trigger sync on transition back to online
  useEffect(() => {
    if (effectiveOnline && offlineQueue.length > 0) {
      syncOfflineQueue();
    }
  }, [effectiveOnline]);

  const queueOfflineReport = (category, lat, lng, audioPayload) => {
    const newReport = {
      id: `offline-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category,
      latitude: lat,
      longitude: lng,
      audioPayload: audioPayload || null,
      createdAt: new Date().toISOString(),
      status: 'Queued (Offline / Outbox)'
    };
    
    const updatedQueue = [...offlineQueue, newReport];
    setOfflineQueue(updatedQueue);
    localStorage.setItem('guardian_offline_queue', JSON.stringify(updatedQueue));
    
    setBackupDetails({
      id: newReport.id,
      category: category,
      lat: lat,
      lng: lng,
      smsText: `GUARDIAN_ALERT*CAT:${category.substring(0,4).toUpperCase()}*LAT:${lat.toFixed(4)}*LNG:${lng.toFixed(4)}`
    });
    setShowBackupModal(true);
    
    // Provide visual feedback for dispatcher map mock matching
    onAlertTriggered({
      _id: newReport.id,
      senderToken: "ANON_OFFLINE_" + Math.random().toString(36).substring(7).toUpperCase(),
      category: category,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      status: 'Pending',
      threatPriority: 'Normal',
      createdAt: newReport.createdAt,
      nearbyAlertCount: 1,
      audioRef: audioPayload,
      isOfflineReport: true
    });
  };

  const handleUssdSubmit = (inputVal) => {
    const normalizedInput = inputVal.trim();
    if (!normalizedInput) return;
    
    setUssdInput('');
    
    if (ussdStep === 1) {
      let cat = 'Banditry';
      if (normalizedInput === '2') cat = 'Kidnapping';
      if (normalizedInput === '3') cat = 'Armed Robbery';
      if (normalizedInput === '4') cat = 'Fire Outbreak';
      
      setUssdCategory(cat);
      setUssdLogs([...ussdLogs, { sender: 'user', text: normalizedInput }]);
      setUssdStep(2);
    } else if (ussdStep === 2) {
      let lga = 'Gusau';
      if (normalizedInput === '2') lga = 'Maru';
      if (normalizedInput === '3') lga = 'Anka';
      if (normalizedInput === '4') lga = 'Zurmi';
      if (normalizedInput === '5') lga = 'Talata Mafara';
      
      setUssdLga(lga);
      setUssdLogs([...ussdLogs, { sender: 'user', text: normalizedInput }]);
      setUssdStep(3);
    } else if (ussdStep === 3) {
      if (normalizedInput === '1') {
        const lat = backupDetails?.lat || 12.1628;
        const lng = backupDetails?.lng || 6.6614;
        
        const reportId = `offline-ussd-${Date.now()}`;
        const newReport = {
          id: reportId,
          category: `${ussdCategory} (USSD Gateway)`,
          latitude: lat,
          longitude: lng,
          audioPayload: null,
          createdAt: new Date().toISOString(),
          status: 'Queued (Offline / Outbox)'
        };
        
        const exists = offlineQueue.some(r => r.category === ussdCategory && Math.abs(r.latitude - lat) < 0.001);
        if (!exists) {
          const updatedQueue = [...offlineQueue, newReport];
          setOfflineQueue(updatedQueue);
          localStorage.setItem('guardian_offline_queue', JSON.stringify(updatedQueue));
          
          onAlertTriggered({
            _id: reportId,
            senderToken: "ANON_USSD_" + Math.floor(1000 + Math.random() * 9000),
            category: `${ussdCategory} (USSD Gateway)`,
            location: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            status: 'Pending',
            threatPriority: 'Normal',
            createdAt: newReport.createdAt,
            nearbyAlertCount: 1,
            isOfflineReport: true
          });
        }
        
        setUssdStep(4);
      } else {
        resetUssdSession();
      }
    }
  };

  const resetUssdSession = () => {
    setUssdSessionActive(false);
    setUssdStep(0);
    setUssdInput('');
    setUssdLogs([]);
    setUssdDialString('');
    setUssdSessionStep('');
    setUssdError('');
  };

  const closeUssdSession = () => {
    setUssdSessionActive(false);
    setUssdDialString('');
    setUssdSessionStep('');
    setUssdError('');
    setUssdInputText('');
  };

  const triggerUssdIncident = async (category, lga) => {
    const lgaCoords = {
      'Gusau': { lat: 12.1628, lng: 6.6614 },
      'Maru': { lat: 12.0000, lng: 6.4000 },
      'Anka': { lat: 12.1100, lng: 5.9200 },
      'Zurmi': { lat: 12.7700, lng: 6.7900 },
      'Talata Mafara': { lat: 12.5700, lng: 6.0600 }
    };
    
    const coords = lgaCoords[lga] || { lat: 12.1628, lng: 6.6614 };
    const lat = coords.lat;
    const lng = coords.lng;
    
    const reportId = `ussd-${Date.now()}`;
    const displayCategory = `${category} (USSD Gateway)`;
    
    const payload = {
      category: displayCategory,
      latitude: lat,
      longitude: lng,
      description: `Emergency distress broadcast via GSM USSD dial *112# from ${lga} LGA.`,
      locationDetails: `${lga} Local Government Area`,
      reporterName: 'USSD Dial Alert',
      isFormReport: true
    };
    
    try {
      if (effectiveOnline) {
        const result = await reportIncident(payload);
        onAlertTriggered(result.incident);
        
        addToast(
          language === 'en' 
            ? `USSD Alert Confirmed! Dispatched response units to ${lga}.` 
            : `An tabbatar da sanarwar USSD! An tura jami'an ceto zuwa ${lga}.`,
          'success'
        );
      } else {
        const newReport = {
          id: reportId,
          category: displayCategory,
          latitude: lat,
          longitude: lng,
          createdAt: new Date().toISOString(),
          status: 'Queued (Offline / Outbox)'
        };
        
        const updatedQueue = [...offlineQueue, newReport];
        setOfflineQueue(updatedQueue);
        localStorage.setItem('guardian_offline_queue', JSON.stringify(updatedQueue));
        
        onAlertTriggered({
          _id: reportId,
          senderToken: "ANON_USSD_" + Math.floor(1000 + Math.random() * 9000),
          category: displayCategory,
          location: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          status: 'Pending',
          threatPriority: 'Normal',
          createdAt: newReport.createdAt,
          nearbyAlertCount: 1,
          isOfflineReport: true
        });
        
        addToast(
          language === 'en' 
            ? `USSD report saved offline for ${lga}.` 
            : `An ajiye rahoton USSD a offline na ${lga}.`,
          'warning'
        );
      }
    } catch (err) {
      console.error("USSD trigger error: ", err);
      const newReport = {
        id: reportId,
        category: displayCategory,
        latitude: lat,
        longitude: lng,
        createdAt: new Date().toISOString(),
        status: 'Queued (Offline / Outbox)'
      };
      
      const updatedQueue = [...offlineQueue, newReport];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('guardian_offline_queue', JSON.stringify(updatedQueue));
      
      onAlertTriggered({
        _id: reportId,
        senderToken: "ANON_USSD_" + Math.floor(1000 + Math.random() * 9000),
        category: displayCategory,
        location: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        status: 'Pending',
        threatPriority: 'Normal',
        createdAt: newReport.createdAt,
        nearbyAlertCount: 1,
        isOfflineReport: true
      });
    }
  };

  const dialUssdCode = async (code) => {
    const cleanCode = code.trim();
    setUssdDialString(cleanCode);
    setUssdInputText('');
    setUssdError('');
    
    if (cleanCode === '*112#') {
      setUssdSessionActive(true);
      setUssdSessionStep('menu');
      setUssdSessionText(`Welcome to Zamfara State Emergency Hub\n\n1. Distress Report\n2. Helpline Directory\n3. System Status\n\nEnter option:`);
    } else if (cleanCode === '*112*1#') {
      setUssdSessionActive(true);
      setUssdSessionStep('category');
      setUssdSessionText(`Choose Emergency Threat Category:\n1. Banditry (Satar Shanu)\n2. Kidnapping (Garkuwa)\n3. Armed Robbery (Fashi)\n4. Fire Outbreak (Gobara)\n\nEnter option (1-4):`);
    } else if (cleanCode === '*112*2#') {
      setUssdSessionActive(true);
      setUssdSessionStep('helplines');
      setUssdSessionText(`Helplines List:\n1. Army Ops: 08030001111\n2. Police Command: 08022223333\n3. Civil Defence: 08055554444\n\n0. Back`);
    } else if (cleanCode === '*112*3#' || cleanCode === '*310#') {
      setUssdSessionActive(true);
      setUssdSessionStep('telemetry');
      setUssdSessionText(`GUARDIAN-NG TELEMETRY\nSignal: Broadband Uplink OK\nGPS: Locked (Gusau Center)\nSector: Sector 4 Command\n\n0. Back`);
    } else if (cleanCode === '*556#') {
      setUssdSessionActive(true);
      setUssdSessionStep('balance');
      setUssdSessionText(`GSM Balance: 450.50 NGN.\nGuardian Emergency services are completely FREE and do not consume airtime.\n\n0. Back`);
    } else if (cleanCode.startsWith('*112*1*')) {
      const parts = cleanCode.replace('*112*1*', '').replace('#', '').split('*');
      const catIdx = parts[0];
      const lgaIdx = parts[1];
      const confirmIdx = parts[2];
      
      let cat = 'Banditry';
      if (catIdx === '2') cat = 'Kidnapping';
      if (catIdx === '3') cat = 'Armed Robbery';
      if (catIdx === '4') cat = 'Fire Outbreak';
      
      setUssdCategory(cat);
      
      if (!lgaIdx) {
        setUssdSessionActive(true);
        setUssdSessionStep('lga');
        setUssdSessionText(`Select Local Government Area (LGA):\n1. Gusau\n2. Maru\n3. Anka\n4. Zurmi\n5. Talata Mafara\n\nEnter LGA option (1-5):`);
      } else {
        let lga = 'Gusau';
        if (lgaIdx === '2') lga = 'Maru';
        if (lgaIdx === '3') lga = 'Anka';
        if (lgaIdx === '4') lga = 'Zurmi';
        if (lgaIdx === '5') lga = 'Talata Mafara';
        
        setUssdLga(lga);
        
        if (!confirmIdx) {
          setUssdSessionActive(true);
          setUssdSessionStep('confirm');
          setUssdSessionText(`CONFIRM BROADCAST:\nBroadcast ${cat.toUpperCase()} threat in ${lga.toUpperCase()} LGA to surrounding satellite stations and local response units?\n\n1. Confirm & Broadcast\n2. Cancel\n\nEnter option (1-2):`);
        } else if (confirmIdx === '1') {
          setUssdSessionActive(true);
          setUssdSessionStep('finished');
          setUssdSessionText(`USSD BROADCAST COMPLETE!\n\nSignal locked. Emergency response dispatched. Your report has been submitted.\n\nPress 0 to close.`);
          await triggerUssdIncident(cat, lga);
        } else {
          setUssdError('Invalid USSD option or aborted.');
        }
      }
    } else {
      setUssdError('Connection problem or invalid MMI code.');
    }
  };

  const handleActiveUssdSend = async (val) => {
    const input = val.trim();
    if (!input) return;
    
    setUssdInputText('');
    
    if (ussdSessionStep === 'menu') {
      if (input === '1') {
        setUssdSessionStep('category');
        setUssdSessionText(`Choose Emergency Threat Category:\n1. Banditry (Satar Shanu)\n2. Kidnapping (Garkuwa)\n3. Armed Robbery (Fashi)\n4. Fire Outbreak (Gobara)\n\nEnter option (1-4):`);
      } else if (input === '2') {
        setUssdSessionStep('helplines');
        setUssdSessionText(`Helplines List:\n1. Army Ops: 08030001111\n2. Police Command: 08022223333\n3. Civil Defence: 08055554444\n\n0. Back`);
      } else if (input === '3') {
        setUssdSessionStep('telemetry');
        setUssdSessionText(`GUARDIAN-NG TELEMETRY\nSignal: Broadband Uplink OK\nGPS: Locked (Gusau Center)\nSector: Sector 4 Command\n\n0. Back`);
      } else {
        setUssdSessionText(`Invalid option. Welcome to Zamfara State Emergency Hub\n\n1. Distress Report\n2. Helpline Directory\n3. System Status\n\nEnter option:`);
      }
    } else if (ussdSessionStep === 'category') {
      let cat = 'Banditry';
      if (input === '2') cat = 'Kidnapping';
      if (input === '3') cat = 'Armed Robbery';
      if (input === '4') cat = 'Fire Outbreak';
      
      setUssdCategory(cat);
      setUssdSessionStep('lga');
      setUssdSessionText(`Select Local Government Area (LGA):\n1. Gusau\n2. Maru\n3. Anka\n4. Zurmi\n5. Talata Mafara\n\nEnter LGA option (1-5):`);
    } else if (ussdSessionStep === 'lga') {
      let lga = 'Gusau';
      if (input === '2') lga = 'Maru';
      if (input === '3') lga = 'Anka';
      if (input === '4') lga = 'Zurmi';
      if (input === '5') lga = 'Talata Mafara';
      
      setUssdLga(lga);
      setUssdSessionStep('confirm');
      setUssdSessionText(`CONFIRM BROADCAST:\nBroadcast ${ussdCategory.toUpperCase()} threat in ${lga.toUpperCase()} LGA to surrounding satellite stations and local response units?\n\n1. Confirm & Broadcast\n2. Cancel\n\nEnter option (1-2):`);
    } else if (ussdSessionStep === 'confirm') {
      if (input === '1') {
        setUssdSessionStep('finished');
        setUssdSessionText(`USSD BROADCAST COMPLETE!\n\nSignal locked. Emergency response dispatched. Your report has been submitted.\n\nPress 0 to close.`);
        await triggerUssdIncident(ussdCategory, ussdLga);
      } else {
        closeUssdSession();
      }
    } else if (ussdSessionStep === 'finished' || ussdSessionStep === 'helplines' || ussdSessionStep === 'telemetry' || ussdSessionStep === 'balance') {
      if (input === '0' || ussdSessionStep === 'finished') {
        if (ussdSessionStep === 'finished') {
          closeUssdSession();
        } else {
          setUssdSessionStep('menu');
          setUssdSessionText(`Welcome to Zamfara State Emergency Hub\n\n1. Distress Report\n2. Helpline Directory\n3. System Status\n\nEnter option:`);
        }
      }
    }
  };

  // 3-second hold-down implementation for the Panic Button
  const startHolding = (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsHolding(true);
    setProgress(0);
    setSecondsLeft(3.0);

    const startTime = Date.now();
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / 3000) * 100, 100);
      const remaining = Math.max((3000 - elapsed) / 1000, 0);

      setProgress(calculatedProgress);
      setSecondsLeft(parseFloat(remaining.toFixed(1)));

      if (elapsed >= 3000) {
        clearInterval(holdIntervalRef.current);
        holdIntervalRef.current = null;
        triggerPanicAlert();
      }
    }, 50);
  };

  const stopHolding = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
    setSecondsLeft(3.0);
  };

  // Recording 5-second voice distress note using real MediaRecorder API or robust simulation fallback
  const toggleVoiceRecording = async () => {
    if (isPlayingBack) {
      stopPlayback();
    }
    setVoiceSubmitSuccess(false);

    if (isRecording) {
      stopRecording();
    } else {
      setRecordedAudio(null);
      audioChunksRef.current = [];

      try {
        // Request real microphone audio stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setActiveStream(stream);

        // Check standard & platform-specific audio MIME types for cross-browser & cross-device compatibility (Safari, Chrome, iOS, Android, Firefox)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        const mimeTypesToTry = isIOS || isSafari
          ? [
              'audio/mp4;codecs=mp4a',
              'audio/mp4',
              'audio/aac',
              'audio/3gpp',
              'audio/wav',
              'audio/webm;codecs=opus',
              'audio/webm'
            ]
          : [
              'audio/webm;codecs=opus',
              'audio/webm',
              'audio/ogg;codecs=opus',
              'audio/mp4;codecs=mp4a',
              'audio/mp4',
              'audio/aac',
              'audio/3gpp',
              'audio/wav'
            ];
        
        let selectedMimeType = '';
        let options = {};
        for (const type of mimeTypesToTry) {
          if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(type)) {
            selectedMimeType = type;
            break;
          }
        }
        
        if (selectedMimeType) {
          options = { mimeType: selectedMimeType };
        }

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Use the exact MIME type detected by the recorder, fall back to the selected or standard ones
          let mimeType = mediaRecorder.mimeType;
          if (!mimeType && audioChunksRef.current.length > 0) {
            mimeType = audioChunksRef.current[0].type;
          }
          if (!mimeType) {
            mimeType = selectedMimeType || 'audio/mp4';
          }
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            setRecordedAudio(base64Audio);
          };

          // Clean up track streams immediately to release microphone
          if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
          }
          setActiveStream(null);
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingSeconds(0);
        
        let count = 0;
        recordIntervalRef.current = setInterval(() => {
          count += 1;
          setRecordingSeconds(count);
          if (count >= 5) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
            setActiveStream(null);
          }
        }, 1000);

      } catch (err) {
        console.warn("Microphone access blocked. Activating robust distress simulation fallback mode:", err);
        
        // Inform the user elegantly that sandbox/permission is bypassed with simulated distress signal
        if (addToast) {
          addToast(
            language === 'en'
              ? '⚠️ Mic permission blocked inside iframe. Activating Secure Simulated Distress Signal Mode!'
              : '⚠️ An katse izinin makurufo. Ana kunna sautin gaggawa na zamani!',
            'warning'
          );
        }

        // Start simulated recording
        setActiveStream('simulated');
        setIsRecording(true);
        setRecordingSeconds(0);

        let count = 0;
        recordIntervalRef.current = setInterval(() => {
          count += 1;
          setRecordingSeconds(count);
          if (count >= 5) {
            // Stop simulated recording and generate high-fidelity WAV base64
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
            
            const wavBlob = generateSyntheticEmergencyWav();
            const reader = new FileReader();
            reader.readAsDataURL(wavBlob);
            reader.onloadend = () => {
              setRecordedAudio(reader.result);
            };

            setIsRecording(false);
            setActiveStream(null);

            if (addToast) {
              addToast(
                language === 'en'
                  ? '🔊 Secure simulated distress tone synthesized successfully!'
                  : '🔊 An samar da sautin gaggawa na bogi cikin nasara!',
                'success'
              );
            }
          }
        }, 1000);
      }
    }
  };

  const stopRecording = () => {
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    
    if (activeStream === 'simulated') {
      const wavBlob = generateSyntheticEmergencyWav();
      const reader = new FileReader();
      reader.readAsDataURL(wavBlob);
      reader.onloadend = () => {
        setRecordedAudio(reader.result);
      };
      if (addToast) {
        addToast(
          language === 'en'
            ? '🔊 Secure simulated distress tone synthesized successfully!'
            : '🔊 An samar da sautin gaggawa na bogi cikin nasara!',
          'success'
        );
      }
    } else if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.error("Error stopping MediaRecorder:", e);
      }
    }
    
    setIsRecording(false);
    setActiveStream(null);
  };

  // Real Playback using HTML5 Audio element
  const startPlayback = () => {
    if (!recordedAudio) return;
    
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }

    try {
      setIsPlayingBack(true);
      const audio = new Audio(recordedAudio);
      audioPlaybackRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingBack(false);
        audioPlaybackRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlayingBack(false);
        audioPlaybackRef.current = null;
      };

      audio.play().catch(err => {
        console.error("Audio play promise failed:", err);
        setIsPlayingBack(false);
        audioPlaybackRef.current = null;
      });

    } catch (err) {
      console.error("Failed to play audio snippet:", err);
      setIsPlayingBack(false);
    }
  };

  const stopPlayback = () => {
    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      audioPlaybackRef.current = null;
    }
    setIsPlayingBack(false);
  };

  // Submit recorded voice distress immediately directly from the widget
  const submitVoiceDistressDirectly = async () => {
    if (!recordedAudio) return;
    setIsSubmittingVoice(true);
    
    let lat = 12.1628;
    let lng = 6.6614;

    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 0
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn("Geolocation fallback applied.", err);
      }
    }

    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }

    const payload = {
      category: `${selectedCategory} (Voice Distress)`,
      latitude: lat,
      longitude: lng,
      audioPayload: recordedAudio
    };

    try {
      if (effectiveOnline) {
        const result = await reportIncident(payload);

        // Save token for display and trigger success view
        setVoiceSenderToken(result.incident?.senderToken || 'sha256-anonymous-voice-secured');
        setVoiceSubmitSuccess(true);

        // Notify parent dispatcher context
        onAlertTriggered(result.incident);
      } else {
        // Queue report offline & trigger backup modal
        queueOfflineReport(`${selectedCategory} (Voice Distress)`, lat, lng, recordedAudio);
        setVoiceSenderToken("sha256-queued-offline-secure-id");
        setVoiceSubmitSuccess(true);
      }
    } catch (err) {
      console.error("Direct voice distress report failed: ", err);
      // Resilient fallback to queue offline
      queueOfflineReport(`${selectedCategory} (Voice Distress)`, lat, lng, recordedAudio);
      setVoiceSenderToken("sha256-resilient-local-secure-token");
      setVoiceSubmitSuccess(true);
    } finally {
      setIsSubmittingVoice(false);
    }
  };

  // Secure Cryptographic Anonymization and Geolocation Trigger for main button
  const triggerPanicAlert = async () => {
    setIsSubmitting(true);
    setIsHolding(false);
    setProgress(0);
    
    // Retrieve Geolocation coordinates
    let lat = 12.1628; // Default Gusau, Zamfara Latitude
    let lng = 6.6614;  // Default Gusau, Zamfara Longitude

    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch (err) {
        console.warn("Geolocation permission denied or timed out. Defaulting to Gusau central safe zone.", err);
      }
    }

    // Trigger phone vibration if available
    if (navigator.vibrate) {
      navigator.vibrate([300, 100, 300, 100, 500]);
    }

    const payload = {
      category: selectedCategory,
      latitude: lat,
      longitude: lng,
      audioPayload: recordedAudio || undefined
    };

    try {
      if (effectiveOnline) {
        const result = await reportIncident(payload);
        
        // Success
        setAlertStatus({
          success: true,
          message: t.alertSentSuccess,
          offline: false
        });

        // Pass up to parent so dispatcher views can sync instantly
        onAlertTriggered(result.incident);
      } else {
        // Queue report offline & trigger backup modal
        queueOfflineReport(selectedCategory, lat, lng, recordedAudio);
        
        setAlertStatus({
          success: true,
          message: language === 'en' 
            ? "Your panic distress report has been securely saved to the Offline Outbox. Transmitting via USSD/SMS emergency satellite links..." 
            : "An adana rahoton gaggawa a dakin ajiye sakonni na offline. Ana tura sakon ta USSD ko SMS na gaggawa...",
          offline: true
        });
      }
    } catch (error) {
      console.error("Failed to post incident: ", error);
      // Fallback
      queueOfflineReport(selectedCategory, lat, lng, recordedAudio);
      setAlertStatus({
        success: true,
        message: "Network request failed. Saved to Secure Offline Outbox & Backup Protocols Active.",
        offline: true
      });
    } finally {
      setIsSubmitting(false);
      // Clean footprint logic: Wipe local recordedAudio state after alert
      setTimeout(() => {
        setRecordedAudio(null);
      }, 5000);
    }
  };

  const dismissStatus = () => {
    setAlertStatus(null);
  };

  const categories = [
    { 
      id: 'Banditry', 
      label: t.categories.banditry, 
      borderSelected: 'border-b-4 border-[#B71C1C]', 
      iconColor: 'text-[#B71C1C]', 
      bgColor: 'hover:bg-red-50/50', 
      sublabel: language === 'en' ? 'Banditry' : "Harin 'Yan Bindiga" 
    },
    { 
      id: 'Kidnapping', 
      label: t.categories.kidnapping, 
      borderSelected: 'border-b-4 border-[#FFB300]', 
      iconColor: 'text-[#FFB300]', 
      bgColor: 'hover:bg-amber-50/50', 
      sublabel: language === 'en' ? 'Kidnapping' : 'Garkuwa' 
    },
    { 
      id: 'Armed Robbery', 
      label: t.categories.robbery, 
      borderSelected: 'border-b-4 border-[#212121]', 
      iconColor: 'text-[#212121]', 
      bgColor: 'hover:bg-gray-100/50', 
      sublabel: language === 'en' ? 'Armed Robbery' : 'Fashi' 
    },
    { 
      id: 'Fire Outbreak', 
      label: t.categories.fire, 
      borderSelected: 'border-b-4 border-orange-600', 
      iconColor: 'text-orange-600', 
      bgColor: 'hover:bg-orange-50/50', 
      sublabel: language === 'en' ? 'Fire Outbreak' : 'Gobara' 
    },
  ];

  // SVG parameters for progress ring
  const radius = 110;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="w-full max-w-7xl mx-auto bg-[#F5F5F5] min-h-screen flex flex-col justify-between pb-8 animate-fade-in font-sans">
      
      {/* Top Banner & Control Board */}
      <div className="bg-[#212121] text-white px-4 sm:px-6 py-3.5 sm:py-4 shadow-md flex flex-row items-center justify-between border-b border-gray-800 gap-2">
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          <div className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-600 animate-ping" />
          <span className="font-extrabold text-xs sm:text-base tracking-wider sm:tracking-widest text-white uppercase">GUARDIAN-NG</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* USSD Access Instructions Button */}
          <button 
            id="ussd-instructions-btn"
            onClick={() => setShowUssdAccessModal(true)}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-sm border border-amber-500 cursor-pointer"
            title="USSD Access Instructions"
          >
            <Smartphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline">{language === 'en' ? 'USSD CODES' : 'LAMBOBIN USSD'}</span>
            <span className="sm:hidden font-black">USSD</span>
          </button>

          {/* Language Toggle [EN | HA] */}
          <button 
            id="lang-toggle-btn"
            onClick={toggleLanguage}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all border border-gray-700 shadow-sm cursor-pointer"
            title="Switch Language / Canja Harshe"
          >
            <Languages className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 shrink-0" />
            <span className="hidden sm:inline">{language === 'en' ? 'HAUSA (HA)' : 'ENGLISH (EN)'}</span>
            <span className="sm:hidden font-black">{language === 'en' ? 'HA' : 'EN'}</span>
          </button>

          {/* Stealth Lock Quick Button */}
          <button 
            id="stealth-lock-btn"
            onClick={onStealthLock}
            className="flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md border border-red-700 cursor-pointer"
            title="Wipe Screen & Lock Stealth"
          >
            <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline">{t.stealthLock}</span>
            <span className="sm:hidden font-black">{language === 'en' ? 'STEALTH' : 'KARIYA'}</span>
          </button>
        </div>
      </div>

      {/* Main Panel Content - Responsive Bento Grid */}
      <div className="flex-1 px-4 py-6 md:px-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Citizen Critical Response Unit / Action Center */}
        <div className="space-y-6 md:col-span-7 flex flex-col">
          
          {/* 1. Status & Location Panel with Interactive Offline Simulation Controls */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between bg-white p-5 rounded-3xl border border-gray-200 shadow-sm gap-4">
            
            {/* Realtime Status Indicator */}
            <div className="flex flex-wrap items-center gap-2.5">
              {effectiveOnline ? (
                <div className="flex items-center text-xs text-emerald-800 font-bold bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-100 shadow-xs">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-2" />
                  <Wifi className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  <span>{language === 'en' ? 'SATELLITE BROADBAND ONLINE' : 'HANYAR SADAWA TA SATELLITE TANA LAFIYA'}</span>
                </div>
              ) : (
                <div className="flex items-center text-xs text-red-800 font-bold bg-red-50 px-3.5 py-1.5 rounded-full border border-red-100 shadow-xs animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-red-600 mr-2" />
                  <WifiOff className="h-3.5 w-3.5 mr-1 text-red-600" />
                  <span>{language === 'en' ? 'OFFLINE (NO BROADBAND SIGNAL)' : 'KASHE (BABU SADAWA TA INTANET)'}</span>
                </div>
              )}

              {/* Dynamic Synchronization state indicator */}
              {isSyncing && (
                <div className="flex items-center text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping mr-1.5" />
                  <span>{language === 'en' ? 'Syncing...' : 'Ana tura sakonni...'}</span>
                </div>
              )}
            </div>

            {/* Offline Simulator Switch */}
            <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200 gap-3">
              <div className="text-left">
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-wider block">
                  {language === 'en' ? 'Emergency Test Sandbox' : 'Gwajin Yanayin Gaggawa'}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold block">
                  {language === 'en' ? 'Simulate Signal Blackout' : 'Gwajin Katsewar Layi'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  id="offline-simulation-toggle"
                  type="checkbox"
                  checked={simulateOffline}
                  onChange={(e) => {
                    setSimulateOffline(e.target.checked);
                    if (navigator.vibrate) navigator.vibrate(50);
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Coordinates / Command Center Reference */}
            <div className="flex items-center text-xs text-gray-500 font-semibold bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-150">
              <Navigation className="h-3.5 w-3.5 text-[#B71C1C] mr-1.5 animate-pulse" />
              <span>{t.hqCommandLocation}</span>
            </div>
          </div>

          {/* SECURE OFFLINE OUTBOX - handles queueing list display and sync buttons */}
          {offlineQueue.length > 0 && (
            <div className="bg-amber-50/50 border-2 border-amber-200/60 rounded-3xl p-5 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <WifiOff className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 tracking-tight uppercase">
                      {language === 'en' ? 'Secure Offline Outbox Queue' : 'Ajiye Sakonni na Offline'}
                    </h4>
                    <p className="text-[10px] text-amber-700 font-semibold">
                      {language === 'en' 
                        ? `${offlineQueue.length} emergency reports queued locally. Waiting for signal restore.` 
                        : `Ana jiran samun layi don tura rahotanni guda ${offlineQueue.length}.`}
                    </p>
                  </div>
                </div>

                <button
                  id="manual-sync-btn"
                  onClick={syncOfflineQueue}
                  disabled={isSyncing || !effectiveOnline}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    effectiveOnline 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                  }`}
                >
                  {isSyncing 
                    ? (language === 'en' ? 'TRANSMITTING...' : 'ANA TURAWA...') 
                    : (language === 'en' ? 'FORCE SYNC UPLINK' : 'SANYA TURUWA')}
                </button>
              </div>

              {/* List of Queued Incident Reports */}
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {offlineQueue.map((report) => (
                  <div key={report.id} className="bg-white border border-amber-100 rounded-2xl p-3.5 flex items-center justify-between text-xs font-semibold shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-red-100 text-[#B71C1C] text-[9px] font-black rounded uppercase">
                          {report.category}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(report.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 font-bold">
                        LAT {report.latitude.toFixed(5)} • LNG {report.longitude.toFixed(5)}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-amber-600 text-[10px] font-black uppercase space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping mr-1" />
                      <span>{language === 'en' ? 'QUEUED' : 'ANA JIRA'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Success Floating Banner Alert */}
          {syncSuccessNotice && (
            <div className="bg-emerald-50 border-2 border-emerald-200 text-emerald-900 rounded-3xl p-5 flex items-start space-x-3 text-xs font-bold shadow-md animate-fade-in">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold uppercase text-emerald-800 tracking-wider">
                  {language === 'en' ? 'Broadband Satellite Sync Complete' : 'An Tura Dukkan Bayanai na Gaggawa'}
                </p>
                <p className="text-gray-600 font-semibold">{syncSuccessNotice}</p>
              </div>
            </div>
          )}

          {/* Interactive Mode Tabs */}
          <div className="grid grid-cols-3 p-1.5 bg-gray-200/60 rounded-2xl border border-gray-300 shadow-inner">
            <button
              id="tab-btn-quick"
              type="button"
              onClick={() => {
                setActiveTab('quick');
                if (navigator.vibrate) navigator.vibrate(20);
              }}
              className={`py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'quick'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Quick Panic' : 'Gaggawa'}</span>
            </button>
            <button
              id="tab-btn-form"
              type="button"
              onClick={() => {
                setActiveTab('form');
                if (navigator.vibrate) navigator.vibrate(20);
              }}
              className={`py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'form'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'Detailed Form' : 'Fom'}</span>
            </button>
            <button
              id="tab-btn-ussd"
              type="button"
              onClick={() => {
                setActiveTab('ussd');
                if (navigator.vibrate) navigator.vibrate(20);
              }}
              className={`py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                activeTab === 'ussd'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{language === 'en' ? 'USSD Dial' : 'USSD'}</span>
            </button>
          </div>

          {activeTab === 'quick' ? (
            <>
              {/* 2. REPOSITIONED VOICE DISTRESS PANEL: Placed at the very top of elements so it's visible without scrolling */}
              <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-emerald-500/30 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 animate-pulse"></div>
            
            {/* Success state - satisfies "indicate a successful submission experience rather than muting" */}
            {voiceSubmitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-[#2E7D32] flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="h-7 w-7" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-[#2E7D32] uppercase tracking-wider">
                    {t.voiceDistressSuccess}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-semibold leading-relaxed">
                    {language === 'en' 
                      ? 'Secure military-grade anonymized stream received. GPS location paired. Response dispatch initialized.' 
                      : 'An karbi sautin sirri na musamman na sojoji. An hada shi da gurbin GPS. An fara aikin ceto.'}
                  </p>
                </div>

                <div className="border-t border-emerald-100 pt-3">
                  <div className="text-[10px] font-mono text-gray-400 font-black">
                    {t.anonymousToken.toUpperCase()}: <span className="text-gray-600">{voiceSenderToken}</span>
                  </div>
                </div>

                <button
                  id="reset-voice-btn"
                  onClick={() => {
                    setVoiceSubmitSuccess(false);
                    setRecordedAudio(null);
                  }}
                  className="px-4 py-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'RECORD ANOTHER SNIPPET' : 'SANYA WATA MURYAR'}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-emerald-400/20 animate-ping"></div>
                      <Mic className="h-5 w-5 text-[#2E7D32] relative z-10" />
                    </div>
                    <span className="text-sm font-black text-gray-800 tracking-tight">
                      {t.voiceDistressTitle}
                    </span>
                  </div>
                  
                  {recordedAudio && (
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex items-center">
                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-[#2E7D32]" /> {t.readyText}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {t.voiceDistressDesc}
                </p>

                {/* Canvas-based Real Audio Waveform Visualization */}
                {isRecording && activeStream && (
                  <AudioWaveformVisualizer stream={activeStream} isRecording={isRecording} />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Record Button */}
                  <button
                    id="voice-record-btn"
                    onClick={toggleVoiceRecording}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                      isRecording 
                        ? 'bg-red-50 border-red-300 text-[#B71C1C] animate-pulse' 
                        : recordedAudio 
                        ? 'bg-emerald-50 border-emerald-200 text-[#2E7D32]'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm'
                    }`}
                  >
                    <Mic className="h-4 w-4 shrink-0" />
                    <span>
                      {isRecording 
                        ? t.recordingState.replace('{n}', recordingSeconds)
                        : recordedAudio 
                        ? t.rerecordVoice
                        : t.tapToRecord}
                    </span>
                  </button>

                  {/* Playback Simulation Button */}
                  {recordedAudio && !isRecording && (
                    <button
                      id="voice-play-btn"
                      onClick={isPlayingBack ? stopPlayback : startPlayback}
                      className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        isPlayingBack 
                          ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {isPlayingBack ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span>
                        {isPlayingBack ? (language === 'en' ? 'PLAYING (TAP TO STOP)' : 'ANA SAURARO (TABA)') : (language === 'en' ? 'PLAYBACK RECORDED' : 'SAURARI REKODIN')}
                      </span>
                    </button>
                  )}
                </div>

                {/* Submitting Recorded Audio action directly */}
                {recordedAudio && !isRecording && (
                  <button
                    id="voice-submit-direct-btn"
                    onClick={submitVoiceDistressDirectly}
                    disabled={isSubmittingVoice}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Volume2 className="h-4 w-4 animate-bounce" />
                    <span>
                      {isSubmittingVoice ? t.submittingVoice : t.sendVoiceNoteBtn}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* 3. Selected Alert Mode Summary Banner */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#B71C1C]"></div>
            <span className="text-[10px] tracking-widest uppercase font-black text-gray-400 block mb-1">
              {t.selectedCrisisCategory}
            </span>
            <span className="text-base font-black text-[#B71C1C] tracking-wide">
              {selectedCategory === 'Banditry' && t.categories.banditry.toUpperCase()}
              {selectedCategory === 'Kidnapping' && t.categories.kidnapping.toUpperCase()}
              {selectedCategory === 'Armed Robbery' && t.categories.robbery.toUpperCase()}
              {selectedCategory === 'Fire Outbreak' && t.categories.fire.toUpperCase()}
            </span>
          </div>

          {/* 4. Core Dual-Action Panic Hold Button widget */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
            <div className="absolute top-4 left-6">
              <span className="text-[10px] font-black text-[#B71C1C] uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                {t.criticalResponseSystem}
              </span>
            </div>
            
            <div 
              className="relative select-none touch-none flex items-center justify-center cursor-pointer h-[240px] w-[240px]"
              onMouseDown={startHolding}
              onMouseUp={stopHolding}
              onMouseLeave={stopHolding}
              onTouchStart={startHolding}
              onTouchEnd={stopHolding}
            >
              {/* Visual Progress Ring */}
              <svg
                height={radius * 2}
                width={radius * 2}
                className="transform -rotate-90 absolute"
              >
                <circle
                  stroke="#F3F4F6"
                  fill="transparent"
                  strokeWidth={stroke}
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                />
                <circle
                  stroke="#B71C1C"
                  fill="transparent"
                  strokeWidth={stroke}
                  strokeDasharray={circumference + ' ' + circumference}
                  style={{ strokeDashoffset }}
                  strokeLinecap="round"
                  r={normalizedRadius}
                  cx={radius}
                  cy={radius}
                  className="transition-all duration-75"
                />
              </svg>

              {/* Huge Blood-Red Core Button */}
              <div 
                id="panic-button-core"
                className={`h-[176px] w-[176px] rounded-full bg-[#B71C1C] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(183,28,28,0.4)] border-8 border-white/20 transition-all duration-75 ${
                  isHolding ? 'scale-95 bg-[#7F0000]' : 'scale-100 hover:bg-[#D32F2F]'
                }`}
              >
                <Radio className="h-14 w-14 text-white animate-pulse" />
                <span className="text-xs font-black tracking-widest text-white uppercase mt-2">
                  {isHolding ? `${secondsLeft}s` : 'PANIC'}
                </span>
              </div>
            </div>

            <div className="text-center mt-6 space-y-1.5 max-w-sm">
              <p className="text-sm font-black text-gray-800 uppercase tracking-wider">
                {isHolding ? t.releaseToCancel : t.holdToTrigger}
              </p>
              <p className="text-xs text-gray-500 font-semibold">
                {t.requiresHold}
              </p>
            </div>
          </div>

          {/* 5. Categorized Grid (Banditry, Kidnapping, Robbery, Fire) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black tracking-widest text-gray-400 uppercase">
              {language === 'en' ? 'TAP TO PRE-SELECT CATEGORY' : 'ZABI MATSALAR TA KAI TSAYE'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    id={`category-card-${cat.id}`}
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center space-y-2.5 transition-all text-center focus:outline-none cursor-pointer ${
                      isSelected 
                        ? `${cat.borderSelected} scale-[1.03] ring-2 ring-gray-100` 
                        : 'border-b-4 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400">
                      {cat.id === 'Banditry' && <ShieldAlert className={`h-6 w-6 ${isSelected ? 'text-[#B71C1C]' : ''}`} />}
                      {cat.id === 'Kidnapping' && <UserX className={`h-6 w-6 ${isSelected ? 'text-[#FFB300]' : ''}`} />}
                      {cat.id === 'Armed Robbery' && <Radio className={`h-6 w-6 ${isSelected ? 'text-[#212121]' : ''}`} />}
                      {cat.id === 'Fire Outbreak' && <Flame className={`h-6 w-6 ${isSelected ? 'text-orange-600' : ''}`} />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-black leading-tight text-gray-800 tracking-tight uppercase">
                        {cat.label}
                      </div>
                      <div className="text-[9px] text-gray-400 italic font-semibold">
                        {cat.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
            </>
          ) : activeTab === 'ussd' ? (
            <div className="w-full animate-fade-in">
              {/* Dialpad Component */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 flex flex-col items-center space-y-6">
                {/* Header */}
                <div className="w-full text-center pb-2 border-b border-gray-100">
                  <h3 className="text-sm font-black text-gray-800 tracking-wider uppercase flex items-center justify-center gap-1.5">
                    <Smartphone className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    <span>GSM REALTIME USSD DIALER</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-semibold tracking-wide mt-0.5">
                    TYPE & DIAL CODES SECURELY WITHOUT SATELLITE SIGNAL
                  </p>
                </div>

                {/* Virtual LCD Display Screen */}
                <div className="w-full bg-[#111111] rounded-2xl p-4 border-2 border-gray-800 font-mono text-center flex flex-col justify-center min-h-[72px] relative overflow-hidden shadow-inner">
                  {/* Micro Signal status bar */}
                  <div className="absolute top-1 right-3 left-3 flex justify-between items-center text-[7px] text-gray-500 font-black">
                    <span>GSM CARRIER: GUARDIAN NET</span>
                    <span className="flex items-center gap-1">
                      <Wifi className="h-2 w-2 text-emerald-500" /> SIGNAL OK
                    </span>
                  </div>

                  <div className="text-xl font-bold tracking-widest text-amber-400 select-none mt-2">
                    {ussdDialString || <span className="text-gray-700">Enter USSD...</span>}
                  </div>
                  
                  {ussdError && (
                    <div className="text-[9px] text-red-500 font-bold mt-1 uppercase animate-pulse">
                      {ussdError}
                    </div>
                  )}
                </div>

                {/* Dialpad Keypad Grid */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                    <button
                      key={key}
                      id={`ussd-dial-key-${key === '*' ? 'star' : key === '#' ? 'hash' : key}`}
                      onClick={() => {
                        if (navigator.vibrate) navigator.vibrate(15);
                        setUssdError('');
                        if (ussdDialString.length < 15) {
                          setUssdDialString(prev => prev + key);
                        }
                      }}
                      className="h-12 w-full rounded-full bg-gray-50 hover:bg-gray-100 text-gray-800 text-base font-black border border-gray-200/80 hover:border-gray-300 transition-all active:scale-95 shadow-sm flex items-center justify-center cursor-pointer"
                    >
                      {key}
                    </button>
                  ))}
                </div>

                {/* Call & Delete Control Bar */}
                <div className="flex items-center justify-between gap-4 w-full max-w-[280px]">
                  {/* Backspace/Delete */}
                  <button
                    id="ussd-backspace-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(15);
                      setUssdDialString(prev => prev.slice(0, -1));
                      setUssdError('');
                    }}
                    className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 border border-gray-200 cursor-pointer active:scale-95 transition-all"
                    title="Backspace"
                  >
                    <Delete className="h-4 w-4 mr-1" />
                    <span>Delete</span>
                  </button>

                  {/* Green Dial / Send Button */}
                  <button
                    id="ussd-call-btn"
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(30);
                      if (!ussdDialString) {
                        setUssdError('Enter a code first');
                        return;
                      }
                      dialUssdCode(ussdDialString);
                    }}
                    className="flex-[1.5] h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Phone className="h-4 w-4 mr-1.5" />
                    <span>DIAL CODE</span>
                  </button>
                </div>

                {/* Helpful Dial Shortcuts */}
                <div className="w-full bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">
                    💡 IN-NETWORK SHORTCODE DIRECTORY:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-gray-600 font-bold">
                    <button 
                      onClick={() => setUssdDialString('*112#')}
                      className="p-1.5 bg-white border border-gray-200 rounded text-left hover:bg-gray-50 flex flex-col text-gray-700"
                    >
                      <span className="text-[#B71C1C] font-extrabold">*112#</span>
                      <span className="text-[8px] text-gray-400">Guardian Hub</span>
                    </button>
                    <button 
                      onClick={() => setUssdDialString('*112*1#')}
                      className="p-1.5 bg-white border border-gray-200 rounded text-left hover:bg-gray-50 flex flex-col text-gray-700"
                    >
                      <span className="text-emerald-700 font-extrabold">*112*1#</span>
                      <span className="text-[8px] text-gray-400">Direct Distress</span>
                    </button>
                    <button 
                      onClick={() => setUssdDialString('*556#')}
                      className="p-1.5 bg-white border border-gray-200 rounded text-left hover:bg-gray-50 flex flex-col text-gray-700"
                    >
                      <span className="text-amber-600 font-extrabold">*556#</span>
                      <span className="text-[8px] text-gray-400">Check Balance</span>
                    </button>
                    <button 
                      onClick={() => setUssdDialString('*310#')}
                      className="p-1.5 bg-white border border-gray-200 rounded text-left hover:bg-gray-50 flex flex-col text-gray-700"
                    >
                      <span className="text-blue-700 font-extrabold">*310#</span>
                      <span className="text-[8px] text-gray-400">System Telemetry</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EmergencyReportForm onAlertTriggered={onAlertTriggered} addToast={addToast} />
          )}

        </div>

        {/* Right Side: Emergency Hotline Directory */}
        <div className="md:col-span-5 space-y-6">
          <HotlineDirectory />
        </div>

      </div>

      {/* Elegant Professional Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 font-semibold gap-4">
        <p className="uppercase tracking-wider">
          {language === 'en' ? 'Zamfara Emergency Management System © 2026' : 'Tsarin Gudanar da Ayyukan Gaggawa na Zamfara © 2026'}
        </p>
        <div className="flex items-center space-x-4">
          <button 
            id="dispatcher-login-link"
            onClick={onAdminClick}
            className="text-gray-500 hover:text-[#B71C1C] transition-all cursor-pointer flex items-center space-x-1 font-bold focus:outline-none"
            title="Authorized Staff Dispatch Portal"
          >
            <Shield className="h-4 w-4 text-[#B71C1C] fill-current animate-pulse mr-1" />
            <span>{language === 'en' ? 'Authorized Dispatcher Login' : 'Kofark Shiga Jami\'an Tsaro'}</span>
          </button>
        </div>
      </footer>

      {/* Elegant alert sent modal / banner popup overlay */}
      {alertStatus && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 text-center relative">
            <button 
              onClick={dismissStatus}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
              alertStatus.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              {alertStatus.success ? t.dispatchedTitle : t.errorTitle}
            </h3>

            <p className="text-xs text-gray-600 font-medium leading-relaxed whitespace-pre-line">
              {alertStatus.message}
            </p>

            <button
              id="dismiss-alert-btn"
              onClick={dismissStatus}
              className="w-full py-2.5 bg-[#212121] hover:bg-black text-white rounded-xl text-xs font-bold tracking-wider transition-colors uppercase cursor-pointer"
            >
              {t.dismissAlert}
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC OFFLINE USSD/SMS EMERGENCY PROTOCOLS MODAL */}
      {showBackupModal && backupDetails && (
        <div className="fixed inset-0 bg-[#212121]/90 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-6 relative">
            <button 
              onClick={() => setShowBackupModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all border border-gray-100 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Radio className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-gray-900 tracking-tight uppercase">
                {language === 'en' ? 'Emergency Backup Protocol Active' : 'Hanyoyin Sadarwa ta Gaggawa'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {language === 'en' 
                  ? 'Your cellular data is offline. Command Sector has generated backup transit signals:' 
                  : 'Sadarwarku ta katse. Babban dakin gaggawa ya samar da hanyoyin sadarwa na kariya:'}
              </p>
            </div>

            {/* Protocol Choice 1: SMS Distress Protocol */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-black text-[#B71C1C] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#B71C1C]" />
                <span>Option A: SMS Transit Protocol</span>
              </div>
              
              <p className="text-[11px] text-gray-500 font-medium">
                {language === 'en' 
                  ? 'Send this compressed micro-payload to the Guardian SMS gateway. It contains military location telemetry.' 
                  : 'Aika wannan takaitaccen sako zuwa layin Guardian SMS. Yana dauke da gurbin dundumen ku na sirri.'}
              </p>

              {/* Compressed SMS Payload Box */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 font-mono text-[10px] text-gray-700 font-bold select-all flex items-center justify-between">
                <span>{backupDetails.smsText}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupDetails.smsText);
                    alert(language === 'en' ? "SMS Payload Copied!" : "An Kwafi Sakon SMS!");
                  }}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[9px] font-mono transition-colors font-black cursor-pointer"
                >
                  COPY
                </button>
              </div>

              {/* Native Send SMS link */}
              <a
                href={`sms:112?body=${encodeURIComponent(backupDetails.smsText)}`}
                className="w-full py-2 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span>{language === 'en' ? 'TRANSMIT VIA PHONE SMS (112)' : 'AIKA TA SAKON SMS (112)'}</span>
              </a>
            </div>

            {/* Protocol Choice 2: Interactive USSD Gateway Terminal */}
            <div className="bg-[#212121] rounded-2xl p-4 border border-gray-800 space-y-3 text-white">
              <div className="flex items-center space-x-2 text-xs font-black text-amber-500 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Option B: USSD Signal Dispatcher</span>
              </div>

              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                {language === 'en' 
                  ? 'Dial Zamfara emergency USSD signal code *112# to trigger automated cell broadcast and dispatch response units.' 
                  : 'Latsa lambobin gaggawa na Zamfara *112# don tura bayanan gaggawa zuwa ga jami\'an tsaro kai tsaye.'}
              </p>

              {ussdSessionActive ? (
                /* Dynamic Interactive USSD Window inside the terminal box */
                <div className="bg-black rounded-xl p-4 border border-gray-700 font-mono text-[11px] space-y-3 text-emerald-400">
                  <div className="flex justify-between items-center text-[10px] text-emerald-600 pb-1.5 border-b border-emerald-950">
                    <span>USSD GATEWAY TERMINAL</span>
                    <button 
                      onClick={resetUssdSession}
                      className="text-red-500 hover:text-red-400 font-black cursor-pointer"
                    >
                      [QUIT]
                    </button>
                  </div>

                  {ussdStep === 0 && (
                    <div className="space-y-3">
                      <p className="text-gray-300">Dialing *112# ...</p>
                      <button
                        onClick={() => {
                          setUssdStep(1);
                          setUssdLogs([{ sender: 'system', text: 'Welcome to Zamfara State Emergency Command USSD Hub\n\n1. Distress Report\n2. Helpline Directory\n\nEnter option (1-2):' }]);
                        }}
                        className="w-full py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded border border-emerald-800 text-[10px] font-black cursor-pointer"
                      >
                        [ CONNECT DIAL ]
                      </button>
                    </div>
                  )}

                  {ussdStep > 0 && (
                    <div className="space-y-3">
                      <div className="whitespace-pre-line text-gray-200">
                        {ussdLogs[ussdLogs.length - 1]?.text}
                      </div>

                      {ussdStep === 1 && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button onClick={() => { setUssdCategory('Banditry'); setUssdStep(2); setUssdLogs([...ussdLogs, { sender: 'system', text: 'Choose Emergency Threat Category:\n1. Banditry (Satar Shanu)\n2. Kidnapping (Garkuwa)\n3. Armed Robbery (Fashi)\n4. Fire Outbreak (Gobara)\n\nEnter option (1-4):' }]); }} className="py-1 bg-emerald-950 hover:bg-emerald-900 rounded text-[9px] border border-emerald-900 cursor-pointer">1. REPORT DISTRESS</button>
                          <button onClick={() => { setUssdStep(4); setUssdLogs([...ussdLogs, { sender: 'system', text: 'Helplines List:\n1. Army Ops: 08030001111\n2. Police Command: 08022223333\n3. Civil Defence: 08055554444\n\nDial 0 to return.' }]); }} className="py-1 bg-emerald-950 hover:bg-emerald-900 rounded text-[9px] border border-emerald-900 cursor-pointer">2. DIRECTORIES</button>
                        </div>
                      )}

                      {ussdStep === 2 && (
                        <div className="grid grid-cols-3 gap-1 pt-2">
                          {['Banditry', 'Kidnapping', 'Armed Robbery', 'Fire Outbreak'].map((cat, idx) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setUssdCategory(cat);
                                setUssdStep(3);
                                setUssdLogs([...ussdLogs, { sender: 'system', text: `Select Local Government Area (LGA):\n1. Gusau\n2. Maru\n3. Anka\n4. Zurmi\n5. Talata Mafara\n\nEnter LGA option (1-5):` }]);
                              }}
                              className="py-1 bg-emerald-950 hover:bg-emerald-900 rounded text-[8px] border border-emerald-900 font-bold truncate cursor-pointer"
                            >
                              {idx+1}. {cat.substring(0,8).toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}

                      {ussdStep === 3 && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          {['Gusau', 'Maru', 'Anka', 'Zurmi', 'Talata Mafara'].map((lga, idx) => (
                            <button
                              key={lga}
                              onClick={() => {
                                setUssdLga(lga);
                                setUssdStep(4);
                                setUssdLogs([...ussdLogs, { sender: 'system', text: `CONFIRM BROADCAST:\nBroadcast ${ussdCategory.toUpperCase()} threat in ${lga.toUpperCase()} LGA to surrounding satellite stations and local response units?\n\n1. Confirm & Broadcast\n2. Cancel` }]);
                              }}
                              className="py-1 bg-emerald-950 hover:bg-emerald-900 rounded text-[9px] border border-emerald-900 cursor-pointer"
                            >
                              {idx+1}. {lga}
                            </button>
                          ))}
                        </div>
                      )}

                      {ussdStep === 4 && ussdLogs[ussdLogs.length-1]?.text.includes('CONFIRM') && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => {
                              const lat = backupDetails?.lat || 12.1628;
                              const lng = backupDetails?.lng || 6.6614;
                              const reportId = `offline-ussd-${Date.now()}`;
                              
                              const newReport = {
                                id: reportId,
                                category: `${ussdCategory} (USSD Gateway)`,
                                latitude: lat,
                                longitude: lng,
                                audioPayload: null,
                                createdAt: new Date().toISOString(),
                                status: 'Queued (Offline / Outbox)'
                              };

                              const updatedQueue = [...offlineQueue, newReport];
                              setOfflineQueue(updatedQueue);
                              localStorage.setItem('guardian_offline_queue', JSON.stringify(updatedQueue));
                              
                              onAlertTriggered({
                                _id: reportId,
                                senderToken: "ANON_USSD_" + Math.floor(1000 + Math.random() * 9000),
                                category: `${ussdCategory} (USSD Gateway)`,
                                location: {
                                  type: 'Point',
                                  coordinates: [lng, lat]
                                },
                                status: 'Pending',
                                threatPriority: 'Normal',
                                createdAt: newReport.createdAt,
                                nearbyAlertCount: 1,
                                isOfflineReport: true
                              });

                              setUssdStep(5);
                              setUssdLogs([...ussdLogs, { sender: 'system', text: 'USSD BROADCAST COMPLETE!\n\nSignal locked. Emergency response dispatched. Your local report is backed up in the Offline Outbox.\n\nDial 0 to finish.' }]);
                            }}
                            className="py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-black cursor-pointer"
                          >
                            1. CONFIRM BROADCAST
                          </button>
                          <button
                            onClick={resetUssdSession}
                            className="py-1.5 bg-red-900 hover:bg-red-800 text-white rounded text-[9px] font-black cursor-pointer"
                          >
                            2. CANCEL
                          </button>
                        </div>
                      )}

                      {ussdStep === 5 || (ussdStep === 4 && ussdLogs[ussdLogs.length-1]?.text.includes('Helplines')) ? (
                        <button
                          onClick={resetUssdSession}
                          className="w-full py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 rounded border border-emerald-800 text-[10px] font-black cursor-pointer"
                        >
                          [ FINISH SESSION ]
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="start-ussd-btn"
                  onClick={() => {
                    setUssdSessionActive(true);
                    setUssdStep(0);
                  }}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-[#212121] rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center justify-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <span>{language === 'en' ? 'DIAL EMERGENCY USSD (*112#)' : 'KIRA LAMBAR USSD (*112#)'}</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setShowBackupModal(false)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-black tracking-widest uppercase transition-colors border border-gray-200 cursor-pointer"
            >
              {language === 'en' ? 'CLOSE FALLBACK CONSOLE' : 'RUFE WANNAN SHAFIN'}
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC OFFLINE USSD/SMS EMERGENCY INSTRUCTIONS SHEET */}
      {showUssdAccessModal && (
        <div className="fixed inset-0 bg-[#212121]/95 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-amber-300 space-y-6 relative">
            <button 
              onClick={() => setShowUssdAccessModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all border border-gray-150 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-50 text-amber-700 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Smartphone className="h-7 w-7 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase">
                {language === 'en' ? 'USSD & SMS Offline Access' : 'Manhajar USSD da SMS na Gaggawa'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                {language === 'en' 
                  ? 'If the Guardian application or internet services are completely blocked or inaccessible, you can transmit distress alerts using GSM networks.' 
                  : 'Idan babu intanet ko kuma ba za a iya shiga manhajar Guardian ba sam, za ku iya tura sakonnin gaggawa ta amfani da layukan wayar salula na yau da kullum.'}
              </p>
            </div>

            {/* Instruction Tabs/Blocks */}
            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              
              {/* Block 1: USSD Code Protocol */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-[#B71C1C] uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-[#B71C1C] flex items-center justify-center font-bold text-[10px]">#1</div>
                  <span>{language === 'en' ? 'USSD Quick Dial Protocol' : 'Hanyar Latsa Lambobin USSD'}</span>
                </div>
                
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  {language === 'en' 
                    ? 'Dial the state emergency USSD portal to connect with civilian dispatch networks.' 
                    : 'Latsa lambar USSD ta babban dakin gaggawa na jiha don haduwa da jami\'an tsaro kai tsaye.'}
                </p>

                <div className="bg-[#212121] border border-gray-800 rounded-xl p-4 text-center font-mono space-y-2 text-white">
                  <span className="text-xl font-extrabold tracking-widest text-amber-400 block">*112#</span>
                  <span className="text-[10px] text-gray-400 font-sans font-bold block">
                    {language === 'en' ? 'Works on MTN, Airtel, Glo, and 9mobile' : 'Yana aiki akan dukkan layuka (MTN, Airtel, Glo, 9mobile)'}
                  </span>
                </div>

                <div className="text-[11px] text-gray-500 space-y-1.5 font-medium">
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-1.5">•</span>
                    <span>{language === 'en' ? 'Step 1: Dial *112# and press send.' : 'Mataki na 1: Latsa *112# sannan ka tura.'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-1.5">•</span>
                    <span>{language === 'en' ? 'Step 2: Enter Option 1 (Distress Report).' : 'Mataki na 2: Shigar da Lamba 1 (Report Distress).'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-1.5">•</span>
                    <span>{language === 'en' ? 'Step 3: Select category (e.g. Banditry, Kidnapping).' : 'Mataki na 3: Zabi nau\'in barazana (misali Satar Shanu, Garkuwa).'}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-1.5">•</span>
                    <span>{language === 'en' ? 'Step 4: Select Local Government Area (LGA).' : 'Mataki na 4: Zabi Karamar Hukuma (LGA) da kake.'}</span>
                  </div>
                </div>

                <a 
                  href="tel:*112#" 
                  className="w-full py-2 bg-gray-900 hover:bg-black text-white text-[10px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Smartphone className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                  <span>{language === 'en' ? 'DIAL *112# NATIVELY' : 'LATSAR DA *112# A WAYA'}</span>
                </a>
              </div>

              {/* Block 2: SMS Payload Protocol */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-emerald-800 uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">#2</div>
                  <span>{language === 'en' ? 'Compressed SMS Payload' : 'Hanyar Sakon SMS Takaitacce'}</span>
                </div>

                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  {language === 'en' 
                    ? 'Send a formatted emergency telemetry SMS directly to our security gateway. High-frequency satellite transceivers will pick up the signal.' 
                    : 'Aika da takaitaccen sakon gaggawa zuwa ga babban dakin tsaro na jihar Zamfara ta amfani da tsarin sakon gaggawa.'}
                </p>

                <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {language === 'en' ? 'SMS Payload Format' : 'Tsararren Sakon SMS'}
                  </div>
                  <div className="font-mono text-xs text-gray-800 font-bold bg-gray-50 p-2.5 rounded border border-gray-200 break-words select-all">
                    GUARDIAN_ALERT*CAT:BAND*LAT:12.1628*LNG:6.6614
                  </div>
                </div>

                <div className="text-[11px] text-gray-500 space-y-1 font-medium">
                  <p className="font-bold text-gray-700">
                    {language === 'en' ? 'Category Codes (CAT):' : 'Takaitaccen Lambobin Suna:'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>• <span className="font-bold">BAND</span> : Banditry / Satar Shanu</div>
                    <div>• <span className="font-bold">KIDN</span> : Kidnapping / Garkuwa</div>
                    <div>• <span className="font-bold">ROBB</span> : Armed Robbery / Fashi</div>
                    <div>• <span className="font-bold">FIRE</span> : Fire Outbreak / Gobara</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText("GUARDIAN_ALERT*CAT:BAND*LAT:12.1628*LNG:6.6614");
                      alert(language === 'en' ? "Sample SMS Payload copied!" : "An riga an kwafi sakon SMS!");
                    }}
                    className="py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-250 text-[9px] font-black uppercase rounded-xl transition-all cursor-pointer"
                  >
                    {language === 'en' ? 'COPY SAMPLE SMS' : 'KWAFI SAMPLIN SAKO'}
                  </button>

                  <a
                    href="sms:112?body=GUARDIAN_ALERT*CAT:BAND*LAT:12.1628*LNG:6.6614"
                    className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black tracking-wider uppercase rounded-xl text-center flex items-center justify-center space-x-1 transition-all cursor-pointer"
                  >
                    <span>{language === 'en' ? 'SEND EMERGENCY SMS' : 'TURA SAKON SMS'}</span>
                  </a>
                </div>
              </div>

              {/* Block 3: Absolute Blackout Direct Lines */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-black text-amber-800 uppercase tracking-wider">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">#3</div>
                  <span>{language === 'en' ? 'Direct Command Voice Hotlines' : 'Lambobin Wayar Gaggawa Kai Tsaye'}</span>
                </div>

                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  {language === 'en' 
                    ? 'In the event of total application failure or satellite outage, dial the security agencies directly using standard cellular networks.' 
                    : 'Idan komai ya gaza baki daya, za ku iya kiran wadannan lambobin wayar kai tsaye don samun taimakon gaggawa.'}
                </p>

                <div className="divide-y divide-gray-200">
                  <div className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-gray-800">{language === 'en' ? 'Military Operations Command' : 'Babban Ofishin Sojoji'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">24/7 Crisis Dispatch Center</div>
                    </div>
                    <a href="tel:08030001111" className="font-mono font-black text-red-700 hover:underline">0803 000 1111</a>
                  </div>

                  <div className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-gray-800">{language === 'en' ? 'Police State Command HQ' : 'Rundunar Yan Sanda ta Jiha'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">Emergency Control Room</div>
                    </div>
                    <a href="tel:08022223333" className="font-mono font-black text-red-700 hover:underline">0802 222 3333</a>
                  </div>

                  <div className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-gray-800">{language === 'en' ? 'Civil Defence Corps (NSCDC)' : 'Jami\'an Tsaron Farin Kaya'}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">Joint Security Coordination</div>
                    </div>
                    <a href="tel:08055554444" className="font-mono font-black text-red-700 hover:underline">0805 555 4444</a>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-black tracking-widest uppercase">
                <Shield className="h-3.5 w-3.5 text-gray-300" />
                <span>Guardian Offline Safe</span>
              </div>
              <button
                onClick={() => setShowUssdAccessModal(false)}
                className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                {language === 'en' ? 'CLOSE SHEET' : 'RUFE SHAFIN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM OVERLAY DIALOG FOR LIVE ACTIVE USSD SESSIONS */}
      {ussdSessionActive && (
        <div className="fixed inset-0 bg-[#212121]/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#1a1a1a] border-2 border-gray-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl font-mono text-xs text-white space-y-4">
            {/* Network Header */}
            <div className="flex justify-between items-center text-[9px] text-gray-500 pb-2 border-b border-gray-950 uppercase">
              <span>GSM PROTOCOL GATEWAY</span>
              <span className="text-emerald-500 flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CONNECTED
              </span>
            </div>

            {/* Main Content Display */}
            <div className="whitespace-pre-wrap leading-relaxed text-gray-200 py-2 font-mono tracking-wide">
              {ussdSessionText}
            </div>

            {/* Interactive Input */}
            {ussdSessionStep !== 'finished' && (
              <input
                id="ussd-active-session-input"
                type="text"
                value={ussdInputText}
                onChange={(e) => setUssdInputText(e.target.value)}
                placeholder="Enter choice number..."
                className="w-full bg-black border border-gray-800 rounded-lg py-2 px-3 text-emerald-400 font-mono text-center focus:outline-none focus:border-emerald-600 transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleActiveUssdSend(ussdInputText);
                  }
                }}
              />
            )}

            {/* Dialogue Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-900 text-[10px] font-bold">
              <button
                id="ussd-active-cancel-btn"
                onClick={closeUssdSession}
                className="flex-1 py-2 bg-gray-950 hover:bg-gray-900 text-gray-400 rounded-lg transition-colors border border-gray-900 cursor-pointer text-center uppercase"
              >
                Cancel
              </button>
              
              {ussdSessionStep !== 'finished' ? (
                <button
                  id="ussd-active-send-btn"
                  onClick={() => handleActiveUssdSend(ussdInputText)}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-md cursor-pointer text-center uppercase"
                >
                  Send
                </button>
              ) : (
                <button
                  id="ussd-active-close-btn"
                  onClick={closeUssdSession}
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-md cursor-pointer text-center uppercase"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
