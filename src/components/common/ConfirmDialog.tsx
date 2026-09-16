import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDestructive = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-xl relative space-y-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-[#8A8172] hover:text-[#0A1C14] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 shrink-0 flex items-center justify-center border ${
              isDestructive
                ? 'bg-[#FDF2F2] border-[#F8B4B4] text-[#991B1B]'
                : 'bg-[#FAF8F5] border-[#DDD5C7] text-[#8C7355]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand text-lg text-[#0A1C14] font-medium tracking-wide">
              {title}
            </h3>
            <p className="font-sans text-xs text-[#665D4F] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white'
                : 'bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5]'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Traitement...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
