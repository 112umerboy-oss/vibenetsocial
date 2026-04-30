import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Flame, 
  Trophy, 
  Share2, 
  X, 
  Sparkles, 
  TrendingUp, 
  Star,
  ChevronRight,
  ChevronLeft,
  Heart
} from 'lucide-react';
import { VibeWrapped as VibeWrappedType } from '../types';

interface VibeWrappedProps {
  data: VibeWrappedType;
  displayName: string;
  onClose: () => void;
}

export const VibeWrapped: React.FC<VibeWrappedProps> = ({ data, displayName, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      id: 'intro',
      render: () => (
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-32 h-32 rounded-[40px] bg-vibe-neon flex items-center justify-center shadow-[0_0_50px_rgba(200,255,0,0.3)]"
          >
             <Sparkles className="w-16 h-16 text-black" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-5xl font-serif italic font-bold text-white tracking-tight">Your {data.month}</h1>
            <p className="text-vibe-neon font-black uppercase tracking-[0.4em] text-xs">A VibeNet Retrospective</p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white/40 text-[10px] font-black uppercase tracking-widest"
          >
            Resonance detected. Tap to reveal.
          </motion.div>
        </div>
      )
    },
    {
      id: 'score',
      render: () => (
        <div className="space-y-12 w-full max-w-md">
          <div className="space-y-2">
            <span className="text-vibe-neon text-xs font-black uppercase tracking-widest">Evolution</span>
            <h2 className="text-4xl font-serif italic font-bold text-white">Vibe Score Growth</h2>
          </div>
          
          <div className="relative h-64 flex items-end justify-between px-8 gap-4">
             <div className="flex flex-col items-center gap-4 flex-1">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '40%' }}
                  className="w-full bg-white/5 border border-white/10 rounded-t-2xl flex items-center justify-center"
                >
                   <span className="text-white/20 font-mono text-sm">{data.scoreStart}</span>
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Start</span>
             </div>
             
             <div className="flex flex-col items-center gap-4 flex-1">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  className="w-full bg-vibe-neon rounded-t-2xl flex items-center justify-center relative shadow-[0_0_30px_rgba(200,255,0,0.2)]"
                >
                   <Zap className="w-6 h-6 text-black absolute top-4" />
                   <span className="text-black font-black text-xl">{data.scoreEnd}</span>
                </motion.div>
                <span className="text-[10px] font-black uppercase tracking-widest text-vibe-neon">Now</span>
             </div>
          </div>
          
          <p className="text-center text-white/60 text-sm italic font-serif">
            A {Math.round(((data.scoreEnd - data.scoreStart) / (data.scoreStart || 1)) * 100)}% increase in digital resonance.
          </p>
        </div>
      )
    },
    {
      id: 'dna',
      render: () => (
        <div className="space-y-12">
          <div className="text-center space-y-2">
            <span className="text-vibe-neon text-xs font-black uppercase tracking-widest">Locked In</span>
            <h2 className="text-4xl font-serif italic font-bold text-white">Aesthetic DNA</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
             {data.aestheticDNA.map((dna, i) => (
                <motion.div 
                  key={dna}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between group hover:bg-white/[0.08] transition-colors"
                >
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-vibe-neon/10 flex items-center justify-center">
                         <span className="text-vibe-neon font-black font-mono">{i + 1}</span>
                      </div>
                      <span className="text-xl font-mono text-white lowercase tracking-tighter">{dna}</span>
                   </div>
                   <div className="flex gap-1">
                      {[1,2,3].map(n => <div key={n} className="w-1 h-3 rounded-full bg-white/20" />)}
                   </div>
                </motion.div>
             ))}
          </div>

          <div className="p-8 rounded-[40px] bg-black border border-vibe-neon/20 text-center relative overflow-hidden group">
             <div className="absolute inset-0 bg-vibe-neon/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <span className="text-[10px] font-black uppercase tracking-widest text-vibe-neon mb-2 block">Dominant Mood</span>
             <h3 className="text-3xl font-serif italic font-bold text-white mb-2">{data.dominantMood}</h3>
             <div className="flex items-center justify-center gap-2">
                <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${data.moodPercentage}%` }}
                     className="h-full bg-vibe-neon" 
                   />
                </div>
                <span className="text-[10px] font-mono text-vibe-neon font-bold">{data.moodPercentage}%</span>
             </div>
          </div>
        </div>
      )
    },
    {
      id: 'performance',
      render: () => (
        <div className="space-y-16">
          <div className="text-center space-y-2">
            <span className="text-vibe-neon text-xs font-black uppercase tracking-widest">Stats</span>
            <h2 className="text-4xl font-serif italic font-bold text-white">The Numbers</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
             <StatCard label="Longest Streak" value={`${data.longestStreak} Days`} icon={<Flame className="text-orange-500" />} />
             <StatCard label="Total Posts" value={data.totalPosts.toString()} icon={<Zap className="text-vibe-neon" />} />
             <StatCard label="Peak Rank" value={`#${data.rankEnd}`} icon={<Trophy className="text-yellow-500" />} />
             <StatCard label="Climb" value={data.rankStart ? `${data.rankStart} → ${data.rankEnd}` : 'New Arrival'} icon={<TrendingUp className="text-blue-500" />} />
          </div>

          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             className="p-8 rounded-[40px] bg-white text-black relative"
          >
             <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-black flex items-center justify-center text-vibe-neon">
                <Star className="w-6 h-6 fill-current" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-black/40 block mb-4">Top Signal</span>
             <p className="text-xl font-bold leading-tight italic truncate">"{data.mostResonantPostCaption || 'Untitled Masterpiece'}"</p>
             <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-black" />
                   </div>
                   <span className="text-xs font-black">HIGH RESONANCE</span>
                </div>
                <Share2 className="w-4 h-4 opacity-40" />
             </div>
          </motion.div>
        </div>
      )
    },
    {
      id: 'outro',
      render: () => (
        <div className="flex flex-col items-center justify-center text-center space-y-12">
          <div className="space-y-4">
             <h2 className="text-5xl font-serif italic font-bold text-white">Vibe Level: Elite</h2>
             <p className="text-white/40 text-sm max-w-xs mx-auto">
                You've redefined the grid this month. April was only the beginning of your synchronization.
             </p>
          </div>
          
          <div className="w-full space-y-4">
             <button 
               onClick={() => alert('Wrapped summary saved to your Vault.')}
               className="w-full h-16 rounded-full bg-vibe-neon text-black text-xs font-black uppercase tracking-[0.4em] hover:scale-105 transition-transform flex items-center justify-center gap-3"
             >
                <Share2 className="w-4 h-4" /> Push to Signal
             </button>
             <button 
               onClick={onClose}
               className="w-full h-16 rounded-full vibe-glass text-white/60 text-xs font-black uppercase tracking-[0.4em] hover:text-white transition-colors"
             >
                Close Portal
             </button>
          </div>
        </div>
      )
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[600] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-vibe-neon/5 blur-[120px] rounded-full animate-pulse" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/5 blur-[120px] rounded-full" />
      </div>

      {/* Progress */}
      <div className="absolute top-8 left-8 right-8 flex gap-2 z-50">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
             <motion.div 
               initial={false}
               animate={{ width: i < currentSlide ? '100%' : i === currentSlide ? '100%' : '0%' }}
               className={`h-full ${i === currentSlide ? 'bg-vibe-neon' : 'bg-white/40'}`}
               transition={{ duration: 0.5 }}
             />
          </div>
        ))}
      </div>

      {/* Navigation Areas */}
      <div className="absolute inset-y-0 left-0 w-1/4 z-40" onClick={prevSlide} />
      <div className="absolute inset-y-0 right-0 w-1/4 z-40" onClick={nextSlide} />

      {/* Exit */}
      <button 
        onClick={onClose}
        className="absolute top-12 right-12 z-50 p-2 text-white/40 hover:text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Content */}
      <div className="relative z-30 p-8 w-full max-w-2xl px-6">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {slides[currentSlide].render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer hint */}
      <div className="absolute bottom-12 flex flex-col items-center gap-4 text-white/20 animate-bounce">
         <span className="text-[10px] font-black uppercase tracking-[0.3em]">Next Memory</span>
         <ChevronRight className="w-5 h-5 rotate-90" />
      </div>
    </motion.div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="p-8 rounded-[40px] bg-white/5 border border-white/5 flex flex-col gap-4">
     <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl">
        {icon}
     </div>
     <div className="space-y-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{label}</span>
        <span className="text-2xl font-mono text-white font-bold">{value}</span>
     </div>
  </div>
);
