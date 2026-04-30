import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { chatService } from '../services/chatService';
import { auth } from '../lib/firebase';
import { Conversation } from '../types';
import { MessageSquare, Search, Sparkles, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessagesListProps {
  onSelectConversation: (conv: Conversation) => void;
  activeConversationId?: string;
}

export const MessagesList: React.FC<MessagesListProps> = ({ 
  onSelectConversation,
  activeConversationId 
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = chatService.subscribeToConversations((convs) => {
      setConversations(convs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredConversations = conversations.filter(conv => {
    const participantData = conv.participantData as Record<string, { displayName: string; photoURL?: string }>;
    const otherParticipant = Object.values(participantData || {}).find(p => p.displayName !== auth.currentUser?.displayName);
    return otherParticipant?.displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-vibe-card border-x border-white/5">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif italic font-bold text-white">Encrypted</h2>
          <div className="w-8 h-8 rounded-full bg-vibe-neon/10 flex items-center justify-center">
             <div className="w-2 h-2 rounded-full bg-vibe-neon animate-pulse" />
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-vibe-neon transition-colors" />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search signals..."
            className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-xs font-bold uppercase tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-vibe-neon/50 transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-4 opacity-20">
             <Loader2 className="w-8 h-8 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest">Scanning frequencies...</p>
          </div>
        ) : (
          <>
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-40">
                <MessageSquare className="w-12 h-12 text-white/10" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">No active transmissions.<br/>Start a signal from a profile.</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredConversations.map((conv) => {
                  const myUid = auth.currentUser?.uid;
                  const participantData = conv.participantData as Record<string, { displayName: string; photoURL?: string }>;
                  const otherParticipant = Object.entries(participantData || {}).find(([uid]) => uid !== myUid);
                  const otherUid = otherParticipant?.[0];
                  const otherData = otherParticipant?.[1];
                  const unread = conv.unreadCount?.[myUid || ''] || 0;
                  const isActive = activeConversationId === conv.id;

                  return (
                    <motion.div
                      key={conv.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => onSelectConversation(conv)}
                      className={`group p-4 rounded-[32px] cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-white border-white' 
                          : 'bg-white/5 border-transparent hover:bg-white/[0.08] hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          <div className={`w-14 h-14 rounded-3xl overflow-hidden shadow-2xl border ${isActive ? 'border-black/5' : 'border-white/10 group-hover:border-vibe-neon/50'}`}>
                            {otherData?.photoURL ? (
                              <img src={otherData.photoURL} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-black/20 text-vibe-neon font-bold">
                                {otherData?.displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                          {unread > 0 && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-vibe-neon text-black text-[10px] font-black flex items-center justify-center border-2 border-vibe-card shadow-lg animate-bounce">
                              {unread}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className={`text-sm font-bold truncate ${isActive ? 'text-black' : 'text-white'}`}>
                              {otherData?.displayName || 'Unknown Alpha'}
                            </h4>
                            <span className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? 'text-black/40' : 'text-white/20'}`}>
                              {conv.lastMessageAt?.seconds ? formatDistanceToNow(new Date(conv.lastMessageAt.seconds * 1000), { addSuffix: false }) : 'Now'}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate leading-tight ${isActive ? 'text-black/60' : 'text-white/40'}`}>
                             {conv.lastMessage}
                          </p>
                        </div>

                        <div className={`w-1 h-8 rounded-full ${isActive ? 'bg-black/10' : 'bg-vibe-neon scale-y-0 group-hover:scale-y-100 transition-transform origin-bottom'}`} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
};
