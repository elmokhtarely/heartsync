import React from 'react';
import { motion } from 'motion/react';
import { Heart, Loader2, LogOut, Share2 } from 'lucide-react';
import { Language, translations } from '../translations';
import { UserProfile } from '../types';
import { auth, signOut } from '../lib/firebase';

interface WaitingScreenProps {
  lang: Language;
  profile: UserProfile;
}

export default function WaitingScreen({ lang, profile }: WaitingScreenProps) {
  const t = translations[lang];

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
      const text = encodeURIComponent(shareData.text);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 bg-pink-50 items-center justify-center">
      <div className="absolute top-8 right-8">
        <button onClick={() => signOut(auth)} className="p-2 text-gray-500">
          <LogOut size={20} />
        </button>
      </div>

      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="mb-12"
      >
        <Heart size={80} className="text-pink-500 fill-pink-500 opacity-60" />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.waiting}</h2>
      <p className="text-gray-500 text-center mb-12 max-w-xs">{t.connectDesc}</p>

      <div className="bg-white p-8 rounded-[40px] shadow-xl shadow-pink-100 border border-white flex flex-col items-center w-full max-w-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{t.yourCode}</p>
        <p className="text-4xl font-mono font-bold text-pink-600 mb-8">{profile.invite_code}</p>
        
        <div className="flex gap-2 w-full justify-center">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-6 py-3 bg-pink-50 text-pink-600 rounded-full font-bold text-sm"
          >
            {t.copyCode}
          </button>
          <button
            onClick={directShare}
            className="flex items-center gap-2 px-6 py-3 bg-pink-500 text-white rounded-full font-bold text-sm shadow-lg shadow-pink-100"
          >
            <Share2 size={18} />
            {t.shareCode}
          </button>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2 text-gray-400">
        <Loader2 className="animate-spin" size={16} />
        <span className="text-sm font-medium">Checking connection...</span>
      </div>
    </div>
  );
}
