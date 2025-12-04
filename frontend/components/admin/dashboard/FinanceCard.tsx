"use client";

import React, { useEffect, useState } from "react";
import adminApi from "@/lib/api/admin.api";

export default function FinanceCard({ timeoutMs }: { timeoutMs?: number }) {
  const [loading, setLoading] = useState(true);
  const [incomeThisMonth, setIncomeThisMonth] = useState<number | string>(0);
  const [expenseThisMonth, setExpenseThisMonth] = useState<number | string>(0);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const resRaw: unknown = await adminApi.getDashboardStats({ timeoutMs }).catch(() => null);
        if (!mounted) return;
        const res = (resRaw && typeof resRaw === "object") ? (resRaw as { finance?: Record<string, unknown> }) : null;
        const finance = (res?.finance ?? {}) as Record<string, unknown>;
        setIncomeThisMonth(finance["income_this_month"] ?? 0);
        setExpenseThisMonth(finance["expense_this_month"] ?? 0);
      } catch (err) {
        console.debug("FinanceCard load failed", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [timeoutMs]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Finance</h2>
        <button onClick={() => window.location.href = '/admin/finance'} className="text-blue-600 bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium">View all</button>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
          <div className="text-gray-700 font-medium">Income (This month)</div>
          <div className="font-bold text-gray-900">{loading ? '—' : incomeThisMonth}</div>
        </div>

        <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
          <div className="text-gray-700 font-medium">Expense (This month)</div>
          <div className="font-bold text-gray-900">{loading ? '—' : expenseThisMonth}</div>
        </div>
      </div>
    </div>
  );
}
