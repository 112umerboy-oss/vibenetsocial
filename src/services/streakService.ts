import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { UserProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';

export const updateStreak = async (uid: string, profile?: UserProfile) => {
  const userRef = doc(db, 'users', uid);
  const path = `users/${uid}`;
  
  try {
    let currentProfile = profile;
    if (!currentProfile) {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        currentProfile = { uid, ...userSnap.data() } as UserProfile;
      }
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!currentProfile) {
      // New user
      await setDoc(userRef, {
        uid,
        displayName: auth.currentUser?.displayName || 'VibeUser',
        photoURL: auth.currentUser?.photoURL || '',
        streak: 1,
        lastActiveAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      return 1;
    }

    const lastActive = currentProfile.lastActiveAt instanceof Timestamp 
      ? currentProfile.lastActiveAt.toDate() 
      : new Date(currentProfile.lastActiveAt || 0);
    
    const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
    
    const diffTime = today.getTime() - lastActiveDay.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStreak = currentProfile.streak;
    if (diffDays === 1) {
      // Regular increment
      newStreak += 1;
      await updateDoc(userRef, {
        streak: newStreak,
        lastActiveAt: serverTimestamp()
      });
    } else if (diffDays > 1) {
      // Streak broken
      newStreak = 1;
      await updateDoc(userRef, {
        streak: newStreak,
        lastActiveAt: serverTimestamp()
      });
    } else if (diffDays === 0) {
      // Already active today
      // Update timestamp anyway to refresh activity
      await updateDoc(userRef, {
        lastActiveAt: serverTimestamp()
      });
    }

    return newStreak;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    return 0;
  }
};

export const getStreakMessage = (streak: number) => {
  if (streak === 0) return "Start your vibe journey today.";
  if (streak === 1) return "The first step to dominance.";
  if (streak < 3) return "Heating up. Keep the momentum.";
  if (streak < 7) return "On fire! You're a regular now.";
  if (streak < 14) return "LEGENDARY STATUS approaching.";
  return "VIBE GOD. Your streak is unstoppable.";
};
