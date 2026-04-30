import React, { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mail, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Fingerprint,
  Smartphone
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [subMode, setSubMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setConfirmationResult(null);
      setOtp('');
    }
  }, [isOpen]);

  const setupRecaptcha = (buttonId: string) => {
    try {
      const verifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
      });
      return verifier;
    } catch (err) {
      console.error('Recaptcha error:', err);
      return null;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (subMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        await sendEmailVerification(userCredential.user);
        setSuccess('Verification email sent! Please check your inbox.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const verifier = setupRecaptcha('phone-signin-button');
    if (!verifier) {
      setError('Could not initialize verification system.');
      setLoading(false);
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setSuccess('OTP sent to your phone.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;

    setLoading(true);
    setError(null);

    try {
      await confirmationResult.confirm(otp);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-vibe-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-vibe-card border border-vibe-border p-8 relative overflow-hidden"
      >
        {/* Brutalist Grid Background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--vibe-neon) 1px, transparent 1px), linear-gradient(90deg, var(--vibe-neon) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-vibe-muted hover:text-vibe-contrast"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Fingerprint className="w-8 h-8 text-vibe-neon" />
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-vibe-contrast">
              Identity <span className="text-vibe-neon">Sync</span>
            </h2>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 mb-8 border-b border-vibe-border">
            <button 
              onClick={() => { setMode('email'); setConfirmationResult(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mode === 'email' ? 'border-vibe-neon text-vibe-neon' : 'border-transparent text-vibe-muted hover:text-vibe-contrast'}`}
            >
              Email Protocol
            </button>
            <button 
              onClick={() => { setMode('phone'); setSuccess(null); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${mode === 'phone' ? 'border-vibe-neon text-vibe-neon' : 'border-transparent text-vibe-muted hover:text-vibe-contrast'}`}
            >
              Phone Relay
            </button>
          </div>

          <div className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 flex items-center gap-3 text-red-500 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="bg-vibe-neon/10 border border-vibe-neon/30 p-4 flex items-center gap-3 text-vibe-neon text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {success}
              </div>
            )}

            {mode === 'email' ? (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {subMode === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Agent Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="w-full bg-vibe-pure border border-vibe-border px-4 py-3 text-vibe-contrast font-mono text-sm focus:border-vibe-neon outline-none transition-all"
                      placeholder="e.g. Ghost_X"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Email Hash</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-vibe-pure border border-vibe-border pl-12 pr-4 py-3 text-vibe-contrast font-mono text-sm focus:border-vibe-neon outline-none transition-all"
                      placeholder="address@grid.net"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">DNA Key (Password)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-vibe-pure border border-vibe-border px-4 py-3 text-vibe-contrast font-mono text-sm focus:border-vibe-neon outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-vibe-neon text-black py-4 font-black uppercase italic tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-vibe-contrast hover:text-vibe-pure transition-all shadow-[0_0_20px_rgba(204,255,0,0.3)]"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      {subMode === 'login' ? 'INITIALIZE LINK' : 'CREATE IDENTITY'} 
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[10px] text-vibe-muted font-mono uppercase tracking-widest">
                  {subMode === 'login' ? "New Agent?" : "Existing Agent?"}{' '}
                  <button 
                    type="button"
                    onClick={() => setSubMode(subMode === 'login' ? 'signup' : 'login')}
                    className="text-vibe-contrast hover:text-vibe-neon transition-colors"
                  >
                    {subMode === 'login' ? 'Register Binary' : 'Login Grid'}
                  </button>
                </p>
              </form>
            ) : (
              <div className="space-y-6">
                {!confirmationResult ? (
                  <form onSubmit={handlePhoneSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Phone Frequency</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="w-full bg-vibe-pure border border-vibe-border pl-12 pr-4 py-3 text-vibe-contrast font-mono text-sm focus:border-vibe-neon outline-none transition-all"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      id="phone-signin-button"
                      disabled={loading}
                      className="w-full bg-vibe-contrast text-vibe-pure py-4 font-black uppercase italic tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-vibe-neon hover:text-black transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>SEND SIGNAL <Smartphone className="w-4 h-4" /></>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Verification Code</label>
                      <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full bg-vibe-pure border border-vibe-border px-4 py-3 text-vibe-contrast font-mono text-center text-2xl tracking-[0.5em] focus:border-vibe-neon outline-none transition-all"
                        placeholder="000000"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-vibe-neon text-black py-4 font-black uppercase italic tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-vibe-contrast hover:text-vibe-pure transition-all"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>VERIFY IDENTITY <CheckCircle2 className="w-4 h-4" /></>
                      )}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="w-full text-[10px] text-vibe-muted font-mono uppercase tracking-widest hover:text-vibe-contrast transition-colors"
                    >
                      Back to Re-route
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
