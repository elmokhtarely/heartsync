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
  type DocumentData,
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
  couple_id?: string;
  invite_code?: string;
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

// ========== FONCTIONS PROFIL DE BASE ==========

/**
 * Récupère le profil d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Le profil ou null s'il n'existe pas
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
 * @param userId - ID de l'utilisateur
 * @param data - Données du profil
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
 * @param userId - ID de l'utilisateur
 * @param data - Champs à modifier
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
 * @param userId - ID de l'utilisateur
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

// ========== FONCTIONS AVANCÉES ==========

/**
 * Met à jour la date de dernière activité
 * @param userId - ID de l'utilisateur
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
 * @param userId - ID de l'utilisateur
 * @param isOnline - Statut en ligne
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
 * @param searchTerm - Terme de recherche
 * @param maxResults - Nombre maximum de résultats
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
 * @param coupleId - ID du couple
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
 * @param userId - ID de l'utilisateur
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
 * @param user - Utilisateur Firebase Auth
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

/**
 * Supprime complètement le compte utilisateur (Auth + Firestore)
 * @param userId - ID de l'utilisateur
 */
export const deleteUserAccount = async (userId: string): Promise<void> => {
  try {
    // Supprimer le profil Firestore
    await deleteProfile(userId);
    
    // Supprimer l'authentification (nécessite une fonction Cloud ou ré-authentification)
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
