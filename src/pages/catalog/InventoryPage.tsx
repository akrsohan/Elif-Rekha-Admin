import React, { useState, useEffect } from 'react';
import {
  Boxes,
  RefreshCw,
  Search,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { usePermission } from '../../hooks/usePermission';

export const InventoryPage: React.FC = () => {
  const { canManageInventory } = usePermission();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await catalogService.getProducts({ pageSize: 100 });
      setProducts(data || []);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Impossible de charger l’inventaire.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Flatten products into variant rows or product rows
  const inventoryRows: Array<{
    productId: string;
    productName: string;
    productCode: string | null;
    variantId?: string;
    size?: string;
    color?: string;
    sku?: string;
    price: number;
    quantity: number;
  }> = [];

  products.forEach((prod) => {
    if (prod.product_variants && prod.product_variants.length > 0) {
      prod.product_variants.forEach((v: any) => {
        inventoryRows.push({
          productId: prod.id,
          productName: prod.name,
          productCode: prod.product_code,
          variantId: v.id,
          size: v.size,
          color: v.color,
          sku: v.sku || prod.product_code,
          price: v.price || prod.price,
          quantity: v.quantity ?? 10,
        });
      });
    } else {
      inventoryRows.push({
        productId: prod.id,
        productName: prod.name,
        productCode: prod.product_code,
        variantId: undefined,
        sku: prod.product_code,
        price: prod.price,
        quantity: 10,
      });
    }
  });

  const filteredRows = inventoryRows.filter((row) => {
    const matchesSearch =
      row.productName.toLowerCase().includes(search.toLowerCase()) ||
      (row.sku && row.sku.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStock === 'low') return row.quantity > 0 && row.quantity <= 3;
    if (filterStock === 'out') return row.quantity === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-fashion text-[9px] uppercase tracking-[0.25em] text-[#6E6657] font-semibold mb-1">
            <span>Catalogue Officiel</span>
            <span>•</span>
            <span className="text-[#0A1C14]">Stocks & Pièces Uniques</span>
          </div>
          <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
            Inventaire de l'Atelier
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-[#5C5548] max-w-xl mt-1">
            Suivi des exemplaires disponibles en boutique, en réserve d'atelier et pour commandes sur mesure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchInventory}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser les stocks"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5DFD5] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8A8172] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrer par création ou référence SKU..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStock('all')}
            className={`px-3 py-1.5 font-fashion text-[9.5px] uppercase tracking-wider border cursor-pointer ${
              filterStock === 'all'
                ? 'bg-[#0A1C14] text-[#FAF8F5] border-[#0A1C14]'
                : 'bg-white text-[#575043] border-[#DDD5C7]'
            }`}
          >
            Tous ({inventoryRows.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStock('low')}
            className={`px-3 py-1.5 font-fashion text-[9.5px] uppercase tracking-wider border cursor-pointer ${
              filterStock === 'low'
                ? 'bg-amber-800 text-white border-amber-800'
                : 'bg-white text-amber-800 border-[#DDD5C7]'
            }`}
          >
            Stock Faible (≤3)
          </button>
          <button
            type="button"
            onClick={() => setFilterStock('out')}
            className={`px-3 py-1.5 font-fashion text-[9.5px] uppercase tracking-wider border cursor-pointer ${
              filterStock === 'out'
                ? 'bg-red-800 text-white border-red-800'
                : 'bg-white text-red-800 border-[#DDD5C7]'
            }`}
          >
            Rupture (0)
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E5DFD5]">
          <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
          <p className="font-fashion text-[10px] uppercase tracking-widest text-[#7A7162]">
            Synchronisation de l'inventaire...
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="border border-[#E5DFD5] bg-white p-12 text-center space-y-3 shadow-xs">
          <Boxes className="w-8 h-8 mx-auto text-[#AAA090]" />
          <h3 className="font-brand text-lg text-[#0A1C14] font-medium tracking-wide">
            Aucun Article d'Inventaire
          </h3>
          <p className="font-serif italic text-xs text-[#665D4F]">
            Aucune pièce répertoriée avec ces critères.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5DFD5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5DFD5] font-fashion text-[9px] uppercase tracking-[0.2em] text-[#6E6657]">
                  <th className="py-3 px-4">Création Haute Couture</th>
                  <th className="py-3 px-4">Référence SKU</th>
                  <th className="py-3 px-4">Taille / Teinte</th>
                  <th className="py-3 px-4">Prix Vente</th>
                  <th className="py-3 px-4 text-center">Quantité Disponible</th>
                  <th className="py-3 px-4 text-center">Statut Disponibilité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-brand text-sm text-[#0A1C14] font-medium tracking-wide">
                      {row.productName}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#7A7162]">
                      {row.sku || row.productCode || '—'}
                    </td>

                    <td className="py-3.5 px-4">
                      {row.size || row.color ? (
                        <div className="flex items-center gap-2 text-[11px] text-[#524B3F]">
                          {row.size && (
                            <span className="font-medium bg-[#FAF8F5] px-1.5 py-0.5 border border-[#E5DFD5]">
                              {row.size}
                            </span>
                          )}
                          {row.color && <span>{row.color}</span>}
                        </div>
                      ) : (
                        <span className="text-[#AAA090] italic text-[11px]">Pièce Unique</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#0A1C14]">
                      {row.price} €
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 font-semibold ${
                          row.quantity > 3
                            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            : row.quantity > 0
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-red-50 text-red-900 border border-red-200'
                        }`}
                      >
                        {row.quantity} en stock
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-fashion text-[9px] uppercase tracking-wider ${
                          row.quantity > 3
                            ? 'text-emerald-700'
                            : row.quantity > 0
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {row.quantity > 3
                          ? 'En Réserve'
                          : row.quantity > 0
                          ? 'Derniers Exemplaires'
                          : 'Rupture d’Atelier'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
