import React from 'react';
import { motion } from 'motion/react';
import { Zap, Flame, Trophy, Share2, Download, X } from 'lucide-react';

interface VibeFlexCardProps {
  displayName: string;
  vibeScore: number;
  streak: number;
  dominantMood?: string;
  aestheticDNA?: string[];
  rank?: number;
  totalPosts: number;
  onClose?: () => void;
}

export const VibeFlexCard: React.FC<VibeFlexCardProps> = ({
  displayName,
  vibeScore,
  streak,
  dominantMood = 'Chill',
  aestheticDNA = ['minimal', 'builder', 'raw'],
  rank = 0,
  totalPosts,
  onClose
}) => {
  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* The Actual Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-[340px] aspect-[1/1.5] bg-[#050505] border-[3px] border-white/10 rounded-[32px] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col p-8"
        id="vibe-flex-card"
      >
        {/* Holographic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-vibe-neon/5 via-transparent to-white/5 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        {/* Grain Texture */}
        <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay pointer-events-none"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">VibeNet Social</span>
            <div className="h-[2px] w-12 bg-vibe-neon mt-1" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-vibe-neon" />
          </div>
        </div>

        {/* User Info */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif italic font-bold text-white tracking-tight leading-none mb-2">
            {displayName}
          </h2>
          <div className="bg-vibe-neon/10 border border-vibe-neon/20 px-3 py-1 rounded-full w-fit">
            <span className="text-[8px] font-black uppercase tracking-widest text-vibe-neon">Authenticity Verified</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 space-y-6">
          <StatRow label="Vibe Score" value={vibeScore.toString()} icon={<Zap className="w-3 h-3" />} highlight />
          <StatRow label="Streak" value={`🔥 ${streak}x`} />
          <StatRow label="Dominant Mood" value={dominantMood} />
          
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Aesthetic DNA</span>
            <div className="flex flex-wrap gap-2">
              {aestheticDNA.map((dna, i) => (
                <div key={dna} className="flex items-center gap-1.5">
                   <span className="text-[8px] text-white/10">{i === 0 ? '·' : i === 1 ? '·' : '·'}</span>
                   <span className="text-[10px] font-mono text-white/60 lowercase">{dna}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-between">
            <StatColumn label="Rank" value={`#${rank}`} />
            <StatColumn label="Total Signals" value={totalPosts.toString()} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 flex items-center justify-between">
           <span className="text-[10px] font-mono text-white/20 tracking-tighter">vibenet.social</span>
           <div className="flex gap-1">
              {[1,2,3].map(n => (
                <div key={n} className="w-1 h-1 rounded-full bg-white/10" />
              ))}
           </div>
        </div>
      </motion.div>

      {/* Control Actions */}
      <div className="flex gap-4">
        <button 
          onClick={() => {
            // In a real app we'd use html2canvas or similar
            alert('Screenshot captured and optimized for sharing.');
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-vibe-neon transition-all shadow-xl"
        >
          <Share2 className="w-3 h-3" /> Push Signal
        </button>
        {onClose && (
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center text-white/40 hover:text-white border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string; icon?: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
  <div className="flex items-center justify-between group">
    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors">{label}</span>
    <div className="flex items-center gap-2">
      {icon && <span className="text-vibe-neon">{icon}</span>}
      <span className={`text-xs font-mono ${highlight ? 'text-vibe-neon font-bold' : 'text-white'}`}>{value}</span>
    </div>
  </div>
);

const StatColumn: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[8px] font-black uppercase tracking-widest text-white/20">{label}</span>
    <span className="text-sm font-mono text-white font-bold">{value}</span>
  </div>
);
