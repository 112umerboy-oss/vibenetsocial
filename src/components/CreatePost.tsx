import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Send, Loader2, Sparkles, X, Ghost, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp, getDoc } from 'firebase/firestore';
import { generateCaption } from '../services/vibeNetService';
import { OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

export const CreatePost: React.FC<{ onPostCreated: () => void; defaultAnonymous?: boolean }> = ({ onPostCreated, defaultAnonymous = false }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mood, setMood] = useState<'hype' | 'chill' | 'creative' | 'deep' | 'raw'>('hype');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(defaultAnonymous);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isPro, setIsPro] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchProStatus = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
      if (userDoc.exists()) {
        setIsPro(userDoc.data().isPro || false);
      }
    };
    fetchProStatus();
  }, []);

  // Update isAnonymous if defaultAnonymous changes (e.g. view switch)
  useEffect(() => {
    setIsAnonymous(defaultAnonymous);
  }, [defaultAnonymous]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Limit is 10MB.');
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerateCaption = async () => {
    if (!selectedFile && !input) return;
    setIsGenerating(true);
    try {
      const context = selectedFile ? `Visual Resonance: ${selectedFile.name}` : input;
      const result = await generateCaption(context, 'raw');
      if (result) setInput(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || !auth.currentUser) return;

    if (isScheduled && !scheduledAt) {
      alert('Please select a schedule time.');
      return;
    }

    setIsUploading(true);
    const path = 'posts';
    try {
      let mediaType: 'image' | 'video' | undefined = undefined;
      let mockUrl: string | undefined = undefined;

      if (selectedFile) {
        mediaType = selectedFile.type.startsWith('video') ? 'video' : 'image';
        mockUrl = previewUrl || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800';
      }

      const scheduleDate = isScheduled ? new Date(scheduledAt) : new Date();

      await addDoc(collection(db, path), {
        authorId: auth.currentUser.uid,
        authorName: isAnonymous ? 'Shadow Agent' : (auth.currentUser.displayName || 'VibeUser'),
        authorPhoto: isAnonymous ? '' : (auth.currentUser.photoURL || ''),
        mediaUrl: mockUrl || '',
        mediaType: mediaType || 'image',
        caption: input,
        mood,
        likesCount: 0,
        dislikesCount: 0,
        isAnonymous,
        authorIsPro: isPro,
        isScheduled,
        scheduledAt: Timestamp.fromDate(scheduleDate),
        createdAt: serverTimestamp()
      });

      // Update user metrics
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        totalPosts: increment(1)
      });

      setInput('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsAnonymous(false);
      setIsScheduled(false);
      setScheduledAt('');
      onPostCreated();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-vibe-card border border-white/5 p-8 rounded-[48px] rounded-bl-none shadow-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif italic font-bold text-white">Manifest Signal</h2>
        <div className="flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${isUploading ? 'bg-vibe-neon animate-pulse' : 'bg-white/10'}`} />
           <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">
             {isUploading ? 'Synchronizing...' : 'System Ready'}
           </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mood Selection */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Resonance Mood</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'hype', label: 'Hype', color: 'text-[#D4AF37]' },
              { id: 'chill', label: 'Chill', color: 'text-[#60A5FA]' },
              { id: 'creative', label: 'Creative', color: 'text-[#C084FC]' },
              { id: 'deep', label: 'Deep', color: 'text-white' },
              { id: 'raw', label: 'Raw', color: 'text-[#F87171]' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMood(m.id as any)}
                className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${mood === m.id ? 'bg-white text-black border-white' : 'border-white/5 text-white/30 hover:text-white'}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Media Upload Area */}
        <div 
          className="group relative w-full h-64 rounded-[40px] rounded-bl-sm border-2 border-dashed border-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-vibe-neon/50 transition-all overflow-hidden bg-black/40"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewUrl ? (
            <div className="w-full h-full relative">
              {selectedFile?.type.startsWith('video') ? (
                <video src={previewUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:text-red-500 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-vibe-neon group-hover:text-black transition-all">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-widest">Inject Media</p>
                <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Photo or Video Signal</p>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>

        {/* Caption Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between ml-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Reflection</label>
            <button 
              type="button"
              onClick={handleGenerateCaption}
              disabled={isGenerating}
              className="flex items-center gap-2 text-[10px] font-bold text-vibe-neon uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-30"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              AI Resonance
            </button>
          </div>
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Translate your vibes into words..."
            className="w-full bg-black/40 border border-white/5 p-6 rounded-[32px] rounded-bl-sm text-sm font-sans focus:outline-none focus:ring-1 focus:ring-vibe-neon/30 min-h-[100px] text-white transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Shadow Mode Toggle */}
          <div className="flex items-center justify-between px-6 py-4 rounded-[24px] bg-black/60 border border-white/5">
            <button 
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${isAnonymous ? 'text-vibe-neon' : 'text-white/40 hover:text-white'}`}
            >
              <Ghost className="w-3 h-3" />
              {isAnonymous ? 'Shadow ON' : 'Shadow OFF'}
            </button>
          </div>

          {/* Schedule Toggle */}
          <div className="flex items-center justify-between px-6 py-4 rounded-[24px] bg-black/60 border border-white/5">
            <button 
              type="button"
              onClick={() => setIsScheduled(!isScheduled)}
              className={`flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest transition-all ${isScheduled ? 'text-vibe-neon' : 'text-white/40 hover:text-white'}`}
            >
              <Clock className="w-3 h-3" />
              {isScheduled ? 'Scheduled' : 'Live Drop'}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isScheduled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 rounded-[32px] bg-vibe-neon/5 border border-vibe-neon/20 space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-vibe-neon/60 ml-1">Peak Resonance Time</label>
                <input 
                  type="datetime-local" 
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-black/40 border border-vibe-neon/20 p-4 rounded-2xl text-xs font-mono text-vibe-neon focus:outline-none focus:ring-1 focus:ring-vibe-neon"
                />
                <p className="text-[8px] text-vibe-muted uppercase tracking-widest font-mono">Signal will manifest automatically at this interval.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={isUploading || (!input.trim() && !selectedFile)}
          className="w-full h-16 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-vibe-neon transition-all disabled:opacity-20 shadow-xl overflow-hidden group"
        >
          {isUploading ? (
            <Loader2 className="w-6 h-6 animate-spin text-black" />
          ) : (
            <>
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              {isScheduled ? 'Schedule Signal' : 'Manifest Signal'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};
