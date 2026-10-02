import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Gift,
  PlusCircle,
  Users,
  Share2,
  Globe,
  Lock,
  ArrowLeft,
  Loader2,
  Bookmark,
  Check,
  Gamepad2,
  ArrowUpDown,
  Filter,
  Flame,
} from 'lucide-react';
import { Wishlist, Item } from '../types';
import { wishlistService } from '../services/wishlistService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GiftCard } from '../components/GiftCard';
import { AddItemModal } from '../components/AddItemModal';
import { WhitelistModal } from '../components/WhitelistModal';
import { PurchaseConfirmModal } from '../components/PurchaseConfirmModal';
import { ImportSteamModal } from '../components/ImportSteamModal';
import { useWishlistSocket } from '../hooks/useWishlistSocket';

export const WishlistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isImportSteamOpen, setIsImportSteamOpen] = useState(false);
  const [isWhitelistOpen, setIsWhitelistOpen] = useState(false);
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState<Item | null>(null);

  // Estados de filtro y ordenación
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'high_desire' | 'purchased'>('all');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'priority_desc' | 'price_asc' | 'price_desc' | 'alpha_asc'
  >('date_desc');
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const fetchWishlist = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await wishlistService.getWishlistById(id);
      setWishlist(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar la lista de regalos');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id, error, navigate]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleCopyShareLink = () => {
    if (!wishlist) return;
    const url = `${window.location.origin}/w/${wishlist.shareSlug}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    success('¡Enlace de la lista copiado al portapapeles!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleToggleSave = async () => {
    if (!wishlist) return;
    try {
      if (wishlist.isSaved) {
        await wishlistService.unsaveWishlist(wishlist.id);
        setWishlist((prev) => (prev ? { ...prev, isSaved: false } : null));
        info('Lista eliminada de tus guardados');
      } else {
        await wishlistService.saveWishlist(wishlist.id);
        setWishlist((prev) => (prev ? { ...prev, isSaved: true } : null));
        success('¡Lista anclada a tus guardados!');
      }
    } catch (err: any) {
      error('Error al guardar o desanclar la lista');
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

    // Cerrar el modal si otro usuario reservó este mismo regalo en paralelo
    setSelectedItemForPurchase((prev) => {
      if (prev && prev.id === updatedItem.id && updatedItem.isPurchased) {
        info('El regalo que estabas visualizando acaba de ser reservado por otro usuario.');
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

  // Sincronización en tiempo real vía WebSockets (conecta de inmediato con id de ruta o de lista)
  const { isConnected, lastUpdatedItemId } = useWishlistSocket({
    wishlistId: id || wishlist?.id,
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
        <p className="text-xs font-mono text-zinc-400">
          Cargando detalles de la lista...
        </p>
      </div>
    );
  }

  if (!wishlist) {
    return null;
  }

  const isOwner = Boolean(user && wishlist.userId === user.id);
  const purchasedItemsCount = wishlist.items.filter((i) => i.isPurchased).length;
  const availableItemsCount = wishlist.items.length - purchasedItemsCount;
  const highDesireCount = wishlist.items.filter((i) => (i.priority || 5) >= 7).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8 space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Mis Listas</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-zinc-900 rounded-xl p-5 sm:p-7 border border-zinc-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
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

              {isConnected && (
                <span className="text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded flex items-center gap-1.5 bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  En vivo
                </span>
              )}

              {!isOwner && wishlist.user && (
                <span className="text-xs font-mono text-zinc-400">
                  Por <strong className="text-zinc-200">@{wishlist.user.username}</strong>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
              {wishlist.title}
            </h1>

            {wishlist.description && (
              <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl leading-relaxed">
                {wishlist.description}
              </p>
            )}
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 flex-wrap self-start">
            {/* Share link button */}
            <button
              onClick={handleCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-sky-400" />}
              <span>{isCopied ? 'Copiado' : 'Compartir'}</span>
            </button>

            {/* Whitelist Modal button (Owner + Private) */}
            {isOwner && wishlist.visibility === 'PRIVATE' && (
              <button
                onClick={() => setIsWhitelistOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-sky-800/60 bg-sky-950/40 hover:bg-sky-900/40 text-sky-300 text-xs font-medium transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Invitados ({wishlist.whitelistUsers?.length || 0})</span>
              </button>
            )}

            {/* Save/Bookmark button (for non-owners) */}
            {!isOwner && (
              <button
                onClick={handleToggleSave}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  wishlist.isSaved
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${wishlist.isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{wishlist.isSaved ? 'Guardada' : 'Guardar'}</span>
              </button>
            )}

            {/* Import Steam Wishlist (Owner) */}
            {isOwner && (
              <button
                onClick={() => setIsImportSteamOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#2a475e] bg-[#171a21] hover:bg-[#1b2838] text-[#66c0f4] text-xs font-semibold transition-colors"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-[#66c0f4]" />
                <span>Importar Steam</span>
              </button>
            )}

            {/* Add item button (Owner) */}
            {isOwner && (
              <button
                onClick={() => setIsAddItemOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Añadir Regalo</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats summary bar */}
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-zinc-200">
              Total: {wishlist.items.length} {wishlist.items.length === 1 ? 'ítem' : 'ítems'}
            </span>
            <span className="text-emerald-400 font-medium">
              {purchasedItemsCount} reservado(s)
            </span>
            <span className="text-sky-400 font-medium">
              {availableItemsCount} disponible(s)
            </span>
          </div>
        </div>
      </div>

      {/* Filtros y Ordenación (si hay items en la lista) */}
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
              Disponibles ({availableItemsCount})
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
              Comprados / Reservados ({purchasedItemsCount})
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 self-end sm:self-auto px-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-semibold text-zinc-400 flex items-center gap-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ordenar:</span>
            </label>
            <select
              id="sort-select"
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

      {/* Gifts Grid or Empty State */}
      {wishlist.items.length === 0 ? (
        <div className="text-center py-14 px-6 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-sky-400 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Esta lista aún no tiene regalos</h3>
          <p className="text-sm text-zinc-400 mt-1 mb-6">
            {isOwner
              ? 'Empieza añadiendo tu primer deseo o importa tus juegos deseados desde Steam.'
              : 'El creador aún no ha agregado artículos a esta lista.'}
          </p>
          {isOwner && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setIsAddItemOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] min-h-[42px]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Añadir regalo manual</span>
              </button>
              <button
                onClick={() => setIsImportSteamOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#171a21] hover:bg-[#1b2838] text-[#66c0f4] border border-[#2a475e] font-bold text-sm px-5 py-2.5 rounded-lg transition-all hover:scale-[1.02] min-h-[42px]"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Importar de Steam</span>
              </button>
            </div>
          )}
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
              onEditClick={(it) => setEditingItem(it)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {isOwner && (
        <AddItemModal
          isOpen={isAddItemOpen || Boolean(editingItem)}
          wishlistId={wishlist.id}
          itemToEdit={editingItem}
          onClose={() => {
            setIsAddItemOpen(false);
            setEditingItem(null);
          }}
          onSuccess={(item) => {
            if (editingItem) {
              handleItemUpdated(item);
            } else {
              handleItemAdded(item);
            }
          }}
        />
      )}

      {/* Import from Steam Modal */}
      {isOwner && (
        <ImportSteamModal
          isOpen={isImportSteamOpen}
          wishlistId={wishlist.id}
          onClose={() => setIsImportSteamOpen(false)}
          onSuccess={handleBatchItemsAdded}
        />
      )}

      {/* Whitelist Modal */}
      {isOwner && wishlist.visibility === 'PRIVATE' && (
        <WhitelistModal
          isOpen={isWhitelistOpen}
          wishlistId={wishlist.id}
          whitelistUsers={wishlist.whitelistUsers || []}
          onClose={() => setIsWhitelistOpen(false)}
          onUpdate={fetchWishlist}
        />
      )}

      {/* Purchase / Reserve Confirmation Modal */}
      <PurchaseConfirmModal
        isOpen={Boolean(selectedItemForPurchase)}
        item={selectedItemForPurchase}
        onClose={() => setSelectedItemForPurchase(null)}
        onSuccess={handleItemUpdated}
      />
    </div>
  );
};
