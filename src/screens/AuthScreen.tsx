import React from 'react';
import { motion } from 'motion/react';
import { Heart, Globe } from 'lucide-react';
import { auth, googleProvider, signInWithPopup } from '../lib/firebase';
import { Language, translations } from '../translations';

interface AuthScreenProps {
  onLanguageChange: (lang: Language) => void;
  lang: Language;
}

export default function AuthScreen({ onLanguageChange, lang }: AuthScreenProps) {
  const t = translations[lang];

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="w-24 h-24 bg-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-200">
          <Heart size={48} className="text-white fill-white" />
        </div>
        
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2 italic">HeartSync</h1>
          <p className="text-gray-500 max-w-xs">{t.connectDesc}</p>
        </div>

        <button
          onClick={handleLogin}
          className="mt-8 px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-3 font-medium cursor-pointer"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <div className="flex gap-4 mt-12">
          {(['en', 'fr', 'es', 'ar'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => onLanguageChange(l)}
              className={`p-2 rounded-lg transition-colors ${
                lang === l ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
