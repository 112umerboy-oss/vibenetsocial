import React, { useState } from 'react';
import { Send, Loader2, Ghost, Zap, X } from 'lucide-react';
import { motion } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

interface QuickDropProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const QuickDrop: React.FC<QuickDropProps> = ({ onClose, onSuccess }) => {
  const [input, setInput] = useState('');
  const [mood, setMood] = useState<'hype' | 'chill' | 'creative' | 'deep' | 'raw'>('hype');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser) return;

    setLoading(true);
    const path = 'posts';
    try {
      await addDoc(collection(db, path), {
        authorId: auth.currentUser.uid,
        authorName: isAnonymous ? 'Phantom' : (auth.currentUser.displayName || 'VibeUser'),
        authorPhoto: isAnonymous ? '' : (auth.currentUser.photoURL || ''),
        mediaUrl: '',
        mediaType: 'image',
        caption: input,
        mood,
        likesCount: 0,
        dislikesCount: 0,
        isAnonymous,
        createdAt: serverTimestamp()
      });

      // Update user stats
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalPosts: increment(1)
      });

      setInput('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-vibe-card p-6 w-full max-w-md border border-vibe-border shadow-2xl relative overflow-hidden group">
      {/* Glitchy border effect */}
      <div className="absolute inset-0 border border-vibe-neon animate-pulse pointer-events-none opacity-20" />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-vibe-neon animate-bounce" />
          <h2 className="text-xl font-black italic uppercase text-vibe-contrast tracking-tighter">Quick Drop</h2>
        </div>
        <button onClick={onClose} className="text-vibe-muted hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <textarea
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What's the vibe?"
          className="w-full bg-black/40 border border-vibe-border p-4 text-sm font-mono focus:outline-none focus:border-vibe-neon min-h-[120px] text-white resize-none"
        />

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Sync Mood</p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'hype', color: 'border-yellow-400' },
              { id: 'chill', color: 'border-blue-500' },
              { id: 'creative', color: 'border-purple-500' },
              { id: 'deep', color: 'border-white' },
              { id: 'raw', color: 'border-red-500' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id as any)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${mood === m.id ? 'bg-vibe-neon text-black border-vibe-neon shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-vibe-border text-vibe-muted hover:border-vibe-neon/50'}`}
              >
                {m.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-4 border-y border-vibe-border/50">
          <button 
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isAnonymous ? 'text-vibe-neon' : 'text-vibe-muted'}`}
          >
            <Ghost className={`w-4 h-4 ${isAnonymous ? 'fill-current' : ''}`} />
            🔒 Go Ghost
          </button>
          <span className="text-[9px] font-mono text-vibe-muted/50 uppercase">
            {isAnonymous ? 'Anonymous' : 'Public Signal'}
          </span>
        </div>

        <button 
          type="submit"
          disabled={loading || !input.trim()}
          className="w-full h-12 bg-vibe-neon text-black font-black uppercase text-xs flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 disabled:grayscale relative group/btn overflow-hidden"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
              <span>Broadcast Vibes</span>
            </>
          )}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/20" />
        </button>
      </form>
    </div>
  );
};
