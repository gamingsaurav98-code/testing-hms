"use client";

import React from 'react';

type Trend = { isPositive: boolean; value: number };

type Props = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  trend?: Trend | null;
};

export default function StatCard({ title, value, subtitle, icon, color = 'blue', trend = null }: Props) {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  } as const;

  const getIcon = (iconName?: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      bed: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      users: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      person: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    };
    return iconName ? iconMap[iconName] ?? null : null;
  };

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {icon && (
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${colorClasses[color].bg} ${colorClasses[color].text}`}>
              {getIcon(icon)}
            </div>
          )}
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
            trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {trend.isPositive ? '↗' : '↘'} {trend.value}%
          </div>
        )}
      </div>
    </div>
  );

}
