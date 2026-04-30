import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment, where, getDoc, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { Post, OperationType } from '../types';
import { Loader2, Zap, Swords, Flame, Trophy, Ghost } from 'lucide-react';
import { PostCard } from './PostCard';

export const VibeBattles: React.FC = () => {
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [battlePosts, setBattlePosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedId, setVotedId] = useState<string | null>(null);

  useEffect(() => {
    const battlesRef = collection(db, 'battles');
    const q = query(battlesRef, where('status', '==', 'active'), limit(1));

    const unsub = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Seed a battle if none exists, using top posts as candidates
        setLoading(true);
        try {
          const postsRef = collection(db, 'posts');
          const topPostsQuery = query(postsRef, orderBy('likesCount', 'desc'), limit(20));
          const topPostsSnap = await getDocs(topPostsQuery);
          
          if (topPostsSnap.docs.length >= 2) {
            // Pick two random posts from top 20 to keep it fresh
            const docs = topPostsSnap.docs;
            const idx1 = Math.floor(Math.random() * docs.length);
            let idx2 = Math.floor(Math.random() * docs.length);
            while (idx1 === idx2) idx2 = Math.floor(Math.random() * docs.length);

            const first = docs[idx1];
            const second = docs[idx2];
            
            await addDoc(collection(db, 'battles'), {
              post1Id: first.id,
              post2Id: second.id,
              votes1: 0,
              votes2: 0,
              voters: [],
              startedAt: serverTimestamp(),
              endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
              status: 'active'
            });
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error seeding battle:", error);
          setLoading(false);
        }
        return;
      }

      const battleDoc = snapshot.docs[0];
      const battleData = { id: battleDoc.id, ...battleDoc.data() } as any;

      // Lazy closing logic
      const now = new Date();
      const endsAt = battleData.endsAt?.toDate ? battleData.endsAt.toDate() : new Date(battleData.endsAt);
      
      if (now > endsAt) {
        const winnerId = battleData.votes1 >= battleData.votes2 ? battleData.post1Id : battleData.post2Id;
        await updateDoc(doc(db, 'battles', battleData.id), {
          status: 'finished',
          winnerId
        });
        return; // Snapshot will trigger again with empty active list
      }

      setActiveBattle(battleData);
      if (auth.currentUser && battleData.voters?.includes(auth.currentUser.uid)) {
        // Check if we already voted (find which post we voted for by checking votes state is not possible easily, so we just disable both)
        // In a real app we'd store {uid, postId} in voters map or subcollection
        setVotedId('already_voted'); 
      } else {
        setVotedId(null);
      }

      try {
        const p1Snap = await getDoc(doc(db, 'posts', battleData.post1Id));
        const p2Snap = await getDoc(doc(db, 'posts', battleData.post2Id));

        if (p1Snap.exists() && p2Snap.exists()) {
          setBattlePosts([
            { id: p1Snap.id, ...p1Snap.data() } as Post,
            { id: p2Snap.id, ...p2Snap.data() } as Post
          ]);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'posts');
      } finally {
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'battles');
      setLoading(false);
    });

    return unsub;
  }, []);

  const handleVote = async (postId: string) => {
    if (votedId || !auth.currentUser || !activeBattle) return;
    setVotedId(postId);

    const path = `battles/${activeBattle.id}`;
    try {
      const battleRef = doc(db, 'battles', activeBattle.id);
      const isPost1 = postId === activeBattle.post1Id;
      
      const arrayUnion = (await import('firebase/firestore')).arrayUnion;
      await updateDoc(battleRef, {
        [isPost1 ? 'votes1' : 'votes2']: increment(1),
        voters: arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      setVotedId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Syncing Battle Grid...</p>
      </div>
    );
  }

  if (!activeBattle || battlePosts.length < 2) {
    return (
      <div className="text-center py-24 border border-dashed border-vibe-border bg-vibe-neon/5">
        <Ghost className="w-12 h-12 text-vibe-neon/20 mx-auto mb-4" />
        <h2 className="text-2xl font-black italic uppercase text-vibe-contrast mb-2">Insufficient Resonance</h2>
        <p className="text-vibe-muted text-xs uppercase font-mono tracking-widest">Waiting for enough signals to prime the battle arena.</p>
      </div>
    );
  }

  const totalVotes = activeBattle.votes1 + activeBattle.votes2;
  const p1Percent = totalVotes > 0 ? (activeBattle.votes1 / totalVotes) * 100 : 50;
  const p2Percent = totalVotes > 0 ? (activeBattle.votes2 / totalVotes) * 100 : 50;

  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-4 px-6 py-2 border border-vibe-neon bg-vibe-neon/10 skew-x-[-12deg]">
          <Swords className="w-6 h-6 text-vibe-neon animate-pulse" />
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-vibe-contrast skew-x-[12deg]">
            Vibe <span className="text-vibe-neon">Battle</span>
          </h2>
          <Zap className="w-6 h-6 text-vibe-neon animate-pulse" />
        </div>
        <p className="text-vibe-muted font-mono text-[10px] uppercase tracking-[0.4em]">Decide the dominant collective frequency</p>
      </div>

      {/* Battle Progress Bar */}
      <div className="relative h-2 bg-vibe-border overflow-hidden flex">
        <motion.div 
          initial={{ width: '50%' }}
          animate={{ width: `${p1Percent}%` }}
          className="h-full bg-vibe-neon shadow-[0_0_20px_rgba(204,255,0,0.5)] z-10"
        />
        <motion.div 
          initial={{ width: '50%' }}
          animate={{ width: `${p2Percent}%` }}
          className="h-full bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]"
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-vibe-pure border border-vibe-contrast px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-vibe-contrast">
          VS
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block group">
           <div className="w-20 h-20 rounded-full bg-vibe-pure border-2 border-vibe-neon flex items-center justify-center text-vibe-neon group-hover:scale-110 transition-transform cursor-pointer">
              <Swords className="w-8 h-8" />
           </div>
        </div>

        {battlePosts.map((post, index) => {
          const isWinner = (index === 0 && p1Percent > p2Percent) || (index === 1 && p2Percent > p1Percent);
          const isLoser = (index === 0 && p1Percent < p2Percent) || (index === 1 && p2Percent < p1Percent);
          
          return (
            <motion.div 
              key={post.id}
              initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative group"
            >
              <div className={`absolute -top-4 ${index === 0 ? 'left-4' : 'right-4'} z-20 flex items-center gap-2`}>
                <div className={`px-4 py-1 font-black italic uppercase tracking-widest text-[10px] shadow-lg ${index === 0 ? 'bg-vibe-neon text-black' : 'bg-red-600 text-white'}`}>
                  SIGNAL #{index + 1}
                </div>
                {isWinner && (
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1 bg-vibe-contrast text-vibe-pure px-2 py-1 text-[8px] font-black uppercase animate-bounce"
                  >
                    <Trophy className="w-3 h-3" /> DOMINANT +50 XP
                  </motion.div>
                )}
                {isLoser && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    className="flex items-center gap-1 bg-vibe-pure text-vibe-muted border border-vibe-border px-2 py-1 text-[8px] font-black uppercase"
                  >
                    <Ghost className="w-3 h-3" /> 💀 FADING
                  </motion.div>
                )}
              </div>

              <div className={`transition-all duration-500 overflow-hidden ${votedId === post.id ? 'ring-4 ring-vibe-neon' : ''} ${isLoser ? 'grayscale opacity-50' : ''}`}>
                <PostCard post={post} />
              </div>

              <button
                onClick={() => handleVote(post.id)}
                disabled={!!votedId}
                className={`w-full mt-4 py-4 font-black uppercase italic tracking-[0.2em] border-2 transition-all flex items-center justify-center gap-3
                  ${votedId === post.id 
                    ? 'bg-vibe-neon text-black border-vibe-neon' 
                    : votedId 
                      ? 'bg-transparent text-vibe-muted border-vibe-border cursor-not-allowed'
                      : 'bg-transparent text-vibe-contrast border-vibe-contrast hover:bg-vibe-contrast hover:text-vibe-pure'}`}
              >
                {votedId === post.id ? (
                  <>RESONANCE SYNCED <Flame className="w-4 h-4" /></>
                ) : (
                  <>CAST SIGNAL VOX <Zap className="w-4 h-4" /></>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="max-w-xl mx-auto p-8 border border-vibe-border bg-vibe-card text-center space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-vibe-neon">Arena Rules</h3>
        <p className="text-[10px] font-mono leading-relaxed text-vibe-muted uppercase tracking-widest">
          Signals are derived from the most resonant transmissions. 
          Binary votes are permanent. New battles initialize when the collective frequency shifts.
        </p>
      </div>
    </div>
  );
};
