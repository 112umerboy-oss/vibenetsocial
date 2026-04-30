import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserIcon, Loader2, Search, MessageSquare, ExternalLink, Zap } from 'lucide-react';

interface FriendItem {
  uid: string;
  profile: UserProfile;
}

export const FriendsList: React.FC<{ onViewProfile: (uid: string) => void }> = ({ onViewProfile }) => {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifying, setNotifying] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    
    setLoading(true);
    // Fetch accepted friends
    const q = query(
      collection(db, 'friends'), 
      where('uids', 'array-contains', uid), 
      where('status', '==', 'accepted')
    );

    const unsub = onSnapshot(q, async (snap) => {
      const friendUids = snap.docs.map(doc => {
        const uids = doc.data().uids as string[];
        return uids.find(id => id !== uid) || '';
      }).filter(id => id !== '');

      if (friendUids.length === 0) {
        setFriends([]);
        setLoading(false);
        return;
      }

      // Fetch profiles for all friends
      const profilePromises = friendUids.map(async (fId) => {
        const userDoc = await getDoc(doc(db, 'users', fId));
        if (userDoc.exists()) {
          return {
            uid: fId,
            profile: { uid: fId, ...userDoc.data() } as UserProfile
          };
        }
        return null;
      });

      const resolvedProfiles = (await Promise.all(profilePromises)).filter(p => p !== null) as FriendItem[];
      setFriends(resolvedProfiles);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'friends');
      setLoading(false);
    });

    return unsub;
  }, []);

  const sendSignal = async (targetUid: string, targetName: string) => {
    if (!auth.currentUser) return;
    setNotifying(targetUid);
    
    try {
      const notificationRef = collection(db, `users/${targetUid}/notifications`);
      await addDoc(notificationRef, {
        type: 'vibe_signal',
        fromId: auth.currentUser.uid,
        fromName: auth.currentUser.displayName || 'Anon Agent',
        message: `${auth.currentUser.displayName || 'Anon Agent'} sent you a synchronization signal.`,
        isRead: false,
        createdAt: serverTimestamp()
      });
      
      setTimeout(() => setNotifying(null), 2000);
    } catch (e) {
      console.error("Failed to send signal", e);
      setNotifying(null);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.profile.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-vibe-border pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-vibe-neon/10 border border-vibe-neon rounded-xl">
            <Users className="w-8 h-8 text-vibe-neon" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-vibe-contrast leading-tight">Synchronized Circle</h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-vibe-muted">Managing your frequency harmonics</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vibe-muted" />
          <input 
            type="text"
            placeholder="Search signals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-vibe-pure/50 border border-vibe-border pl-10 pr-4 py-2 text-[10px] font-mono uppercase tracking-widest text-vibe-contrast focus:outline-none focus:border-vibe-neon transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-vibe-neon animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-vibe-muted">Scanning Grid for Friends...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend, index) => (
                <motion.div
                  key={friend.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-vibe-card border border-vibe-border p-5 hover:border-vibe-neon transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-vibe-border bg-vibe-pure">
                        {friend.profile.photoURL ? (
                          <img src={friend.profile.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-full h-full p-3 text-vibe-muted" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-vibe-neon rounded-full border-2 border-vibe-card" />
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase text-vibe-gray group-hover:text-vibe-neon transition-colors">
                        {friend.profile.displayName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-mono uppercase text-vibe-muted">Resonance {friend.profile.streak}X</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => sendSignal(friend.uid, friend.profile.displayName)}
                      disabled={notifying === friend.uid}
                      className={`p-2 border transition-all ${notifying === friend.uid ? 'bg-vibe-neon border-vibe-neon text-black' : 'border-vibe-border text-vibe-muted hover:text-vibe-neon hover:border-vibe-neon'}`}
                      title="Send Signal"
                    >
                      <Zap className={`w-4 h-4 ${notifying === friend.uid ? 'animate-pulse' : ''}`} />
                    </button>
                    <button 
                      onClick={() => onViewProfile(friend.uid)}
                      className="p-2 border border-vibe-border text-vibe-muted hover:text-vibe-contrast hover:border-vibe-contrast transition-all"
                      title="View Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border border-dashed border-vibe-border bg-vibe-pure/20">
                <Users className="w-16 h-16 text-vibe-muted mx-auto mb-6 opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted">No friends found in this grid sector.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
