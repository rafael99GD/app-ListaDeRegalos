import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Globe, Lock, Copy, Check, Trash2, ArrowRight, Bookmark } from 'lucide-react';
import { Wishlist } from '../types';
import { useToast } from '../context/ToastContext';

interface WishlistCardProps {
  wishlist: Wishlist;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  onUnsave?: (id: string) => void;
}

export const WishlistCard: React.FC<WishlistCardProps> = ({
  wishlist,
  isOwner = false,
  onDelete,
  onUnsave,
}) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const publicUrl = `${window.location.origin}/w/${wishlist.shareSlug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    success('¡Enlace público copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  const itemCount = wishlist.items?.length ?? wishlist._count?.items ?? 0;
  const purchasedCount = wishlist.items?.filter((i) => i.isPurchased).length ?? 0;

  return (
    <div className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-sky-500/40 hover:bg-zinc-900/90 transition-all duration-200 flex flex-col justify-between relative shadow-sm">
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {wishlist.occasion && (
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                {wishlist.occasion}
              </span>
            )}
            <span
              className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded flex items-center gap-1 border ${
                wishlist.visibility === 'PUBLIC'
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                  : 'bg-sky-950/60 text-sky-400 border-sky-800/60'
              }`}
            >
              {wishlist.visibility === 'PUBLIC' ? (
                <>
                  <Globe className="w-3 h-3" /> Pública
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3" /> Privada
                </>
              )}
            </span>
          </div>

          {/* Quick copy link */}
          <button
            onClick={handleCopyLink}
            title="Copiar enlace para compartir"
            aria-label="Copiar enlace para compartir"
            className="p-1.5 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800/80 rounded-md transition-colors flex items-center justify-center"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Title & Description */}
        <Link to={`/wishlist/${wishlist.id}`} className="block group-hover:text-sky-400 transition-colors">
          <h3 className="text-base sm:text-lg font-bold text-zinc-100 line-clamp-1 mb-1 tracking-tight">
            {wishlist.title}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 min-h-[2rem] leading-relaxed">
            {wishlist.description || 'Sin descripción adicional.'}
          </p>
        </Link>

        {/* Creator Info if not owner */}
        {!isOwner && wishlist.user && (
          <p className="text-[11px] font-mono text-zinc-400 mt-2">
            Creado por <span className="font-semibold text-zinc-200">@{wishlist.user.username}</span>
          </p>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 mt-4 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Gift className="w-3.5 h-3.5 text-sky-400" />
          <span>
            {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
          </span>
          {purchasedCount > 0 && (
            <span className="text-[10px] text-emerald-400 font-mono font-medium bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              {purchasedCount} comprado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onUnsave && (
            <button
              onClick={() => onUnsave(wishlist.id)}
              title="Quitar de guardados"
              aria-label="Quitar de guardados"
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Bookmark className="w-4 h-4 fill-amber-400 text-amber-400" />
            </button>
          )}

          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(wishlist.id)}
              title="Eliminar lista"
              aria-label="Eliminar lista"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/wishlist/${wishlist.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:text-zinc-950 bg-sky-950/40 hover:bg-sky-400 border border-sky-800/50 hover:border-sky-400 px-3 py-1.5 rounded-lg transition-all"
          >
            <span>Ver</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
