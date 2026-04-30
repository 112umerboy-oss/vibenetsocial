import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { Post, OperationType } from '../types';
import { PostCard } from './PostCard';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { Loader2, Ghost, Plus } from 'lucide-react';

import { Stories } from './Stories';

export const Feed: React.FC<{ 
  filter?: 'anonymous' | 'public', 
  onViewProfile?: (uid: string) => void;
  onMessage?: (convId: string, otherUser: { displayName: string, photoURL?: string }) => void;
}> = ({ filter, onViewProfile, onMessage }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const MOOD_OPTIONS = [
    { id: 'hype', label: 'HYPE', color: 'text-vibe-neon', bg: 'bg-vibe-neon/10' },
    { id: 'chill', label: 'CHILL', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { id: 'creative', label: 'CREATIVE', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { id: 'deep', label: 'DEEP', color: 'text-pink-400', bg: 'bg-pink-400/10' },
    { id: 'raw', label: 'RAW', color: 'text-red-400', bg: 'bg-red-400/10' }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SYSTEM_INJECTIONS = [
    {
      authorName: 'kai.wav',
      caption: "built something at 3am that actually works",
      mood: 'hype',
      likesCount: 12,
      dislikesCount: 2,
    },
    {
      authorName: 'luna.pixel',
      caption: "the neural link is feeling especially snappy today. resonance is peaking.",
      mood: 'creative',
      likesCount: 45,
      dislikesCount: 1,
    },
    {
      authorName: 'ghost_logic',
      caption: "grid silence is underrated. sometimes you just need to disconnect to reconnect.",
      mood: 'chill',
      likesCount: 89,
      dislikesCount: 0,
    },
    {
      authorName: 'void_walker',
      caption: "found a fragment of the old web in the deep buffers. strange vibes.",
      mood: 'deep',
      likesCount: 34,
      dislikesCount: 5,
    },
    {
      authorName: 'protocol_zero',
      caption: "optimizing my aesthetic DNA for maximum frequency.hype is a mindset.",
      mood: 'hype',
      likesCount: 128,
      dislikesCount: 3,
    },
    {
      authorName: 'synth_poet',
      caption: "raw data is the new poetry. unfiltered. crystalline. beautiful.",
      mood: 'raw',
      likesCount: 56,
      dislikesCount: 12,
    }
  ];

  useEffect(() => {
    let q;
    const postsRef = collection(db, 'posts');
    const now = new Date();
    // Use scheduledAt as the primary index for time-based manifestation
    const constraints: any[] = [
      where('scheduledAt', '<=', now),
      orderBy('scheduledAt', 'desc'), 
      limit(50)
    ];

    if (filter === 'anonymous') {
      constraints.splice(1, 0, where('isAnonymous', '==', true));
    } else if (filter === 'public') {
      constraints.splice(1, 0, where('isAnonymous', '==', false));
    }

    if (selectedMood) {
      constraints.splice(1, 0, where('mood', '==', selectedMood));
    }

    q = query(postsRef, ...constraints);

    setLoading(true);
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Seed if fewer than 5 posts and not filtering
      if (snapshot.size < 5 && !filter && !selectedMood && auth.currentUser) {
        const { addDoc, serverTimestamp } = await import('firebase/firestore');
        const postsRef = collection(db, 'posts');
        
        try {
          for (const seed of SYSTEM_INJECTIONS) {
            try {
              await addDoc(postsRef, {
                ...seed,
                authorId: 'system_seed',
                authorPhoto: '',
                isAnonymous: false,
                mediaUrl: '',
                mediaType: 'image',
                scheduledAt: serverTimestamp(),
                createdAt: serverTimestamp()
              });
            } catch (err) {
              console.error(`Failed to add seed post ${seed.authorName}:`, err);
            }
          }
        } catch (error) {
          console.error("Critical seeding error:", error);
        }
      } 
      
      const realPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setPosts(realPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });
    return unsubscribe;
  }, [filter, selectedMood]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-pulse">
        <Loader2 className="w-12 h-12 text-vibe-neon animate-spin mb-4" />
        <p className="text-[10px] uppercase font-black tracking-widest text-vibe-muted">Syncing the Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Stories Area */}
      <section className="pt-2">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 mb-6 px-1">Active Resonance</h2>
        <Stories onViewProfile={onViewProfile} />
      </section>

      {/* Mood Filter Bar */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedMood(null)}
          className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-wider transition-all border ${
            !selectedMood 
              ? 'bg-vibe-neon text-black border-vibe-neon shadow-[0_10px_20px_rgba(204,255,0,0.2)]' 
              : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'
          }`}
        >
          ALL
        </button>
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
            className={`px-6 py-2 rounded-full text-[10px] font-bold tracking-wider transition-all border flex items-center gap-2 ${
              selectedMood === mood.id
                ? `${mood.bg} ${mood.color} border-current shadow-[0_10px_20px_rgba(0,0,0,0.2)]`
                : 'border-white/10 text-white/40 hover:border-white/20'
            }`}
          >
            {mood.label}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-vibe-border bg-vibe-neon/5 relative group h-full">
          <Ghost className="w-10 h-10 text-vibe-neon/40 mx-auto mb-6 group-hover:scale-125 transition-transform" />
          <p className="text-vibe-muted uppercase font-black tracking-[0.3em] text-sm mb-2">No signals detected in the grid.</p>
          <p className="text-[10px] text-vibe-muted/50 mb-8 italic">The phantom space is yours to define.</p>
          
          <button 
            onClick={scrollToTop}
            className="inline-flex items-center gap-3 px-8 py-4 bg-vibe-neon text-black font-black uppercase text-xs hover:bg-vibe-contrast hover:text-vibe-pure transition-all transform hover:-translate-y-1"
          >
            <Plus className="w-4 h-4" />
            Drop a Vibe
          </button>
        </div>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} onViewProfile={onViewProfile} onMessage={onMessage} />)
      )}
    </div>
  );
};
