import React, { useState } from 'react';
import { ProductVariant } from '../../types';
import { Plus, Trash2, Layers, Check, AlertCircle } from 'lucide-react';

interface VariantManagerProps {
  variants: Array<
    Partial<ProductVariant> & {
      quantity?: number;
    }
  >;
  onChange: (
    variants: Array<
      Partial<ProductVariant> & {
        quantity?: number;
      }
    >
  ) => void;
  basePrice?: number;
  disabled?: boolean;
}

export const ProductVariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onChange,
  basePrice = 0,
  disabled = false,
}) => {
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [colorHex, setColorHex] = useState('#000000');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!size.trim() && !color.trim() && !sku.trim()) {
      setError('Veuillez au moins indiquer une taille, une couleur ou une référence SKU.');
      return;
    }

    // Check duplicate size + color combination
    const isDuplicate = variants.some(
      (v) =>
        (v.size || '').toLowerCase() === size.trim().toLowerCase() &&
        (v.color || '').toLowerCase() === color.trim().toLowerCase()
    );

    if (isDuplicate && size.trim() && color.trim()) {
      setError('Cette combinaison taille/couleur existe déjà.');
      return;
    }

    setError(null);

    const newVar: Partial<ProductVariant> & { quantity?: number } = {
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      color_hex: color.trim() ? colorHex : undefined,
      sku: sku.trim() || undefined,
      price: price ? parseFloat(price) : basePrice,
      is_active: true,
      quantity: Number(quantity) || 0,
    };

    onChange([...variants, newVar]);
    setSize('');
    setColor('');
    setSku('');
    setPrice('');
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const handleToggleActive = (index: number) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      is_active: !updated[index].is_active,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Add Variant Box */}
      {!disabled && (
        <div className="bg-[#FAF8F5] border border-[#E5DFD5] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-fashion text-[9.5px] uppercase tracking-[0.2em] text-[#6E6657] font-semibold">
              Nouvelle Déclinaison (Taille / Teinte Couture)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div>
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                Taille
              </label>
              <input
                type="text"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="36, 38, S, M..."
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] text-xs text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
              />
            </div>

            <div>
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                Couleur
              </label>
              <div className="flex gap-1.5 items-center">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-7 h-7 p-0 border border-[#DDD5C7] cursor-pointer bg-white"
                  title="Nuancier Hex"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Noir Onyx..."
                  className="w-full px-2 py-1.5 bg-white border border-[#DDD5C7] text-xs text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
                />
              </div>
            </div>

            <div>
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                SKU Variante
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ELF-R36-BLK"
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
              />
            </div>

            <div>
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                Prix Spécifique (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={basePrice ? `${basePrice} (Base)` : 'Optionnel'}
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
              />
            </div>

            <div>
              <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                Stock Initial
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddVariant}
                className="w-full py-1.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter</span>
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-sans">{error}</p>}
        </div>
      )}

      {/* Variants List Table */}
      {variants.length === 0 ? (
        <div className="border border-dashed border-[#DDD5C7] p-6 text-center bg-white space-y-1">
          <Layers className="w-6 h-6 mx-auto text-[#AAA090]" />
          <p className="font-fashion text-[10px] uppercase tracking-wider text-[#8A8172]">
            Aucune variante configurée
          </p>
          <p className="font-serif italic text-xs text-[#AAA090]">
            Si cet article existe en plusieurs tailles ou teintes d'atelier, ajoutez-les ici.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#E5DFD5] bg-white">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#FAF8F5] border-b border-[#E5DFD5] font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">
              <tr>
                <th className="py-2.5 px-3">Taille</th>
                <th className="py-2.5 px-3">Couleur</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Prix</th>
                <th className="py-2.5 px-3 text-center">Stock</th>
                <th className="py-2.5 px-3 text-center">Statut</th>
                {!disabled && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE3]">
              {variants.map((v, idx) => (
                <tr key={v.id || idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#0A1C14]">
                    {v.size || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      {v.color_hex && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: v.color_hex }}
                        />
                      )}
                      <span className="text-[#524B3F]">{v.color || 'Standard'}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#7A7162]">
                    {v.sku || '—'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#0A1C14]">
                    {v.price ? `${v.price} €` : `${basePrice || 0} €`}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px]">
                    <span
                      className={`px-2 py-0.5 font-medium ${
                        (v.quantity ?? 0) > 3
                          ? 'bg-emerald-50 text-emerald-800'
                          : (v.quantity ?? 0) > 0
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-red-50 text-red-800'
                      }`}
                    >
                      {v.quantity ?? 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleToggleActive(idx)}
                      className={`inline-flex items-center px-2 py-0.5 text-[9px] font-fashion uppercase tracking-wider border cursor-pointer ${
                        v.is_active
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                    >
                      {v.is_active ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  {!disabled && (
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="text-[#991B1B] hover:text-[#7F1D1D] p-1 cursor-pointer"
                        title="Supprimer la déclinaison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
