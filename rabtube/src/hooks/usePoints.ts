'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import {
  getOrCreateBalance,
  getTransactions,
  confirmPendingTransactions,
} from '@/lib/pointService';
import type { PointBalance, PointTransaction } from '@/types';

export function usePoints() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<PointBalance | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      // pending 확정 먼저 처리
      await confirmPendingTransactions(user.uid);
      const [bal, txs] = await Promise.all([
        getOrCreateBalance(user.uid),
        getTransactions(user.uid, 30),
      ]);
      setBalance(bal);
      setTransactions(txs);
    } catch (e) {
      console.error('usePoints error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { balance, transactions, loading, refresh };
}
