import React, { useState } from 'react';
import { Camera, Upload, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import API from '../../api';

export default function PhotoUploader({ isOpen, onClose, profile, onPhotoUpdated }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation: jpg/png/webp, max 2 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Please upload JPG, PNG, or WEBP.');
      return;
    }

    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxSize) {
      setError('Image size exceeds the 2 MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          const res = await API.post('/profile/photo/upload', {
            photo_data: base64Data,
            target_user_id: profile?.id
          });

          setSuccessMsg('Profile photo updated!');
          if (onPhotoUpdated) {
            onPhotoUpdated(res.data.photo_url);
          }
          setTimeout(() => {
            setUploading(false);
            onClose();
          }, 800);
        } catch (err) {
          console.error('Photo upload failed:', err);
          setError(err.response?.data?.error || err.message || 'Failed to upload photo');
          setUploading(false);
        }
      };
    } catch (err) {
      console.error('File reading failed:', err);
      setError('Failed to read selected image file.');
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;

    setUploading(true);
    setError(null);

    try {
      await API.delete(`/profile/photo?target_user_id=${profile?.id || ''}`);
      setSuccessMsg('Photo removed');
      if (onPhotoUpdated) {
        onPhotoUpdated(null);
      }
      setTimeout(() => {
        setUploading(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Photo removal failed:', err);
      setError(err.response?.data?.error || err.message || 'Failed to remove photo');
      setUploading(false);
    }
  };

  const currentPhoto = previewUrl || profile?.photo_url;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative text-center">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Profile Photo</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Photo Preview */}
        <div className="mb-6 flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-slate-100 shadow-md relative overflow-hidden bg-slate-100 flex items-center justify-center">
            {currentPhoto ? (
              <img src={currentPhoto} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-extrabold text-slate-400">
                {profile?.initials || 'EP'}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            JPG, PNG, or WEBP up to 2 MB
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <label className={`w-full bg-[#022851] hover:bg-[#03376e] text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <Upload className="w-4 h-4" />
            <span>{selectedFile ? 'Change File' : 'Select Photo'}</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <span>{uploading ? 'Uploading...' : 'Save New Photo'}</span>
            </button>
          )}

          {profile?.photo_url && !selectedFile && (
            <button
              onClick={handleRemovePhoto}
              disabled={uploading}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Photo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
