import { db } from '../lib/firebase';
import { doc, updateDoc, setDoc, getDoc, serverTimestamp, increment } from 'firebase/firestore';

export type CompetitionPeriod = 'week' | 'month';

export const getPeriodKey = (type: CompetitionPeriod, date: Date = new Date()): string => {
  const year = date.getFullYear();
  if (type === 'month') {
    const month = date.getMonth() + 1;
    return `M${month.toString().padStart(2, '0')}_${year}`;
  } else {
    // Basic ISO week calculation
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `W${weekNo.toString().padStart(2, '0')}_${year}`;
  }
};

export const incrementUserCompetitionScore = async (userId: string, amount: number = 1) => {
  const weekKey = getPeriodKey('week');
  const monthKey = getPeriodKey('month');

  const updateStat = async (period: string, type: CompetitionPeriod) => {
    const statId = `${userId}_${type}_${period}`;
    const statRef = doc(db, 'periodicStats', statId);
    const statSnap = await getDoc(statRef);

    if (statSnap.exists()) {
      await updateDoc(statRef, {
        resonance: increment(amount),
        updatedAt: serverTimestamp()
      });
    } else {
      await setDoc(statRef, {
        period,
        type,
        resonance: amount,
        userId,
        updatedAt: serverTimestamp()
      });
    }
  };

  const updateUserTotal = async () => {
    const userRef = doc(db, 'users', userId);
    try {
      await updateDoc(userRef, {
        totalResonance: increment(amount)
      });
    } catch (e) {
      // If field doesn't exist, set it. Note: updateDoc with increment fails if field is missing in some firebase versions, but usually it works by treating as 0
      console.warn("Failed to update totalResonance, user document might be missing field", e);
    }
  };

  try {
    await Promise.all([
      updateStat(weekKey, 'week'),
      updateStat(monthKey, 'month'),
      updateUserTotal()
    ]);
  } catch (error) {
    console.error('Error updating competition scores:', error);
  }
};
