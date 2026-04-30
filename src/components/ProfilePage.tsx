import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, onSnapshot, doc, getCountFromServer, updateDoc, serverTimestamp, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Post, UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { PostCard } from './PostCard';
import { 
  User, 
  Flame, 
  Trophy, 
  Grid, 
  Settings, 
  Calendar, 
  TrendingUp, 
  Loader2,
  Ghost,
  Camera,
  X,
  Save,
  PenLine,
  ShieldCheck,
  Mail,
  Smartphone,
  AlertTriangle,
  RefreshCw,
  Zap,
  Share2,
  Sparkles,
  Crown,
  Shield,
  Lock,
  BarChart3
} from 'lucide-react';
import { sendEmailVerification } from 'firebase/auth';

import { chatService } from '../services/chatService';
import { VibeFlexCard } from './VibeFlexCard';
import { wrappedService } from '../services/wrappedService';
import { ProUpgradeModal } from './ProUpgradeModal';
import { VibeWrapped as VibeWrappedType } from '../types';

export const ProfilePage: React.FC<{ 
  userId?: string;
  onMessage?: (convId: string, otherUser: { displayName: string, photoURL?: string }) => void;
  onViewWrapped?: (data: VibeWrappedType) => void;
}> = ({ userId, onMessage, onViewWrapped }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<UserProfile & { totalResonance?: number } | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'stats'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    photoURL: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [showFlexCard, setShowFlexCard] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [latestWrapped, setLatestWrapped] = useState<VibeWrappedType | null>(null);
  const profileFileInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Signal too dense. Limit is 5MB.');
        return;
      }
      const url = URL.createObjectURL(file);
      setEditForm({ ...editForm, photoURL: url });
    }
  };

  // Social Stats
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [isProcessingSocial, setIsProcessingSocial] = useState(false);

  const effectiveUid = userId || auth.currentUser?.uid;
  const isOwnProfile = effectiveUid === auth.currentUser?.uid;

  const totalLikes = posts.reduce((sum, post) => sum + (post.likesCount || 0), 0);
  const vibeScore = (totalLikes * 3) + (posts.length * 10) + ((profile?.streak || 0) * 25);

  useEffect(() => {
    if (isOwnProfile && profile && profile.vibeScore !== vibeScore && vibeScore > 0) {
      const userRef = doc(db, 'users', auth.currentUser!.uid);
      updateDoc(userRef, { 
        vibeScore,
        totalPosts: posts.length 
      }).catch(console.error);
    }
  }, [vibeScore, isOwnProfile, profile, posts.length]);

  useEffect(() => {
    if (!effectiveUid) return;

    setLoading(true);
    const userDocRef = doc(db, 'users', effectiveUid);
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', effectiveUid),
      orderBy('createdAt', 'desc')
    );

    // Fetch user profile
    const unsubProfile = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.data() as UserProfile & { totalResonance?: number };
        setProfile(userData);
        setEditForm({
          displayName: userData.displayName,
          bio: userData.bio || '',
          photoURL: userData.photoURL || ''
        });
        
        // Calculate Rank based on totalResonance or streak
        const rankQuery = query(
          collection(db, 'users'),
          where('totalResonance', '>', userData.totalResonance || 0)
        );
        getCountFromServer(rankQuery).then(rankSnapshot => {
          setRank(rankSnapshot.data().count + 1);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${effectiveUid}`);
      setLoading(false);
    });

    // Social Stats Fetching
    const followersQuery = query(collection(db, `users/${effectiveUid}/followers`));
    const followingQuery = query(collection(db, `users/${effectiveUid}/following`));

    const unsubFollowers = onSnapshot(followersQuery, (snap) => setFollowersCount(snap.size));
    const unsubFollowing = onSnapshot(followingQuery, (snap) => setFollowingCount(snap.size));

    // Check relationship if not own profile
    let unsubIsFollowing = () => {};
    let unsubFriendStatus = () => {};

    if (!isOwnProfile && auth.currentUser) {
      const followRef = doc(db, `users/${auth.currentUser.uid}/following`, effectiveUid);
      unsubIsFollowing = onSnapshot(followRef, (snap) => setIsFollowing(snap.exists()));

      const friendId1 = `${auth.currentUser.uid}_${effectiveUid}`;
      const friendId2 = `${effectiveUid}_${auth.currentUser.uid}`;
      // In a real app we'd query by uids array, but for simplicity of rules/IDs:
      const friendQuery = query(
        collection(db, 'friends'),
        where('uids', 'array-contains', auth.currentUser.uid)
      );
      unsubFriendStatus = onSnapshot(friendQuery, (snap) => {
        const doc = snap.docs.find(d => (d.data().uids as string[]).includes(effectiveUid));
        if (doc) {
          setFriendStatus(doc.data().status as any);
        } else {
          setFriendStatus('none');
        }
      });
    }

    // Fetch user posts
    const unsubPosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'posts');
      setLoading(false);
    });

    return () => {
      unsubProfile();
      unsubPosts();
      unsubFollowers();
      unsubFollowing();
      unsubIsFollowing();
      unsubFriendStatus();
    };
  }, [effectiveUid, isOwnProfile]);

  useEffect(() => {
    if (isOwnProfile && effectiveUid) {
      wrappedService.getLatestWrapped(effectiveUid).then(setLatestWrapped);
    }
  }, [effectiveUid, isOwnProfile]);

  const handleFollow = async () => {
    if (!auth.currentUser || !effectiveUid) return;
    setIsProcessingSocial(true);
    try {
      const myFollowingRef = doc(db, `users/${auth.currentUser.uid}/following`, effectiveUid);
      const theirFollowersRef = doc(db, `users/${effectiveUid}/followers`, auth.currentUser.uid);
      
      if (isFollowing) {
        // Unfollow
        await Promise.all([
          deleteDoc(myFollowingRef),
          deleteDoc(theirFollowersRef)
        ]);
      } else {
        // Follow
        await Promise.all([
          setDoc(myFollowingRef, { followedId: effectiveUid, createdAt: serverTimestamp() }),
          setDoc(theirFollowersRef, { followerId: auth.currentUser.uid, createdAt: serverTimestamp() })
        ]);
        
        // Notify
        await addDoc(collection(db, `users/${effectiveUid}/notifications`), {
          recipientId: effectiveUid,
          type: 'follow',
          message: `${auth.currentUser.displayName || 'Unknown Signal'} started following your frequency.`,
          isRead: false,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingSocial(false);
    }
  };

  const handleFriendRequest = async () => {
    if (!auth.currentUser || !effectiveUid) return;
    setIsProcessingSocial(true);
    try {
      if (friendStatus === 'none') {
        const friendId = auth.currentUser.uid < effectiveUid 
          ? `${auth.currentUser.uid}_${effectiveUid}` 
          : `${effectiveUid}_${auth.currentUser.uid}`;
        
        await setDoc(doc(db, 'friends', friendId), {
          uids: [auth.currentUser.uid, effectiveUid],
          status: 'pending',
          requestedBy: auth.currentUser.uid,
          createdAt: serverTimestamp()
        });

        await addDoc(collection(db, `users/${effectiveUid}/notifications`), {
          recipientId: effectiveUid,
          type: 'friend_request',
          message: `${auth.currentUser.displayName || 'Unknown Signal'} requested synchronization (Friend Request).`,
          isRead: false,
          createdAt: serverTimestamp()
        });
      } else if (friendStatus === 'pending') {
         // Logic for accepting if we are the recipient, but here we just show state
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingSocial(false);
    }
  };

  const handleMessageClick = async () => {
    if (!auth.currentUser || !profile || !onMessage) return;
    try {
      const convId = await chatService.startConversation(profile);
      onMessage(convId, {
        displayName: profile.displayName,
        photoURL: profile.photoURL
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!auth.currentUser || !profile) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        displayName: editForm.displayName,
        bio: editForm.bio,
        photoURL: editForm.photoURL,
        lastActiveAt: serverTimestamp() // Refresh heartbeat on profile update
      });
      setIsEditing(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Decrypting Identity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-32">
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="bg-vibe-card border border-white/10 w-full max-w-xl p-10 rounded-[48px] rounded-bl-none shadow-2xl space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif italic font-bold text-white">Identity Params</h2>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Avatar Update Area */}
                <div className="flex flex-col items-center gap-4">
                  <div 
                    onClick={() => profileFileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    <div className="w-24 h-24 rounded-[32px] rounded-bl-none border-2 border-dashed border-white/10 p-1 group-hover:border-vibe-neon transition-all">
                      <div className="w-full h-full rounded-[30px] rounded-bl-none overflow-hidden bg-black/40 flex items-center justify-center">
                        {editForm.photoURL ? (
                          <img src={editForm.photoURL} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <Camera className="w-6 h-6 text-white/20" />
                        )}
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={profileFileInputRef} 
                    onChange={handleProfileFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">Update Signal Source</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Visual Alias</label>
                  <input 
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-sans focus:border-vibe-neon focus:outline-none transition-all"
                    placeholder="Display Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Broadcasting Signal (Bio)</label>
                  <textarea 
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="w-full bg-black/40 border border-white/5 p-4 rounded-2xl text-white font-sans focus:border-vibe-neon focus:outline-none transition-all min-h-[100px] resize-none"
                    placeholder="Bio..."
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="flex-1 py-4 rounded-full bg-white text-black font-black uppercase tracking-widest text-xs hover:bg-vibe-neon transition-all"
                >
                  {isSaving ? "Syncing..." : "Finalize Changes"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Header Block */}
      <section className="relative px-6 py-12 rounded-[64px] rounded-bl-none bg-vibe-card border border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-vibe-neon/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
           {/* Avatar Area */}
           <div className="relative">
              <div className={`w-32 h-32 rounded-[40px] rounded-bl-none border-2 p-1 transition-all duration-500 ${profile.isPro ? 'border-vibe-neon animate-pulse shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'border-vibe-neon/30 hover:border-vibe-neon/60'}`}>
                <div className="w-full h-full rounded-[38px] rounded-bl-none overflow-hidden bg-black/40 border border-white/10">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
              </div>
              <div className={`absolute -bottom-2 -right-2 p-2 rounded-full shadow-xl transition-colors duration-300 ${profile.isPro ? 'bg-vibe-neon text-black' : 'bg-white text-black'}`}>
                 {profile.isPro ? <Crown className="w-4 h-4 fill-black" /> : <Zap className="w-4 h-4 fill-black" />}
              </div>
           </div>

           {/* Name & Bio */}
           <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-serif italic font-bold text-white tracking-tight leading-[0.9] flex items-center justify-center gap-3">
                {profile.displayName}
                {profile.isPro && (
                  <span className="px-3 py-1 rounded-full bg-vibe-neon text-black text-[10px] font-black uppercase tracking-widest not-italic">Pro</span>
                )}
                {profile.hasInsurance && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest not-italic flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Insured
                  </span>
                )}
              </h1>
              <p className="text-white/40 text-xs font-sans tracking-wide max-w-sm mx-auto leading-relaxed italic">
                “{profile.bio || 'Transcending the digital noise.'}”
              </p>
           </div>

           {/* Core Metrics Pill */}
           <div className="flex items-center gap-2 p-1.5 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
              <div className="px-6 py-3 rounded-full bg-white text-black flex flex-col items-center">
                 <span className="text-xl font-bold leading-none">{profile.vibeScore || vibeScore}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Vibe Score</span>
              </div>
              <div className="px-6 py-3 flex flex-col items-center text-white/60">
                 <span className="text-xl font-bold leading-none">{followersCount}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Followers</span>
              </div>
              <div className="px-6 py-3 flex flex-col items-center text-white/60">
                 <span className="text-xl font-bold leading-none">{posts.length}</span>
                 <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Signals</span>
              </div>
           </div>

           {/* Actions */}
           <div className="flex gap-4 pt-4">
              {isOwnProfile ? (
                 <>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="px-8 py-3 rounded-full vibe-glass text-white/80 text-[10px] font-bold uppercase tracking-widest border border-white/10 hover:border-vibe-neon hover:text-white transition-all"
                   >
                     Configuration
                   </button>
                   <button 
                     onClick={() => setShowFlexCard(true)}
                     className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center text-vibe-neon hover:scale-110 transition-all border border-vibe-neon/30 group"
                   >
                     <Share2 className="w-4 h-4 group-hover:rotate-12" />
                   </button>
                   {isOwnProfile && !profile.isPro && (
                      <button 
                       onClick={() => setShowUpgradeModal(true)}
                       className="px-6 py-3 rounded-full bg-vibe-neon text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(212,175,55,0.2)]"
                     >
                        <Crown className="w-3 h-3" /> Go Pro
                     </button>
                   )}
                   {latestWrapped && (
                     <button 
                        onClick={() => onViewWrapped?.(latestWrapped)}
                        className="px-6 py-3 rounded-full bg-vibe-neon/10 border border-vibe-neon/20 text-vibe-neon text-[10px] font-black uppercase tracking-widest hover:bg-vibe-neon/20 transition-all flex items-center gap-2"
                     >
                        <Sparkles className="w-3 h-3" /> Wrapped
                     </button>
                   )}
                 </>
              ) : (
                <>
                  <button 
                    onClick={handleFollow}
                    className={`px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${isFollowing ? 'bg-white/5 text-white/40 border border-white/10' : 'bg-white text-black hover:bg-vibe-neon'}`}
                  >
                    {isFollowing ? 'Resonating' : 'Follow Signal'}
                  </button>
                  <button 
                    onClick={handleMessageClick}
                    className="w-12 h-12 rounded-full vibe-glass flex items-center justify-center text-white/60 hover:text-white transition-colors border border-white/10"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </>
              )}
           </div>
        </div>
      </section>

      {/* Vibe Flex Card Modal */}
      <AnimatePresence>
        {showFlexCard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <VibeFlexCard 
              displayName={profile.displayName}
              vibeScore={profile.vibeScore || vibeScore}
              streak={profile.streak}
              rank={rank || 0}
              totalPosts={posts.length}
              dominantMood={profile.dominantMood}
              aestheticDNA={profile.aestheticDNA}
              onClose={() => setShowFlexCard(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradeModal && (
          <ProUpgradeModal 
            onClose={() => setShowUpgradeModal(false)}
            onSuccess={() => {}}
          />
        )}
      </AnimatePresence>

      {/* Stats Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="p-8 rounded-[40px] rounded-bl-none bg-vibe-card border border-white/5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-vibe-neon flex items-center gap-3">
              <TrendingUp className="w-4 h-4" /> Aesthetic DNA
            </h3>
            <div className="flex flex-wrap gap-2">
               {(profile.aestheticDNA || ['neural-link', 'digital-native', 'vibe-curator']).map(tag => (
                 <span key={tag} className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-white/40 uppercase tracking-widest">
                   {tag}
                 </span>
               ))}
            </div>
         </div>

         <div className="p-8 rounded-[40px] rounded-bl-none bg-vibe-card border border-white/5 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 flex items-center gap-3">
              <Flame className="w-4 h-4" /> Activity Log
            </h3>
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-4xl font-serif italic text-white font-bold">{profile.streak} Days</span>
                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Ongoing Synchronization</span>
              </div>
              <div className="p-3 rounded-2xl bg-vibe-neon/10 border border-vibe-neon/20">
                 <Calendar className="w-5 h-5 text-vibe-neon" />
              </div>
            </div>
         </div>

         {/* Vibe Analytics Dashboard - PRO ONLY */}
         <div className={`p-8 rounded-[40px] rounded-bl-none border transition-all ${profile.isPro ? 'bg-vibe-card border-white/5' : 'bg-black/40 border-dashed border-white/10 opacity-60'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 flex items-center gap-3">
                <BarChart3 className="w-4 h-4" /> Deep Analytics
              </h3>
              {!profile.isPro && <Lock className="w-3 h-3 text-vibe-muted" />}
            </div>
            
            {profile.isPro ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Signal Purity</span>
                  <span className="text-vibe-neon font-bold">98.2%</span>
                </div>
                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Avg Resonance</span>
                  <span className="text-vibe-neon font-bold">+412</span>
                </div>
                <button className="w-full py-3 rounded-full border border-vibe-neon/20 text-vibe-neon text-[8px] font-black uppercase tracking-[0.2em] hover:bg-vibe-neon/10 transition-all">
                  Export Signal Data
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <p className="text-[8px] font-mono uppercase tracking-widest text-vibe-muted text-center leading-relaxed">
                  Deep signal heatmaps <br /> are locked to Sovereign agents.
                </p>
                <button 
                  onClick={() => isOwnProfile && setShowUpgradeModal(true)}
                  className="text-[8px] font-black uppercase tracking-widest text-vibe-neon hover:underline"
                >
                  Manifest Pro Access
                </button>
              </div>
            )}
         </div>
      </section>

      {/* Posts Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-serif italic font-bold text-white tracking-tight">Recent Manifestations</h2>
          <div className="w-24 h-px bg-white/10" />
        </div>

        <div className="space-y-8">
          {posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[40px]">
               <Ghost className="w-12 h-12 text-white/10 mx-auto mb-4" />
               <p className="text-white/20 font-mono text-[10px] uppercase tracking-widest">No signals detected from this source.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
