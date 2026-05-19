'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/firebaseService';
import { awardSignupBonus } from '@/lib/pointService';
import type { UserProfile } from '@/types';
import { isApprovedStatus } from '@/types';

interface AuthCtx {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** 정회원(APPROVED) 여부 - 하위호환 포함 */
  isApproved: boolean;
  signOut: () => Promise<void>;
  /** 프로필 상태 즉시 갱신 (면허 제출/승인 후 호출) */
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

  const loadProfile = useCallback(async (u: User | null) => {
    if (u) {
      const p = await getUserProfile(u.uid);
      setProfile(p);
      // 회원가입 보너스 (이미 지급됐으면 내부에서 스킵)
      awardSignupBonus(u.uid).catch(console.error);
    } else {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await loadProfile(u);
      setLoading(false);
    });
    return unsub;
  }, [loadProfile]);

  const signOut = async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  /** 면허 제출/승인 후 프로필을 즉시 리프레시 */
  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await getUserProfile(user.uid);
      setProfile(p);
    }
  }, [user]);

  const isApproved = isApprovedStatus(profile?.status);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isApproved, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
