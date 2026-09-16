import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Star,
  Lock,
} from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { Collection } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CollectionsPage: React.FC = () => {
  const { canManageCollections } = usePermission();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formFeatured, setFormFeatured] = useState<boolean>(false);
  const [formSortOrder, setFormSortOrder] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await catalogService.getCollections();
      if (err) throw err;
      setCollections(data || []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les collections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const openCreateModal = () => {
    setEditingCollection(null);
    setFormName('');
    setFormSlug('');
    setFormDescription('');
    setFormImageUrl('');
    setFormStatus('active');
    setFormFeatured(false);
    setFormSortOrder(collections.length);
    setIsModalOpen(true);
  };

  const openEditModal = (col: Collection) => {
    setEditingCollection(col);
    setFormName(col.name);
    setFormSlug(col.slug);
    setFormDescription(col.description || '');
    setFormImageUrl(col.image_url || '');
    setFormStatus((col.status as any) || 'active');
    setFormFeatured(Boolean(col.featured));
    setFormSortOrder(col.sort_order ?? 0);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCollection) {
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
    if (!canManageCollections) {
      setFeedback({
        type: 'error',
        message: 'Action non autorisée : privilège "Manage Collections" requis.',
      });
      return;
    }

    if (!formName.trim() || !formSlug.trim()) {
      setFeedback({
        type: 'error',
        message: 'Le nom et le slug de la collection sont obligatoires.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingCollection) {
        const { error: updErr } = await catalogService.updateCollection(editingCollection.id, {
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          status: formStatus,
          featured: formFeatured,
          sort_order: Number(formSortOrder) || 0,
        });
        if (updErr) throw updErr;
        setFeedback({ type: 'success', message: 'Collection mise à jour avec succès.' });
      } else {
        const { error: insErr } = await catalogService.createCollection({
          name: formName.trim(),
          slug: formSlug.trim(),
          description: formDescription.trim() || null,
          image_url: formImageUrl.trim() || null,
          status: formStatus,
          featured: formFeatured,
          sort_order: Number(formSortOrder) || 0,
        });
        if (insErr) throw insErr;
        setFeedback({ type: 'success', message: 'Collection créée avec succès.' });
      }

      setIsModalOpen(false);
      await fetchCollections();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la sauvegarde.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete || !canManageCollections) return;
    setDeleteLoading(true);
    try {
      await catalogService.deleteCollection(collectionToDelete.id);
      setCollectionToDelete(null);
      setFeedback({ type: 'success', message: 'Collection retirée avec succès.' });
      await fetchCollections();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
      setCollectionToDelete(null);
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
            <span className="text-[#0A1C14]">Éditions & Saisons</span>
          </div>
          <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
            Collections & Défilés
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-[#5C5548] max-w-xl mt-1">
            Lignes saisonnières (Automne-Hiver, Printemps-Été, Capsule Mariage, Héritage).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchCollections}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageCollections ? (
            <button
              id="btn-new-collection"
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.25em] font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Nouvelle Collection</span>
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

      {/* Collections List */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white border border-[#E5DFD5]">
          <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
          <p className="font-fashion text-[10px] uppercase tracking-widest text-[#7A7162]">
            Chargement des collections...
          </p>
        </div>
      ) : collections.length === 0 ? (
        <div className="border border-[#E5DFD5] bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 mx-auto bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#8C7355]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
              Aucune Collection Enregistrée
            </h3>
            <p className="font-serif italic text-sm text-[#665D4F] max-w-md mx-auto">
              La table <code className="font-mono text-xs bg-[#FAF8F5] px-1 py-0.5 border border-[#E5DFD5]">public.collections</code> ne contient encore aucune entrée.
            </p>
          </div>
          {canManageCollections && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em]"
            >
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Créer la Première Collection</span>
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
                  <th className="py-3 px-4">Collection</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                  <th className="py-3 px-4 text-center">Vedette</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2ECE3]">
                {collections.map((col) => (
                  <tr key={col.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8A8172] w-14">
                      #{col.sort_order ?? 0}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {col.image_url ? (
                          <img
                            src={col.image_url}
                            alt={col.name}
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
                            {col.name}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-[#7A7162]">
                      {col.slug}
                    </td>

                    <td className="py-3 px-4 text-[#665D4F] max-w-sm truncate">
                      {col.description || <span className="text-[#AAA090] italic">—</span>}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 font-fashion text-[9px] uppercase tracking-wider border ${
                          col.status === 'active'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : col.status === 'draft'
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {col.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      {col.featured ? (
                        <Star className="w-4 h-4 text-[#C5A880] fill-[#C5A880] mx-auto" />
                      ) : (
                        <span className="text-[#CCC0B0]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canManageCollections ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(col)}
                            className="p-1.5 text-[#524B3F] hover:text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCollectionToDelete(col)}
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
              {editingCollection ? `Modifier Collection : ${editingCollection.name}` : 'Nouvelle Collection'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Nom de la Collection <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ex. Automne-Hiver 2026 : Éclipse"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Slug URL <span className="text-red-700">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="automne-hiver-2026-eclipse"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  URL de la Bannière / Couverture
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-sans text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Manifeste Éditorial
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Inspirations, jeux de drapés et silhouettes du défilé..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Statut
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14]"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Brouillon</option>
                    <option value="archived">Archivée</option>
                  </select>
                </div>

                <div>
                  <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Ordre
                  </label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono text-[#0A1C14]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="col_featured"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 accent-[#0A1C14] cursor-pointer"
                  />
                  <label
                    htmlFor="col_featured"
                    className="font-fashion text-[9px] uppercase tracking-wider text-[#0A1C14] cursor-pointer font-medium"
                  >
                    Mise en Avant
                  </label>
                </div>
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
        isOpen={Boolean(collectionToDelete)}
        title={`Retirer la collection "${collectionToDelete?.name}"`}
        message="Cette action détachera les produits associés et supprimera la collection. Êtes-vous certain de vouloir continuer ?"
        confirmLabel="Supprimer"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setCollectionToDelete(null)}
      />
    </div>
  );
};
