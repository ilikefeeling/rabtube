'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firebaseService';
import { awardSignupBonus } from '@/lib/pointService';
import type { UserProfile } from '@/types';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isApproved: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null, profile: null, loading: true, isApproved: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const p = await getUserProfile(u.uid);
        setProfile(p);
        // 회원가입 보너스 (이미 지급됐으면 내부에서 스킵)
        awardSignupBonus(u.uid).catch(console.error);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  };

  const isApproved = profile?.status === 'approved';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isApproved, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
