import React from 'react';
import { CheckCircle2, Clock, Truck, AlertTriangle, XCircle } from 'lucide-react';

export const ShipmentTimeline = ({ status, statusHistory = [], expectedDate, actualDate }) => {
  const steps = [
    { key: 'PENDING', label: 'Order Created & Reserved' },
    { key: 'DISPATCHED', label: 'Dispatched from Warehouse' },
    { key: 'IN_TRANSIT', label: 'In Transit' },
    { key: 'DELIVERED', label: 'Delivered to Facility' }
  ];

  const getStepState = (stepKey) => {
    if (status === 'CANCELLED') return 'cancelled';
    if (status === 'DELAYED' && (stepKey === 'IN_TRANSIT' || stepKey === 'DISPATCHED')) return 'delayed';

    const order = ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex <= currentIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className="py-4">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-2">
        {/* Connecting line on desktop */}
        <div className="hidden md:block absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(step.key);
          const historyEntry = statusHistory.find(h => h.status === step.key);

          let circleBg = 'bg-slate-100 text-slate-400 border-slate-300';
          let textColor = 'text-slate-500';

          if (state === 'completed') {
            circleBg = 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20';
            textColor = 'text-emerald-900 font-semibold';
          } else if (state === 'delayed') {
            circleBg = 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 animate-pulse';
            textColor = 'text-rose-700 font-semibold';
          }

          return (
            <div key={step.key} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 flex-1 text-left md:text-center">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${circleBg}`}>
                {state === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : state === 'delayed' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className={`text-xs ${textColor}`}>{step.label}</div>
                {historyEntry && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(historyEntry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {status === 'DELAYED' && (
        <div className="mt-6 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2.5 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>This consignment has exceeded the planned expected delivery date ({expectedDate ? new Date(expectedDate).toLocaleDateString() : 'N/A'}). Automated operational alert triggered.</span>
        </div>
      )}
    </div>
  );
};