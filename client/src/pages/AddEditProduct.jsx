import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Pill, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { productService } from '../services/productService';
import { useToast } from '../context/ToastContext';

export const AddEditProduct = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

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

  useEffect(() => {
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
          navigate('/products');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'productCode' ? value.toUpperCase() : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await productService.updateProduct(id, form);
        toast.success('Product updated successfully.');
      } else {
        await productService.createProduct(form);
        toast.success('New pharmaceutical product registered successfully.');
      }
      navigate('/products');
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
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products Catalog
      </Link>

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
                disabled={isEdit}
                value={form.productCode}
                onChange={handleChange}
                placeholder="e.g. PRD-TAB-201"
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Trade / Brand Name *
              </label>
              <input
                type="text"
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Paracetamol 650mg Tablets"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Generic / Active Ingredient (API) *
              </label>
              <input
                type="text"
                required
                name="genericName"
                value={form.genericName}
                onChange={handleChange}
                placeholder="e.g. Acetaminophen / Paracetamol"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Therapeutic Category *
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
                value={form.dosageForm}
                onChange={handleChange}
                placeholder="e.g. Film-coated Tablet"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Strength *
              </label>
              <input
                type="text"
                required
                name="strength"
                value={form.strength}
                onChange={handleChange}
                placeholder="e.g. 650mg or 20mg/5ml"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
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
                value={form.unitOfMeasure}
                onChange={handleChange}
                placeholder="e.g. Strips of 10"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Manufacturer / Formulation Lab *
              </label>
              <input
                type="text"
                required
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                placeholder="e.g. Apex Pharma Laboratories"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="unitPrice"
                value={form.unitPrice}
                onChange={handleChange}
                placeholder="25.00"
                className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-teal-50/50 border border-teal-100">
            <div>
              <label className="block text-xs font-semibold text-teal-900 uppercase tracking-wider mb-1.5">
                Minimum Stock Safety Level *
              </label>
              <input
                type="number"
                required
                min="0"
                name="minimumStockLevel"
                value={form.minimumStockLevel}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-teal-200 rounded-lg focus:outline-none focus:border-teal-600"
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
                value={form.reorderLevel}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-xs font-mono bg-white border border-teal-200 rounded-lg focus:outline-none focus:border-teal-600"
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
              value={form.description}
              onChange={handleChange}
              placeholder="Clinical indication, temperature storage requirements, etc."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition shadow-sm shadow-teal-600/20 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Update Formulation' : 'Register Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};