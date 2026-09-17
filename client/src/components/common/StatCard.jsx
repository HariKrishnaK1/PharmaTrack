import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, description, trend, trendType = 'neutral', color = 'teal' }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className={`p-2.5 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {trend && (
          <span
            className={`inline-flex items-center text-xs font-semibold ${
              trendType === 'up'
                ? 'text-emerald-600'
                : trendType === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {trendType === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
            {trendType === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{description}</p>
      )}
    </div>
  );
};