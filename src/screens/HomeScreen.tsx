import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Heart, Trophy, Users } from 'lucide-react';
import { auth, db, signOut } from '../lib/firebase';
import { 
  doc, 
  onSnapshot, 
  collection, 
  addDoc, 
  updateDoc, 
  increment, 
  serverTimestamp,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { Language, translations } from '../translations';
import { Couple, Signal, UserProfile } from '../types';
import HeartButton from '../components/HeartButton';
import FloatingHearts from '../components/FloatingHearts';
import NotificationLayer from '../components/NotificationLayer';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface HomeScreenProps {
  lang: Language;
  profile: UserProfile;
  couple: Couple;
}

export default function HomeScreen({ lang, profile, couple }: HomeScreenProps) {
  const t = translations[lang];
  const [lastSignalAt, setLastSignalAt] = useState<number>(0);
  const [partnerSignalCount, setPartnerSignalCount] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<UserProfile | null>(null);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  // Heartbeat for current user
  useEffect(() => {
    const heartbeat = setInterval(async () => {
      try {
        await updateDoc(doc(db, 'profiles', profile.id), {
          last_active_at: serverTimestamp()
        });
      } catch (err) {
        console.error("Heartbeat failed", err);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [profile.id]);

  // Check partner presence
  useEffect(() => {
    if (partnerProfile?.last_active_at) {
      const lastActive = (partnerProfile.last_active_at as any)?.toMillis?.() || 0;
      const now = Date.now();
      const isActive = (now - lastActive) < 90000; // Active within 90 seconds
      setIsPartnerOnline(isActive);
    } else {
      setIsPartnerOnline(false);
    }
  }, [partnerProfile]);

  // Get partner ID
  const partnerId = couple.partner1_id === profile.id ? couple.partner2_id : couple.partner1_id;

  // Fetch partner profile
  useEffect(() => {
    if (partnerId) {
      const partnerRef = doc(db, 'profiles', partnerId);
      const unsubscribePartner = onSnapshot(partnerRef, (snap) => {
        if (snap.exists()) {
          setPartnerProfile(snap.data() as UserProfile);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `profiles/${partnerId}`));
      return () => unsubscribePartner();
    }
  }, [partnerId]);

  // Listen for incoming signals
  useEffect(() => {
    const signalsRef = collection(db, 'couples', couple.id, 'signals');
    const q = query(signalsRef, orderBy('sent_at', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const signal = snapshot.docs[0].data() as Signal;
        // If the signal is new and NOT sent by me
        if (signal.sent_by !== profile.id) {
          const sentAt = (signal.sent_at as any)?.toMillis?.() || Date.now();
          if (sentAt > lastSignalAt) {
            setLastSignalAt(sentAt);
            setPartnerSignalCount(prev => prev + 1);
            setNotification(t.partnerConnected);
            setTimeout(() => setNotification(null), 3000);
            
            // Haptic feedback (web alternative)
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 100]);
            }
          }
        }
      }
    }, (err) => handleFirestoreError(err, OperationType.LIST, `couples/${couple.id}/signals`));

    return () => unsubscribe();
  }, [couple.id, profile.id, lastSignalAt, t.partnerConnected]);

  const sendSignal = async () => {
    // Haptic feedback (immediate for responsiveness)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    setIsLoading(true);
    try {
      const signalData = {
        sent_by: profile.id,
        sent_at: serverTimestamp(),
        type: 'THINK',
        members: [couple.partner1_id, couple.partner2_id]
      };

      // Add signal
      await addDoc(collection(db, 'couples', couple.id, 'signals'), signalData);
      
      // Update couple stats
      await updateDoc(doc(db, 'couples', couple.id), {
        total_signals: increment(1),
        daily_count: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `couples/${couple.id}/signals`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-hidden relative">
      <NotificationLayer message={notification} />
      <FloatingHearts count={partnerSignalCount} />

      {/* Header */}
      <header className="p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-100">
            <Heart size={20} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 italic">HeartSync</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isPartnerOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  {isPartnerOnline ? 'Partner Online' : 'Partner Offline'}
                </span>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${isPartnerOnline ? 'bg-pink-100 border-pink-200' : 'bg-gray-100 border-gray-200 opacity-50'}`}>
                <span className="text-[10px] font-bold text-pink-500 uppercase">
                  {partnerProfile?.display_name?.charAt(0) || '?'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => signOut(auth)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Stats Cards */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 gap-12">
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center mb-2 text-orange-500">
              <Trophy size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{couple.total_signals}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.totalSignals}</span>
          </motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-2 text-blue-500">
              <Users size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{couple.daily_count}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.dailySignals}</span>
          </motion.div>
        </div>

        {/* Main Heart Button */}
        <div className="relative flex flex-col items-center gap-8">
          <HeartButton onPress={sendSignal} isLoading={isLoading} />
          <motion.p 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-400 font-medium tracking-wide uppercase text-sm"
          >
            {t.tapToSend}
          </motion.p>
        </div>
      </main>

      {/* Footer/Bottom spacing */}
      <footer className="p-12" />
    </div>
  );
}
