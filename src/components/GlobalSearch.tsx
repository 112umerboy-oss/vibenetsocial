import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, UserIcon, Loader2, Sparkles, UserPlus, ShieldCheck } from 'lucide-react';

export const GlobalSearch: React.FC<{ onViewProfile: (uid: string) => void }> = ({ onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Fetch a base set of users to search from
        // In a real app, we might use Algolia or specialized indexing
        const q = query(collection(db, 'users'), limit(100));
        const snap = await getDocs(q);
        const fetchedUsers = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
        setUsers(fetchedUsers);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return false;
    const search = searchTerm.toLowerCase();
    const nameMatch = user.displayName?.toLowerCase().includes(search);
    const bioMatch = user.bio?.toLowerCase().includes(search);
    return nameMatch || bioMatch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 border-b border-vibe-border pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-vibe-neon/10 border border-vibe-neon rounded-xl">
            <Search className="w-8 h-8 text-vibe-neon" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-vibe-contrast leading-tight">Grid Discovery</h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-vibe-muted">Scanning network for active signals</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-5 h-5 text-vibe-neon animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 text-vibe-muted group-focus-within:text-vibe-neon transition-colors" />
            )}
          </div>
          <input 
            type="text"
            placeholder="Search by alias or bio frequency..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearching(true)}
            onBlur={() => setIsSearching(false)}
            className="w-full bg-vibe-pure border-2 border-vibe-border px-12 py-5 text-sm font-black uppercase tracking-widest text-vibe-contrast focus:outline-none focus:border-vibe-neon transition-all placeholder:text-vibe-muted/50"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 text-vibe-neon animate-spin" />
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-vibe-muted">Initializing Neural Scan...</p>
        </div>
      ) : searchTerm && filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.uid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onViewProfile(user.uid)}
                className="group bg-vibe-card border border-vibe-border p-6 hover:border-vibe-neon transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-vibe-neon/5 -skew-x-12 translate-x-8 group-hover:translate-x-4 transition-transform" />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-vibe-border bg-vibe-pure group-hover:border-vibe-neon transition-colors shadow-2xl">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-full h-full p-4 text-vibe-muted" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase text-vibe-gray group-hover:text-white transition-colors">
                        {user.displayName}
                      </h4>
                      {user.streak > 5 && <ShieldCheck className="w-3 h-3 text-vibe-neon" title="Verified Frequency" />}
                    </div>
                    <div className="text-[9px] font-mono text-vibe-muted mt-1 uppercase tracking-widest">
                      Pulse: {user.streak}X Streak
                    </div>
                  </div>
                </div>

                {user.bio && (
                  <p className="text-[10px] text-vibe-muted font-mono leading-relaxed italic border-t border-vibe-border/50 pt-4 line-clamp-2">
                    "{user.bio}"
                  </p>
                )}

                <div className="flex justify-between items-center mt-2">
                   <div className="text-[8px] font-black uppercase bg-vibe-pure px-2 py-1 border border-vibe-border text-vibe-muted group-hover:border-vibe-neon group-hover:text-vibe-neon transition-all">
                    Aesthetic Level: {Math.min(100, (user.streak || 0) * 12)}
                  </div>
                  <UserPlus className="w-4 h-4 text-vibe-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : searchTerm ? (
        <div className="py-32 text-center border border-dashed border-vibe-border bg-vibe-pure/20 rounded-2xl">
          <div className="max-w-xs mx-auto space-y-4">
            <div className="w-16 h-16 bg-vibe-muted/10 border border-vibe-border rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-vibe-muted/30" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-vibe-muted leading-tight">
              No entities detected matching <span className="text-vibe-neon">"{searchTerm}"</span>
            </p>
            <p className="text-[9px] font-mono text-vibe-muted italic">
              Try searching by display name or common interest frequency.
            </p>
          </div>
        </div>
      ) : (
        <div className="py-24 text-center">
           <Zap className="w-12 h-12 text-vibe-neon/10 mx-auto mb-4" />
           <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-vibe-muted">Input frequency to begin grid scan</p>
        </div>
      )}
    </div>
  );
};

const Zap = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);
