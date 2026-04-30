import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Notification, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestoreUtils';
import { 
  Bell, 
  ThumbsUp, 
  MessageSquare, 
  Flame, 
  Trash2, 
  CheckCircle2, 
  Loader2,
  Inbox
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;
    const path = `users/${uid}/notifications`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return unsub;
  }, []);

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/notifications`;
    try {
      await updateDoc(doc(db, path, id), { isRead: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!auth.currentUser) return;
    const path = `users/${auth.currentUser.uid}/notifications`;
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const markAllRead = async () => {
    if (!auth.currentUser) return;
    const unread = notifications.filter(n => !n.isRead);
    for (const n of unread) {
      markAsRead(n.id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="w-8 h-8 text-vibe-neon animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Filtering Signals...</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const SYSTEM_ALERTS: Notification[] = [
    {
      id: 'sys-notif-1',
      recipientId: 'all',
      type: 'streak',
      message: "SYSTEM: Your streak protocol is now active. Log in tomorrow to maintain resonance.",
      isRead: false,
      createdAt: { toDate: () => new Date() } as any
    },
    {
      id: 'sys-notif-2',
      recipientId: 'all',
      type: 'like',
      message: "Resonance Boost: Your first signal was indexed by the grid.",
      isRead: true,
      createdAt: { toDate: () => new Date(Date.now() - 3600000) } as any
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : SYSTEM_ALERTS;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between border-b border-vibe-border pb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-vibe-neon" />
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">System Alerts</h2>
          {unreadCount > 0 && (
            <span className="bg-vibe-neon text-black text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {unreadCount} NEW
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button 
            onClick={markAllRead}
            className="text-[10px] font-black uppercase tracking-widest text-vibe-muted hover:text-vibe-neon transition-colors"
          >
            Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {displayNotifications.length > 0 ? (
            displayNotifications.map((n, index) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative p-4 border transition-all ${n.isRead ? 'border-vibe-border bg-vibe-card/40' : 'border-vibe-neon/50 bg-vibe-neon/5 ring-1 ring-vibe-neon/20'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 border ${n.isRead ? 'border-vibe-border text-vibe-muted' : 'border-vibe-neon text-vibe-neon bg-black'}`}>
                    {n.type === 'like' && <ThumbsUp className="w-4 h-4" />}
                    {n.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                    {n.type === 'streak' && <Flame className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${n.isRead ? 'text-vibe-gray' : 'text-white font-medium'}`}>
                      {n.message}
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-vibe-muted">
                      {new Date(n.createdAt?.toDate()).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.isRead && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="p-2 text-vibe-muted hover:text-vibe-neon"
                        title="Mark as read"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="p-2 text-vibe-muted hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-24 border border-dashed border-vibe-border bg-black/20">
              <Inbox className="w-12 h-12 text-vibe-muted/20 mx-auto mb-4" />
              <p className="text-[10px] font-mono uppercase tracking-widest text-vibe-muted">Signal silence. No alerts detected.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 bg-vibe-neon/5 border border-vibe-neon/20 rounded-sm">
        <p className="text-[10px] font-mono uppercase tracking-[0.1em] text-vibe-muted text-center italic">
          Notifications are transient. Ensure you resonate with others to keep the signal active.
        </p>
      </div>
    </div>
  );
};
