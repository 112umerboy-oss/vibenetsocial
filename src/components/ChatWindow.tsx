import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Send, 
  User, 
  ArrowLeft, 
  Sparkles, 
  Loader2,
  Check,
  CheckCheck,
  MoreVertical,
  Phone,
  Video
} from 'lucide-react';
import { chatService } from '../services/chatService';
import { auth } from '../lib/firebase';
import { Message, Conversation, UserProfile } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  conversationId: string;
  onClose: () => void;
  otherUser?: {
    displayName: string;
    photoURL?: string;
  };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  conversationId, 
  onClose, 
  otherUser 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = chatService.subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      chatService.markAsRead(conversationId);
    });
    return () => unsubscribe();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input;
    setInput('');
    await chatService.sendMessage(conversationId, messageText);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-4 right-4 w-[400px] h-[600px] bg-vibe-card border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-[200] max-md:inset-0 max-md:w-full max-md:h-full max-md:rounded-none"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="md:hidden p-2 hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
              {otherUser?.photoURL ? (
                <img src={otherUser.photoURL} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-vibe-neon font-bold">
                  {otherUser?.displayName?.charAt(0)}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-vibe-neon rounded-full border-2 border-vibe-card" />
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">{otherUser?.displayName || 'Loading...'}</h3>
            <span className="text-[10px] uppercase font-black tracking-widest text-vibe-neon">Synchronized</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Video className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors max-md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar"
      >
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-vibe-neon animate-spin" />
          </div>
        ) : (
          <>
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-[24px] bg-white/5 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-vibe-neon/40" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Secure Connection Active</p>
                  <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest">End-to-end resonance established</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const isMine = msg.senderId === auth.currentUser?.uid;
              const nextMsg = messages[i + 1];
              const showTime = !nextMsg || (nextMsg.createdAt?.seconds - msg.createdAt?.seconds > 300);

              return (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`max-w-[80%] px-4 py-3 rounded-[20px] shadow-sm relative group ${
                      isMine 
                        ? 'bg-white text-black rounded-tr-none' 
                        : 'bg-white/5 text-white border border-white/5 rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                    
                    <div className={`absolute bottom-[-18px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isMine ? 'right-0' : 'left-0'}`}>
                       <span className="text-[8px] font-mono text-white/20 uppercase">
                         {msg.createdAt?.seconds ? formatDistanceToNow(new Date(msg.createdAt.seconds * 1000)) + ' ago' : 'Sent'}
                       </span>
                       {isMine && (
                         msg.read ? <CheckCheck className="w-3 h-3 text-vibe-neon" /> : <Check className="w-3 h-3 text-white/20" />
                       )}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-black/40 border-t border-white/5 backdrop-blur-xl">
        <form 
          onSubmit={handleSend}
          className="relative flex items-center gap-3"
        >
          <div className="relative flex-1">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inject pulse..."
              className="w-full h-12 bg-white/5 border border-white/5 rounded-full px-6 text-sm text-white focus:outline-none focus:ring-1 focus:ring-vibe-neon/50 transition-all pr-12"
            />
            <button 
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-vibe-neon transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!input.trim()}
            className="w-12 h-12 rounded-full bg-vibe-neon text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-20 disabled:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
