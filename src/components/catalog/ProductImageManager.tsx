import React, { useState } from 'react';
import { ProductImage } from '../../types';
import { Plus, Trash2, Star, Image as ImageIcon, AlertCircle, Info } from 'lucide-react';

interface ProductImageManagerProps {
  images: Array<{
    id?: string;
    image_url: string;
    alt_text?: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  onChange: (
    images: Array<{
      id?: string;
      image_url: string;
      alt_text?: string;
      is_primary: boolean;
      sort_order: number;
    }>
  ) => void;
  disabled?: boolean;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onChange,
  disabled = false,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    // Validate URL basic format
    try {
      new URL(newUrl.trim());
    } catch {
      setError('Veuillez saisir une URL d’image valide (https://...)');
      return;
    }

    setError(null);
    const isFirst = images.length === 0;
    const newImage = {
      image_url: newUrl.trim(),
      alt_text: newAlt.trim() || undefined,
      is_primary: isFirst,
      sort_order: images.length,
    };

    onChange([...images, newImage]);
    setNewUrl('');
    setNewAlt('');
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    // If we removed the primary, designate the first one as primary
    if (images[index].is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Storage Bucket Notice as requested */}
      <div className="p-3 bg-[#FAF8F5] border border-[#DDD5C7] flex items-start gap-2.5 text-xs text-[#524B3F]">
        <Info className="w-4 h-4 text-[#8C7355] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-sans">
            <strong className="font-medium text-[#0A1C14]">Gestion des Visuels Haute Définition :</strong> Vous pouvez renseigner des URLs sécurisées (CDN, Supabase Storage ou hébergement d'atelier).
          </p>
          <p className="font-serif italic text-[11px] text-[#7A7162]">
            Note : Le bucket Supabase Storage <code className="font-mono bg-white px-1 py-0.5 border border-[#E5DFD5]">product-images</code> n'est pas encore provisionné. Les images sont référencées via la table officielle <code className="font-mono bg-white px-1 py-0.5 border border-[#E5DFD5]">public.product_images</code>.
          </p>
        </div>
      </div>

      {/* Add Image Form */}
      {!disabled && (
        <div className="bg-[#FAF8F5] border border-[#E5DFD5] p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                URL de l'image (HTTPS)
              </label>
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-... ou URL CDN"
                className="w-full px-3 py-2 bg-white border border-[#DDD5C7] text-xs font-sans text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                Texte alternatif (Alt Text)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  placeholder="ex. Robe de Soie - Vue Face"
                  className="w-full px-3 py-2 bg-white border border-[#DDD5C7] text-xs font-sans text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-3 py-2 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-wider transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {error && <p className="text-xs text-red-600 font-sans">{error}</p>}
        </div>
      )}

      {/* Image Gallery List */}
      {images.length === 0 ? (
        <div className="border border-dashed border-[#DDD5C7] p-8 text-center bg-white space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-[#AAA090]" />
          <p className="font-fashion text-[10px] uppercase tracking-wider text-[#8A8172]">
            Aucune image rattachée
          </p>
          <p className="font-serif italic text-xs text-[#AAA090]">
            Ajoutez au moins une photo pour le rendu catalogue et la miniature.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className={`group relative bg-white border ${
                img.is_primary ? 'border-[#0A1C14] ring-1 ring-[#0A1C14]' : 'border-[#E5DFD5]'
              } p-2 shadow-xs transition-all`}
            >
              <div className="aspect-3/4 w-full bg-[#FAF8F5] overflow-hidden flex items-center justify-center relative">
                <img
                  src={img.image_url}
                  alt={img.alt_text || `Vue produit ${idx + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback on broken image
                    (e.target as HTMLImageElement).src =
                      'https://placehold.co/400x533/FAF8F5/8C7355?text=Aperçu+Indisponible';
                  }}
                />
                {img.is_primary && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[8px] uppercase tracking-wider font-semibold">
                    Principale
                  </span>
                )}
              </div>

              <div className="mt-2 text-[10px] text-[#7A7162] truncate">
                {img.alt_text || `Vue n°${idx + 1}`}
              </div>

              {!disabled && (
                <div className="mt-2 flex items-center justify-between pt-1 border-t border-[#F2ECE3]">
                  {!img.is_primary ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] flex items-center gap-1 cursor-pointer"
                    >
                      <Star className="w-3 h-3" />
                      <span>Définir</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-[#0A1C14] font-semibold">Défaut</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-[#991B1B] hover:text-[#7F1D1D] p-1 cursor-pointer"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
