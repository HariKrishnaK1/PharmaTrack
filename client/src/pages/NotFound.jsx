import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="p-4 bg-teal-50 text-teal-700 rounded-2xl mb-4 border border-teal-200">
        <Pill className="w-10 h-10 rotate-45" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404 - Formulation Not Found</h1>
      <p className="text-xs text-slate-500 mt-2 max-w-sm">
        The pharmaceutical resource, consignment, or operational endpoint you requested does not exist on this network node.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};