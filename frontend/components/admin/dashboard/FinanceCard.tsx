"use client";

import React, { useEffect, useState } from 'react';
import { API_BASE_URL, handleResponse, fetchWithTimeout } from '@/lib/api/core';
import { getAuthHeaders } from '@/lib/api/auth.api';

export default function FinanceCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<number>(0);
  const [expense, setExpense] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        // This endpoint returns monthly aggregates on server — prefer stat endpoint
        const incomeRes = await fetchWithTimeout(`${API_BASE_URL}/incomes/statistics`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);
        const exRes = await fetchWithTimeout(`${API_BASE_URL}/expenses/statistics`, { headers: getAuthHeaders(), signal: controller.signal }, timeoutMs);

        const incomeData = await handleResponse<unknown>(incomeRes);
        const expenseData = await handleResponse<unknown>(exRes);

        if (mounted) {
          const inc = (incomeData && typeof incomeData === 'object') ? (Number(((incomeData as unknown) as Record<string, unknown>)['total_amount_this_month'] ?? 0)) : 0;
          const exp = (expenseData && typeof expenseData === 'object') ? (Number(((expenseData as unknown) as Record<string, unknown>)['total_amount_this_month'] ?? 0)) : 0;
          setIncome(inc);
          setExpense(exp);
        }
      } catch (err) {
        console.debug('FinanceCard load failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => { mounted = false; try { controller.abort(); } catch { } };
  }, [timeoutMs]);

  return (
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <h3 className="text-sm font-medium text-gray-700">Finance (This month)</h3>
      <div className="mt-2 flex gap-4">
        <div>
          <div className="text-lg font-semibold text-green-600">{loading ? '—' : `Rs. ${income.toLocaleString()}`}</div>
          <div className="text-xs text-gray-500">Income</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-600">{loading ? '—' : `Rs. ${expense.toLocaleString()}`}</div>
          <div className="text-xs text-gray-500">Expense</div>
        </div>
      </div>
    </div>
  );
}
