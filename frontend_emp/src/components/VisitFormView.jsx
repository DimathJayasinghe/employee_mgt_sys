import React, { useState } from 'react';
import { ExternalLink, RotateCw, FileText, CheckCircle } from 'lucide-react';

export default function VisitFormView() {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const visitFormUrl = 'https://visitform-5qp.pages.dev/';

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Visiting Form</h2>
            <p className="text-xs text-slate-500">Official company client & visitor registration form</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            title="Refresh Form"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reload</span>
          </button>

          <a
            href={visitFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Web Form Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden relative min-h-[750px] flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center z-10">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-500 mt-3">Loading Visiting Form...</p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src={visitFormUrl}
          title="Visiting Form"
          onLoad={() => setIsLoading(false)}
          className="w-full h-[750px] sm:h-[820px] border-0 rounded-b-2xl"
          allow="camera; microphone; geolocation"
        />
      </div>
    </div>
  );
}
