import React, { useState, useEffect, useRef } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { fetchIncidents as fetchIncidentsFromApi, updateIncidentStatus } from './utils.js';
import { CitizenDashboard } from './components/CitizenDashboard';
import { DispatcherPanel } from './components/DispatcherPanel';
import { StealthLockUtility } from './components/StealthLockUtility';
import { AdminAuthForm } from './components/AdminAuthForm';
import ManagerPanel from './components/ManagerPanel';
import { 
  Shield, 
  ServerCrash, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import InstallPrompt from './components/InstallPrompt';

// Web Audio API Premium Sound Generators
const playEmergencySound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Play a dual-tone urgent sequence of high-frequency alerts (Military/Security alert feel)
    const playTone = (freq, startTime, duration) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      // Fine-tuned volume envelope to sound professional & clear with no click artifacts
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    // Sequential alert pings
    playTone(987.77, now, 0.35);       // B5 note
    playTone(1174.66, now + 0.12, 0.4);  // D6 note
    playTone(1318.51, now + 0.24, 0.55); // E6 note
  } catch (error) {
    console.warn("Audio Context blocked or failed to initialize.", error);
  }
};

const playAcknowledgeSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, startTime, duration) => {
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioCtx.currentTime;
    // A clean, soft ascending positive confirmation chime
    playTone(659.25, now, 0.25);      // E5 note
    playTone(880.00, now + 0.08, 0.4);  // A5 note
  } catch (error) {
    console.warn("Audio Context blocked or failed to initialize.", error);
  }
};

// Global Floating Toast Container Component
function ToastContainer({ toasts, onClose }) {
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Info className="h-5 w-5 text-blue-500 shrink-0" />;
          let borderClass = 'border-blue-100 bg-white/95 text-blue-900 shadow-blue-500/5';
          if (toast.type === 'success') {
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />;
            borderClass = 'border-emerald-100 bg-white/95 text-emerald-900 shadow-emerald-500/5';
          } else if (toast.type === 'warning') {
            icon = <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
            borderClass = 'border-amber-100 bg-white/95 text-amber-900 shadow-amber-500/5';
          } else if (toast.type === 'error') {
            icon = <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
            borderClass = 'border-red-100 bg-white/95 text-red-900 shadow-red-500/5';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className={`flex items-start gap-3 p-4 rounded-2xl border-2 shadow-xl pointer-events-auto relative overflow-hidden backdrop-blur-md ${borderClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 text-[11px] sm:text-xs font-bold leading-relaxed pr-6 text-gray-800">
                {toast.message}
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className="absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function GuardianApp() {
  const { t, language } = useLanguage();
  
  // App views: 'citizen' | 'dispatcher'
  const [audienceMode, setAudienceMode] = useState('citizen');
  const [stealthLocked, setStealthLocked] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [serverStatus, setServerStatus] = useState('connected');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Toast state
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keep track of previously loaded incidents to avoid duplicate notifications on poll
  const prevIncidentsRef = useRef([]);
  const prevStatusRef = useRef({});
  const isFirstLoadRef = useRef(true);

  // Fetch initial incidents list from our Express API
  const fetchIncidents = async () => {
    try {
      const data = await fetchIncidentsFromApi();
      setIncidents(data.incidents || []);
      setServerStatus('connected');
    } catch (err) {
      console.warn("Backend server offline or loading. Using local memory.", err);
      setServerStatus('disconnected');
    }
  };

  // Poll for new reports in background for dispatcher real-time feel
  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 6000);
    return () => clearInterval(interval);
  }, []);

  // Monitor incident list updates to trigger alerts & notifications
  useEffect(() => {
    if (incidents.length === 0) return;

    // First load setup - seed historical identifiers to avoid flooding on startup
    if (isFirstLoadRef.current) {
      prevIncidentsRef.current = incidents;
      incidents.forEach(inc => {
        prevStatusRef.current[inc._id] = inc.status;
      });
      isFirstLoadRef.current = false;
      return;
    }

    // 1. Detect Brand New Incidents submitted online or from another source
    const newIncidents = incidents.filter(
      inc => !prevIncidentsRef.current.some(prev => prev._id === inc._id)
    );

    if (newIncidents.length > 0) {
      newIncidents.forEach(newInc => {
        // Trigger a notification for the newly submitted report
        addToast(
          language === 'en'
            ? `ðŸš¨ NEW CRISIS REPORT: ${newInc.category.toUpperCase()} submitted near coordinates.`
            : `ðŸš¨ SABON RAHOTON GAGGAWA: An tura ${newInc.category.toUpperCase()} kusa da ku.`,
          'warning'
        );

        // ALWAYS play sound tone for administrators when any report is submitted
        if (audienceMode === 'dispatcher') {
          playEmergencySound();
        }
      });
    }

    // 2. Detect status change acknowledgments (e.g. Pending -> Verified / Dispatched / Resolved)
    incidents.forEach(inc => {
      const prevStatus = prevStatusRef.current[inc._id];
      if (prevStatus && prevStatus !== inc.status) {
        // Acknowledgment received!
        addToast(
          language === 'en'
            ? `âœ… DISPATCH ACKNOWLEDGED: Incident status set to '${inc.status}'`
            : `âœ… AN TABBATAR DA AIKO: An saita rahoton a matsayin '${inc.status}'`,
          'success'
        );

        // Play positive tone for admin/dispatcher as confirmation
        if (audienceMode === 'dispatcher') {
          playAcknowledgeSound();
        }
      }
      prevStatusRef.current[inc._id] = inc.status;
    });

    prevIncidentsRef.current = incidents;
  }, [incidents, audienceMode, language]);

  // Update incident status dispatcher trigger
  const handleUpdateStatus = async (id, nextStatus) => {
    // Optimistic state update for instant UI response
    setIncidents(prev => prev.map(inc => {
      if (inc._id === id) {
        return { ...inc, status: nextStatus };
      }
      return inc;
    }));

    // Instantly update local cache of the status to prevent duplicate trigger
    prevStatusRef.current[id] = nextStatus;

    addToast(
      language === 'en'
        ? `Status successfully changed to: '${nextStatus}'`
        : `An yi nasarar canza matsayi zuwa: '${nextStatus}'`,
      'success'
    );

    try {
      await updateIncidentStatus(id, nextStatus);
    } catch (err) {
      console.error('Failed to sync state changes to API, kept optimistic local change.', err);
    }
  };

  // When a local alert is triggered, add it to state immediately
  const handleNewAlert = (newIncident) => {
    // Prevent duplicate triggers if the item gets pulled in subsequent polls
    if (!prevIncidentsRef.current.some(p => p._id === newIncident._id)) {
      prevIncidentsRef.current = [newIncident, ...prevIncidentsRef.current];
    }
    prevStatusRef.current[newIncident._id] = newIncident.status;
    
    setIncidents(prev => [newIncident, ...prev]);

    // Render immediate toast confirmation
    addToast(
      language === 'en'
        ? `Emergency report securely transmitted: ${newIncident.category}`
        : `An tura rahoton gaggawa cikin nasara: ${newIncident.category}`,
      'success'
    );

    // Notify admins if logged in
    if (audienceMode === 'dispatcher') {
      playEmergencySound();
    }
  };

  if (stealthLocked) {
    return <StealthLockUtility onUnlock={() => setStealthLocked(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col relative">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <InstallPrompt />

      {/* Top Brand Banner */}
      <div className="bg-[#212121] text-white px-6 py-2.5 flex flex-col sm:flex-row justify-between items-center text-xs font-bold gap-2.5 select-none border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-[#B71C1C]" />
          <span className="tracking-widest uppercase">Guardian-NG Security Framework</span>
        </div>

        {/* Status indicator */}
        {serverStatus === 'disconnected' ? (
          <div className="flex items-center space-x-1 text-red-400 bg-red-950/50 px-2 py-0.5 rounded border border-red-900 text-[10px]">
            <ServerCrash className="h-3 w-3" />
            <span>Local Database Offline Fallback</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900 text-[10px]">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
            <span>Secure Server Core Connected</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between">
        {audienceMode === 'citizen' ? (
          <CitizenDashboard 
            onStealthLock={() => setStealthLocked(true)} 
            onAlertTriggered={handleNewAlert}
            onAdminClick={() => setAudienceMode('dispatcher')}
            addToast={addToast}
          />
        ) : !currentUser ? (
          <AdminAuthForm 
            onAuthSuccess={(user) => setCurrentUser(user)}
            onBack={() => setAudienceMode('citizen')}
          />
        ) : currentUser.role === 'manager' ? (
          <ManagerPanel
            incidents={incidents}
            onUpdateStatus={handleUpdateStatus}
            currentUser={currentUser}
            onAuthUpdated={setCurrentUser}
            onLogout={() => {
              setCurrentUser(null);
              setAudienceMode('citizen');
            }}
            addToast={addToast}
          />
        ) : (
          <DispatcherPanel 
            incidents={incidents} 
            onUpdateStatus={handleUpdateStatus}
            currentUser={currentUser}
            onLogout={() => {
              setCurrentUser(null);
              setAudienceMode('citizen');
            }}
            addToast={addToast}
          />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <GuardianApp />
    </LanguageProvider>
  );
}

