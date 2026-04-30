import React, { useState, useEffect, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion 
} from 'firebase/firestore';
import { Story } from '../types';
import { Plus, Camera, Loader2, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

export const Stories: React.FC<{ onViewProfile?: (uid: string) => void }> = ({ onViewProfile }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video'; file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const now = new Date();
    const q = query(
      collection(db, 'stories'), 
      where('expiresAt', '>', Timestamp.fromDate(now)),
      orderBy('expiresAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const fetchedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Story));

      // Group stories by user (one bubble per user, showing most recent)
      const uniqueUsers: Record<string, Story> = {};
      fetchedStories.forEach(s => {
        if (!uniqueUsers[s.authorId] || (s.createdAt?.seconds > uniqueUsers[s.authorId].createdAt?.seconds)) {
          uniqueUsers[s.authorId] = s;
        }
      });

      setStories(Object.values(uniqueUsers));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stories');
    });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Signal too dense. Limit 10MB.');
      return;
    }

    const type = file.type.startsWith('video') ? 'video' : 'image';
    const url = URL.createObjectURL(file);
    setPreviewMedia({ url, type, file });
  };

  const handleBroadcast = async () => {
    if (!previewMedia || !auth.currentUser) return;

    setIsUploading(true);
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      await addDoc(collection(db, 'stories'), {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'VNet User',
        authorPhoto: auth.currentUser.photoURL || '',
        mediaUrl: previewMedia.url, // In prod, upload to Storage
        mediaType: previewMedia.type,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        viewedBy: []
      });
      
      setPreviewMedia(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'stories');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const markAsViewed = async (storyId: string) => {
    if (!auth.currentUser) return;
    try {
      const story = stories.find(s => s.id === storyId);
      if (story?.viewedBy?.includes(auth.currentUser.uid)) return;

      const storyRef = doc(db, 'stories', storyId);
      await updateDoc(storyRef, {
        viewedBy: arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      console.error('Failed to mark as viewed:', error);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x no-scrollbar min-h-[100px]">
        {/* Broadcast Trigger */}
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 flex-shrink-0 snap-start cursor-pointer group"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-[24px] border-2 border-white/10 p-0.5 flex items-center justify-center overflow-hidden transition-all group-hover:border-vibe-neon shadow-2xl bg-black/40">
              {auth.currentUser?.photoURL ? (
                <img src={auth.currentUser.photoURL} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Plus className="w-6 h-6 text-white group-hover:text-vibe-neon transition-colors" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="hidden"
            />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Broadcast</span>
        </div>

        <AnimatePresence>
          {stories.map((story, i) => {
            const isViewed = story.viewedBy?.includes(auth.currentUser?.uid || '');
            return (
              <motion.div 
                key={story.id} 
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setSelectedStoryIndex(i);
                  markAsViewed(story.id);
                }}
                className="flex flex-col items-center gap-2 flex-shrink-0 snap-start cursor-pointer group"
              >
                <div className="relative">
                  <div className={`w-16 h-16 rounded-[24px] p-[2px] flex items-center justify-center overflow-hidden transition-all shadow-xl ${!isViewed ? 'bg-gradient-to-tr from-vibe-neon via-vibe-neon/50 to-white/20' : 'bg-white/5 opacity-60'}`}>
                    <div className="w-full h-full rounded-[22px] overflow-hidden bg-vibe-card border border-black group-hover:border-vibe-neon/30 transition-colors">
                      {story.authorPhoto ? (
                        <img src={story.authorPhoto} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-black text-vibe-neon bg-black/40">
                          {story.authorName.charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!isViewed && (
                    <div className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vibe-neon opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-vibe-neon"></span>
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-[64px] uppercase tracking-wider ${isViewed ? 'text-white/20' : 'text-white/60'}`}>
                  {story.authorName.split(' ')[0]}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {loading && stories.length === 0 && (
          <div className="flex gap-4">
            {[1,2,3].map(n => (
              <div key={n} className="flex flex-col items-center gap-2 opacity-20">
                <div className="w-16 h-16 rounded-[24px] bg-white/10 animate-pulse" />
                <div className="h-2 w-10 bg-white/10 animate-pulse rounded" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black flex flex-col items-center justify-center p-6"
          >
            <div className="relative w-full max-w-[400px] aspect-[9/16] bg-black/40 rounded-[40px] overflow-hidden border border-white/10 flex items-center justify-center">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} autoPlay loop muted className="w-full h-full object-cover" />
              ) : (
                <img src={previewMedia.url} className="w-full h-full object-cover" alt="" />
              )}
              
              <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 overflow-hidden">
                     <img src={auth.currentUser?.photoURL || ''} alt="" className="w-full h-full object-cover" />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest text-white italic">Broadcast Pulse</span>
                </div>
                <button onClick={() => setPreviewMedia(null)} className="w-10 h-10 rounded-full vibe-glass flex items-center justify-center">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="absolute bottom-12 inset-x-8 flex flex-col gap-4">
                <button 
                  onClick={handleBroadcast}
                  disabled={isUploading}
                  className="w-full h-14 rounded-full bg-vibe-neon text-black text-xs font-black uppercase tracking-[0.3em] flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Signal Transmit'}
                </button>
                <p className="text-[8px] text-center font-black uppercase tracking-[0.2em] text-white/40">Expires in 24 hours</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Overlay */}
      <AnimatePresence>
        {selectedStoryIndex !== null && (
          <StoryOverlay 
            stories={stories} 
            initialIndex={selectedStoryIndex} 
            onClose={() => setSelectedStoryIndex(null)}
            onViewProfile={onViewProfile}
            onMarkViewed={markAsViewed}
          />
        )}
      </AnimatePresence>
    </>
  );
};

interface StoryOverlayProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onViewProfile?: (uid: string) => void;
  onMarkViewed: (id: string) => void;
}

const StoryOverlay: React.FC<StoryOverlayProps> = ({ stories, initialIndex, onClose, onViewProfile, onMarkViewed }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(true);
  const story = stories[currentIndex];
  const duration = story.mediaType === 'video' ? 10 : 5; // seconds

  useEffect(() => {
    setProgress(0);
    onMarkViewed(story.id);

    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return p + (100 / (duration * 60)); // 60fps approx
      });
    }, 16.6);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl flex items-center justify-center"
    >
      <div className="relative w-full max-w-[450px] aspect-[9/16] md:max-h-[90vh] bg-black shadow-2xl md:rounded-[40px] overflow-hidden flex flex-col">
        {/* Progress Bars */}
        <div className="absolute top-4 inset-x-4 flex gap-1 z-20">
          {stories.map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-vibe-neon transition-all duration-100 ease-linear"
                style={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 inset-x-4 flex items-center justify-between z-20 px-2">
          <div className="flex items-center gap-3">
             <div 
               onClick={() => onViewProfile?.(story.authorId)}
               className="w-10 h-10 rounded-2xl border border-white/10 bg-black/40 overflow-hidden cursor-pointer"
             >
                <img src={story.authorPhoto} className="w-full h-full object-cover" alt="" />
             </div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-white leading-none">{story.authorName}</span>
               <span className="text-[10px] text-white/40 font-medium">
                 {story.createdAt?.seconds ? formatDistanceToNow(new Date(story.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
               </span>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(!muted)} className="p-2 text-white/60 hover:text-white">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Media Container */}
        <div className="flex-1 bg-black flex items-center justify-center relative cursor-pointer group">
          {/* Navigation Overlay */}
          <div className="absolute inset-y-0 left-0 w-1/4 z-30" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-1/4 z-30" onClick={handleNext} />
          
          {story.mediaType === 'video' ? (
            <video 
              src={story.mediaUrl} 
              autoPlay 
              muted={muted} 
              className="w-full h-full object-cover"
            />
          ) : (
            <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
          )}

          {/* Viewer Count */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full vibe-glass border border-white/10">
            <Eye className="w-3 h-3 text-vibe-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              {story.viewedBy?.length || 0} Synced
            </span>
          </div>

          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-8 h-8 text-white/40" />
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-8 h-8 text-white/40" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};



