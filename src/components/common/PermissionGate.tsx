import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PermissionGateProps {
  hasPermission: boolean;
  requiredPermission?: string;
  fallbackMessage?: string;
  children: React.ReactNode;
  showCardFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  hasPermission,
  requiredPermission,
  fallbackMessage,
  children,
  showCardFallback = false,
}) => {
  if (hasPermission) {
    return <>{children}</>;
  }

  if (!showCardFallback) {
    return null;
  }

  return (
    <div className="bg-white border border-[#E5DFD5] p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
      <div className="w-12 h-12 mx-auto bg-[#FDF2F2] border border-[#F8B4B4] flex items-center justify-center text-[#991B1B] mb-4">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <span className="font-fashion text-[9.5px] uppercase tracking-[0.25em] text-[#991B1B] font-semibold">
        Autorisation Insuffisante
      </span>
      <h2 className="font-brand text-xl text-[#0A1C14] mt-2 mb-3">
        Accès Restreint
      </h2>
      <p className="font-serif italic text-sm text-[#665D4F] leading-relaxed mb-6">
        {fallbackMessage ||
          `Votre rôle administrateur ne dispose pas du privilège "${requiredPermission || 'requis'}" nécessaire pour effectuer cette opération.`}
      </p>
      <Link
        to="/admin/catalog/products"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] hover:bg-[#143325] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Retour au Catalogue</span>
      </Link>
    </div>
  );
};
