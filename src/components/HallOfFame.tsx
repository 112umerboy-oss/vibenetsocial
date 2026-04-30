import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { Post, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { PostCard } from './PostCard';
import { Trophy, Flame, Zap, Calendar, TrendingUp, Loader2, Star, Ghost } from 'lucide-react';

export const HallOfFame: React.FC<{ onViewProfile?: (uid: string) => void }> = ({ onViewProfile }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'all'>('week');

  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, 'posts');
    
    let q;
    if (timeRange === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      q = query(
        postsRef,
        where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo)),
        orderBy('createdAt', 'desc'), // Firestore combined index required for range + order, but we can filter client side or use a simpler query first
        limit(50)
      );
    } else {
      q = query(
        postsRef,
        orderBy('likesCount', 'desc'),
        limit(20)
      );
    }

    const unsub = onSnapshot(q, (snapshot) => {
      let filteredPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      
      // If empty, inject system high-points
      if (filteredPosts.length === 0) {
        filteredPosts = [
          {
            id: 'hall-sys-1',
            content: "ORIGIN SIGNAL: The first successful resonance detected in the pre-alpha grid.",
            authorId: 'system',
            likesCount: 1337,
            isAnonymous: false,
            createdAt: { toDate: () => new Date() } as any,
            type: 'text'
          },
          {
             id: 'hall-sys-2',
             content: "SHADOW PEAK: A collective moment of silence that reached maximum frequency.",
             authorId: 'system',
             likesCount: 888,
             isAnonymous: true,
             createdAt: { toDate: () => new Date() } as any,
             type: 'text'
          }
        ] as any;
      }

      // If week range, we sort by likesCount client side
      if (timeRange === 'week' && snapshot.docs.length > 0) {
        filteredPosts.sort((a, b) => b.likesCount - a.likesCount);
      }
      
      setPosts(filteredPosts.slice(0, 10));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });

    return unsub;
  }, [timeRange]);

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-gradient-to-br from-yellow-500/10 via-vibe-neon/5 to-transparent border border-vibe-neon/20 p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Star className="w-32 h-32 text-yellow-400 rotate-12" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-vibe-neon via-yellow-400 to-vibe-neon animate-pulse" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-vibe-pure border border-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Trophy className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-vibe-contrast">Hall of <span className="text-yellow-400">Fame</span></h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-vibe-muted font-mono text-[10px] uppercase tracking-widest">The collective peak of the VibeNet grid</p>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-vibe-pure border border-vibe-border">
                  <Calendar className="w-3 h-3 text-vibe-neon" />
                  <span className="text-[8px] font-black uppercase text-vibe-neon animate-pulse">Resets in 3d 14h</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex bg-vibe-pure border border-vibe-border p-1">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === 'week' ? 'bg-vibe-neon text-black' : 'text-vibe-muted hover:text-vibe-contrast'}`}
            >
              This Week
            </button>
            <button 
              onClick={() => setTimeRange('all')}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${timeRange === 'all' ? 'bg-vibe-neon text-black' : 'text-vibe-muted hover:text-vibe-contrast'}`}
            >
              All Time
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Calculating Resonance...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-vibe-neon flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" />
              Top Resonance
            </h3>
            {posts.slice(0, 5).map((post, index) => {
              const isFirst = index === 0;
              return (
                <div key={post.id} className="relative pt-8 pl-4">
                  <div className="absolute left-0 top-0 z-0 select-none pointer-events-none">
                    <span className={`text-[120px] font-black italic leading-none tracking-tighter ${isFirst ? 'text-yellow-400/10' : 'text-vibe-neon/5'}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className={`absolute left-4 top-12 z-20 font-black italic text-[10px] px-3 py-1 transform -rotate-12 shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase tracking-widest whitespace-nowrap ${isFirst ? 'bg-yellow-400 text-black' : 'bg-vibe-neon text-black'}`}>
                    {isFirst ? '🏆 GRID CHAMPION' : `Resonance Rank #${index + 1}`}
                  </div>
                  <div className={`relative z-10 bg-vibe-card border p-1 group transition-all duration-500 ${isFirst ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)]' : 'border-vibe-neon/20 hover:border-vibe-neon'}`}>
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${isFirst ? 'bg-yellow-400/5' : 'bg-vibe-neon/5'}`} />
                    <PostCard post={post} onViewProfile={onViewProfile} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-6">
             <h3 className="text-xs font-black uppercase tracking-[0.3em] text-vibe-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rising Inscriptions
            </h3>
            {posts.slice(5, 10).map((post, index) => (
              <div key={post.id} className="relative pt-4 pl-4">
                <div className="absolute left-0 top-0 z-0 select-none pointer-events-none">
                  <span className="text-6xl font-black italic text-vibe-muted/10 leading-none">
                    {index + 6}
                  </span>
                </div>
                <div className="absolute left-4 top-8 z-20 bg-vibe-card border border-vibe-border text-vibe-contrast font-black italic text-[8px] px-2 py-0.5 transform -rotate-12 uppercase tracking-widest">
                  #{index + 6} Rising
                </div>
                <div className="relative z-10 p-1 grayscale hover:grayscale-0 transition-all duration-300">
                  <PostCard post={post} onViewProfile={onViewProfile} />
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-24 border border-dashed border-vibe-border opacity-40">
                <Ghost className="w-8 h-8 text-vibe-muted mx-auto mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-widest">No data signals detected in this range.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
