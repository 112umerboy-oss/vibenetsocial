import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Crown, Zap, BarChart3, Clock, Sparkles, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { proService } from '../services/proService';
import { auth } from '../lib/firebase';

interface ProUpgradeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({ onClose, onSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpgrade = async () => {
    if (!auth.currentUser) return;
    setIsProcessing(true);
    
    // Simulate Stripe Checkout delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      await proService.upgradeToPro(auth.currentUser.uid);
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const features = [
    { 
      icon: <Zap className="w-5 h-5 text-vibe-neon" />, 
      title: "Unlimited AI Energy", 
      desc: "Remove the 10-signal daily limit for Trend Prophet & Creator Lab." 
    },
    { 
      icon: <Crown className="w-5 h-5 text-vibe-neon" />, 
      title: "Shadow Sovereign Identity", 
      desc: "Exclusive custom neon border colors & PRO badge badge on your profile." 
    },
    { 
      icon: <BarChart3 className="w-5 h-5 text-vibe-neon" />, 
      title: "Deep Signal Analytics", 
      desc: "Unlock the full Insights dashboard with resonance heatmaps." 
    },
    { 
      icon: <Clock className="w-5 h-5 text-vibe-neon" />, 
      title: "Early Artifact Access", 
      desc: "Be the first to manifest new features before they hit the general feed." 
    }
  ];

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-vibe-card border border-vibe-neon/30 p-12 rounded-[48px] text-center space-y-6"
        >
          <div className="w-24 h-24 bg-vibe-neon/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Crown className="w-12 h-12 text-vibe-neon" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Access Granted</h2>
          <p className="text-vibe-muted font-mono text-sm uppercase tracking-widest leading-relaxed">
            Your signal has been upgraded to Sovereign status. 
            Welcome to the elite core.
          </p>
          <div className="pt-4 flex justify-center">
            <div className="w-8 h-1 bg-vibe-neon rounded-full" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-2xl bg-vibe-card border border-white/10 rounded-[48px] overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 rounded-full hover:bg-white/5 text-vibe-muted transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-12 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-vibe-neon font-black italic uppercase tracking-tight text-xs">
              <Sparkles className="w-3 h-3" /> Exclusive Access
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
              Vibe Pro <span className="text-vibe-neon">Subscription</span>
            </h2>
            <p className="text-vibe-muted font-mono text-sm uppercase tracking-widest">
              Escape the simulation. Become a sovereign signal.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-[32px] bg-white/5 border border-white/5 space-y-2 hover:bg-white/10 transition-colors"
              >
                <div className="p-2 rounded-xl bg-vibe-neon/10 w-fit mb-2">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight">{f.title}</h3>
                <p className="text-[10px] text-vibe-muted font-mono leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="p-10 rounded-[40px] bg-vibe-neon/5 border border-vibe-neon/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="text-4xl font-black italic text-vibe-neon">$4.99<span className="text-sm text-vibe-muted font-mono">/mo</span></div>
              <div className="text-[10px] text-vibe-muted font-mono uppercase tracking-widest flex items-center gap-2">
                 <ShieldCheck className="w-3 h-3" /> Cancel any time
              </div>
            </div>
            <button 
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="w-full md:w-auto px-10 py-5 rounded-full bg-vibe-neon text-black font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all text-lg shadow-[0_20px_40px_rgba(212,175,55,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  Upgrade Now
                  <Zap className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
          
          <div className="flex justify-center gap-6 text-[8px] text-vibe-muted font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-vibe-neon" /> Secured by VibeNet</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-vibe-neon" /> Global Resonance</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
