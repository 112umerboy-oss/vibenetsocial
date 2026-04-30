import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, addDoc, getDocs, limit, orderBy, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { OperationType, RoomMessage } from '../types';
import { Loader2, Hash, Users, MessageCircle, ArrowUpRight, Zap, Ghost, Coffee, Flame, ShieldAlert, Send, X, Smile } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  mood: string;
  description: string;
  activeCount: number;
}

const RoomChat: React.FC<{ room: Room, onClose: () => void }> = ({ room, onClose }) => {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesRef = collection(db, `rooms/${room.id}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

    const unsub = onSnapshot(q, (snapshot) => {
      // Snippet requested desc, but chat UI usually wants asc for display, 
      // so we reverse the result of the desc query
      const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoomMessage));
      setMessages(fetchedMessages.reverse());
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `rooms/${room.id}/messages`);
      setLoading(false);
    });

    // Increment active count when joining
    const roomRef = doc(db, 'rooms', room.id);
    updateDoc(roomRef, { activeCount: increment(1) }).catch(console.error);

    return () => {
      unsub();
      // Decrement active count when leaving
      updateDoc(roomRef, { activeCount: increment(-1) }).catch(console.error);
    };
  }, [room.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !auth.currentUser) return;

    const path = `rooms/${room.id}/messages`;
    try {
      await addDoc(collection(db, path), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'VibeUser',
        authorPhoto: auth.currentUser.photoURL || '',
        text: input,
        createdAt: serverTimestamp()
      });
      setInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-vibe-pure border-l border-vibe-border z-[60] flex flex-col shadow-2xl"
    >
      <div className="p-4 border-b border-vibe-border flex items-center justify-between bg-vibe-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-vibe-neon/10 rounded-lg">
            <Hash className="w-4 h-4 text-vibe-neon" />
          </div>
          <div>
            <h3 className="text-sm font-black italic uppercase tracking-tighter text-white">{room.name.replace('-', ' ')}</h3>
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-vibe-neon uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-vibe-neon rounded-full animate-pulse" />
              Live Presence
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-vibe-muted hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-4 h-4 text-vibe-neon animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 space-y-2 opacity-30">
            <Smile className="w-8 h-8 mx-auto text-vibe-muted" />
            <p className="text-[10px] font-black uppercase tracking-widest text-vibe-muted">Silence in the grid...</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.authorId === auth.currentUser?.uid;
            return (
              <div key={msg.id || idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end group`}>
                {!isMe && (
                   <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 mb-1">
                      {msg.authorPhoto ? (
                        <img src={msg.authorPhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full bg-vibe-neon/20 flex items-center justify-center text-[10px] font-black text-vibe-neon">
                          {msg.authorName.charAt(0)}
                        </div>
                      )}
                   </div>
                )}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && <span className="text-[8px] font-mono uppercase text-vibe-muted mb-1 ml-1">{msg.authorName}</span>}
                  <div className={`max-w-[200px] p-3 text-xs font-mono break-words border relative ${
                    isMe 
                      ? 'bg-vibe-neon text-black border-vibe-neon rounded-tl-xl rounded-tr-sm rounded-bl-xl' 
                      : 'bg-vibe-card text-white border-vibe-border rounded-tr-xl rounded-tl-sm rounded-br-xl'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-vibe-card border-t border-vibe-border">
        <div className="flex gap-2">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit vibe..."
            className="flex-1 bg-vibe-pure border border-vibe-border px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-vibe-neon transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-vibe-neon text-black hover:bg-white transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </motion.div>
  );
}

const DEFAULT_ROOMS = [
  { name: 'hyper-focus', mood: 'focus', description: 'Deep Work only. Minimalist energy for creators in the zone.', icon: <Zap className="w-5 h-5" /> },
  { name: 'the-void', mood: 'shadow', description: 'Where anonymous thoughts go to reside. Silent and vast.', icon: <Ghost className="w-5 h-5" /> },
  { name: 'main-character-energy', mood: 'bold', description: 'Maximum resonance required. For those who own the grid.', icon: <Flame className="w-5 h-5" /> },
  { name: 'chill-stream', mood: 'relax', description: 'Lo-fi vibes. Low stakes. High frequency relaxation.', icon: <Coffee className="w-5 h-5" /> },
  { name: 'panic-room', mood: 'chaos', description: 'High-intensity feedback. Enter at your own risk.', icon: <ShieldAlert className="w-5 h-5" /> }
];

export const VibeRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    const roomsRef = collection(db, 'rooms');
    
    // Seed rooms if none exist (one-time check)
    const seedRooms = async () => {
      try {
        const snapshot = await getDocs(query(roomsRef, limit(1)));
        if (snapshot.empty) {
          for (const roomDef of DEFAULT_ROOMS) {
            // Remove icon (React element) before saving to Firestore
            const { icon, ...roomData } = roomDef;
            // 20% chance a room starts empty
            const isEmptyStart = Math.random() < 0.2;
            await addDoc(roomsRef, { 
              ...roomData, 
              activeCount: isEmptyStart ? 0 : Math.floor(Math.random() * 20) + 5 
            });
          }
        }
      } catch (error) {
        console.error('Room seeding failed:', error);
      }
    };
    seedRooms();

    const unsub = onSnapshot(roomsRef, (snapshot) => {
      setRooms(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
      setLoading(false);
    });

    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Syncing Rooms...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 relative">
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={() => setSelectedRoom(null)}>
            <RoomChat room={selectedRoom} onClose={() => setSelectedRoom(null)} />
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-vibe-contrast">Vibe Rooms</h2>
        <p className="text-vibe-muted font-mono text-xs uppercase tracking-widest">Drop-in spaces organized by collective frequency</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room, index) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="group block p-6 bg-vibe-card border border-vibe-border hover:border-vibe-neon transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-vibe-neon" />
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-vibe-pure border border-vibe-border text-vibe-contrast group-hover:text-vibe-neon group-hover:border-vibe-neon transition-colors">
                 {DEFAULT_ROOMS.find(r => r.name === room.name)?.icon || <Hash className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black italic uppercase tracking-tight text-vibe-contrast group-hover:text-vibe-neon transition-colors">
                    {room.name.replace('-', ' ')}
                  </h3>
                  <span className={`flex items-center gap-1 text-[10px] font-mono ${room.activeCount > 0 ? 'text-vibe-neon' : 'text-blue-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${room.activeCount > 0 ? 'bg-vibe-neon animate-pulse' : 'bg-blue-400 opacity-50'}`} />
                    {room.activeCount > 0 ? `${room.activeCount} IN` : 'BE THE FIRST'}
                  </span>
                </div>
                <p className="text-vibe-muted text-xs font-mono leading-relaxed">
                  {room.description}
                </p>
              </div>
            </div>

            <div 
              onClick={() => setSelectedRoom(room)}
              className="flex gap-2 items-center cursor-pointer"
            >
              <span className="bg-vibe-pure border border-vibe-border px-2 py-1 text-[8px] font-black uppercase tracking-widest text-vibe-muted group-hover:border-vibe-neon/30 transition-colors">
                #{room.mood}
              </span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedRoom(room); }}
                className={`ml-auto px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 border ${
                room.activeCount === 0 
                  ? 'bg-vibe-neon text-black border-vibe-neon hover:bg-white hover:border-white shadow-[0_0_15px_rgba(204,255,0,0.3)]' 
                  : 'text-vibe-muted border-vibe-border hover:text-vibe-contrast hover:border-vibe-contrast'
              }`}>
                {room.activeCount === 0 ? '[ ENTER FIRST ]' : 'Enter Space'} 
                {room.activeCount > 0 && <MessageCircle className="w-3 h-3" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 border border-dashed border-vibe-border bg-vibe-pure/20 text-center space-y-4">
        <Users className="w-8 h-8 text-vibe-muted/40 mx-auto" />
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-vibe-muted max-w-sm mx-auto">
          Experimental: Rooms are ephemeral. Spaces close when resonance falls below threshold.
        </p>
      </div>
    </div>
  );
};
