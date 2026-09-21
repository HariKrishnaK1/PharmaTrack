import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pill, ArrowLeft, Save, Loader2, AlertTriangle, Lock, LogIn } from 'lucide-react';
import { productService } from '../services/productService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AddEditProduct = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { isDemo, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    productCode: '',
    name: '',
    genericName: '',
    category: 'Tablets',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: '',
    unitOfMeasure: 'Packs',
    minimumStockLevel: 500,
    reorderLevel: 1000,
    unitPrice: 25.00,
    description: '',
    status: 'ACTIVE'
  });

  const categories = ['Tablets', 'Capsules', 'Syrups', 'Injectables', 'Creams', 'Devices', 'Inhalers', 'Supplements'];

  // Immediate alert on load in Demo Mode
  useEffect(() => {
    if (isDemo) {
      toast.warning('Demo Mode: View-Only Form. Entering details and database changes are disabled. Please log in with an authorized account.');
    }
  }, [isDemo]);

  useEffect(() => {
    if (isDemo && !isEdit) {
      // Pre-fill sample values for demonstration inspection
      setForm({
        productCode: 'PRD-DEMO-201',
        name: 'Azithromycin Dihydrate 500mg',
        genericName: 'Azithromycin',
        category: 'Tablets',
        dosageForm: 'Film-coated Tablet',
        strength: '500mg',
        manufacturer: 'Cipla Respiratory Ltd',
        unitOfMeasure: 'Strips',
        minimumStockLevel: 2500,
        reorderLevel: 5000,
        unitPrice: 125.00,
        description: 'Sample formulation preview. Broad-spectrum macrolide antibiotic. Store in a dry place below 30°C.',
        status: 'ACTIVE'
      });
      return;
    }

    if (isEdit) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const res = await productService.getProductById(id);
          const p = res.product;
          setForm({
            productCode: p.productCode || '',
            name: p.name || '',
            genericName: p.genericName || '',
            category: p.category || 'Tablets',
            dosageForm: p.dosageForm || '',
            strength: p.strength || '',
            manufacturer: p.manufacturer || '',
            unitOfMeasure: p.unitOfMeasure || 'Packs',
            minimumStockLevel: p.minimumStockLevel || 100,
            reorderLevel: p.reorderLevel || 200,
            unitPrice: p.unitPrice || 10.0,
            description: p.description || '',
            status: p.status || 'ACTIVE'
          });
        } catch (err) {
          toast.error('Failed to load product details.');
          navigate('/app/products');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit, isDemo]);

  const handleChange = (e) => {
    if (isDemo) return;
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'productCode' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDemo) {
      toast.error('Action Disabled: You must log in with an authorized account to modify the catalog.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit) {
        await productService.updateProduct(id, form);
        toast.success('Product updated successfully.');
      } else {
        await productService.createProduct(form);
        toast.success('New pharmaceutical product registered successfully.');
      }
      navigate('/app/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product formulation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/app/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
      </Link>

      {/* Demo View-Only Notice Banner */}
      {isDemo && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-start gap-3.5 shadow-2xs">
          <div className="p-2 bg-amber-500/20 text-amber-700 rounded-xl mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Demo Mode: Formulation Form Preview (View-Only)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Read Only
              </span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              You are exploring the drug catalog registration interface. Fields are disabled to protect data integrity. Please log in with an authorized account to add or edit catalog records.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5" /> Log In to Register Formulations
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="p-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {isEdit ? `Edit Formulation: ${form.name}` : 'Register New Pharmaceutical Formulation'}
            </h1>
            <p className="text-xs text-slate-500">
              Enter certified drug regulatory specifications and minimum inventory safety levels.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Product Code *
              </label>
              <input
                type="text"
                required
                name="productCode"
                disabled={isDemo || isEdit}
                value={form.productCode}
                onChange={handleChange}
                placeholder="e.g. PRD-TAB-201"
                className={`w-full px-3.5 py-2 text-xs font-mono border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand / Commercial Name *
              </label>
              <input
                type="text"
                required
                name="name"
                disabled={isDemo}
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Augmentin 625 Duo"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Generic Active Pharmaceutical Ingredient (API) *
              </label>
              <input
                type="text"
                required
                name="genericName"
                disabled={isDemo}
                value={form.genericName}
                onChange={handleChange}
                placeholder="e.g. Amoxicillin and Clavulanate Potassium"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Formulation Category *
              </label>
              <select
                name="category"
                disabled={isDemo}
                value={form.category}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Dosage Form *
              </label>
              <input
                type="text"
                required
                name="dosageForm"
                disabled={isDemo}
                value={form.dosageForm}
                onChange={handleChange}
                placeholder="e.g. Tablet, Syrup, Injection"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Strength / Concentration *
              </label>
              <input
                type="text"
                required
                name="strength"
                disabled={isDemo}
                value={form.strength}
                onChange={handleChange}
                placeholder="e.g. 500mg, 100 IU/ml"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit of Measure *
              </label>
              <input
                type="text"
                required
                name="unitOfMeasure"
                disabled={isDemo}
                value={form.unitOfMeasure}
                onChange={handleChange}
                placeholder="e.g. Strips, Vials, Bottles"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Manufacturer Organization *
              </label>
              <input
                type="text"
                required
                name="manufacturer"
                disabled={isDemo}
                value={form.manufacturer}
                onChange={handleChange}
                placeholder="e.g. GlaxoSmithKline Pharmaceuticals"
                className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                name="unitPrice"
                disabled={isDemo}
                value={form.unitPrice}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-xs font-mono border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 focus:border-teal-600'
                }`}
              />
            </div>
          </div>

          {/* Safety stock threshold card */}
          <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-teal-900 uppercase tracking-wider mb-1.5">
                Minimum Safety Stock Level *
              </label>
              <input
                type="number"
                required
                min="0"
                name="minimumStockLevel"
                disabled={isDemo}
                value={form.minimumStockLevel}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-xs font-mono border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-teal-200 focus:border-teal-600'
                }`}
              />
              <span className="text-[10px] text-teal-700 mt-1 block">Triggers LOW STOCK operational alert when available stock drops below this.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-900 uppercase tracking-wider mb-1.5">
                Reorder Recommendation Level *
              </label>
              <input
                type="number"
                required
                min="0"
                name="reorderLevel"
                disabled={isDemo}
                value={form.reorderLevel}
                onChange={handleChange}
                className={`w-full px-3.5 py-2 text-xs font-mono border rounded-lg focus:outline-none ${
                  isDemo
                    ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                    : 'bg-white border-teal-200 focus:border-teal-600'
                }`}
              />
              <span className="text-[10px] text-teal-700 mt-1 block">Recommended automatic replenishment batch size.</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description & Storage Specifications
            </label>
            <textarea
              rows={3}
              name="description"
              disabled={isDemo}
              value={form.description}
              onChange={handleChange}
              placeholder="Clinical indication, temperature storage requirements, etc."
              className={`w-full px-3.5 py-2 text-xs border rounded-lg focus:outline-none ${
                isDemo
                  ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:border-teal-600'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/app/products')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Back to Catalog
            </button>
            <button
              type="submit"
              disabled={isDemo || submitting}
              className={`flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg transition shadow-sm ${
                isDemo
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {isDemo ? (
                <>
                  <Lock className="w-4 h-4" /> Log In Required to Save
                </>
              ) : submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Update Formulation' : 'Register Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};