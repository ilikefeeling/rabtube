'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  getDashboardStats,
  getMembersWithBalance,
  getSupplyTimeline,
  subscribeRecentTransactions,
  type DashboardStats,
  type MemberWithBalance,
  type SupplyDataPoint,
} from '@/lib/adminService';
import type { PointTransaction } from '@/types';

export function useAdmin() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [stats, setStats]           = useState<DashboardStats | null>(null);
  const [members, setMembers]       = useState<MemberWithBalance[]>([]);
  const [recentTxs, setRecentTxs]   = useState<PointTransaction[]>([]);
  const [timeline, setTimeline]     = useState<SupplyDataPoint[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const refresh = useCallback(async () => {
    if (!user || !isAdmin) return;
    setLoading(true);
    setError('');
    try {
      const [s, m, tl] = await Promise.all([
        getDashboardStats(),
        getMembersWithBalance(),
        getSupplyTimeline(30),
      ]);
      setStats(s);
      setMembers(m);
      setTimeline(tl);
    } catch (e: any) {
      setError(e.message ?? '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // 실시간 트랜잭션 스트림
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsub = subscribeRecentTransactions(txs => setRecentTxs(txs), 50);
    return unsub;
  }, [user, isAdmin]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, members, recentTxs, timeline, loading, error, refresh, isAdmin };
}
