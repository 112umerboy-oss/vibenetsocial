import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserProfile } from '../types';

const FREE_DAILY_LIMIT = 10;

export const proService = {
  /**
   * Checks if an AI action is allowed based on the user's Pro status and daily usage.
   * If allowed and the user is not Pro, increments their daily usage.
   */
  async checkAndIncrementAiUsage(userId: string): Promise<{ allowed: boolean; remaining?: number; error?: string }> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { allowed: false, error: 'User profile not found' };
    }

    const profile = userSnap.data() as UserProfile;
    
    // Pro users have unlimited AI usage
    if (profile.isPro) {
      return { allowed: true };
    }

    const today = new Date().toISOString().split('T')[0];
    const usage = profile.dailyAiUsage || { count: 0, lastResetDate: today };

    // Reset count if it's a new day
    let currentCount = usage.count;
    if (usage.lastResetDate !== today) {
      currentCount = 0;
    }

    if (currentCount >= FREE_DAILY_LIMIT) {
      return { 
        allowed: false, 
        remaining: 0, 
        error: 'Daily AI limit reached (10/day). Upgrade to Pro for unlimited access.' 
      };
    }

    // Increment usage
    await updateDoc(userRef, {
      'dailyAiUsage.count': currentCount + 1,
      'dailyAiUsage.lastResetDate': today
    });

    return { allowed: true, remaining: FREE_DAILY_LIMIT - (currentCount + 1) };
  },

  /**
   * Simulates a Pro subscription upgrade.
   */
  async upgradeToPro(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const proExpiresAt = new Date();
    proExpiresAt.setMonth(proExpiresAt.getMonth() + 1); // 1 month from now

    await updateDoc(userRef, {
      isPro: true,
      proExpiresAt: proExpiresAt
    });
  }
};
