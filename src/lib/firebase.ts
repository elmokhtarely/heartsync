import { initializeApp } from 'firebase/app';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  type QueryConstraint,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ========== TYPES ==========

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  couple_id?: string | null;
  invite_code?: string | null;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  last_active_at: string;
  is_online?: boolean;
}

export interface UpdateProfileData {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  last_active_at?: string;
  is_online?: boolean;
}

export interface Couple {
  id: string;
  invite_code: string;
  created_at: string;
  users: string[];
}

// ========== FONCTIONS PROFIL ==========

/**
 * Récupère le profil d'un utilisateur
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Profile;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    throw error;
  }
};

/**
 * Crée ou met à jour un profil complet
 */
export const setProfile = async (userId: string, data: Partial<Profile>): Promise<void> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Erreur lors de la création du profil:", error);
    throw error;
  }
};

/**
 * Met à jour partiellement un profil
 */
export const updateProfile = async (userId: string, data: UpdateProfileData): Promise<void> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    await updateDoc(docRef, {
      ...data,
      last_active_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    throw error;
  }
};

/**
 * Supprime un profil
 */
export const deleteProfile = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Erreur lors de la suppression du profil:", error);
    throw error;
  }
};

/**
 * Met à jour la date de dernière activité
 */
export const updateLastActive = async (userId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    await updateDoc(docRef, {
      last_active_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'activité:", error);
  }
};

/**
 * Met à jour le statut en ligne
 */
export const updateOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    await updateDoc(docRef, {
      is_online: isOnline,
      last_active_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
  }
};

/**
 * Recherche des profils par nom
 */
export const searchProfiles = async (searchTerm: string, maxResults: number = 20): Promise<Profile[]> => {
  try {
    const profilesRef = collection(db, 'profiles');
    const constraints: QueryConstraint[] = [
      orderBy('display_name'),
      limit(maxResults)
    ];
    
    const q = query(profilesRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const results: Profile[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.display_name?.toLowerCase().includes(searchTerm.toLowerCase())) {
        results.push({ id: doc.id, ...data } as Profile);
      }
    });
    
    return results;
  } catch (error) {
    console.error("Erreur lors de la recherche:", error);
    return [];
  }
};

/**
 * Récupère les profils d'un couple
 */
export const getCoupleProfiles = async (coupleId: string): Promise<Profile[]> => {
  try {
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('couple_id', '==', coupleId));
    const querySnapshot = await getDocs(q);
    
    const profiles: Profile[] = [];
    querySnapshot.forEach((doc) => {
      profiles.push({ id: doc.id, ...doc.data() } as Profile);
    });
    
    return profiles;
  } catch (error) {
    console.error("Erreur lors de la récupération des profils du couple:", error);
    return [];
  }
};

/**
 * Vérifie si un profil existe
 */
export const profileExists = async (userId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Erreur lors de la vérification:", error);
    return false;
  }
};

/**
 * Crée un profil pour un nouvel utilisateur avec les données Google
 */
export const createProfileFromGoogle = async (user: User): Promise<Profile> => {
  const newProfile: Profile = {
    id: user.uid,
    email: user.email || '',
    display_name: user.displayName || 'Utilisateur',
    avatar_url: user.photoURL || undefined,
    created_at: new Date().toISOString(),
    last_active_at: new Date().toISOString(),
    is_online: true,
  };
  
  await setProfile(user.uid, newProfile);
  return newProfile;
};

// ========== FONCTIONS COUPLE ==========

/**
 * Génère un code d'invitation aléatoire
 */
const generateInviteCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Cherche un couple par code d'invitation
 */
export const findCoupleByInviteCode = async (inviteCode: string): Promise<Couple | null> => {
  try {
    const couplesRef = collection(db, 'couples');
    const q = query(couplesRef, where('invite_code', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Couple;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la recherche du couple:", error);
    return null;
  }
};

/**
 * Crée un nouveau couple et un code d'invitation
 */
export const createCouple = async (userId: string): Promise<string> => {
  try {
    const inviteCode = generateInviteCode();
    const coupleId = `couple_${Date.now()}`;
    
    const coupleRef = doc(db, 'couples', coupleId);
    await setDoc(coupleRef, {
      id: coupleId,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
      users: [userId]
    });
    
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, {
      couple_id: coupleId,
      invite_code: inviteCode
    });
    
    return inviteCode;
  } catch (error) {
    console.error("Erreur lors de la création du couple:", error);
    throw error;
  }
};

/**
 * Rejoint un couple avec un code d'invitation
 */
export const joinCouple = async (userId: string, inviteCode: string): Promise<{ success: boolean; message: string }> => {
  try {
    const couple = await findCoupleByInviteCode(inviteCode);
    
    if (!couple) {
      return { success: false, message: "Code d'invitation invalide" };
    }
    
    // Vérifier si l'utilisateur est déjà dans un couple
    const userProfile = await getProfile(userId);
    if (userProfile?.couple_id) {
      return { success: false, message: "Tu es déjà dans un couple" };
    }
    
    const coupleRef = doc(db, 'couples', couple.id);
    const updatedUsers = [...couple.users, userId];
    await updateDoc(coupleRef, { users: updatedUsers });
    
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, { 
      couple_id: couple.id,
      invite_code: inviteCode.toUpperCase()
    });
    
    return { success: true, message: "Tu as rejoint le couple !" };
  } catch (error) {
    console.error("Erreur lors du join:", error);
    return { success: false, message: "Erreur lors du join" };
  }
};

/**
 * Quitte un couple
 */
export const leaveCouple = async (userId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const profile = await getProfile(userId);
    if (!profile?.couple_id) {
      return { success: false, message: "Tu n'es dans aucun couple" };
    }
    
    const coupleRef = doc(db, 'couples', profile.couple_id);
    const coupleSnap = await getDoc(coupleRef);
    
    if (coupleSnap.exists()) {
      const coupleData = coupleSnap.data();
      const updatedUsers = coupleData.users.filter((id: string) => id !== userId);
      
      if (updatedUsers.length === 0) {
        await deleteDoc(coupleRef);
      } else {
        await updateDoc(coupleRef, { users: updatedUsers });
      }
    }
    
    const profileRef = doc(db, 'profiles', userId);
    await updateDoc(profileRef, {
      couple_id: null,
      invite_code: null
    });
    
    return { success: true, message: "Tu as quitté le couple" };
  } catch (error) {
    console.error("Erreur lors du leave:", error);
    return { success: false, message: "Erreur lors du départ" };
  }
};

/**
 * Récupère le couple d'un utilisateur
 */
export const getUserCouple = async (userId: string): Promise<Couple | null> => {
  try {
    const profile = await getProfile(userId);
    if (!profile?.couple_id) return null;
    
    const coupleRef = doc(db, 'couples', profile.couple_id);
    const coupleSnap = await getDoc(coupleRef);
    
    if (coupleSnap.exists()) {
      return { id: coupleSnap.id, ...coupleSnap.data() } as Couple;
    }
    return null;
  } catch (error) {
    console.error("Erreur lors de la récupération du couple:", error);
    return null;
  }
};

/**
 * Supprime complètement le compte utilisateur (Auth + Firestore)
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    const profile = await getProfile(userId);
    if (profile?.couple_id) {
      await leaveCouple(userId);
    }
    
    await deleteProfile(userId);
    
    const user = auth.currentUser;
    if (user) {
      await user.delete();
    }
  } catch (error) {
    console.error("Erreur lors de la suppression du compte:", error);
    throw error;
  }
};

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};
