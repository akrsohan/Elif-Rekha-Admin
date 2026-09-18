import React, { useState } from 'react';
import { ProductVariant } from '../../types';
import { Plus, Trash2, Tag, Check, Sparkles } from 'lucide-react';

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
  productCode?: string;
  disabled?: boolean;
}

const COMMON_SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

export const ProductVariantManager: React.FC<VariantManagerProps> = ({
  variants,
  onChange,
  basePrice = 0,
  productCode = '',
  disabled = false,
}) => {
  const [newSizeInput, setNewSizeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Add a size entry
  const handleAddSize = (sizeValue: string) => {
    const trimmed = sizeValue.trim();
    if (!trimmed) {
      setError('Please enter a size name (e.g. S, M, L, XL, Free Size).');
      return;
    }

    // Check duplicate size
    const isDuplicate = variants.some(
      (v) => (v.size || '').toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Size "${trimmed}" is already added to this product.`);
      return;
    }

    setError(null);

    const generatedSku = productCode
      ? `${productCode}-${trimmed.toUpperCase().replace(/\s+/g, '')}`
      : undefined;

    const newVar: Partial<ProductVariant> & { quantity?: number } = {
      size: trimmed,
      sku: generatedSku,
      price: basePrice,
      is_active: true,
      quantity: 10, // default starting stock
    };

    onChange([...variants, newVar]);
    setNewSizeInput('');
  };

  const handleRemove = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const handleUpdateSizeName = (index: number, newName: string) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      size: newName,
      sku: productCode ? `${productCode}-${newName.toUpperCase().replace(/\s+/g, '')}` : updated[index].sku,
    };
    onChange(updated);
  };

  const handleUpdateQuantity = (index: number, qty: number) => {
    const updated = [...variants];
    updated[index] = {
      ...updated[index],
      quantity: Math.max(0, qty),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Quick size preset chips */}
      {!disabled && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-xs font-medium text-[#6E736B]">
              Quick Add Presets:
            </span>
            <span className="font-sans text-[11px] text-[#8A9288]">
              Click to quickly add common sizes
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COMMON_SIZE_PRESETS.map((preset) => {
              const isAlreadyAdded = variants.some(
                (v) => (v.size || '').toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => handleAddSize(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all flex items-center gap-1 cursor-pointer ${
                    isAlreadyAdded
                      ? 'bg-[#EAF4EE] text-[#2D6636] border border-[#D2E4D8] opacity-70 cursor-not-allowed'
                      : 'bg-white text-[#18281B] border border-[#DED6BE] hover:border-[#18281B] hover:bg-[#FAF7EB]'
                  }`}
                >
                  {isAlreadyAdded ? <Check className="w-3 h-3 text-[#2D6636]" /> : <Plus className="w-3 h-3 text-[#7A8278]" />}
                  <span>{preset}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Sizes List matching user requested individual boxes */}
      <div className="space-y-2">
        <label className="block font-sans text-xs font-semibold text-[#18281B]">
          Available Sizes ({variants.length})
        </label>

        {variants.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-[#DED6BE] bg-[#FAF7EB]/40 text-center">
            <Tag className="w-6 h-6 mx-auto text-[#8A9288] mb-1.5" />
            <p className="font-sans text-xs font-medium text-[#18281B]">No sizes added yet</p>
            <p className="font-sans text-[11px] text-[#6E736B] mt-0.5">
              Add sizes using the quick presets above or enter custom sizes below.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {variants.map((v, idx) => (
              <div
                key={v.id || idx}
                className="flex items-center justify-between gap-2 p-2.5 bg-white border border-[#DED6BE] rounded-lg shadow-2xs hover:border-[#18281B]/40 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#FAF7EB] border border-[#DED6BE] flex items-center justify-center font-sans font-semibold text-xs text-[#18281B] shrink-0">
                    {idx + 1}
                  </div>
                  <input
                    type="text"
                    disabled={disabled}
                    value={v.size || ''}
                    onChange={(e) => handleUpdateSizeName(idx, e.target.value)}
                    placeholder="Size"
                    className="w-full font-sans text-xs font-semibold text-[#18281B] bg-transparent focus:outline-none focus:border-b focus:border-[#18281B] px-1 py-0.5"
                  />
                </div>

                {/* Stock input */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-sans text-[11px] text-[#7A8278]">Qty:</span>
                  <input
                    type="number"
                    min="0"
                    disabled={disabled}
                    value={v.quantity ?? 10}
                    onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 0)}
                    className="w-14 px-1.5 py-1 bg-[#FAF7EB]/50 border border-[#DED6BE] rounded text-xs font-mono text-[#18281B] text-center focus:outline-none focus:bg-white"
                    title="Available stock"
                  />
                </div>

                {/* Remove button */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1.5 text-[#991B1B] hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                    title={`Remove size ${v.size}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Add Size input and button */}
      {!disabled && (
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
            <input
              type="text"
              value={newSizeInput}
              onChange={(e) => setNewSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSize(newSizeInput);
                }
              }}
              placeholder="Enter size (e.g. 38, S, M, XL, Custom)..."
              className="flex-1 px-3.5 py-2.5 bg-white border border-[#DED6BE] rounded-lg text-xs font-sans text-[#18281B] placeholder-[#8A9288] focus:outline-none focus:border-[#18281B]"
            />
            <button
              type="button"
              onClick={() => handleAddSize(newSizeInput)}
              className="px-4 py-2.5 bg-[#18281B] hover:bg-[#2D6636] text-white rounded-lg text-xs font-sans font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Size</span>
            </button>
          </div>
          {error && <p className="text-xs text-rose-600 font-sans mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
};
