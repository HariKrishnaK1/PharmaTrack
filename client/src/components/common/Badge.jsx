import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const Badge = ({ status, size = 'sm' }) => {
  const norm = String(status || '').toUpperCase().trim();

  let label = norm;
  let bg = 'bg-slate-100 text-slate-700 border-slate-200';
  let Icon = HelpCircle;

  // Inventory & Stock
  if (norm === 'IN STOCK' || norm === 'HEALTHY' || norm === 'ACTIVE' || norm === 'RELEASED') {
    label = norm === 'IN STOCK' ? 'In Stock' : norm === 'HEALTHY' ? 'Healthy' : norm === 'ACTIVE' ? 'Active' : 'Released';
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  } else if (norm === 'LOW STOCK' || norm === 'EXPIRING_SOON') {
    label = norm === 'LOW STOCK' ? 'Low Stock' : 'Expiring Soon';
    bg = 'bg-amber-50 text-amber-700 border-amber-200';
    Icon = AlertTriangle;
  } else if (norm === 'OUT OF STOCK' || norm === 'CRITICAL') {
    label = norm === 'OUT OF STOCK' ? 'Out of Stock' : 'Critical (<30d)';
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    Icon = AlertOctagon;
  } else if (norm === 'EXPIRED') {
    label = 'Expired';
    bg = 'bg-slate-900 text-white border-slate-800';
    Icon = XCircle;
  } else if (norm === 'SAFE') {
    label = 'Safe (>90d)';
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = CheckCircle2;
  }

  // Shipments
  else if (norm === 'PENDING') {
    label = 'Pending';
    bg = 'bg-slate-100 text-slate-700 border-slate-300';
    Icon = Clock;
  } else if (norm === 'DISPATCHED') {
    label = 'Dispatched';
    bg = 'bg-sky-50 text-sky-700 border-sky-200';
    Icon = Truck;
  } else if (norm === 'IN_TRANSIT') {
    label = 'In Transit';
    bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    Icon = Truck;
  } else if (norm === 'DELIVERED') {
    label = 'Delivered';
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    Icon = PackageCheck;
  } else if (norm === 'DELAYED') {
    label = 'Delayed';
    bg = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
    Icon = AlertTriangle;
  } else if (norm === 'CANCELLED') {
    label = 'Cancelled';
    bg = 'bg-slate-100 text-slate-500 border-slate-200 line-through';
    Icon = XCircle;
  }

  const px = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'xs' ? 'w-3 h-3 mr-1' : 'w-3.5 h-3.5 mr-1.5';

  return (
    <span className={`inline-flex items-center font-semibold rounded-md border ${px} ${bg}`}>
      <Icon className={iconSize} />
      {label}
    </span>
  );
};