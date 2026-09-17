import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_COLORS = {
  PENDING: '#64748b',
  DISPATCHED: '#0284c7',
  IN_TRANSIT: '#6366f1',
  DELIVERED: '#10b981',
  DELAYED: '#e11d48',
  CANCELLED: '#94a3b8'
};

export const ShipmentStatusDonut = ({ data = [] }) => {
  const activeData = data.filter(d => d.count > 0);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="count"
            nameKey="status"
          >
            {activeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#cbd5e1'} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0];
                return (
                  <div className="bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700">
                    <span className="font-semibold">{d.name}: </span>
                    <span className="font-mono text-teal-400 font-bold">{d.value}</span> consignments
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};