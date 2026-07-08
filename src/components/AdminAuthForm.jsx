import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  User, 
  Mail, 
  Lock, 
  ShieldAlert, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Key, 
  AlertCircle 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AdminAuthForm = ({ onAuthSuccess, onBack }) => {
  const { t, language } = useLanguage();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'

  // Input States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agencyId, setAgencyId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI helper states
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password criteria states
  const [pwdLength, setPwdLength] = useState(false);
  const [pwdUpper, setPwdUpper] = useState(false);
  const [pwdLower, setPwdLower] = useState(false);
  const [pwdDigit, setPwdDigit] = useState(false);
  const [pwdSpecial, setPwdSpecial] = useState(false);
  const [strengthScore, setStrengthScore] = useState(0);

  // Validate password strength in real-time
  useEffect(() => {
    const isLength = password.length >= 8;
    const isUpper = /[A-Z]/.test(password);
    const isLower = /[a-z]/.test(password);
    const isDigit = /[0-9]/.test(password);
    const isSpecial = /[^A-Za-z0-9]/.test(password);

    setPwdLength(isLength);
    setPwdUpper(isUpper);
    setPwdLower(isLower);
    setPwdDigit(isDigit);
    setPwdSpecial(isSpecial);

    // Score from 0 to 5 based on met criteria
    let score = 0;
    if (isLength) score++;
    if (isUpper) score++;
    if (isLower) score++;
    if (isDigit) score++;
    if (isSpecial) score++;
    setStrengthScore(score);
  }, [password]);

  // Handle account registration & login
  const handleSubmit = (e) => {
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

    // Strong password check for Sign Up
    if (authMode === 'signup') {
      if (!name) {
        setErrorMessage(
          language === 'en' ? 'Please provide your full administrator name.' : 'Sanya cikakken sunanka na hukuma.'
        );
        return;
      }
      if (strengthScore < 5) {
        setErrorMessage(
          language === 'en' 
            ? 'Password does not meet strong security criteria.' 
            : 'Kalmar sirri ba ta cika amintattun sharuɗɗan tsaro ba.'
        );
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage(
          language === 'en' ? 'Passwords do not match.' : 'Kalmomin sirri ba su yi daidai ba.'
        );
        return;
      }

      // Save user in local state or localStorage mock directory
      const newAdmin = { name, email, agencyId, password };
      const existingAdmins = JSON.parse(localStorage.getItem('guardian_admins') || '[]');
      
      // Check duplicate
      if (existingAdmins.some(admin => admin.email.toLowerCase() === email.toLowerCase() || admin.agencyId === agencyId)) {
        setErrorMessage(
          language === 'en' 
            ? 'An account with this Email or Agency ID is already registered.' 
            : 'An riga an yi rajista da wannan Imel ko Lambar Hukuma.'
        );
        return;
      }

      existingAdmins.push(newAdmin);
      localStorage.setItem('guardian_admins', JSON.stringify(existingAdmins));
      
      setSuccessMessage(
        language === 'en' 
          ? 'Registration successful! Proceeding to dispatch room...' 
          : 'An yi rajista cikin nasara! Ana shiga dakin bayar da umarni...'
      );
      
      setTimeout(() => {
        onAuthSuccess({ name, email, agencyId });
      }, 1500);

    } else {
      // Login flow
      const defaultAdmin = {
        name: 'Command Dispatcher',
        email: 'admin@guardian.gov.ng',
        agencyId: 'ZMF-CPG-2026',
        password: 'Secure@Password123'
      };

      const existingAdmins = JSON.parse(localStorage.getItem('guardian_admins') || '[]');
      existingAdmins.push(defaultAdmin); // Ensure default admin is always available

      const matchedUser = existingAdmins.find(admin => 
        admin.email.toLowerCase() === email.toLowerCase() && 
        admin.agencyId.trim().toUpperCase() === agencyId.trim().toUpperCase() && 
        admin.password === password
      );

      if (!matchedUser) {
        setErrorMessage(
          language === 'en' 
            ? 'Invalid Email, Agency ID, or Password. Please try again.' 
            : 'Kuskure a Imel, Lambar Hukuma, ko Kalmar Sirri. Sake gwadawa.'
        );
        return;
      }

      setSuccessMessage(
        language === 'en' 
          ? 'Authentication verified. Redirecting to security command center...' 
          : 'An tabbatar da shiga. Ana karkatar da ku zuwa dakin sadarwa...'
      );

      setTimeout(() => {
        onAuthSuccess({
          name: matchedUser.name,
          email: matchedUser.email,
          agencyId: matchedUser.agencyId
        });
      }, 1500);
    }
  };

  const getStrengthLabel = () => {
    switch (strengthScore) {
      case 0:
      case 1:
        return { text: language === 'en' ? 'Very Weak' : 'Mafi Rauni', color: 'bg-red-500', textClass: 'text-red-500' };
      case 2:
      case 3:
        return { text: language === 'en' ? 'Weak' : 'Mai Rauni', color: 'bg-amber-500', textClass: 'text-amber-500' };
      case 4:
        return { text: language === 'en' ? 'Medium' : 'Tsaka-tsaki', color: 'bg-blue-500', textClass: 'text-blue-500' };
      case 5:
        return { text: language === 'en' ? 'Strong (Secured)' : 'Kariyar Sirri Mafi Karfi', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
      default:
        return { text: '', color: 'bg-gray-300', textClass: 'text-gray-400' };
    }
  };

  const strengthInfo = getStrengthLabel();

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center px-4 py-12 font-sans animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-6 relative overflow-hidden">
        
        {/* Absolute Red Security Indicator Tab */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#B71C1C]"></div>

        {/* Back navigation */}
        <button
          id="auth-back-btn"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-gray-500 hover:text-[#B71C1C] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{language === 'en' ? 'Return to Citizen Portal' : 'Koma Kofar Jama\'a'}</span>
        </button>

        {/* Branding header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-[#B71C1C] text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            {authMode === 'login' 
              ? (language === 'en' ? 'Dispatcher Control Sign-In' : 'Shiga Dakin Bayar da Umarni')
              : (language === 'en' ? 'Register Dispatcher Account' : 'Yin Rajistar Jami\'i')}
          </h2>
          <p className="text-xs text-gray-400 font-semibold max-w-xs mx-auto">
            {language === 'en' 
              ? 'Secure cryptographic authentication protocol for authorized personnel only.' 
              : 'Amintacciyar hanyar shiga ta sirri ga jami\'an tsaro kadai.'}
          </p>
        </div>

        {/* Info alerts */}
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

        {/* Toggle Form Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-gray-100 rounded-xl p-1 text-xs font-bold">
          <button
            id="tab-login"
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'login' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {language === 'en' ? 'Sign In' : 'Shiga Ciki'}
          </button>
          <button
            id="tab-signup"
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              authMode === 'signup' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {language === 'en' ? 'Sign Up' : 'Yin Rajista'}
          </button>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Admin Name Field (Signup Only) */}
          {authMode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                {language === 'en' ? 'Full Admin Name' : 'Cikakken Sunan Jami\'i'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="admin-name"
                  type="text"
                  placeholder="e.g. Captain Bello Gusau"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Email Address Field */}
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

          {/* Agency ID Number Field */}
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
                placeholder="e.g. ZMF-CPG-2026 or ARMY-042"
                value={agencyId}
                onChange={(e) => setAgencyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                {language === 'en' ? 'Secure Password' : 'Kalmar Sirri'}
              </label>
              {authMode === 'signup' && (
                <span className={`text-[9px] font-black ${strengthInfo.textClass}`}>
                  {strengthInfo.text.toUpperCase()}
                </span>
              )}
            </div>
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

          {/* Strong Password Real-time Criteria Feedback (Signup Only) */}
          {authMode === 'signup' && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-150 space-y-2.5 animate-fade-in">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                {language === 'en' ? 'Strong Security Requirements:' : 'Sharuɗɗan Tsaro na Gaggawa:'}
              </span>
              
              {/* Progress Bar Strength Indicator */}
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${strengthInfo.color}`} 
                  style={{ width: `${(strengthScore / 5) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-semibold text-gray-500">
                <div className="flex items-center space-x-1.5">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${pwdLength ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={pwdLength ? 'text-gray-800 font-bold' : ''}>
                    {language === 'en' ? 'Min. 8 characters' : 'Kalla baki 8'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${pwdUpper ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={pwdUpper ? 'text-gray-800 font-bold' : ''}>
                    {language === 'en' ? 'At least 1 uppercase' : 'Babban baki guda 1'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${pwdLower ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={pwdLower ? 'text-gray-800 font-bold' : ''}>
                    {language === 'en' ? 'At least 1 lowercase' : 'Karamin baki guda 1'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${pwdDigit ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={pwdDigit ? 'text-gray-800 font-bold' : ''}>
                    {language === 'en' ? 'At least 1 number' : 'Lamba a kalla guda 1'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                  <Check className={`h-3.5 w-3.5 shrink-0 ${pwdSpecial ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={pwdSpecial ? 'text-gray-800 font-bold' : ''}>
                    {language === 'en' ? 'At least 1 special character' : 'Bakin sirri (kamar @, #, $, %)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password (Signup Only) */}
          {authMode === 'signup' && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                {language === 'en' ? 'Confirm Secure Password' : 'Sake Tabbatar da Kalmar Sirri'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="admin-password-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B71C1C] focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            id="auth-submit-btn"
            type="submit"
            className="w-full py-3 bg-[#B71C1C] hover:bg-red-800 text-white rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            {authMode === 'login' 
              ? (language === 'en' ? 'ENTER DISPATCH ROOM' : 'SHIGA SASHA BA DA UMARNI')
              : (language === 'en' ? 'CREATE ADMINISTRATOR' : 'YIN RAJISTAR MAI TSARI')}
          </button>
        </form>

        {/* Demo Assistant helper box */}
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4 space-y-2 text-center text-[11px] text-gray-600 font-semibold leading-relaxed">
          <p className="text-[#B71C1C] font-black uppercase tracking-wider flex items-center justify-center">
            <AlertCircle className="h-4.5 w-4.5 mr-1.5 shrink-0" />
            <span>{language === 'en' ? 'Demo Authorization Access' : 'Taimakon Shiga na Gwaji'}</span>
          </p>
          <p>
            {language === 'en' 
              ? 'Authorized staff may bypass Sign Up by signing in with our pre-populated command credentials:'
              : 'Don gwada tsarin kai tsaye, za a iya amfani da wadannan asusun da muka riga muka tsara:'}
          </p>
          <div className="bg-white border border-red-100 p-2.5 rounded-xl font-mono text-[10px] text-[#B71C1C] text-left space-y-1 select-all font-black">
            <div>EMAIL: admin@guardian.gov.ng</div>
            <div>AGENCY ID: ZMF-CPG-2026</div>
            <div>PASS: Secure@Password123</div>
          </div>
        </div>

      </div>
    </div>
  );
};
