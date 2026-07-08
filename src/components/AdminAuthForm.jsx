import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  ShieldAlert,
  Eye,
  EyeOff,
  ArrowLeft,
  Key,
  AlertCircle,
  Check
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { loginAdmin } from '../utils.js';

export const AdminAuthForm = ({ onAuthSuccess, onBack }) => {
  const { language } = useLanguage();
  const [authRole, setAuthRole] = useState('dispatcher');
  const [email, setEmail] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email || !agencyId || !password) {
      setErrorMessage(
        language === 'en'
          ? 'Please fill in all required fields.'
          : 'Haba, da fatan za ku cike dukkan guraren da ake bukata.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginAdmin({ email, agencyId, password, role: authRole });
      setSuccessMessage(
        language === 'en'
          ? 'Authentication successful. Redirecting to the command console...'
          : 'An tabbatar da shiga. Ana komawa zuwa dakin umarni...'
      );
      setTimeout(() => onAuthSuccess(response.admin), 700);
    } catch (error) {
      setErrorMessage(
        error.message ||
          (language === 'en'
            ? 'Login failed. Check credentials and try again.'
            : 'Shiga ya gaza. Duba bayanan kuma sake gwadawa.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center px-4 py-12 font-sans animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#B71C1C]"></div>

        <button
          id="auth-back-btn"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-[#B71C1C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Return to Citizen Portal' : 'Koma Kofar Jama\'a'}</span>
        </button>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#B71C1C] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            {language === 'en' ? 'Secure Admin Sign-In' : 'Shiga Mai Gudanarwa Mai Tsaro'}
          </h2>
          <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto">
            {language === 'en'
              ? 'Authorized dispatchers and managers only.'
              : 'Ana izini kawai ga masu umarni da manajoji.'}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#B71C1C] font-bold animate-fade-in">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start space-x-3 text-xs text-emerald-800 font-bold animate-fade-in">
            <Check className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              {language === 'en' ? 'Government Email Address' : 'Imel Na Hukuma'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                placeholder="e.g. dispatcher@security.gov.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              {language === 'en' ? 'Agency Number ID' : 'Lambar Shaida ta Hukuma'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Key className="h-4 w-4" />
              </div>
              <input
                id="admin-agency-id"
                type="text"
                placeholder="e.g. ZMF-CPG-2026"
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <span>{language === 'en' ? 'Administrator Role' : 'Matsayin Mai Gudanarwa'}</span>
              <span className="text-[9px] text-gray-500">
                {language === 'en' ? 'Select your current login role' : 'Zaɓi matsayin shiga naka'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['dispatcher', 'manager'].map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => setAuthRole(roleOption)}
                  className={`py-2 rounded-xl text-[11px] font-bold transition-all border ${authRole === roleOption ? 'bg-[#B71C1C] text-white border-[#B71C1C]' : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'}`}
                >
                  {language === 'en'
                    ? roleOption === 'dispatcher' ? 'Dispatcher' : 'Manager'
                    : roleOption === 'dispatcher' ? 'Mai Umurni' : 'Manaja'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              {language === 'en' ? 'Secure Password' : 'Kalmar Sirri'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
              <button
                id="toggle-show-password"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer disabled:opacity-60"
          >
            {language === 'en' ? 'ENTER COMMAND CONSOLE' : 'SHIGA DAKIN UMARNI'}
          </button>
        </form>

        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2 text-center text-[11px] text-gray-600 font-semibold leading-relaxed">
          <p className="text-[#B71C1C] font-black uppercase tracking-wider flex items-center justify-center">
            <AlertCircle className="h-4.5 w-4.5 mr-1.5 shrink-0" />
            <span>{language === 'en' ? 'Demo Authorization Access' : 'Taimakon Shiga na Gwaji'}</span>
          </p>
          <p>
            {language === 'en'
              ? 'Manager and dispatcher accounts are provisioned centrally. Use the following credentials to login.'
              : 'Ana samar da asusun manaja da umurni a tsakiya. Yi amfani da bayanan shiga masu zuwa.'}
          </p>
          <div className="bg-white border border-red-100 p-2.5 rounded-xl font-mono text-[10px] text-[#B71C1C] text-left space-y-1 select-all font-black">
            <div>EMAIL: admin@guardian.gov.ng</div>
            <div>AGENCY ID: ZMF-CPG-2026</div>
            <div>PASS: Secure@Password123</div>
            <div className="pt-2 border-t border-red-100" />
            <div>EMAIL: manager@guardian.gov.ng</div>
            <div>AGENCY ID: ZMF-MGR-2026</div>
            <div>PASS: Manager@123</div>
          </div>
        </div>
      </div>
    </div>
  );
};
