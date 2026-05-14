import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, Couple } from './types';
import AuthScreen from './screens/AuthScreen';
import ConnectScreen from './screens/ConnectScreen';
import WaitingScreen from './screens/WaitingScreen';
import HomeScreen from './screens/HomeScreen';
import { Language } from './translations';
import { Loader2 } from 'lucide-react';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [lang, setLang] = useState<Language>('fr');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch or create profile
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data() as UserProfile);
        } else {
          // Create new profile
          const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
          const newProfile: UserProfile = {
            id: user.uid,
            display_name: user.displayName || 'Lover',
            invite_code: inviteCode,
            couple_id: null
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
        setCouple(null);
      }
      setIsInitializing(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Listen to profile changes
  useEffect(() => {
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      const unsubscribeProfile = onSnapshot(profileRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `profiles/${user.uid}`));
      return () => unsubscribeProfile();
    }
  }, [user]);

  // Listen to couple changes if couple_id exists
  useEffect(() => {
    if (profile?.couple_id) {
      const coupleRef = doc(db, 'couples', profile.couple_id);
      const unsubscribeCouple = onSnapshot(coupleRef, (snap) => {
        if (snap.exists()) {
          setCouple(snap.data() as Couple);
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, `couples/${profile.couple_id}`));
      return () => unsubscribeCouple();
    } else {
      setCouple(null);
    }
  }, [profile?.couple_id]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLanguageChange={setLang} lang={lang} />;
  }

  if (!profile) {
     return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!profile.couple_id) {
    return <ConnectScreen lang={lang} profile={profile} />;
  }

  if (couple && !couple.partner2_id) {
    // If I'm partner 1 and waiting for partner 2
    if (couple.partner1_id === user.uid) {
      return <WaitingScreen lang={lang} profile={profile} />;
    }
    // If I joined as partner 2, the join code logic in ConnectScreen handles updating the doc, 
    // so this case should briefly transition or not stay here.
  }

  if (couple && couple.partner2_id) {
    return <HomeScreen lang={lang} profile={profile} couple={couple} />;
  }

  // Fallback to connect if something is weird
  return <ConnectScreen lang={lang} profile={profile} />;
}
