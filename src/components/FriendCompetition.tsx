import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, UserProfile, UserStat as BaseUserStat } from '../types';
import { getPeriodKey, CompetitionPeriod } from '../services/competitionService';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Flame, Trophy, Crown, Medal, User as UserIcon, Loader2, Calendar, Clock } from 'lucide-react';

interface UserStat extends BaseUserStat {
  displayName?: string;
  photoURL?: string;
}

export const FriendCompetition: React.FC<{ onViewProfile?: (uid: string) => void }> = ({ onViewProfile }) => {
  const [period, setPeriod] = useState<CompetitionPeriod>('week');
  const [stats, setStats] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendUids, setFriendUids] = useState<string[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    // Fetch friends first
    const q = query(collection(db, 'friends'), where('uids', 'array-contains', uid), where('status', '==', 'accepted'));
    const unsubFriends = onSnapshot(q, (snap) => {
      const ids = new Set<string>();
      ids.add(uid); // Include self
      snap.docs.forEach(doc => {
        const uids = doc.data().uids as string[];
        uids.forEach(id => ids.add(id));
      });
      setFriendUids(Array.from(ids));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friends');
    });

    return unsubFriends;
  }, []);

  useEffect(() => {
    if (friendUids.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentPeriod = getPeriodKey(period);
    
    // Query stats for friends
    // Note: Firestore 'in' limit is 30. If more friends, we might need multiple queries.
    // For this prototype, we'll limit to top 30 friends resonance.
    const limitedFriendUids = friendUids.slice(0, 30);
    
    const q = query(
      collection(db, 'periodicStats'),
      where('userId', 'in', limitedFriendUids),
      where('period', '==', currentPeriod),
      where('type', '==', period),
      orderBy('resonance', 'desc')
    );

    const unsubStats = onSnapshot(q, async (snap) => {
      const fetchedStats = snap.docs.map(doc => doc.data() as UserStat);
      
      // We need display names and photos for these users
      const statsWithProfiles = await Promise.all(fetchedStats.map(async (s) => {
        const userDoc = await getDoc(doc(db, 'users', s.userId));
        if (userDoc.exists()) {
          return {
            ...s,
            displayName: userDoc.data().displayName,
            photoURL: userDoc.data().photoURL
          };
        }
        return s;
      }));

      setStats(statsWithProfiles);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'periodicStats');
      setLoading(false);
    });

    return unsubStats;
  }, [friendUids, period]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 1: return <Medal className="w-5 h-5 text-gray-300" />;
      case 2: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-[10px] font-mono text-vibe-muted">#{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vibe-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-vibe-neon/10 border border-vibe-neon rounded-lg">
            <Users className="w-6 h-6 text-vibe-neon" />
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-vibe-contrast">Circle Resonance</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Competing in your frequencies</p>
          </div>
        </div>

        <div className="flex bg-vibe-pure border border-vibe-border p-1">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${period === 'week' ? 'bg-vibe-neon text-black' : 'text-vibe-muted hover:text-vibe-neon'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${period === 'month' ? 'bg-vibe-neon text-black' : 'text-vibe-muted hover:text-vibe-neon'}`}
          >
            Monthly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Syncing Friend Frequencies...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <AnimatePresence mode="popLayout">
            {stats.length > 0 ? (
              stats.map((stat, index) => (
                <motion.div
                  key={stat.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-4 border ${stat.userId === auth.currentUser?.uid ? 'border-vibe-neon bg-vibe-neon/5' : 'border-vibe-border bg-vibe-card'} group hover:border-vibe-contrast transition-all cursor-pointer`}
                  onClick={() => onViewProfile?.(stat.userId)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index)}
                    </div>
                    
                    <div className="w-10 h-10 border border-vibe-border overflow-hidden bg-vibe-pure flex items-center justify-center rounded-full">
                      {stat.photoURL ? (
                        <img src={stat.photoURL} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-vibe-muted" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-vibe-gray group-hover:text-vibe-neon transition-colors">
                          {stat.displayName || 'VibeUser'}
                        </span>
                        {stat.userId === auth.currentUser?.uid && (
                          <span className="text-[8px] font-black bg-vibe-neon text-black px-1">YOU</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-vibe-neon fill-current" />
                      <span className="text-xl font-black italic text-vibe-contrast">{stat.resonance}</span>
                    </div>
                    <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-vibe-muted italic">
                      Fires this {period}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-24 border border-dashed border-vibe-border bg-vibe-pure/20">
                <div className="max-w-[280px] mx-auto space-y-4">
                  <Users className="w-12 h-12 text-vibe-muted mx-auto opacity-20" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted leading-relaxed">
                    No resonance detected. Invite friends to start the competition.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-4 bg-vibe-pure border border-vibe-border">
          <div className="flex items-center gap-2 mb-2 text-vibe-neon">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Auto Reset</span>
          </div>
          <p className="text-[9px] font-mono text-vibe-muted leading-relaxed uppercase">
            Weekly stats reset every Sunday at 00:00 UTC. Monthly stats reset on the 1st.
          </p>
        </div>
        <div className="p-4 bg-vibe-pure border border-vibe-border">
          <div className="flex items-center gap-2 mb-2 text-vibe-neon">
            <Calendar className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">Current Key</span>
          </div>
          <p className="text-[9px] font-mono text-vibe-muted leading-relaxed uppercase">
            Active Block: {getPeriodKey(period)}
          </p>
        </div>
      </div>
    </div>
  );
};
