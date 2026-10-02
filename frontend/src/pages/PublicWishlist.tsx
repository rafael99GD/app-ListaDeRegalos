import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Gift,
  Lock,
  Share2,
  Check,
  Bookmark,
  Loader2,
  ArrowLeft,
  ArrowUpDown,
  Filter,
  Flame,
} from 'lucide-react';
import { Wishlist, Item } from '../types';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiftCard } from '../components/GiftCard';
import { PurchaseConfirmModal } from '../components/PurchaseConfirmModal';
import { useWishlistSocket } from '../hooks/useWishlistSocket';

export const PublicWishlist: React.FC = () => {
  const { shareSlug } = useParams<{ shareSlug: string }>();
  const { user, isAuthenticated } = useAuth();
  const { success, error, info } = useToast();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivateAccessDenied, setIsPrivateAccessDenied] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<Item | null>(null);

  // Estados de filtro y ordenación
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'high_desire' | 'purchased'>('all');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'priority_desc' | 'price_asc' | 'price_desc' | 'alpha_asc'
  >('date_desc');

  const fetchWishlist = useCallback(async () => {
    if (!shareSlug) return;
    try {
      setIsLoading(true);
      setIsPrivateAccessDenied(false);
      const data = await wishlistService.getWishlistBySlug(shareSlug);
      setWishlist(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsPrivateAccessDenied(true);
      } else {
        error(err.response?.data?.message || 'No se pudo cargar la lista');
      }
    } finally {
      setIsLoading(false);
    }
  }, [shareSlug, error]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    success('¡Enlace de la lista copiado al portapapeles!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleSave = async () => {
    if (!wishlist || !isAuthenticated) return;
    try {
      if (wishlist.isSaved) {
        await wishlistService.unsaveWishlist(wishlist.id);
        setWishlist((prev) => (prev ? { ...prev, isSaved: false } : null));
        info('Lista eliminada de tus guardados');
      } else {
        await wishlistService.saveWishlist(wishlist.id);
        setWishlist((prev) => (prev ? { ...prev, isSaved: true } : null));
        success('¡Lista anclada a tus listas compartidas!');
      }
    } catch (err: any) {
      error('Error al guardar lista');
    }
  };

  const handleItemAdded = useCallback((newItem: Item) => {
    setWishlist((prev) => {
      if (!prev) return null;
      const exists = prev.items.some((i) => i.id === newItem.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) => (i.id === newItem.id ? { ...i, ...newItem } : i)),
        };
      }
      return {
        ...prev,
        items: [newItem, ...prev.items],
      };
    });
  }, []);

  const handleBatchItemsAdded = useCallback((newItems: Item[]) => {
    setWishlist((prev) => {
      if (!prev) return null;
      const existingIds = new Set(prev.items.map((i) => i.id));
      const freshItems = newItems.filter((i) => !existingIds.has(i.id));
      if (freshItems.length === 0) return prev;
      return {
        ...prev,
        items: [...freshItems, ...prev.items],
      };
    });
  }, []);

  const handleItemUpdated = useCallback((updatedItem: Item) => {
    setWishlist((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((i) => (i.id === updatedItem.id ? { ...i, ...updatedItem } : i)),
      };
    });

    // Cerrar el modal si otro usuario reservó este mismo regalo concurrentemente
    setSelectedItemForPurchase((prev) => {
      if (prev && prev.id === updatedItem.id && updatedItem.isPurchased) {
        info('El regalo que estabas reservando acaba de ser adquirido por otro usuario.');
        return null;
      }
      return prev;
    });
  }, [info]);

  const handleItemDeleted = useCallback((deletedItemId: string) => {
    setWishlist((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== deletedItemId),
      };
    });
  }, []);

  // Sincronización en tiempo real vía WebSockets
  const { isConnected, lastUpdatedItemId } = useWishlistSocket({
    wishlistId: wishlist?.id,
    onItemCreated: (payload) => {
      if (Array.isArray(payload)) {
        handleBatchItemsAdded(payload);
      } else {
        handleItemAdded(payload);
      }
    },
    onItemUpdated: handleItemUpdated,
    onItemDeleted: handleItemDeleted,
    currentUsername: user?.username,
  });

  // Filtrado y ordenación reactivos en memoria
  const filteredAndSortedItems = useMemo(() => {
    if (!wishlist?.items) return [];

    let items = [...wishlist.items];

    // Filtro por estado
    if (filterStatus === 'available') {
      items = items.filter((item) => !item.isPurchased);
    } else if (filterStatus === 'high_desire') {
      items = items.filter((item) => (item.priority || 5) >= 7);
    } else if (filterStatus === 'purchased') {
      items = items.filter((item) => item.isPurchased);
    }

    // Ordenación
    items.sort((a, b) => {
      if (sortBy === 'priority_desc') {
        const prA = a.priority !== undefined && a.priority !== null ? a.priority : 5;
        const prB = b.priority !== undefined && b.priority !== null ? b.priority : 5;
        if (prB !== prA) return prB - prA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'price_asc') {
        const pA = a.price !== null && a.price !== undefined ? a.price : Infinity;
        const pB = b.price !== null && b.price !== undefined ? b.price : Infinity;
        return pA - pB;
      }
      if (sortBy === 'price_desc') {
        const pA = a.price !== null && a.price !== undefined ? a.price : -Infinity;
        const pB = b.price !== null && b.price !== undefined ? b.price : -Infinity;
        return pB - pA;
      }
      if (sortBy === 'alpha_asc') {
        return a.title.localeCompare(b.title, 'es', { sensitivity: 'base' });
      }
      if (sortBy === 'date_asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // date_desc (por defecto)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
  }, [wishlist?.items, filterStatus, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        <p className="text-sm font-semibold text-zinc-400">
          Cargando lista de regalos...
        </p>
      </div>
    );
  }

  if (isPrivateAccessDenied) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-zinc-900 rounded-xl max-w-md w-full p-8 shadow-2xl border border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700/60 text-sky-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Esta lista es privada</h2>
          <p className="text-sm text-zinc-400">
            El propietario ha restringido el acceso a esta lista solo a invitados autorizados.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            {!isAuthenticated ? (
              <Link
                to={`/login?redirect=/w/${shareSlug}`}
                className="w-full py-2.5 px-4 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg text-sm transition-colors min-h-[42px] flex items-center justify-center"
              >
                Iniciar sesión para acceder
              </Link>
            ) : (
              <p className="text-xs text-amber-400 font-semibold bg-amber-950/40 p-2.5 rounded-lg border border-amber-900/60">
                Tu cuenta (@{user?.username}) no ha sido agregada a la lista blanca de esta lista por su creador.
              </p>
            )}
            <Link
              to="/"
              className="w-full py-2 px-4 text-zinc-400 hover:text-zinc-200 text-xs font-semibold"
            >
              Ir a la página principal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-zinc-900 rounded-xl max-w-md w-full p-8 shadow-2xl border border-zinc-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-zinc-800 border border-zinc-700/60 text-rose-400 flex items-center justify-center mx-auto">
            <Gift className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100">Lista no encontrada</h2>
          <p className="text-sm text-zinc-400">
            Es posible que el enlace no sea correcto o la lista haya sido eliminada por su dueño.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg text-sm min-h-[42px] transition-colors"
          >
            Ir a Wishlist Hub
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = Boolean(user && wishlist.userId === user.id);
  const purchasedCount = wishlist.items.filter((i) => i.isPurchased).length;
  const availableCount = wishlist.items.length - purchasedCount;
  const highDesireCount = wishlist.items.filter((i) => (i.priority || 5) >= 7).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8 space-y-8">
      {/* Navigation header for guest */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-lg transition-colors shadow-sm min-h-[38px]"
        >
          <ArrowLeft className="w-4 h-4 text-sky-400" />
          <span>Wishlist Hub</span>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated && !isOwner && (
            <button
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all min-h-[38px] ${
                wishlist.isSaved
                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${wishlist.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{wishlist.isSaved ? 'Guardada' : 'Guardar'}</span>
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white transition-all shadow-sm min-h-[38px]"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
            <span>{isCopied ? 'Copiado' : 'Compartir'}</span>
          </button>
        </div>
      </div>

      {/* Main Wishlist Card */}
      <div className="bg-zinc-900 rounded-xl p-6 sm:p-8 border border-zinc-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          {wishlist.occasion && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-zinc-800 border border-zinc-700 text-sky-400 tracking-wide uppercase">
              {wishlist.occasion}
            </span>
          )}
          {wishlist.user && (
            <span className="text-xs font-semibold text-zinc-400">
              Lista de deseos de <strong className="text-zinc-200 font-bold">@{wishlist.user.username}</strong>
            </span>
          )}
          {isConnected && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 bg-emerald-950/50 text-emerald-400 border border-emerald-800/80">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              En vivo
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-zinc-100 tracking-tight">
          {wishlist.title}
        </h1>

        {wishlist.description && (
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed max-w-3xl">
            {wishlist.description}
          </p>
        )}

        <div className="pt-2 flex items-center gap-4 text-xs font-semibold text-zinc-400 border-t border-zinc-800 flex-wrap">
          <span className="text-zinc-300 font-bold">{wishlist.items.length} artículos en total</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{purchasedCount} ya reservados</span>
          <span>•</span>
          <span className="text-sky-400 font-bold">{availableCount} disponibles</span>
        </div>
      </div>

      {/* Filtros y Ordenación */}
      {wishlist.items.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800/80 rounded-lg overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap min-h-[34px] ${
                filterStatus === 'all'
                  ? 'bg-sky-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Todos ({wishlist.items.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap min-h-[34px] ${
                filterStatus === 'available'
                  ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Disponibles ({availableCount})
            </button>
            <button
              onClick={() => setFilterStatus('high_desire')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap min-h-[34px] flex items-center gap-1.5 ${
                filterStatus === 'high_desire'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Deseo alto ({highDesireCount})</span>
            </button>
            <button
              onClick={() => setFilterStatus('purchased')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap min-h-[34px] ${
                filterStatus === 'purchased'
                  ? 'bg-zinc-700 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              Comprados / Reservados ({purchasedCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto px-2">
            <label
              htmlFor="sort-select-public"
              className="text-xs font-semibold text-zinc-400 flex items-center gap-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordenar:</span>
            </label>
            <select
              id="sort-select-public"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-semibold bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="date_desc">Más recientes (defecto)</option>
              <option value="priority_desc">Nivel de deseo (10 a 1) 🔥</option>
              <option value="price_asc">Precio: Menor a mayor</option>
              <option value="price_desc">Precio: Mayor a menor</option>
              <option value="alpha_asc">Alfabético (A-Z)</option>
              <option value="date_asc">Más antiguos</option>
            </select>
          </div>
        </div>
      )}

      {/* Items Grid or Empty State */}
      {wishlist.items.length === 0 ? (
        <div className="text-center py-14 px-4 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 max-w-lg mx-auto">
          <Gift className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">
            Esta lista no contiene regalos por ahora
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Vuelve a consultar más adelante.</p>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <div className="text-center py-12 px-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm max-w-md mx-auto">
          <Filter className="w-9 h-9 text-zinc-500 mx-auto mb-3" />
          <h4 className="text-base font-bold text-zinc-100">
            No hay regalos en este filtro
          </h4>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            No se encontraron regalos correspondientes a{' '}
            <strong className="text-zinc-200">
              {filterStatus === 'available'
                ? 'Disponibles'
                : filterStatus === 'high_desire'
                ? 'Deseo alto (7 o más)'
                : 'Comprados / Reservados'}
            </strong>.
          </p>
          <button
            onClick={() => setFilterStatus('all')}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
          >
            Ver todos los regalos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedItems.map((item) => (
            <GiftCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              currentUsername={user?.username}
              isHighlighted={lastUpdatedItemId === item.id}
              onPurchaseClick={(it) => setSelectedItemForPurchase(it)}
              onItemUpdated={handleItemUpdated}
              onItemDeleted={handleItemDeleted}
            />
          ))}
        </div>
      )}

      {/* Modal confirmation */}
      <PurchaseConfirmModal
        isOpen={Boolean(selectedItemForPurchase)}
        item={selectedItemForPurchase}
        onClose={() => setSelectedItemForPurchase(null)}
        onSuccess={handleItemUpdated}
      />
    </div>
  );
};
