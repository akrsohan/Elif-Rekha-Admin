import React, { useState, useEffect, useCallback } from 'react';
import {
  Scissors,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  Lock,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { ProductMaterial } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const MaterialsPage: React.FC = () => {
  const { canManageMaterials } = usePermission();

  const [materials, setMaterials] = useState<ProductMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<ProductMaterial | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [materialToDelete, setMaterialToDelete] = useState<ProductMaterial | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await catalogService.getMaterials();
      if (err) throw err;
      setMaterials(data || []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les matières premières.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreateModal = () => {
    setEditingMaterial(null);
    setFormName('');
    setFormDescription('');
    setFormOrigin('');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: ProductMaterial) => {
    setEditingMaterial(mat);
    setFormName(mat.name);
    setFormDescription(mat.description || '');
    setFormOrigin(mat.origin || '');
    setFormIsActive(mat.is_active);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMaterials) {
      setFeedback({
        type: 'error',
        message: 'Action non autorisée : privilège requis.',
      });
      return;
    }

    if (!formName.trim()) {
      setFeedback({
        type: 'error',
        message: 'Le nom de la matière est obligatoire.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingMaterial) {
        const { error: updErr } = await catalogService.updateMaterial(editingMaterial.id, {
          name: formName.trim(),
          description: formDescription.trim() || null,
          origin: formOrigin.trim() || null,
          is_active: formIsActive,
        });
        if (updErr) throw updErr;
        setFeedback({ type: 'success', message: 'Matière mise à jour.' });
      } else {
        const { error: insErr } = await catalogService.createMaterial({
          name: formName.trim(),
          description: formDescription.trim() || null,
          origin: formOrigin.trim() || null,
          is_active: formIsActive,
        });
        if (insErr) throw insErr;
        setFeedback({ type: 'success', message: 'Matière enregistrée au répertoire.' });
      }

      setIsModalOpen(false);
      await fetchMaterials();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete || !canManageMaterials) return;
    setDeleteLoading(true);
    try {
      await catalogService.deleteMaterial(materialToDelete.id);
      setMaterialToDelete(null);
      setFeedback({ type: 'success', message: 'Matière retirée avec succès.' });
      await fetchMaterials();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
      setMaterialToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-fashion text-[9px] uppercase tracking-[0.25em] text-[#6E6657] font-semibold mb-1">
            <span>Catalogue Officiel</span>
            <span>•</span>
            <span className="text-[#0A1C14]">Étoffes & Noblesse</span>
          </div>
          <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
            Matières Premières & Étoffes
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-[#5C5548] max-w-xl mt-1">
            Répertoire des soies de Côme, laines vierges d'Écosse, cachemires et broderies artisanales.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchMaterials}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageMaterials ? (
            <button
              id="btn-new-material"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Nouvelle Matière</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-400 font-fashion text-[9.5px] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Gestion Verrouillée</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3.5 border flex items-start gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{feedback.message}</div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[10px] uppercase font-fashion underline ml-2"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Materials List */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E5DFD5]">
          <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
          <p className="font-fashion text-[10px] uppercase tracking-widest text-[#7A7162]">
            Chargement des matières...
          </p>
        </div>
      ) : materials.length === 0 ? (
        <div className="border border-[#E5DFD5] bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#8C7355]">
            <Scissors className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
              Aucune Matière Référencée
            </h3>
            <p className="font-serif italic text-sm text-[#665D4F] max-w-md mx-auto">
              La table <code className="font-mono text-xs bg-[#FAF8F5] px-1 py-0.5 border border-[#E5DFD5]">public.product_materials</code> ne comporte encore aucune ligne.
            </p>
          </div>
          {canManageMaterials && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em]"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Créer la Première Matière</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DFD5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5DFD5] font-fashion text-[9px] uppercase tracking-[0.2em] text-[#6E6657]">
                  <th className="py-3 px-4">Matière</th>
                  <th className="py-3 px-4">Provenance (origin)</th>
                  <th className="py-3 px-4">Description de Tissage</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {materials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3.5 px-4 font-brand text-sm text-[#0A1C14] font-medium tracking-wide">
                      {mat.name}
                    </td>

                    <td className="py-3.5 px-4 font-serif italic text-xs text-[#8C7355]">
                      {mat.origin ? (
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#8C7355]" />
                          <span>{mat.origin}</span>
                        </div>
                      ) : (
                        <span className="text-[#AAA090]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#665D4F] max-w-sm truncate">
                      {mat.description || <span className="text-[#AAA090] italic">—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 font-fashion text-[9px] uppercase tracking-wider border ${
                          mat.is_active
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {mat.is_active ? 'Active' : 'Inactif'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {canManageMaterials ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(mat)}
                            className="p-1.5 text-[#524B3F] hover:text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setMaterialToDelete(mat)}
                            className="p-1.5 text-[#991B1B] hover:text-[#7F1D1D] hover:bg-[#FDF2F2] transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[#AAA090] text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="font-brand text-lg text-[#0A1C14] font-medium tracking-wide pb-2 border-b border-[#F2ECE3]">
              {editingMaterial ? `Modifier Matière : ${editingMaterial.name}` : 'Nouvelle Matière d’Étoffe'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Nom de la Matière <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex. Soie Mulberry 22 Momme"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Provenance / Moulin (origin)
                </label>
                <input
                  type="text"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  placeholder="Lac de Côme, Italie"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Description / Caractéristiques de Tissage
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Filature délicate, toucher peau de pêche, respirabilité..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="mat_is_active"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#0A1C14] cursor-pointer"
                />
                <label
                  htmlFor="mat_is_active"
                  className="font-fashion text-[9.5px] uppercase tracking-wider text-[#0A1C14] cursor-pointer font-medium"
                >
                  Matière Disponible dans l'Atelier
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(materialToDelete)}
        title={`Retirer la matière "${materialToDelete?.name}"`}
        message="Cette matière sera supprimée de la bibliothèque de l'atelier. Les fiches produits liées perdront cette association."
        confirmLabel="Supprimer"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setMaterialToDelete(null)}
      />
    </div>
  );
};
