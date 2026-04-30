import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Crown, Medal, User as UserIcon, Loader2, Zap } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'streak' | 'vibeScore'>('streak');

  useEffect(() => {
    const path = 'users';
    const q = query(
      collection(db, path),
      orderBy(sortBy, 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedUsers = snapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];
      setUsers(fetchedUsers);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return unsub;
  }, [sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Calculating Power Levels...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vibe-border pb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-vibe-neon" />
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-vibe-contrast">Grid Leaderboard</h2>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setSortBy('streak')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${sortBy === 'streak' ? 'bg-vibe-neon text-black border-vibe-neon' : 'bg-transparent text-vibe-muted border-vibe-border hover:border-vibe-neon'}`}
          >
            Streak
          </button>
          <button 
            onClick={() => setSortBy('vibeScore')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${sortBy === 'vibeScore' ? 'bg-vibe-neon text-black border-vibe-neon' : 'bg-transparent text-vibe-muted border-vibe-border hover:border-vibe-neon'}`}
          >
            Vibe Score
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <AnimatePresence mode="popLayout">
          {users.map((user, index) => (
            <motion.div
              key={user.uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 border ${index === 0 ? 'border-vibe-neon bg-vibe-neon/5' : 'border-vibe-border bg-vibe-card'} group hover:border-vibe-contrast transition-all`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center font-black italic text-xl">
                  {index === 0 ? <Crown className="w-6 h-6 text-yellow-400" /> : 
                   index === 1 ? <Medal className="w-6 h-6 text-gray-300" /> :
                   index === 2 ? <Medal className="w-6 h-6 text-amber-600" /> :
                   <span className="text-vibe-muted font-mono text-sm">#{index + 1}</span>}
                </div>
                
                <div className="w-10 h-10 border border-vibe-border overflow-hidden bg-vibe-pure flex items-center justify-center rounded-full">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-vibe-muted" />
                  )}
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-vibe-gray group-hover:text-vibe-neon transition-colors">
                    {user.displayName}
                  </div>
                  <div className="flex items-center gap-2">
                    {user.dominantMood && (
                       <span className="text-[7px] font-mono uppercase bg-vibe-neon/10 text-vibe-neon px-1 border border-vibe-neon/20">{user.dominantMood}</span>
                    )}
                    {user.bio && (
                      <div className="text-[9px] font-mono text-vibe-muted truncate max-w-[120px]">
                        {user.bio}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    {sortBy === 'streak' ? (
                      <>
                        <Flame className={`w-4 h-4 ${index === 0 ? 'text-vibe-neon fill-current' : 'text-vibe-muted'}`} />
                        <span className="text-xl font-black italic text-vibe-contrast">{user.streak}x</span>
                      </>
                    ) : (
                      <>
                        <Zap className={`w-4 h-4 ${index === 0 ? 'text-[#ccff00] fill-current' : 'text-vibe-muted'}`} />
                        <span className="text-xl font-black italic text-vibe-contrast">{user.vibeScore || 0}</span>
                      </>
                    )}
                  </div>
                  <div className="text-[8px] font-mono uppercase tracking-widest text-vibe-muted">
                    {sortBy === 'streak' ? 'Day Streak' : 'Vibe Units'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {users.length === 0 && (
          <div className="text-center py-12 border border-dashed border-vibe-border">
            <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">No contenders found. The crown is yours for the taking.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-vibe-pure/40 border border-vibe-border">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-vibe-muted text-center italic">
          Power levels updated in real-time across the Asia-Southeast1 Grid
        </p>
      </div>
    </div>
  );
};
