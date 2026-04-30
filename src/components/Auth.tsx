import React, { useState } from 'react';
import { auth, signIn } from '../lib/firebase';
import { LogOut, Chrome, User, Flame, Ghost, Smartphone, Mail } from 'lucide-react';

export const Auth: React.FC<{ streak?: number }> = ({ streak }) => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => auth.signOut();

  if (auth.currentUser) {
    return (
      <div className="flex items-center gap-4">
        {streak !== undefined && streak > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-vibe-neon/10 rounded-full border border-vibe-neon/20">
            <Flame className="w-3 h-3 text-vibe-neon fill-vibe-neon animate-pulse" />
            <span className="text-xs font-bold text-vibe-neon italic">{streak}</span>
          </div>
        )}
        
        <button 
          onClick={handleSignOut}
          className="relative group p-0.5 rounded-full border border-white/10 hover:border-vibe-neon transition-all"
        >
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            {auth.currentUser.photoURL ? (
              <img src={auth.currentUser.photoURL} className="w-full h-full object-cover" alt="" />
            ) : (
              <User className="w-4 h-4 text-white/40" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-vibe-neon rounded-full border-2 border-vibe-pure" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleSignIn}
        disabled={loading}
        className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-widest hover:bg-vibe-neon transition-all disabled:opacity-50"
      >
        {loading ? '...' : 'Connect'}
      </button>
    </div>
  );
};
