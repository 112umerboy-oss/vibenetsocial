import React, { useState, useEffect } from 'react';
import { Flame, MessageSquare, Trash2, Loader2, User, Sparkles, Ghost, Share2, Mail, Crown, ZapOff, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, deleteField } from 'firebase/firestore';
import { Post, Comment, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { getCommentReplies } from '../services/vibeNetService';
import { incrementUserCompetitionScore } from '../services/competitionService';

import { chatService } from '../services/chatService';

export const PostCard: React.FC<{ 
  post: Post; 
  onViewProfile?: (uid: string) => void;
  onMessage?: (convId: string, otherUser: { displayName: string, photoURL?: string }) => void;
}> = ({ post, onViewProfile, onMessage }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [friendDoc, setFriendDoc] = useState<any>(null);

  const handleProfileClick = () => {
    if (onViewProfile && !post.isAnonymous) {
      onViewProfile(post.authorId);
    }
  };

  const handleMessageClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || post.isAnonymous || !onMessage || auth.currentUser.uid === post.authorId) return;
    try {
      const convId = await chatService.startConversation({
        uid: post.authorId,
        displayName: post.authorName,
        photoURL: post.authorPhoto || ''
      } as any);
      onMessage(convId, {
        displayName: post.authorName,
        photoURL: post.authorPhoto
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  useEffect(() => {
    if (!auth.currentUser || !post.authorId || post.isAnonymous) return;
    const followRef = doc(db, `users/${auth.currentUser.uid}/following`, post.authorId);
    const unsub = onSnapshot(followRef, (snap) => setIsFollowing(snap.exists()), (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}/following/${post.authorId}`);
    });
    return unsub;
  }, [post.authorId, post.isAnonymous, auth.currentUser?.uid]);

  useEffect(() => {
    if (!auth.currentUser || !post.authorId || post.isAnonymous) return;
    const uids = [auth.currentUser.uid, post.authorId].sort();
    const friendRef = doc(db, 'friends', uids.join('_'));
    const unsub = onSnapshot(friendRef, (snap) => {
      if (snap.exists()) {
        setFriendStatus(snap.data().status);
        setFriendDoc(snap.data());
      } else {
        setFriendStatus('none');
        setFriendDoc(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `friends/${uids.join('_')}`);
    });
    return unsub;
  }, [post.authorId, post.isAnonymous, auth.currentUser?.uid]);

  const handleFollow = async () => {
    if (!auth.currentUser || post.isAnonymous || auth.currentUser.uid === post.authorId) return;
    const uid = auth.currentUser.uid;
    const targetId = post.authorId;
    
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, `users/${uid}/following`, targetId));
        await deleteDoc(doc(db, `users/${targetId}/followers`, uid));
      } else {
        await setDoc(doc(db, `users/${uid}/following`, targetId), {
          followerId: uid,
          followedId: targetId,
          createdAt: serverTimestamp()
        });
        await setDoc(doc(db, `users/${targetId}/followers`, uid), {
          followerId: uid,
          followedId: targetId,
          createdAt: serverTimestamp()
        });
        await createNotification('like', `${auth.currentUser.displayName} is now following your frequency.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/following/${targetId}`);
    }
  };

  const handleFriendAction = async () => {
    if (!auth.currentUser || post.isAnonymous || auth.currentUser.uid === post.authorId) return;
    const uids = [auth.currentUser.uid, post.authorId].sort();
    const friendId = uids.join('_');
    
    try {
      if (friendStatus === 'none') {
        await setDoc(doc(db, 'friends', friendId), {
          uids,
          status: 'pending',
          requesterUid: auth.currentUser.uid,
          targetUid: post.authorId,
          createdAt: serverTimestamp()
        });
        await createNotification('like', `${auth.currentUser.displayName} sent a resonance request.`);
      } else if (friendStatus === 'pending' && friendDoc?.targetUid === auth.currentUser.uid) {
        await updateDoc(doc(db, 'friends', friendId), { status: 'accepted' });
        await createNotification('like', `${auth.currentUser.displayName} accepted your frequency sync.`);
      } else if (friendStatus === 'accepted') {
        await deleteDoc(doc(db, 'friends', friendId));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `friends/${friendId}`);
    }
  };

  useEffect(() => {
    // Check if current user has liked/disliked
    if (!auth.currentUser) return;
    
    const likeRef = doc(db, `posts/${post.id}/likes`, auth.currentUser.uid);
    const dislikeRef = doc(db, `posts/${post.id}/dislikes`, auth.currentUser.uid);
    
    const unsubLike = onSnapshot(likeRef, (doc) => setHasLiked(doc.exists()), (error) => {
      handleFirestoreError(error, OperationType.GET, `posts/${post.id}/likes/${auth.currentUser?.uid}`);
    });
    const unsubDislike = onSnapshot(dislikeRef, (doc) => setHasDisliked(doc.exists()), (error) => {
      handleFirestoreError(error, OperationType.GET, `posts/${post.id}/dislikes/${auth.currentUser?.uid}`);
    });
    
    return () => { unsubLike(); unsubDislike(); };
  }, [post.id, auth.currentUser?.uid]);

  useEffect(() => {
    const q = query(collection(db, `posts/${post.id}/comments`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${post.id}/comments`);
    });
    return unsubscribe;
  }, [post.id]);

  const createNotification = async (type: 'like' | 'comment', message: string) => {
    if (!auth.currentUser || post.authorId === auth.currentUser.uid) return;
    
    const notificationPath = `users/${post.authorId}/notifications`;
    try {
      await addDoc(collection(db, notificationPath), {
        recipientId: post.authorId,
        type,
        message,
        postId: post.id,
        isRead: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const handleLike = async () => {
    if (!auth.currentUser || isLiking) return;
    setIsLiking(true);
    const postRef = doc(db, 'posts', post.id);
    const likeRef = doc(db, `posts/${post.id}/likes`, auth.currentUser.uid);
    const dislikeRef = doc(db, `posts/${post.id}/dislikes`, auth.currentUser.uid);

    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likesCount: Math.max(0, post.likesCount - 1) });
      } else {
        if (hasDisliked) {
          await deleteDoc(dislikeRef);
          await updateDoc(postRef, { dislikesCount: Math.max(0, post.dislikesCount - 1) });
        }
        await setDoc(likeRef, { postId: post.id, userId: auth.currentUser.uid });
        await updateDoc(postRef, { likesCount: post.likesCount + 1 });
        
        // Competition Scoring: Increment post author's weekly/monthly resonance
        if (post.authorId) {
          await incrementUserCompetitionScore(post.authorId, 1);
        }
        
        // Notify author
        const name = post.isAnonymous ? 'Someone' : (auth.currentUser.displayName || 'VibeUser');
        createNotification('like', `${name} resonated with your ${post.isAnonymous ? 'anonymous thought' : 'post'}.`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    if (!auth.currentUser || isLiking) return;
    setIsLiking(true);
    const postRef = doc(db, 'posts', post.id);
    const dislikeRef = doc(db, `posts/${post.id}/dislikes`, auth.currentUser.uid);
    const likeRef = doc(db, `posts/${post.id}/likes`, auth.currentUser.uid);

    try {
      if (hasDisliked) {
        await deleteDoc(dislikeRef);
        await updateDoc(postRef, { dislikesCount: Math.max(0, post.dislikesCount - 1) });
      } else {
        if (hasLiked) {
          await deleteDoc(likeRef);
          await updateDoc(postRef, { likesCount: Math.max(0, post.likesCount - 1) });
        }
        await setDoc(dislikeRef, { postId: post.id, userId: auth.currentUser.uid });
        await updateDoc(postRef, { dislikesCount: post.dislikesCount + 1 });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${post.id}`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;

    const path = `posts/${post.id}/comments`;
    try {
      await addDoc(collection(db, path), {
        postId: post.id,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'VibeUser',
        text: newComment,
        createdAt: serverTimestamp()
      });
      setNewComment('');

      // Notify author
      const name = auth.currentUser.displayName || 'VibeUser';
      createNotification('comment', `${name} left a reflection on your ${post.isAnonymous ? 'Shadow Feed post' : 'grid post'}.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeletePost = async () => {
    if (confirm('Trash this vibe?') && auth.currentUser?.uid === post.authorId) {
      try {
        await deleteDoc(doc(db, 'posts', post.id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `posts/${post.id}`);
      }
    }
  };

  const getMoodColor = () => {
    switch (post.mood) {
      case 'hype': return 'border-l-[#D4AF37]';
      case 'chill': return 'border-l-[#1E3A8A]';
      case 'creative': return 'border-l-[#7E22CE]';
      case 'deep': return 'border-l-[#F3F4F6]';
      case 'raw': return 'border-l-[#991B1B]';
      default: return 'border-l-white/10';
    }
  };

  const getMoodBgColor = () => {
    switch (post.mood) {
      case 'hype': return 'bg-[#D4AF37]/10 text-[#D4AF37]';
      case 'chill': return 'bg-[#1E3A8A]/10 text-[#60A5FA]';
      case 'creative': return 'bg-[#7E22CE]/10 text-[#C084FC]';
      case 'deep': return 'bg-[#F3F4F6]/5 text-white';
      case 'raw': return 'bg-[#991B1B]/10 text-[#F87171]';
      default: return 'bg-vibe-card text-vibe-neon';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-vibe-pure border rounded-[48px] rounded-bl-none overflow-hidden mb-12 shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all ${post.authorIsPro && !post.isAnonymous ? 'border-vibe-neon/40 ring-1 ring-vibe-neon/20' : 'border-white/5'}`}
    >
      {/* Post Header */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/[0.03]">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleProfileClick}
            className={`relative p-0.5 rounded-full border border-white/10 ${!post.isAnonymous ? 'cursor-pointer hover:border-vibe-neon transition-all' : ''}`}
          >
            {post.isAnonymous ? (
              <div className="w-9 h-9 bg-vibe-card flex items-center justify-center rounded-full">
                <Ghost className="w-4 h-4 text-white/50" />
              </div>
            ) : post.authorPhoto ? (
              <img src={post.authorPhoto} className="w-9 h-9 rounded-full object-cover" alt="" />
            ) : (
              <div className="w-9 h-9 bg-vibe-neon/10 flex items-center justify-center rounded-full">
                <User className="w-4 h-4 text-vibe-neon" />
              </div>
            )}
          </div>
          <div className="flex flex-col -space-y-1">
            <span 
              onClick={handleProfileClick}
              className={`text-xs font-bold tracking-tight flex items-center gap-2 ${post.isAnonymous ? 'text-white/40 italic' : 'text-white hover:text-vibe-neon cursor-pointer transition-colors'}`}
            >
              {post.isAnonymous ? 'Shadow Agent' : post.authorName}
              {post.authorIsPro && !post.isAnonymous && <Crown className="w-3 h-3 text-vibe-neon fill-vibe-neon scale-animation" />}
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-white/20">
              {post.mood || 'vibe'} resonance
            </span>
          </div>
        </div>

        {!post.isAnonymous && auth.currentUser && auth.currentUser.uid !== post.authorId && (
          <button 
            onClick={handleFollow}
            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${isFollowing ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-white text-black hover:bg-vibe-neon'}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* Media or Visual Content */}
      <div className="p-3">
        <div className="rounded-[40px] rounded-bl-sm overflow-hidden border border-white/5 bg-vibe-card relative group">
          {post.mediaUrl ? (
            <div className={`aspect-[4/5] w-full ${post.isAnonymous ? 'grayscale hover:grayscale-0 transition-all duration-1000' : ''}`}>
               {post.mediaType === 'video' ? (
                <video src={post.mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              ) : (
                <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
              )}
              
              {/* Interaction Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <div className="flex gap-4">
                  <button 
                    onClick={handleLike} 
                    className={`w-12 h-12 rounded-full vibe-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group/btn ${hasLiked ? 'text-vibe-neon shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] focus:shadow-[0_0_20px_rgba(212,175,55,0.2)]'}`}
                  >
                    <Flame className={`w-5 h-5 transition-transform duration-300 group-hover/btn:rotate-12 ${hasLiked ? 'text-vibe-neon fill-vibe-neon' : ''}`} />
                  </button>
                  <button 
                    onClick={handleDislike} 
                    className={`w-12 h-12 rounded-full vibe-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group/btn ${hasDisliked ? 'text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] focus:shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}
                  >
                    <ZapOff className={`w-5 h-5 transition-transform duration-300 group-hover/btn:-rotate-12 ${hasDisliked ? 'text-red-500 fill-red-500' : ''}`} />
                  </button>
                  <button 
                    onClick={() => setShowComments(!showComments)} 
                    className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  {!post.isAnonymous && auth.currentUser?.uid !== post.authorId && (
                    <button 
                      onClick={handleMessageClick} 
                      className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                  )}
                  <button className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={`aspect-[4/3] p-12 flex flex-col items-center justify-center relative ${getMoodBgColor().split(' ')[0]}`}>
               <h3 className="text-2xl md:text-3xl font-serif text-white tracking-tight leading-[1.1] mb-6 drop-shadow-2xl italic font-bold">
                “{(post as any).caption || (post as any).content}”
              </h3>
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-vibe-neon animate-pulse" />
                 <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/50">Pulse Log</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caption Section */}
      <div className="px-8 py-6 space-y-4">
        {post.mediaUrl && (post as any).caption && (
          <p className="text-xl font-serif text-white/90 leading-tight italic font-medium">
            {(post as any).caption}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-white/30">
             <div className="flex items-center gap-2">
               <Flame className={`w-3 h-3 ${hasLiked ? 'text-vibe-neon' : ''}`} />
               {post.likesCount} Resonance
             </div>
             <div className="flex items-center gap-2">
               <MessageSquare className="w-3 h-3" />
               {comments.length} Reflections
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             {hasLiked && <span className="text-[8px] font-mono text-vibe-neon animate-pulse uppercase">Syncing...</span>}
             {auth.currentUser?.uid === post.authorId && (
               <button onClick={handleDeletePost} className="text-white/20 hover:text-red-500 transition-colors">
                 <Trash2 className="w-4 h-4" />
               </button>
             )}
          </div>
        </div>

        {/* Comments Peek */}
        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pt-6 border-t border-white/5"
            >
              <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar">
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3">
                    <div className="text-[10px] font-bold text-vibe-neon uppercase flex-shrink-0">{c.authorName.split(' ')[0]}</div>
                    <div className="text-[11px] text-white/60 font-sans leading-relaxed">{c.text}</div>
                  </div>
                ))}
              </div>
              
              <form onSubmit={handleAddComment} className="mt-6 flex gap-2">
                <input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share a reflection..."
                  className="flex-1 bg-white/5 rounded-full px-6 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-vibe-neon/50 text-white"
                />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
