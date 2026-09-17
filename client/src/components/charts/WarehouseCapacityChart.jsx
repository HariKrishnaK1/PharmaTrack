import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const WarehouseCapacityChart = ({ data = [] }) => {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="code"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickFormatter={(val) => `${val / 1000}k`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-700">
                    <div className="font-semibold">{d.name} ({d.code})</div>
                    <div className="text-slate-300 mt-1">
                      Stored: <span className="font-mono text-teal-400 font-bold">{d.units?.toLocaleString()}</span> units
                    </div>
                    <div className="text-slate-300">
                      Capacity: <span className="font-mono">{d.capacity?.toLocaleString()}</span> units
                    </div>
                    <div className="text-slate-300">
                      Utilization: <span className={`font-bold ${d.utilization >= 90 ? 'text-rose-400' : d.utilization >= 70 ? 'text-amber-400' : 'text-emerald-400'}`}>{d.utilization}%</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="units" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              let fill = '#0d9488'; // Teal
              if (entry.utilization >= 90) fill = '#e11d48'; // Rose
              else if (entry.utilization >= 70) fill = '#d97706'; // Amber
              return <Cell key={`cell-${index}`} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};