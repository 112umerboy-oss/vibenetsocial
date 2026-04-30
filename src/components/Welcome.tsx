import React, { useState } from 'react';
import { motion } from 'motion/react';
import { auth, signIn } from '../lib/firebase';
import { ChevronRight, Lock, ArrowRight, Zap, Loader2 } from 'lucide-react';

export const Welcome: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Background with Ambient Glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(212,175,55,0.15),transparent)] opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.05),transparent)]" />
        
        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <motion.div 
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-vibe-neon/5 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -30, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 -right-20 w-[600px] h-[600px] bg-white/5 rounded-full blur-[150px]" 
        />
      </div>

      <div className="relative z-10 w-full max-w-xl px-10 flex flex-col items-center text-center">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="space-y-6"
        >
          <div className="text-[10px] uppercase font-black tracking-[0.5em] text-vibe-neon mb-4">
             Digital Harmony Layer
          </div>
          <h1 className="text-6xl md:text-7xl font-serif text-white tracking-tight leading-[0.9] font-bold">
            Your World, <br />
            <span className="italic font-normal">Seamlessly</span> <br />
            Connected
          </h1>
          <p className="text-white/50 text-sm max-w-sm mx-auto font-sans leading-relaxed pt-6">
            Experience a social platform designed to keep you in the loop. Share your moments, connect with like-minded individuals.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 w-full"
        >
          <button 
            onClick={handleSignIn}
            className="group relative w-full h-16 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full flex items-center overflow-hidden transition-all hover:border-white/40"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
            
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-transform group-hover:scale-105">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5 fill-black" />}
                </div>
                <span className="text-white font-bold uppercase tracking-widest text-[11px] ml-2">
                  {loading ? 'Authenticating...' : 'Get Started'}
                </span>
              </div>
              
              <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity pr-4">
                <ChevronRight className="w-4 h-4 text-white" />
                <ChevronRight className="w-4 h-4 text-white -ml-2" />
                <ChevronRight className="w-4 h-4 text-white -ml-2" />
              </div>
            </div>
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-[9px] uppercase font-black text-white/30 tracking-[0.3em]">
             <Zap className="w-3 h-3 text-vibe-neon" /> VibeNet Social v5.2.0
          </div>
        </motion.div>
      </div>

      {/* Decorative Corner Bars */}
      <div className="absolute top-10 left-10 w-20 h-px bg-white/20" />
      <div className="absolute top-10 left-10 w-px h-20 bg-white/20" />
      <div className="absolute bottom-10 right-10 w-20 h-px bg-white/20" />
      <div className="absolute bottom-10 right-10 w-px h-20 bg-white/20" />
    </div>
  );
};
