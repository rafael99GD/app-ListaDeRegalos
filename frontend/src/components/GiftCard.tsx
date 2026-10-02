import React, { useState } from 'react';
import { ExternalLink, Check, RotateCcw, Trash2, Gift, User, CheckCircle2, Gamepad2, HelpCircle, Flame, Edit2 } from 'lucide-react';
import { Item } from '../types';
import { getFullImageUrl } from '../services/api';
import { itemService } from '../services/itemService';
import { useToast } from '../context/ToastContext';
import { SteamGiftGuideModal } from './SteamGiftGuideModal';

interface GiftCardProps {
  item: Item;
  isOwner?: boolean;
  currentUsername?: string;
  isHighlighted?: boolean;
  onPurchaseClick: (item: Item) => void;
  onItemUpdated: (updatedItem: Item) => void;
  onItemDeleted?: (itemId: string) => void;
  onEditClick?: (item: Item) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  item,
  isOwner = false,
  currentUsername,
  isHighlighted = false,
  onPurchaseClick,
  onItemUpdated,
  onItemDeleted,
  onEditClick,
}) => {
  const [isUnpurchasing, setIsUnpurchasing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const { success, error } = useToast();

  const handleUnpurchase = async () => {
    try {
      setIsUnpurchasing(true);
      const updated = await itemService.unpurchaseItem(item.id);
      success('Regalo restablecido como disponible');
      onItemUpdated(updated);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al restablecer el regalo');
    } finally {
      setIsUnpurchasing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Deseas eliminar "${item.title}" de la lista?`)) return;
    try {
      await itemService.deleteItem(item.id);
      success('Regalo eliminado');
      if (onItemDeleted) onItemDeleted(item.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al eliminar el regalo');
    }
  };

  const isPurchasedByCurrentUser = Boolean(
    currentUsername && item.purchasedBy === currentUsername
  );

  const canUnpurchase = item.isPurchased && (isOwner || isPurchasedByCurrentUser);
  const fullImageUrl = getFullImageUrl(item.imageUrl);
  const isSteam = Boolean(item.url && item.url.includes('store.steampowered.com'));

  return (
    <>
      <div
        className={`group rounded-xl border transition-all duration-300 flex flex-col justify-between overflow-hidden bg-zinc-900 ${
          isHighlighted
            ? 'ring-2 ring-sky-400 border-sky-400 shadow-lg shadow-sky-950/50'
            : item.isPurchased
            ? 'border-zinc-800/60 opacity-80'
            : 'border-zinc-800 hover:border-zinc-700 shadow-sm'
        }`}
      >
        <div>
          {/* Image Area - Aspect ratio 16:10 for consistent game/product cards */}
          <div className="relative aspect-[16/10] w-full bg-zinc-950 flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
            {item.imageUrl && !imageError ? (
              <img
                src={fullImageUrl}
                alt={item.title}
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  item.isPurchased ? 'grayscale-[40%] opacity-70' : ''
                }`}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-700 p-6">
                <Gift className="w-12 h-12 stroke-[1.2] text-zinc-600 group-hover:text-sky-400 transition-colors" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-2">Deseo</span>
              </div>
            )}

            {/* Badges container */}
            <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
              {item.isPurchased ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-zinc-950/90 text-zinc-400 border border-zinc-800 backdrop-blur-md">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Reservado</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 backdrop-blur-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Disponible</span>
                </span>
              )}

              {/* Desire Level Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold backdrop-blur-md border ${
                  (item.priority || 5) >= 9
                    ? 'bg-amber-950/90 text-amber-400 border-amber-800/80'
                    : (item.priority || 5) >= 7
                    ? 'bg-sky-950/90 text-sky-400 border-sky-800/80'
                    : 'bg-zinc-900/90 text-zinc-400 border-zinc-700/80'
                }`}
                title={`Nivel de deseo: ${item.priority || 5}/10`}
              >
                <Flame className="w-3 h-3 fill-current" />
                <span>Nivel {item.priority || 5}</span>
              </span>

              {/* Steam Badge */}
              {isSteam && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171a21]/95 text-[#66c0f4] border border-[#2a475e] backdrop-blur-sm">
                  <Gamepad2 className="w-3 h-3 text-[#66c0f4]" />
                  <span>STEAM</span>
                </span>
              )}
            </div>

            {/* Owner action buttons */}
            {isOwner && (
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                {onEditClick && (
                  <button
                    onClick={() => onEditClick(item)}
                    title="Editar este regalo"
                    aria-label={`Editar ${item.title}`}
                    className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-sky-400 rounded-lg border border-zinc-700/80 backdrop-blur-md transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  title="Eliminar este regalo"
                  aria-label={`Eliminar ${item.title}`}
                  className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-lg border border-zinc-700/80 backdrop-blur-md transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="p-4">
            <h4
              className={`text-sm sm:text-base font-bold text-zinc-100 line-clamp-2 leading-snug tracking-tight mb-2 ${
                item.isPurchased ? 'text-zinc-500 line-through decoration-zinc-600' : ''
              }`}
              title={item.title}
            >
              {item.title}
            </h4>

            {/* Price section - E-commerce style highlight */}
            <div className="flex items-baseline gap-1 mt-1 font-mono">
              {item.price !== null ? (
                <>
                  <span className="text-lg sm:text-xl font-extrabold text-zinc-100 tracking-tight">
                    {item.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">{item.currency}</span>
                </>
              ) : (
                <span className="text-xs text-zinc-500 italic">Precio no especificado</span>
              )}
            </div>

            {/* Desire Meter Bar */}
            <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                <span>Deseo</span>
                <span className="font-semibold text-zinc-200">{item.priority || 5}/10</span>
              </div>
              <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (item.priority || 5) >= 9
                      ? 'bg-amber-400'
                      : (item.priority || 5) >= 7
                      ? 'bg-sky-400'
                      : 'bg-zinc-500'
                  }`}
                  style={{ width: `${Math.max(10, ((item.priority || 5) / 10) * 100)}%` }}
                />
              </div>
            </div>

            {/* Purchased By Details */}
            {item.isPurchased && (
              <div className="mt-2.5 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-300 font-mono">
                <User className="w-3 h-3 text-zinc-400" />
                <span>
                  Por: <strong className="text-zinc-100">@{item.purchasedBy || 'Anónimo'}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 pt-0 flex flex-col gap-2">
          {/* Steam Guide Button */}
          {isSteam && (
            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-sky-400 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/60 rounded-lg transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>¿Cómo regalar en Steam?</span>
            </button>
          )}

          {/* External Store Link */}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-zinc-300 bg-zinc-800/80 hover:bg-zinc-800 hover:text-zinc-100 border border-zinc-700/60 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver en tienda</span>
            </a>
          )}

          {/* Primary Action Button */}
          {!item.isPurchased ? (
            <button
              onClick={() => onPurchaseClick(item)}
              className="w-full min-h-[42px] py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Reservar regalo</span>
            </button>
          ) : canUnpurchase ? (
            <button
              onClick={handleUnpurchase}
              disabled={isUnpurchasing}
              className="w-full min-h-[42px] py-2.5 px-3 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isUnpurchasing ? 'Restableciendo...' : 'Restablecer a disponible'}</span>
            </button>
          ) : (
            <div className="w-full min-h-[42px] py-2.5 text-center text-xs font-mono text-zinc-500 bg-zinc-950/80 border border-zinc-850 rounded-lg flex items-center justify-center">
              Ya reservado
            </div>
          )}
        </div>
      </div>

      {/* Guide Modal */}
      {isSteam && (
        <SteamGiftGuideModal
          isOpen={isGuideOpen}
          item={item}
          onClose={() => setIsGuideOpen(false)}
          onReserveClick={onPurchaseClick}
        />
      )}
    </>
  );
};
