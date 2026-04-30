import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { Prediction, OperationType } from '../types';
import { Sparkles, Trophy, History, Send, Loader2, Target, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { proService } from '../services/proService';

export const TrendProphet: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ userName: string, points: number }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [remainingEnergy, setRemainingEnergy] = useState<number | null>(null);
  const [view, setView] = useState<'predict' | 'history' | 'rank'>('predict');

  const currentWeek = `Week ${new Date().getUTCFullYear()}-${Math.ceil(new Date().getUTCDate() / 7)}`;

  useEffect(() => {
    const q = query(
      collection(db, 'predictions'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setPredictions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prediction)));
      setFetching(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'predictions');
      setFetching(false);
    });

    return unsub;
  }, []);

  // Simple leaderboard calc (in real app, this would be a separate collection or aggregated)
  useEffect(() => {
    if (predictions.length > 0) {
      const scores: Record<string, number> = {};
      predictions.forEach(p => {
        if (p.pointsAwarded > 0) {
          scores[p.userName] = (scores[p.userName] || 0) + p.pointsAwarded;
        }
      });
      const sorted = Object.entries(scores)
        .map(([userName, points]) => ({ userName, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      setLeaderboard(sorted);
    }
  }, [predictions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser) return;

    setLoading(true);
    const path = 'predictions';
    try {
      const usageCheck = await proService.checkAndIncrementAiUsage(auth.currentUser.uid);
      if (!usageCheck.allowed) {
        alert(usageCheck.error || "Energy depleted.");
        setLoading(false);
        return;
      }
      
      if (usageCheck.remaining !== undefined) {
        setRemainingEnergy(usageCheck.remaining);
      }

      await addDoc(collection(db, path), {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Prophet',
        prediction: input,
        week: currentWeek,
        isCorrect: null,
        pointsAwarded: 0,
        createdAt: serverTimestamp()
      });
      setInput('');
      setView('history');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col gap-2 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-vibe-neon/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-vibe-contrast flex items-center gap-4">
              Trend Prophet <TrendingUp className="w-8 h-8 text-vibe-neon animate-pulse" />
            </h2>
            <p className="text-vibe-muted font-mono text-xs uppercase tracking-widest">Predict the future. Command the grid.</p>
          </div>
          {remainingEnergy !== null && (
            <div className="px-3 py-1 rounded-full bg-vibe-neon/10 border border-vibe-neon/20 text-[10px] font-black uppercase text-vibe-neon animate-pulse flex items-center gap-2 mb-2">
              <Zap className="w-3 h-3 fill-current" />
              Signal Energy: {remainingEnergy}/10
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4 border-b border-vibe-border">
        {[
          { id: 'predict', icon: <Target className="w-4 h-4" />, label: 'Cast Vision' },
          { id: 'history', icon: <History className="w-4 h-4" />, label: 'Oracle Logs' },
          { id: 'rank', icon: <Trophy className="w-4 h-4" />, label: 'Top Prophets' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${view === tab.id ? 'text-vibe-neon' : 'text-vibe-muted hover:text-white'}`}
          >
            {tab.icon}
            {tab.label}
            {view === tab.id && (
              <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-vibe-neon shadow-[0_0_10px_#ccff00]" />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'predict' && (
          <motion.div
            key="predict"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="space-y-6">
              <div className="bg-vibe-card border border-vibe-border p-8 relative group overflow-hidden">
                <div className="absolute inset-0 bg-vibe-neon/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-4">Manifest a Trend</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase text-vibe-muted tracking-widest">What goes viral next week?</label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="e.g. Neo-brutalist UI filters, #ShadowDrop battles, Lo-fi cyberpunk beats..."
                      className="w-full bg-black/40 border border-vibe-border p-4 text-sm font-mono focus:outline-none focus:border-vibe-neon min-h-[120px] text-white resize-none"
                    />
                  </div>
                  <button
                    disabled={loading || !input.trim()}
                    className="w-full h-14 bg-vibe-neon text-black font-black uppercase italic text-xs flex items-center justify-center gap-3 hover:bg-white transition-all shadow-[0_0_30px_rgba(204,255,0,0.2)] disabled:opacity-50 group/btn"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Sparkles className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                        Cast Signal +100 Potential Vibe
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="bg-vibe-pure/50 border border-vibe-border p-6 border-dashed">
                <div className="flex gap-4 items-start">
                  <AlertCircle className="w-5 h-5 text-vibe-neon shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-white">How it works</p>
                    <p className="text-[9px] font-mono text-vibe-muted leading-relaxed">
                      Signals are validated by the Grid AI every Sunday. Correct visions grant <span className="text-vibe-neon">+100 Resonance</span> and permanent Prophet Status.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-vibe-muted">Global Visions (Live)</p>
              <div className="space-y-3">
                {predictions.slice(0, 5).map((p) => (
                  <div key={p.id} className="bg-black/40 border-l-2 border-vibe-border p-4 hover:border-vibe-neon transition-all flex justify-between items-center group">
                    <div className="space-y-1">
                      <p className="text-xs text-white font-mono">{p.prediction}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-vibe-neon uppercase">{p.userName}</span>
                        <span className="text-[8px] font-mono text-vibe-muted/50">• {p.week}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {predictions.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <History className="w-12 h-12 mx-auto text-vibe-muted mb-4" />
                <p className="text-xs font-mono uppercase tracking-widest">No visions recorded in this sector.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.map((p) => (
                  <div key={p.id} className={`bg-vibe-card border p-6 relative group ${p.isCorrect ? 'border-vibe-neon shadow-[0_0_20px_rgba(204,255,0,0.1)]' : 'border-vibe-border'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[8px] font-mono text-vibe-muted uppercase tracking-widest">{p.week}</span>
                      {p.isCorrect !== null && (
                        <div className={`px-2 py-0.5 text-[8px] font-black uppercase ${p.isCorrect ? 'bg-vibe-neon text-black' : 'bg-red-500/20 text-red-500'}`}>
                          {p.isCorrect ? 'VALIDATED' : 'VOIDED'}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-mono text-white mb-4 line-clamp-3 italic">"{p.prediction}"</p>
                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-vibe-border/30">
                      <div className="w-6 h-6 bg-vibe-neon/10 rounded-full flex items-center justify-center text-[10px] font-black text-vibe-neon">
                        {p.userName.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black uppercase text-vibe-contrast">{p.userName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'rank' && (
          <motion.div
            key="rank"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl mx-auto space-y-8"
          >
            <div className="text-center space-y-2">
              <Trophy className="w-12 h-12 text-vibe-neon mx-auto animate-bounce" />
              <h3 className="text-2xl font-black italic uppercase italic tracking-tighter text-white">The Oracle High Council</h3>
            </div>
            
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-vibe-border text-vibe-muted font-mono text-xs uppercase"> No validated prophets yet. Be the first.</div>
              ) : (
                leaderboard.map((prophet, i) => (
                  <div key={i} className="flex items-center gap-4 bg-vibe-card border border-vibe-border p-6 group hover:border-vibe-neon hover:translate-x-2 transition-all">
                    <span className="text-2xl font-black italic text-vibe-border group-hover:text-vibe-neon transition-colors">0{i+1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-black uppercase text-white tracking-widest">{prophet.userName}</p>
                      <p className="text-[9px] font-mono text-vibe-muted uppercase">Prophet Resonance Index</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black italic text-vibe-neon">+{prophet.points}</p>
                      <p className="text-[8px] font-mono text-vibe-muted uppercase tracking-[0.2em]">Validated</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
