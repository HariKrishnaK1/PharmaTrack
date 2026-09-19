import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, CalendarClock, Building2, Truck, X, Loader2 } from 'lucide-react';
import { searchService } from '../../services/searchService';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchService.searchGlobal(query);
        setResults(res.results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pharmaceutical products, batch numbers, warehouses, shipments..."
            className="w-full bg-transparent border-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0 ml-2" />
          ) : (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!results && !loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 2 characters to search across live database records...
            </div>
          )}

          {results && (
            <>
              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-teal-600" /> Products
                  </div>
                  <div className="space-y-1">
                    {results.products.map(p => (
                      <div
                        key={p._id}
                        onClick={() => handleSelect(`/app/products/${p._id}`)}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 group-hover:text-teal-700">{p.name}</span>
                          <span className="ml-2 font-mono text-[10px] text-slate-400">[{p.productCode}]</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200/60 text-slate-600">{p.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batches */}
              {results.batches?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-amber-600" /> Batches
                  </div>
                  <div className="space-y-1">
                    {results.batches.map(b => (
                      <div
                        key={b._id}
                        onClick={() => handleSelect(`/app/batches/${b._id}`)}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-mono font-semibold text-slate-800 group-hover:text-amber-700">{b.batchNumber}</span>
                          <span className="ml-2 text-slate-500">{b.product?.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{b.supplier}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warehouses */}
              {results.warehouses?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" /> Warehouses
                  </div>
                  <div className="space-y-1">
                    {results.warehouses.map(w => (
                      <div
                        key={w._id}
                        onClick={() => handleSelect(`/app/warehouses/${w._id}`)}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-semibold text-slate-800 group-hover:text-blue-700">{w.name}</span>
                          <span className="ml-2 font-mono text-[10px] text-slate-400">[{w.code}]</span>
                        </div>
                        <span className="text-slate-500">{w.location?.city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shipments */}
              {results.shipments?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-indigo-600" /> Shipments
                  </div>
                  <div className="space-y-1">
                    {results.shipments.map(s => (
                      <div
                        key={s._id}
                        onClick={() => handleSelect(`/app/shipments/${s._id}`)}
                        className="p-2 rounded-lg hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs group"
                      >
                        <div>
                          <span className="font-mono font-semibold text-slate-800 group-hover:text-indigo-700">{s.shipmentId}</span>
                          <span className="ml-2 text-slate-500">→ {s.destination?.facilityName}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-700">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.products?.length === 0 &&
                results.batches?.length === 0 &&
                results.warehouses?.length === 0 &&
                results.shipments?.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No results found matching "{query}".
                  </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};