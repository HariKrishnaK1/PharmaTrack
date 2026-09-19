import React, { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, ExternalLink, File, FileBadge } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const formatBytes = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType) => {
  const t = (fileType || '').toUpperCase();
  if (t === 'PDF') return <FileBadge className="w-4 h-4 text-red-500" />;
  if (['JPG', 'JPEG', 'PNG'].includes(t)) return <File className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-slate-500" />;
};

export const DocumentUploader = ({ entityType, entityId, documents = [], onUpdate, canDelete = true }) => {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [docName, setDocName] = useState('');
  const fileInputRef = useRef(null);
  const toast = useToast();

  const token = localStorage.getItem('pharmatrack_token');

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('name', docName || file.name);

    setUploading(true);
    try {
      const endpoint = entityType === 'batch'
        ? `${API_BASE}/documents/batches/${entityId}/documents`
        : `${API_BASE}/documents/shipments/${entityId}/documents`;

      const res = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Document uploaded successfully.');
      onUpdate(res.data.document);
      setDocName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document? This action cannot be undone.')) return;
    setDeleting(docId);
    try {
      const endpoint = entityType === 'batch'
        ? `${API_BASE}/documents/batches/${entityId}/documents/${docId}`
        : `${API_BASE}/documents/shipments/${entityId}/documents/${docId}`;

      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Document deleted.');
      onUpdate(null, docId); // signal deletion
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
        <FileText className="w-4 h-4 text-teal-600" /> Documents & Attachments
        <span className="ml-1 text-[11px] font-normal text-slate-400">(PDF, Images, Word, Excel — max 10MB)</span>
      </h3>

      {/* Existing documents */}
      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/70 transition group"
            >
              <div className="shrink-0">{getFileIcon(doc.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">{doc.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {doc.fileType} · {formatBytes(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition"
                  title="Open document"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc._id)}
                    disabled={deleting === doc._id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition"
                    title="Delete document"
                  >
                    {deleting === doc._id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Trash2 className="w-3.5 h-3.5" />
                    }
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400 italic">No documents attached yet.</p>
      )}

      {/* Upload zone */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 space-y-3 hover:border-teal-400 transition">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="Document name (optional, e.g. Certificate of Analysis)"
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition
            ${uploading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
            }`}
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading...' : 'Choose & Upload'}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>
    </div>
  );
};
