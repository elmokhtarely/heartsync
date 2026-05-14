import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Share2, Link as LinkIcon, Plus, LogOut } from 'lucide-react';
import { auth, db, signOut } from '../lib/firebase';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, serverTimestamp, getDoc } from 'firebase/firestore';
import { Language, translations } from '../translations';
import { UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface ConnectScreenProps {
  lang: Language;
  profile: UserProfile;
}

export default function ConnectScreen({ lang, profile }: ConnectScreenProps) {
  const t = translations[lang];
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const createCouple = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const coupleId = `couple_${Date.now()}`;
      await setDoc(doc(db, 'couples', coupleId), {
        id: coupleId,
        partner1_id: profile.id,
        partner2_id: null,
        total_signals: 0,
        daily_count: 0,
        created_at: serverTimestamp(),
        last_daily_reset: serverTimestamp(),
      });
      await updateDoc(doc(db, 'profiles', profile.id), {
        couple_id: coupleId
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'couples');
    } finally {
      setIsLoading(false);
    }
  };

  const joinCouple = async () => {
    if (!inviteCode) return;
    setIsLoading(true);
    setError(null);
    try {
      // Find user with this invite code
      const q = query(collection(db, 'profiles'), where('invite_code', '==', inviteCode.toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("Invalid code");
        setIsLoading(false);
        return;
      }

      const partnerProfile = querySnapshot.docs[0].data() as UserProfile;
      if (partnerProfile.id === profile.id) {
        setError("You cannot join yourself");
        setIsLoading(false);
        return;
      }

      if (!partnerProfile.couple_id) {
        setError("Partner hasn't created a couple yet");
        setIsLoading(false);
        return;
      }

      const coupleRef = doc(db, 'couples', partnerProfile.couple_id);
      const coupleDoc = await getDoc(coupleRef);
      
      if (!coupleDoc.exists()) {
        setError("Couple record not found");
        setIsLoading(false);
        return;
      }

      const coupleData = coupleDoc.data();
      if (coupleData.partner2_id) {
        setError("This couple session is already full");
        setIsLoading(false);
        return;
      }

      // Join
      await updateDoc(coupleRef, {
        partner2_id: profile.id
      });
      await updateDoc(doc(db, 'profiles', profile.id), {
        couple_id: partnerProfile.couple_id
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'couples');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profile.invite_code);
    alert("Code copied!");
  };

  const directShare = async () => {
    const shareData = {
      title: 'HeartSync',
      text: `Join me on HeartSync! Use my invite code: ${profile.invite_code}`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Shared failed", err);
      }
    } else {
      // Fallback for desktop or non-supported browsers
      const text = encodeURIComponent(shareData.text);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-pink-50">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-2xl font-bold text-gray-900">{t.connectTitle}</h2>
        <button onClick={() => signOut(auth)} className="p-2 text-gray-500">
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100"
        >
          <p className="text-sm text-gray-500 mb-4">{t.yourCode}</p>
          <div className="flex items-center justify-between bg-pink-50 p-4 rounded-2xl border border-pink-100">
            <span className="text-2xl font-mono font-bold tracking-widest text-pink-600">
              {profile.invite_code}
            </span>
            <button onClick={directShare} className="p-2 bg-pink-500 rounded-xl shadow-sm text-white">
              <Share2 size={20} />
            </button>
          </div>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="h-[1px] flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">OR</span>
          <div className="h-[1px] flex-1 bg-gray-200" />
        </div>

        <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-white p-6 rounded-3xl shadow-sm border border-pink-100"
        >
          <input
            type="text"
            placeholder={t.enterCode}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl mb-4 font-mono text-center text-xl uppercase tracking-widest"
          />
          <button
            onClick={joinCouple}
            disabled={isLoading || !inviteCode}
            className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold shadow-lg shadow-pink-100 flex items-center justify-center gap-2"
          >
            <LinkIcon size={20} />
            {t.join}
          </button>
        </motion.div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={createCouple}
          disabled={isLoading}
          className="w-full py-4 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold shadow-sm flex items-center justify-center gap-2"
        >
          <Plus size={20} className="text-pink-500" />
          {t.create}
        </motion.button>
        
        {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}
      </div>
    </div>
  );
}
