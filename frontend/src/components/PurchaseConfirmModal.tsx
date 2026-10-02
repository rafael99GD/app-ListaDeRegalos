import React, { useState } from 'react';
import { X, CheckCircle, Gift, User, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Item } from '../types';
import { useAuth } from '../context/AuthContext';
import { itemService } from '../services/itemService';
import { useToast } from '../context/ToastContext';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onSuccess: (updatedItem: Item) => void;
}

export const PurchaseConfirmModal: React.FC<PurchaseConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [buyerName, setBuyerName] = useState(user?.username || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  if (!isOpen || !item) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const nameToSend = isAnonymous ? 'Anónimo' : buyerName.trim() || user?.username || 'Anónimo';

      const updated = await itemService.purchaseItem(item.id, nameToSend);

      // Microinteracción festiva con confeti
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#059669', '#34d399', '#f43f5e', '#fbbf24', '#6366f1'],
        });
      } catch (confettiErr) {
        // Fallback silencioso si el canvas falla
      }

      success('¡Regalo marcado como comprado / reservado!');
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al reservar el regalo';
      error(errorMsg);
      if (err.response?.status === 409) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-md w-full shadow-2xl border border-zinc-800 overflow-hidden transform transition-all animate-slideUp sm:animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 shadow-sm">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Reservar Regalo</h3>
              <p className="text-xs text-zinc-400">Avisa que vas a regalar este detalle</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800">
            <p className="text-[11px] text-zinc-500 font-mono font-bold uppercase tracking-wider mb-1">
              Artículo a reservar:
            </p>
            <h4 className="text-sm font-bold text-zinc-100">{item.title}</h4>
            {item.price !== null && (
              <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                {item.price.toFixed(2)} {item.currency}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-zinc-400">
              ¿Quién hace el regalo?
            </label>

            {!isAnonymous && (
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Tu nombre o apodo (ej: Tía Laura, Carlos...)"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded border-zinc-700 bg-zinc-950 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-xs text-zinc-300 font-medium">
                Marcar como <strong className="text-zinc-100 font-bold">Sorpresa / Anónimo</strong>
              </span>
            </label>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Al confirmar, el regalo aparecerá como <strong>Comprado / Reservado</strong> para que otros invitados no lo compren dos veces.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirmando...' : 'Confirmar Reserva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
