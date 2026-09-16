import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, ArrowLeft, Shield, Sparkles, Layers, CheckCircle2 } from 'lucide-react';

interface ModulePlaceholderProps {
  title?: string;
  section?: string;
  description?: string;
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderProps> = ({
  title,
  section,
  description,
}) => {
  const location = useLocation();

  // Derive nice readable title from path if not provided
  const pathParts = location.pathname.split('/').filter(Boolean);
  const derivedTitle =
    title ||
    pathParts[pathParts.length - 1]
      ?.split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') ||
    'Module';

  const derivedSection =
    section ||
    (pathParts.length > 2
      ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1)
      : 'Atelier Management');

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 font-fashion text-[9px] tracking-[0.25em] uppercase text-[#7D7566]">
        <Link to="/admin/dashboard" className="hover:text-[#0A1C14] transition-colors">
          Tableau de Bord
        </Link>
        <span className="text-[#C5A880]">/</span>
        <span>{derivedSection}</span>
        <span className="text-[#C5A880]">/</span>
        <span className="text-[#0A1C14] font-semibold">{derivedTitle}</span>
      </div>

      {/* Main Content Box */}
      <div className="bg-white border border-[#E5DFD5] p-8 sm:p-12 relative shadow-[0_2px_12px_-4px_rgba(10,28,20,0.03)] text-center max-w-3xl mx-auto">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#0A1C14]" />

        <div className="w-12 h-12 mx-auto bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#8C7355] mb-5">
          <Clock className="w-5 h-5 text-[#8C7355]" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] border border-[#DDD5C7] font-fashion text-[9px] uppercase tracking-[0.25em] text-[#6E6657] font-semibold mb-3">
          <span>Module en cours de déploiement</span>
          <span>•</span>
          <span className="text-[#0A1C14]">Phase Suivante</span>
        </div>

        <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-[0.1em] mb-3">
          {derivedTitle}
        </h1>

        <p className="font-serif italic text-sm text-[#5C5548] max-w-md mx-auto leading-relaxed mb-8">
          {description ||
            `Ce module de l'atelier ELIF (${derivedSection}) est prévu dans la feuille de route. Actuellement, la console administrative se concentre sur l'authentification sécurisée, la vérification des rôles et le tableau de bord principal.`}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left mb-8">
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E5DFD5] space-y-1">
            <span className="font-fashion text-[9px] uppercase tracking-wider text-[#7A7162] block">
              Contrôle de Sécurité
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#0A1C14] font-sans font-medium">
              <Shield className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>RLS & RBAC Définis</span>
            </div>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E5DFD5] space-y-1">
            <span className="font-fashion text-[9px] uppercase tracking-wider text-[#7A7162] block">
              Backend Supabase
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#0A1C14] font-sans font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tables Raccordées</span>
            </div>
          </div>
        </div>

        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#143325] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour au Tableau de Bord</span>
        </Link>
      </div>
    </div>
  );
};
