import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, AlertCircle, CheckCircle2, File, HardDrive, ExternalLink, Eye, X } from 'lucide-react';
import API from '../../api';

export default function DocumentsTab({ userId, isSelfOrAdmin = true }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = userId ? `/profile/documents?user_id=${userId}` : '/profile/documents';
      const res = await API.get(url);
      if (Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMsg('');

    // Client-side validation: pdf/jpg/png, max 5 MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Allowed: PDF, JPG, PNG, WEBP.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      setError('File size exceeds the 5 MB limit.');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          await API.post('/profile/documents/upload', {
            document_data: base64Data,
            document_name: file.name,
            file_type: file.type,
            user_id: userId
          });

          setSuccessMsg('Document uploaded successfully!');
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchDocuments();
        } catch (err) {
          console.error('Upload error:', err);
          setError(err.response?.data?.error || err.message || 'Failed to upload document');
        } finally {
          setUploading(false);
        }
      };
    } catch (err) {
      console.error('File read error:', err);
      setError('Failed to read selected document file.');
      setUploading(false);
    } finally {
      e.target.value = '';
    }
  };

  const handleDelete = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await API.delete(`/profile/documents/${docId}`);
      setSuccessMsg('Document deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#022851]" />
            <span>Employee Documents</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload and manage official documents (PDF, JPG, PNG up to 5 MB).
          </p>
        </div>

        {isSelfOrAdmin && (
          <label className={`bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-xs text-slate-400">Loading documents...</div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">No documents uploaded yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">Uploaded employment files will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200">
                  <File className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-slate-800 hover:text-blue-600 underline-offset-2 hover:underline truncate block"
                    title={`Click to view/open ${doc.document_name} in new tab`}
                  >
                    {doc.document_name}
                  </a>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {formatFileSize(doc.file_size)} • {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Inline UI Preview Button */}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(doc)}
                  className="p-2 text-[#022851] hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Preview / View Document in UI"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  title="Open Document in New Tab / View Link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.document_name}
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </a>

                {isSelfOrAdmin && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3 min-w-0 pr-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-100 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{previewDoc.document_name}</h3>
                  <p className="text-[11px] text-slate-500 font-medium">{formatFileSize(previewDoc.file_size)} • Inline Document Viewer</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDoc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={previewDoc.document_name}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Document Preview Container */}
            <div className="py-4 flex-1 overflow-y-auto min-h-[400px] flex items-center justify-center bg-slate-50/50 rounded-xl mt-4 border border-slate-100">
              {previewDoc.file_type?.includes('pdf') || previewDoc.file_url?.includes('application/pdf') || previewDoc.document_name?.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.file_url}
                  title={previewDoc.document_name}
                  className="w-full h-[65vh] rounded-xl border border-slate-200 shadow-inner bg-white"
                />
              ) : previewDoc.file_type?.includes('image') || previewDoc.document_name?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/) ? (
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.document_name}
                  className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-md border border-slate-200"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700 mb-1">{previewDoc.document_name}</h4>
                  <p className="text-xs text-slate-500 mb-4">No direct inline preview for this file type.</p>
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
