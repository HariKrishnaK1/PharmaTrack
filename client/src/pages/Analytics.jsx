import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Truck, Pill, RefreshCw, Calendar } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { StatCard } from '../components/common/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const Analytics = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getReports(timeframe);
      setReportData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeframe]);

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  const topProducts = reportData?.topMovedProducts || [];
  const carriers = reportData?.carrierPerformance || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-teal-600" /> Executive Analytics & Supply Chain Trends
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Macro-level metrics across inventory valuation, high-velocity formulations, and carrier fulfillment SLAs.
          </p>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto text-xs">
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '90d', label: '90 Days' },
            { key: '6m', label: '6 Months' },
            { key: '1y', label: '1 Year' }
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeframe === t.key
                  ? 'bg-teal-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Valuation Stat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Inventory Valuation"
          value={`$${reportData?.totalValuation?.toLocaleString() || 0}`}
          icon={DollarSign}
          description="Aggregated acquisition value across all regional nodes"
          trend="Audited"
          trendType="neutral"
          color="teal"
        />
        <StatCard
          title="Monitored Timeframe"
          value={timeframe.toUpperCase()}
          icon={Calendar}
          description="Operational logging window"
          trend="Dynamic Filter"
          trendType="neutral"
          color="blue"
        />
        <StatCard
          title="Logistics Fulfillment SLA"
          value={`${Math.round((carriers.reduce((s, c) => s + c.delivered, 0) / Math.max(1, carriers.reduce((s, c) => s + c.total, 0))) * 100)}%`}
          icon={Truck}
          description="Consignments completed within SLA window"
          trend="Contractual KPI"
          trendType="up"
          color="indigo"
        />
      </div>

      {/* Top High-Velocity Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Highest Volume Moved Products</h3>
            <p className="text-xs text-slate-500">Cumulative units transferred or dispatched during this timeframe</p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: '#334155' }}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700">
                          <div className="font-semibold">{d.name}</div>
                          <div className="text-teal-400 font-mono font-bold mt-1">
                            {d.totalQuantity?.toLocaleString()} units moved ({d.movementCount} logs)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalQuantity" fill="#0d9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Carrier Reliability Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900">Logistics Carrier Fulfillment Performance</h3>
            <p className="text-xs text-slate-500">Delivered on schedule vs route delays by freight partner</p>
          </div>

          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={carriers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="carrier" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }} />
                <Bar dataKey="delivered" name="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};