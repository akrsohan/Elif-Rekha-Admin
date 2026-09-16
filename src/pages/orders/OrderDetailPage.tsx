import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Lock,
  Plus,
} from 'lucide-react';
import {
  orderService,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../contexts/AuthContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canUpdateOrders, canManagePayments, canManageDelivery } = usePermission();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Status Change Dialog
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [statusNote, setStatusNote] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Internal Audit Note Form
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Payment Status Dialog
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPaymentStatus, setTargetPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentProvider, setPaymentProvider] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Shipment Dialog
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [shipmentStatus, setShipmentStatus] = useState('shipped');
  const [submittingShipment, setSubmittingShipment] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await orderService.getOrderById(id);
      if (err) throw err;
      if (!data) throw new Error('Commande introuvable dans les archives de la maison.');
      setOrder(data);
      setNewStatus(data.order_status);
      if (data.payments?.[0]) {
        setTargetPaymentStatus(data.payments[0].status as PaymentStatus);
        setPaymentProvider(data.payments[0].provider || '');
      }
      if (data.shipments?.[0]) {
        setCourierName(data.shipments[0].courier_name || '');
        setTrackingNumber(data.shipments[0].tracking_number || '');
        setTrackingUrl(data.shipments[0].tracking_url || '');
        setShipmentStatus(data.shipments[0].status || 'pending');
      }
    } catch (err: any) {
      setError(err.message || 'Impossible de charger la commande.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canUpdateOrders) return;
    setSubmittingStatus(true);
    setFeedback(null);
    try {
      const { success, error: updErr } = await orderService.updateOrderStatus({
        orderId: order.id,
        newStatus,
        note: statusNote || undefined,
        adminUserId: user?.id,
      });
      if (!success && updErr) throw updErr;

      setFeedback({
        type: 'success',
        message: `Statut mis à jour vers "${newStatus}" et consigné à l'historique d'audit.`,
      });
      setIsStatusModalOpen(false);
      setStatusNote('');
      await fetchOrder();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors du changement de statut.' });
    } finally {
      setSubmittingStatus(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canUpdateOrders || !internalNoteText.trim()) return;
    setSubmittingNote(true);
    setFeedback(null);
    try {
      const { success, error: noteErr } = await orderService.addInternalOrderNote({
        orderId: order.id,
        note: internalNoteText.trim(),
        adminUserId: user?.id,
      });
      if (!success && noteErr) throw noteErr;

      setFeedback({
        type: 'success',
        message: 'Note interne enregistrée dans le journal de suivi de commande.',
      });
      setInternalNoteText('');
      await fetchOrder();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Impossible d’enregistrer la note.' });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canManagePayments) return;
    const payment = order.payments?.[0];
    if (!payment) {
      setFeedback({ type: 'error', message: 'Aucun enregistrement de paiement à modifier.' });
      return;
    }

    setSubmittingPayment(true);
    setFeedback(null);
    try {
      const { success, error: pErr } = await orderService.updatePaymentRecord({
        paymentId: payment.id,
        orderId: order.id,
        status: targetPaymentStatus,
        provider: paymentProvider,
        adminUserId: user?.id,
      });
      if (!success && pErr) throw pErr;

      setFeedback({ type: 'success', message: 'Informations de règlement mises à jour avec succès.' });
      setIsPaymentModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la mise à jour du paiement.' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleShipmentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !canManageDelivery) return;
    const shipment = order.shipments?.[0];
    if (!shipment) {
      setFeedback({ type: 'error', message: 'Aucun enregistrement de transport à modifier.' });
      return;
    }

    setSubmittingShipment(true);
    setFeedback(null);
    try {
      const { success, error: sErr } = await orderService.updateShipmentRecord({
        shipmentId: shipment.id,
        orderId: order.id,
        status: shipmentStatus,
        courier_name: courierName,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        adminUserId: user?.id,
      });
      if (!success && sErr) throw sErr;

      setFeedback({ type: 'success', message: 'Coordonnées de suivi et expédition mises à jour.' });
      setIsShipmentModalOpen(false);
      await fetchOrder();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de la mise à jour de l’expédition.' });
    } finally {
      setSubmittingShipment(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-[#E5DFD5]">
        <div className="w-8 h-8 mx-auto border-2 border-[#8C7355] border-t-transparent rounded-full animate-spin" />
        <p className="font-fashion text-[10.5px] uppercase tracking-widest text-[#7A7162]">
          Consultation du registre de commande...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-white border border-[#E5DFD5] text-center space-y-4 shadow-xs">
        <AlertCircle className="w-8 h-8 mx-auto text-red-700" />
        <h2 className="font-brand text-2xl text-[#0A1C14]">Commande Inaccessible</h2>
        <p className="font-serif italic text-sm text-[#665D4F] max-w-md mx-auto">{error}</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au Registre</span>
        </Link>
      </div>
    );
  }

  const orderAddress = order.order_addresses?.[0];
  const payment = order.payments?.[0];
  const shipment = order.shipments?.[0];
  const orderStatusConfig = ORDER_STATUS_OPTIONS.find((s) => s.value === order.order_status) || {
    label: order.order_status,
    colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
  };
  const paymentStatusConfig = PAYMENT_STATUS_OPTIONS.find((p) => p.value === order.payment_status) || {
    label: order.payment_status,
    colorClass: 'bg-stone-100 text-stone-700 border-stone-200',
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 font-fashion text-[9.5px] uppercase tracking-[0.2em] text-[#8C7355] hover:text-[#0A1C14] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Registre des Commandes</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-brand text-2xl sm:text-3xl text-[#0A1C14] font-normal tracking-wide">
              Commande #{order.order_number}
            </h1>
            <span
              className={`px-2.5 py-1 font-fashion text-[9.5px] uppercase tracking-wider border ${orderStatusConfig.colorClass}`}
            >
              {orderStatusConfig.label}
            </span>
            <span
              className={`px-2.5 py-1 font-fashion text-[9.5px] uppercase tracking-wider border ${paymentStatusConfig.colorClass}`}
            >
              {paymentStatusConfig.label}
            </span>
          </div>
          <div className="font-serif italic text-xs text-[#6E6657] mt-1 flex items-center gap-2">
            <span>Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[#8C7355]">ID: {order.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchOrder}
            disabled={loading}
            className="p-2.5 bg-white border border-[#DDD5C7] text-[#0A1C14] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 text-[#8C7355] ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canUpdateOrders ? (
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Changer Statut</span>
            </button>
          ) : (
            <div className="px-3 py-2 bg-stone-100 border border-stone-200 text-stone-400 font-fashion text-[9px] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              <span>Modification Réservée</span>
            </div>
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Left 2 Columns: Items & Audit Trail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E5DFD5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Pièces d’Étoffe Commandées ({order.order_items?.length || 0})
                </h3>
              </div>
              <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">
                Atelier Confection
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#F2ECE3] font-fashion text-[9px] uppercase tracking-wider text-[#786E5E] bg-white">
                    <th className="py-3 px-4">Article</th>
                    <th className="py-3 px-4">Variante / Taille</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2ECE3]">
                  {(order.order_items || []).map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF8F5]/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-brand font-medium text-sm text-[#0A1C14]">
                          {item.product_name}
                        </div>
                        {item.sku && (
                          <div className="font-mono text-[10.5px] text-[#8C7355]">
                            SKU: {item.sku}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#575043]">
                        <div className="flex items-center gap-2">
                          {item.size && (
                            <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#DDD5C7] font-fashion text-[9.5px] uppercase">
                              Taille: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs text-[#575043] italic">
                              {item.color}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-[#0A1C14]">
                        × {item.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#575043]">
                        {Number(item.unit_price || 0).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {order.currency || 'EUR'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-[#0A1C14]">
                        {Number(item.total_price || 0).toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {order.currency || 'EUR'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="p-4 sm:p-6 bg-[#FAF8F5] border-t border-[#E5DFD5]">
              <div className="max-w-xs ml-auto space-y-2 text-xs">
                <div className="flex justify-between text-[#6E6657]">
                  <span>Sous-total articles :</span>
                  <span className="font-medium text-[#0A1C14]">
                    {Number(order.subtotal || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                    {order.currency}
                  </span>
                </div>

                {Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Remise privilégiée :</span>
                    <span>
                      - {Number(order.discount_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                      {order.currency}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[#6E6657]">
                  <span>Frais de livraison :</span>
                  <span className="font-medium text-[#0A1C14]">
                    {Number(order.delivery_fee || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                    {order.currency}
                  </span>
                </div>

                {Number(order.tax_amount) > 0 && (
                  <div className="flex justify-between text-[#6E6657]">
                    <span>TVA / Taxes applicables :</span>
                    <span className="font-medium text-[#0A1C14]">
                      {Number(order.tax_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                      {order.currency}
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#DDD5C7] flex justify-between items-baseline">
                  <span className="font-fashion text-[10px] uppercase tracking-[0.2em] text-[#0A1C14] font-semibold">
                    Montant Total :
                  </span>
                  <span className="font-brand text-xl text-[#0A1C14] font-medium">
                    {Number(order.total_amount || 0).toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {order.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Instructions Note */}
          {order.customer_notes && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 shadow-xs space-y-1">
              <div className="flex items-center gap-2 font-fashion text-[9.5px] uppercase tracking-wider text-amber-900 font-semibold">
                <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                <span>Instructions Spéciales du Client (Visible)</span>
              </div>
              <p className="font-serif italic text-xs text-amber-950">
                "{order.customer_notes}"
              </p>
            </div>
          )}

          {/* Status Timeline & Audit Trail */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Historique d'Audit & Statuts (order_status_history)
                </h3>
              </div>
              <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657]">
                {order.order_status_history?.length || 0} entrées
              </span>
            </div>

            {/* Add internal note form */}
            {canUpdateOrders && (
              <form onSubmit={handleAddInternalNote} className="space-y-2 bg-[#FAF8F5] p-3 border border-[#E5DFD5]">
                <label className="block font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] font-semibold">
                  Consigner une Note Interne d'Atelier (Confidentiel Admin)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="ex. Retouche demandée avant expédition, vérification couture doublure..."
                    className="flex-1 px-3 py-1.5 bg-white border border-[#DDD5C7] text-xs text-[#0A1C14] focus:outline-none focus:border-[#0A1C14]"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !internalNoteText.trim()}
                    className="px-4 py-1.5 bg-[#0A1C14] text-[#FAF8F5] font-fashion text-[9.5px] uppercase tracking-wider disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    {submittingNote ? 'Ajout...' : 'Ajouter'}
                  </button>
                </div>
              </form>
            )}

            {/* History List */}
            {order.order_status_history && order.order_status_history.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-[#E5DFD5] space-y-4 pt-2">
                {order.order_status_history.map((hist) => {
                  const toCfg = ORDER_STATUS_OPTIONS.find((s) => s.value === hist.new_status);
                  return (
                    <div key={hist.id} className="relative text-xs">
                      {/* Bullet */}
                      <span className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full border-2 border-white bg-[#8C7355]" />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-fashion text-[9.5px] uppercase tracking-wider font-semibold text-[#0A1C14]">
                          {hist.old_status ? `${hist.old_status} ➔ ${hist.new_status}` : hist.new_status}
                        </span>
                        {toCfg && (
                          <span className={`px-1.5 py-0.2 font-fashion text-[8.5px] uppercase border ${toCfg.colorClass}`}>
                            {toCfg.label}
                          </span>
                        )}
                        <span className="text-[10.5px] text-[#8E8474]">
                          {new Date(hist.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {hist.note && (
                        <p className="font-serif italic text-[#575043] mt-1 bg-[#FAF8F5] p-2 border border-[#F2ECE3]">
                          "{hist.note}"
                        </p>
                      )}
                      {hist.changed_by && (
                        <div className="font-mono text-[9px] text-[#A89F90] mt-0.5">
                          Auteur UUID: {hist.changed_by}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-serif italic text-xs text-[#8E8474] py-3 text-center">
                Aucun historique de statut enregistré pour cette commande.
              </p>
            )}
          </div>
        </div>

        {/* Right 1 Column: Customer, Address, Payment, Shipment cards */}
        <div className="space-y-6">
          {/* Customer Profile Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Client & Profil
                </h3>
              </div>
              {order.customer_id && (
                <Link
                  to={`/admin/customers/${order.customer_id}`}
                  className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] underline"
                >
                  Fiche Client
                </Link>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Nom :</span>
                <span className="font-medium text-sm text-[#0A1C14]">
                  {order.customers?.full_name || orderAddress?.recipient_name || 'Client Invité'}
                </span>
              </div>

              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Téléphone :</span>
                <div className="flex items-center gap-1.5 text-[#0A1C14] mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>{order.customers?.phone || orderAddress?.phone || 'Non renseigné'}</span>
                </div>
              </div>

              <div>
                <span className="font-fashion text-[9px] uppercase tracking-wider text-[#6E6657] block">Courriel :</span>
                <div className="flex items-center gap-1.5 text-[#0A1C14] mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#8C7355]" />
                  <span>{order.customers?.email || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F2ECE3]">
                <span className="inline-block px-2 py-0.5 font-fashion text-[8.5px] uppercase tracking-wider bg-[#FAF8F5] border border-[#DDD5C7] text-[#575043]">
                  {order.customers?.user_id ? 'Compte Privilège Enregistré' : 'Commande Passée en Invité'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#F2ECE3] pb-2">
              <MapPin className="w-4 h-4 text-[#8C7355]" />
              <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                Adresse de Livraison
              </h3>
            </div>

            {orderAddress ? (
              <div className="space-y-1.5 text-xs text-[#3D372E]">
                <div className="font-medium text-[#0A1C14]">{orderAddress.recipient_name}</div>
                <div>{orderAddress.address_line}</div>
                <div>
                  {orderAddress.district ? `${orderAddress.district}, ` : ''}
                  {orderAddress.city} {orderAddress.postal_code || ''}
                </div>
                <div className="font-fashion uppercase text-[10px] tracking-wider text-[#6E6657]">
                  {orderAddress.country}
                </div>
                {orderAddress.phone && (
                  <div className="text-[11px] text-[#8C7355] pt-1">
                    Contact: {orderAddress.phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="font-serif italic text-xs text-[#8E8474]">
                Aucune adresse d'expédition enregistrée pour cette commande.
              </p>
            )}
          </div>

          {/* Payment Details Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Règlement & Transaction
                </h3>
              </div>
              {canManagePayments && payment && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] underline cursor-pointer"
                >
                  Modifier
                </button>
              )}
            </div>

            {payment ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Statut de paiement:</span>
                  <span className={`px-2 py-0.5 font-fashion text-[9px] uppercase border ${paymentStatusConfig.colorClass}`}>
                    {payment.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Mode de règlement:</span>
                  <span className="font-medium text-[#0A1C14] uppercase">{payment.payment_method || '—'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Fournisseur / Passerelle:</span>
                  <span className="text-[#0A1C14]">{payment.provider || 'Atelier Direct'}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Montant réglé:</span>
                  <span className="font-medium text-[#0A1C14]">
                    {Number(payment.amount || order.total_amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                    {payment.currency || order.currency}
                  </span>
                </div>

                {payment.paid_at && (
                  <div className="text-[10px] text-[#8E8474]">
                    Validé le : {new Date(payment.paid_at).toLocaleString('fr-FR')}
                  </div>
                )}

                {/* Sub-transactions if any */}
                {payment.payment_transactions && payment.payment_transactions.length > 0 && (
                  <div className="pt-2 border-t border-[#F2ECE3] space-y-1">
                    <span className="font-fashion text-[8.5px] uppercase tracking-wider text-[#6E6657] block font-semibold">
                      Transactions Associées ({payment.payment_transactions.length})
                    </span>
                    {payment.payment_transactions.map((tx) => (
                      <div key={tx.id} className="p-2 bg-[#FAF8F5] border border-[#E5DFD5] text-[10.5px] space-y-0.5">
                        <div className="flex justify-between font-mono">
                          <span>Ref: {tx.transaction_id || tx.id.slice(0, 8)}</span>
                          <span className="uppercase font-semibold">{tx.status}</span>
                        </div>
                        <div className="text-[#6E6657]">{tx.transaction_type || 'Paiement'} • {tx.provider}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#6E6657] space-y-1">
                <div>Méthode déclarée : <span className="font-medium uppercase">{order.payment_method || 'Non définie'}</span></div>
                <div>Statut global : <span className="font-medium uppercase">{order.payment_status}</span></div>
              </div>
            )}
          </div>

          {/* Shipment & Logistics Card */}
          <div className="bg-white border border-[#E5DFD5] shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#F2ECE3] pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#8C7355]" />
                <h3 className="font-fashion text-[10.5px] uppercase tracking-[0.25em] text-[#0A1C14] font-semibold">
                  Logistique & Suivi Coursier
                </h3>
              </div>
              {canManageDelivery && (
                <button
                  type="button"
                  onClick={() => setIsShipmentModalOpen(true)}
                  className="font-fashion text-[9px] uppercase tracking-wider text-[#8C7355] hover:text-[#0A1C14] underline cursor-pointer"
                >
                  {shipment ? 'Modifier' : 'Configurer'}
                </button>
              )}
            </div>

            {shipment ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Statut d'envoi:</span>
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 font-fashion text-[9px] uppercase tracking-wider">
                    {shipment.status}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#6E6657]">Transporteur:</span>
                  <span className="font-medium text-[#0A1C14]">{shipment.courier_name || 'Coursier Privé'}</span>
                </div>

                {shipment.delivery_zones && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#6E6657]">Zone :</span>
                    <span className="text-[#0A1C14]">{shipment.delivery_zones.name}</span>
                  </div>
                )}

                {shipment.tracking_number && (
                  <div>
                    <span className="text-[#6E6657] block text-[10px]">N° de Suivi Gants Blancs :</span>
                    <span className="font-mono text-xs text-[#0A1C14] font-medium select-all">
                      {shipment.tracking_number}
                    </span>
                  </div>
                )}

                {shipment.tracking_url && (
                  <a
                    href={shipment.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] text-[#8C7355] hover:text-[#0A1C14] underline font-medium pt-1"
                  >
                    <span>Portail de suivi transporteur</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {shipment.shipped_at && (
                  <div className="text-[10px] text-[#8E8474] pt-1">
                    Pris en charge le : {new Date(shipment.shipped_at).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>
            ) : (
              <p className="font-serif italic text-xs text-[#8E8474]">
                Aucun colis d'expédition configuré pour cette commande.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Change Order Status */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div>
              <div className="font-fashion text-[9px] uppercase tracking-[0.2em] text-[#8C7355] font-semibold">
                Protocole Couture
              </div>
              <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
                Changer le Statut de la Commande
              </h3>
              <p className="text-xs text-[#665D4F] mt-1">
                Commande #{order.order_number} • Actuel : <span className="font-semibold">{order.order_status}</span>
              </p>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Nouveau Statut
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {opt.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Motif ou Note de Journalisation (order_status_history)
                </label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="ex. Contrôle qualité effectué, pièce soigneusement enveloppée dans le papier de soie..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  disabled={submittingStatus}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submittingStatus ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Payment */}
      {isPaymentModalOpen && payment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div>
              <div className="font-fashion text-[9px] uppercase tracking-[0.2em] text-[#8C7355] font-semibold">
                Gestion Comptable
              </div>
              <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
                Mise à Jour du Règlement
              </h3>
            </div>

            <form onSubmit={handlePaymentUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Statut du Règlement
                </label>
                <select
                  value={targetPaymentStatus}
                  onChange={(e) => setTargetPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Passerelle / Fournisseur (Provider)
                </label>
                <input
                  type="text"
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value)}
                  placeholder="ex. Stripe, Virement Bancaire, Carte Privée..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submittingPayment ? 'Enregistrement...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Shipment Logistics */}
      {isShipmentModalOpen && shipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A1C14]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E5DFD5] max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div>
              <div className="font-fashion text-[9px] uppercase tracking-[0.2em] text-[#8C7355] font-semibold">
                Transport & Conciergerie
              </div>
              <h3 className="font-brand text-xl text-[#0A1C14] font-medium tracking-wide">
                Expédition Gants Blancs
              </h3>
            </div>

            <form onSubmit={handleShipmentUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Transporteur / Coursier
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="ex. DHL Express, Colissimo Privé, Coursier Parisien..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Numéro de Suivi (Tracking)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="ex. JJD00000000000FR"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  URL de Suivi Externe
                </label>
                <input
                  type="url"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://www.dhl.com/track?..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                />
              </div>

              <div>
                <label className="block font-fashion text-[9.5px] uppercase tracking-wider text-[#6E6657] mb-1 font-medium">
                  Statut d'Acheminement
                </label>
                <select
                  value={shipmentStatus}
                  onChange={(e) => setShipmentStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#0A1C14] focus:bg-white focus:outline-none focus:border-[#0A1C14]"
                >
                  <option value="pending">En préparation</option>
                  <option value="shipped">Expédié (remis au transporteur)</option>
                  <option value="in_transit">En transit</option>
                  <option value="delivered">Livré</option>
                  <option value="returned">Retourné</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F2ECE3]">
                <button
                  type="button"
                  onClick={() => setIsShipmentModalOpen(false)}
                  disabled={submittingShipment}
                  className="px-4 py-2 bg-transparent text-[#575043] hover:text-[#0A1C14] font-fashion text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingShipment}
                  className="px-5 py-2.5 bg-[#0A1C14] hover:bg-[#143325] text-[#FAF8F5] font-fashion text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
                >
                  {submittingShipment ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
