import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Pill,
  Layers,
  AlertTriangle,
  CalendarClock,
  Truck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { analyticsService } from '../services/analyticsService';
import { StatCard } from '../components/common/StatCard';
import { WarehouseCapacityChart } from '../components/charts/WarehouseCapacityChart';
import { MovementTrendChart } from '../components/charts/MovementTrendChart';
import { CategoryDonutChart } from '../components/charts/CategoryDonutChart';
import { ShipmentStatusDonut } from '../components/charts/ShipmentStatusDonut';
import { ExpiryRiskChart } from '../components/charts/ExpiryRiskChart';

export const Dashboard = () => {
  const { user } = useAuth();
  const { resolveAlert } = useAlerts();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboard();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolve = async (id) => {
    try {
      await resolveAlert(id, 'Resolved directly from operational dashboard');
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Aggregating live pharmaceutical operational data...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const alerts = data?.priorityAlerts || [];

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Good morning, {user?.name || 'Director'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Here's what's happening across your pharmaceutical supply-chain and inventory network today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
          <Link
            to="/shipments/new"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition shadow-sm shadow-teal-600/20"
          >
            <Truck className="w-3.5 h-3.5" />
            Create Consignment
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Products"
          value={kpis.totalProducts}
          icon={Pill}
          description="Active medical formulations"
          trend="14 cataloged"
          trendType="neutral"
          color="teal"
        />
        <StatCard
          title="Total Inventory"
          value={kpis.totalInventoryUnits}
          icon={Layers}
          description={`${kpis.totalAvailableUnits?.toLocaleString()} units available`}
          trend="Across 5 Hubs"
          trendType="neutral"
          color="blue"
        />
        <StatCard
          title="Low Stock Items"
          value={kpis.lowStockCount}
          icon={AlertTriangle}
          description="Below safety threshold"
          trend={kpis.lowStockCount > 0 ? "Action Needed" : "Optimal"}
          trendType={kpis.lowStockCount > 0 ? "down" : "up"}
          color={kpis.lowStockCount > 0 ? "rose" : "teal"}
        />
        <StatCard
          title="Expiring Soon"
          value={kpis.expiringSoonCount}
          icon={CalendarClock}
          description="Within 90 days horizon"
          trend="FEFO Prioritized"
          trendType={kpis.expiringSoonCount > 0 ? "down" : "neutral"}
          color="amber"
        />
        <StatCard
          title="Active Shipments"
          value={kpis.activeShipments}
          icon={Truck}
          description="In logistics pipeline"
          trend="Live Tracking"
          trendType="up"
          color="indigo"
        />
      </div>

      {/* Priority Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Priority Operational Alerts ({alerts.length})
              </h2>
            </div>
            <Link
              to="/alerts"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              All Alerts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-slate-50 transition">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                    alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {alert.severity}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{alert.title}</div>
                    <div className="text-xs text-slate-600 mt-0.5">{alert.message}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  <button
                    onClick={() => handleResolve(alert._id)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                  <button
                    onClick={() => navigate('/alerts')}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Row 1 Charts: Warehouse Capacity & Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Distribution by Warehouse Hub</h3>
              <p className="text-xs text-slate-500">Real-time stored units against maximum regional storage capacity</p>
            </div>
            <Link to="/warehouses" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Warehouses <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <WarehouseCapacityChart data={charts.warehouseDistribution} />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Inventory Movement Velocity</h3>
              <p className="text-xs text-slate-500">Inbound batch intakes vs outbound consignment dispatches</p>
            </div>
            <Link to="/movements" className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Movements <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <MovementTrendChart data={charts.movementTrends} />
        </div>
      </div>

      {/* Row 2 Charts: Category Distribution, Shipment Status, Expiry Risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Therapeutic Category Share</h3>
            <p className="text-xs text-slate-500">Inventory units distributed by dosage form</p>
          </div>
          <CategoryDonutChart data={charts.categoryDistribution} />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Consignment Pipeline Status</h3>
            <p className="text-xs text-slate-500">Pending, in-transit, and delayed deliveries</p>
          </div>
          <ShipmentStatusDonut data={charts.shipmentStatusDistribution} />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Expiry Risk Profile (FEFO)</h3>
            <p className="text-xs text-slate-500">Batch shelf-life distribution across network</p>
          </div>
          <ExpiryRiskChart data={charts.expiryRiskData} />
        </div>
      </div>
    </div>
  );
};