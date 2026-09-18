import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Layers,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { Category } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CategoriesPage: React.FC = () => {
  const { canManageCategories } = usePermission();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await catalogService.getCategories();
      if (err) throw err;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les catégories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('');
    setFormSortOrder(categories.length);
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDescription(cat.description || '');
    setFormImageUrl(cat.image_url || '');
    setFormSortOrder(cat.sort_order ?? 0);
    setFormIsActive(cat.is_active);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const slugified = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormSlug(slugified);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCategories) {
      setFeedback({
        type: 'error',
        message: 'Action non autorisée : privilège "Manage Categories" requis.',
      });
      return;
    }

    if (!formName.trim() || !formSlug.trim()) {
      setFeedback({
        type: 'error',
        message: 'Le nom et le slug de la catégorie sont obligatoires.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingCategory) {
        const { error: updErr } = await catalogService.updateCategory(editingCategory.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        });
        if (updErr) throw updErr;
        setFeedback({ type: 'success', message: 'Catégorie mise à jour avec succès.' });
      } else {
        const { error: insErr } = await catalogService.createCategory({
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          sort_order: Number(formSortOrder) || 0,
          is_active: formIsActive,
        });
        if (insErr) throw insErr;
        setFeedback({ type: 'success', message: 'Catégorie créée avec succès.' });
      }

      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (cat: Category) => {
    if (!canManageCategories) return;
    try {
      await catalogService.updateCategory(cat.id, {
        is_active: !cat.is_active,
      });
      await fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Impossible de modifier le statut.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete || !canManageCategories) return;
    setDeleteLoading(true);
    try {
      await catalogService.deleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
      setFeedback({ type: 'success', message: 'Catégorie supprimée de la base.' });
      await fetchCategories();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
      setCategoryToDelete(null);
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
            <span className="text-[#0A1C14]">Architecture</span>
          </div>
          <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
            Catégories d'Atelier
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-[#5C5548] max-w-xl mt-1">
            Organisation hiérarchique du vestiaire (Robes du Soir, Tailleurs, Manteaux Couture, Accessoires).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageCategories ? (
            <button
              id="btn-new-category"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Nouvelle Catégorie</span>
            </button>
          ) : (
            <div className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-400 font-fashion text-[9.5px] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Gestion Verrouillée</span>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Categories List */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E5DFD5]">
          <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
          <p className="font-fashion text-[10px] uppercase tracking-widest text-[#7A7162]">
            Chargement des catégories...
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-[#E5DFD5] bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#8C7355]">
            <Tag className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
              Aucune Catégorie
            </h3>
            <p className="font-serif italic text-sm text-[#665D4F] max-w-md mx-auto">
              La table <code className="font-mono text-xs bg-[#FAF8F5] px-1 py-0.5 border border-[#E5DFD5]">public.categories</code> ne contient encore aucune ligne.
            </p>
          </div>
          {canManageCategories && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em]"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Créer la Première Catégorie</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#E5DFD5] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5DFD5] font-fashion text-[9px] uppercase tracking-[0.2em] text-[#6E6657]">
                  <th className="py-3 px-4">Ordre</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4">Slug Unique</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8A8172] w-14">
                      #{cat.sort_order ?? 0}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt={cat.name}
                            className="w-9 h-11 object-cover border border-[#E5DFD5] bg-[#FAF8F5]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-9 h-11 border border-[#E5DFD5] bg-[#FAF8F5] flex items-center justify-center text-[#AAA090]">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span className="font-brand text-sm text-[#0A1C14] font-medium tracking-wide block">
                            {cat.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#7A7162]">
                      {cat.slug}
                    </td>

                    <td className="py-3 px-4 text-[#665D4F] max-w-sm truncate">
                      {cat.description || <span className="text-[#AAA090] italic">—</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        disabled={!canManageCategories}
                        onClick={() => handleToggleActive(cat)}
                        className={`inline-block px-2.5 py-0.5 font-fashion text-[9px] uppercase tracking-wider border cursor-pointer ${
                          cat.is_active
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {cat.is_active ? 'Active' : 'Désactivée'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManageCategories ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-[#524B3F] hover:text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
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

      {/* Create / Edit Modal - Simple Category Name Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18281B]/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#DED6BE] max-w-md w-full p-6 rounded-xl shadow-xl space-y-4">
            <h3 className="font-sans text-base font-semibold text-[#18281B] pb-2 border-b border-[#EBE4D2]">
              {editingCategory ? `Edit Category` : 'Add Category'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-sans text-xs font-medium text-[#18281B] mb-1.5">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Women, Outerwear, Knitwear, Leather..."
                  className="w-full px-3.5 py-2.5 bg-[#FAF7EB]/50 border border-[#DED6BE] rounded-lg text-xs text-[#18281B] focus:bg-white focus:outline-none focus:border-[#2D6636]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EBE4D2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent text-[#5A6258] hover:text-[#18281B] font-sans text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-category"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#18281B] hover:bg-[#2D6636] text-white font-sans text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving Category...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title={`Supprimer la catégorie "${categoryToDelete?.name}"`}
        message="Cette action supprimera définitivement la catégorie si aucun produit n'y est rattaché. Êtes-vous certain de vouloir continuer ?"
        confirmLabel="Supprimer"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
