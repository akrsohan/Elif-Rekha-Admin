import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Heart,
  Calendar,
  Edit2,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { customerService } from '../../services/customerService';
import { Customer, CustomerAddress, Order } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../contexts/AuthContext';
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../services/orderService';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { canUpdateCustomers } = usePermission();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Customer Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  // Address Modals
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrCountry, setAddrCountry] = useState('France');
  const [addrType, setAddrType] = useState('shipping');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, wishlist: wl, error: err } = await customerService.getCustomerById(id);
      if (err) throw err;
      if (!data) throw new Error('Client introuvable dans l’annuaire.');
      setCustomer(data);
      setWishlist(wl || []);
      setEditName(data.full_name || '');
      setEditPhone(data.phone || '');
      setEditEmail(data.email || '');
    } catch (err: any) {
      setError(err.message || 'Impossible de charger le dossier client.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !canUpdateCustomers) return;

    setSubmittingProfile(true);
    setFeedback(null);
    try {
      const { success, error: pErr } = await customerService.updateCustomerProfile({
        customerId: customer.id,
        fullName: editName,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        adminUserId: user?.id,
      });
      if (!success && pErr) throw pErr;

      setFeedback({ type: 'success', message: 'Profil client mis à jour avec succès.' });
      setIsEditProfileOpen(false);
      await fetchCustomerData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la mise à jour du profil.' });
    } finally {
      setSubmittingProfile(false);
    }
  };

  const openAddressModal = (address?: CustomerAddress) => {
    if (address) {
      setEditingAddress(address);
      setAddrRecipient(address.recipient_name || '');
      setAddrPhone(address.phone || '');
      setAddrLine(address.address_line || '');
      setAddrCity(address.city || '');
      setAddrDistrict(address.district || '');
      setAddrPostalCode(address.postal_code || '');
      setAddrCountry(address.country || 'France');
      setAddrType(address.address_type || 'shipping');
      setAddrIsDefault(Boolean(address.is_default));
    } else {
      setEditingAddress(null);
      setAddrRecipient(customer?.full_name || '');
      setAddrPhone(customer?.phone || '');
      setAddrLine('');
      setAddrCity('');
      setAddrDistrict('');
      setAddrPostalCode('');
      setAddrCountry('France');
      setAddrType('shipping');
      setAddrIsDefault(false);
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !canUpdateCustomers) return;

    setSubmittingAddress(true);
    setFeedback(null);
    try {
      if (editingAddress) {
        // Update
        const { success, error: aErr } = await customerService.updateCustomerAddress({
          addressId: editingAddress.id,
          customerId: customer.id,
          data: {
            recipient_name: addrRecipient,
            phone: addrPhone,
            address_line: addrLine,
            city: addrCity,
            district: addrDistrict,
            postal_code: addrPostalCode,
            country: addrCountry,
            address_type: addrType,
            is_default: addrIsDefault,
          },
          adminUserId: user?.id,
        });
        if (!success && aErr) throw aErr;
        setFeedback({ type: 'success', message: 'Adresse mise à jour avec succès.' });
      } else {
        // Create
        const { success, error: aErr } = await customerService.createCustomerAddress({
          customerId: customer.id,
          data: {
            recipient_name: addrRecipient,
            phone: addrPhone,
            address_line: addrLine,
            city: addrCity,
            district: addrDistrict,
            postal_code: addrPostalCode,
            country: addrCountry,
            address_type: addrType,
            is_default: addrIsDefault,
          },
          adminUserId: user?.id,
        });
        if (!success && aErr) throw aErr;
        setFeedback({ type: 'success', message: 'Nouvelle adresse enregistrée au carnet.' });
      }

      setIsAddressModalOpen(false);
      await fetchCustomerData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la sauvegarde de l’adresse.' });
    } finally {
      setSubmittingAddress(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-[#E5DFD5]">
        <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
        <p className="font-fashion text-[10.5px] uppercase tracking-widest text-[#7A7162]">
          Consultation du dossier client...
        </p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-8 bg-white border border-[#E5DFD5] text-center space-y-4 shadow-xs">
        <AlertCircle className="w-8 h-8 mx-auto text-red-700" />
        <h2 className="font-brand text-2xl text-[#0A1C14]">Dossier Client Inaccessible</h2>
        <p className="font-serif italic text-sm text-[#665D4F] max-w-md mx-auto">{error}</p>
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'Annuaire</span>
        </Link>
      </div>
    );
  }

  const avgOrderValue = customer.total_orders && customer.total_orders > 0
    ? (customer.total_spent || 0) / customer.total_orders
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to="/admin/customers"
            className="inline-flex items-center gap-1.5 font-fashion text-[9.5px] uppercase tracking-[0.2em] text-[#8C7355] hover:text-[#0A1C14] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cercle des Clients</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
              {customer.full_name}
            </h1>
            <span className="px-2.5 py-0.5 bg-[#FAF8F5] border border-[#DDD5C7] text-[#575043] font-fashion text-[9.5px] uppercase tracking-wider">
              {customer.user_id ? 'Compte Privilège Enregistré' : 'Commande Invitée'}
            </span>
          </div>
          <div className="font-serif italic text-xs text-[#6E6657] mt-1 flex items-center gap-2">
            <span>Inscrit le {new Date(customer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[#8C7355]">UUID: {customer.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchCustomerData}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canUpdateCustomers && (
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Modifier Coordonnées</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alert */}
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
            className="text-[10px] uppercase font-fashion underline ml-2 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Key Client Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-white border border-[#E5DFD5] p-4 shadow-xs">
          <div className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">Volume Commandes</div>
          <div className="font-brand text-2xl text-[#0A1C14] mt-1 font-medium">{customer.total_orders || 0}</div>
          <div className="text-[10px] text-[#8E8474] mt-0.5">Commandes passées</div>
        </div>

        <div className="bg-white border border-[#E5DFD5] p-4 shadow-xs">
          <div className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">Dépenses Cumulées</div>
          <div className="font-brand text-2xl text-[#0A1C14] mt-1 font-medium">
            {Number(customer.total_spent || 0).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            EUR
          </div>
          <div className="text-[10px] text-[#8E8474] mt-0.5">Valeur client à vie (LTV)</div>
        </div>

        <div className="bg-white border border-[#E5DFD5] p-4 shadow-xs">
          <div className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">Panier Moyen (AOV)</div>
          <div className="font-brand text-2xl text-[#0A1C14] mt-1 font-medium">
            {Number(avgOrderValue).toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            EUR
          </div>
          <div className="text-[10px] text-[#8E8474] mt-0.5">Moyenne par acquisition</div>
        </div>

        <div className="bg-white border border-[#E5DFD5] p-4 shadow-xs">
          <div className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">Dernier Achat</div>
          <div className="font-brand text-lg text-[#0A1C14] mt-1 truncate">
            {customer.last_order_at
              ? new Date(customer.last_order_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Aucun achat'}
          </div>
          <div className="text-[10px] text-[#8E8474] mt-0.5">Activité de commande</div>
        </div>
      </div>

      {/* Main Grid: Orders & Addresses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Left 2 Columns: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5DFD5] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E5DFD5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Historique des Commandes ({customer.orders?.length || 0})
                </h3>
              </div>
            </div>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#F2ECE3] font-fashion text-[9px] uppercase tracking-wider text-[#786E5E] bg-white">
                      <th className="py-3 px-4">N° Commande</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Articles</th>
                      <th className="py-3 px-4">Statut</th>
                      <th className="py-3 px-4 text-right">Montant</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2ECE3]">
                    {customer.orders.map((ord) => {
                      const st = ORDER_STATUS_OPTIONS.find((s) => s.value === ord.order_status) || {
                        label: ord.order_status,
                        colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
                      };
                      return (
                        <tr key={ord.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                          <td className="py-3 px-4">
                            <Link
                              to={`/admin/orders/${ord.id}`}
                              className="font-brand font-medium text-sm text-[#0A1C14] hover:text-[#8C7355] underline decoration-[#DDD5C7]"
                            >
                              #{ord.order_number}
                            </Link>
                          </td>
                          <td className="py-3 px-4 text-[#575043]">
                            {new Date(ord.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-[#575043]">
                            {ord.order_items?.length || 0} pièces
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 font-fashion text-[8.5px] uppercase border ${st.colorClass}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-[#0A1C14]">
                            {Number(ord.total_amount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                            {ord.currency || 'EUR'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              to={`/admin/orders/${ord.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-fashion uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14]"
                            >
                              <span>Détails</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center space-y-2">
                <ShoppingBag className="w-6 h-6 mx-auto text-[#DDD5C7]" />
                <p className="font-serif italic text-xs text-[#8E8474]">
                  Ce client n'a encore finalisé aucune commande.
                </p>
              </div>
            )}
          </div>

          {/* Customer Wishlist Section if available */}
          {wishlist.length > 0 && (
            <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F2ECE3] pb-2">
                <Heart className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Pièces Préférées / Wishlist ({wishlist.length})
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {wishlist.map((it) => {
                  const prod = it.products;
                  const primaryImg = prod?.product_images?.find((img: any) => img.is_primary)?.image_url;
                  return (
                    <div key={it.id} className="p-2.5 bg-[#FAF8F5] border border-[#E5DFD5] space-y-1.5 text-xs">
                      {primaryImg ? (
                        <img
                          src={primaryImg}
                          alt={prod?.name}
                          className="w-full h-24 object-cover border border-[#DDD5C7]"
                        />
                      ) : (
                        <div className="w-full h-24 bg-[#E5DFD5]/40 flex items-center justify-center text-[#8C7355]">
                          <Heart className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                      <div className="font-brand font-medium truncate text-[#0A1C14]">{prod?.name || 'Pièce'}</div>
                      <div className="text-[11px] text-[#8C7355]">
                        {Number(prod?.price || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} EUR
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Identity & Address Book */}
        <div className="space-y-6">
          {/* Identity & Coordinates Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Coordonnées Client
                </h3>
              </div>
              {canUpdateCustomers && (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] underline cursor-pointer"
                >
                  Éditer
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Nom :</span>
                <span className="font-medium text-sm text-[#0A1C14]">{customer.full_name}</span>
              </div>

              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Téléphone :</span>
                <div className="flex items-center gap-1.5 text-[#0A1C14] mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>{customer.phone || 'Non renseigné'}</span>
                </div>
              </div>

              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Courriel :</span>
                <div className="flex items-center gap-1.5 text-[#0A1C14] mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>{customer.email || 'Non renseigné'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Book Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Carnet d'Adresses ({customer.customer_addresses?.length || 0})
                </h3>
              </div>
              {canUpdateCustomers && (
                <button
                  type="button"
                  onClick={() => openAddressModal()}
                  className="inline-flex items-center gap-1 font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Ajouter</span>
                </button>
              )}
            </div>

            {customer.customer_addresses && customer.customer_addresses.length > 0 ? (
              <div className="space-y-3">
                {customer.customer_addresses.map((addr) => (
                  <div key={addr.id} className="p-3 bg-[#FAF8F5] border border-[#E5DFD5] text-xs space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-fashion text-[9px] uppercase tracking-wider text-[#0A1C14] font-semibold">
                          {addr.recipient_name}
                        </span>
                        {addr.is_default && (
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] uppercase font-fashion">
                            Défaut
                          </span>
                        )}
                      </div>
                      {canUpdateCustomers && (
                        <button
                          type="button"
                          onClick={() => openAddressModal(addr)}
                          className="text-[9px] font-fashion uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] underline cursor-pointer"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                    <div className="text-[#575043]">{addr.address_line}</div>
                    <div className="text-[#575043]">
                      {addr.district ? `${addr.district}, ` : ''}
                      {addr.city} {addr.postal_code || ''}
                    </div>
                    <div className="font-fashion uppercase text-[9px] text-[#786E5E]">{addr.country}</div>
                    {addr.phone && <div className="text-[10.5px] text-[#8C7355]">Tél: {addr.phone}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-serif italic text-xs text-[#8E8474]">
                Aucune adresse enregistrée dans le carnet client.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Edit Customer Profile */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div>
              <div className="font-fashion text-[9px] uppercase tracking-[0.2em] text-[#8C7355] font-semibold">
                Relations Publiques
              </div>
              <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
                Modifier les Coordonnées Client
              </h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Nom Complet
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Numéro de Téléphone
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Adresse Courriel
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  disabled={submittingProfile}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submittingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Address */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div>
              <div className="font-fashion text-[9px] uppercase tracking-[0.2em] text-[#8C7355] font-semibold">
                Carnet d'Adresses
              </div>
              <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
                {editingAddress ? 'Modifier l’Adresse' : 'Ajouter une Adresse'}
              </h3>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3 text-xs">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Nom du Destinataire
                </label>
                <input
                  type="text"
                  required
                  value={addrRecipient}
                  onChange={(e) => setAddrRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Téléphone Destinataire
                </label>
                <input
                  type="tel"
                  value={addrPhone}
                  onChange={(e) => setAddrPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Rue & Numéro (Adresse)
                </label>
                <input
                  type="text"
                  required
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  placeholder="ex. 12 Rue du Faubourg Saint-Honoré"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Ville
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Paris"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Code Postal
                  </label>
                  <input
                    type="text"
                    value={addrPostalCode}
                    onChange={(e) => setAddrPostalCode(e.target.value)}
                    placeholder="75008"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Quartier / District
                  </label>
                  <input
                    type="text"
                    value={addrDistrict}
                    onChange={(e) => setAddrDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>
                <div>
                  <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                    Pays
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCountry}
                    onChange={(e) => setAddrCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="addrDefaultCheck"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="accent-[#0A1C14] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="addrDefaultCheck" className="text-xs text-[#0A1C14] cursor-pointer">
                  Définir comme adresse principale par défaut
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  disabled={submittingAddress}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingAddress}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submittingAddress ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
