import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Sparkles, Gift, Users, Loader2, Compass } from 'lucide-react';
import { Wishlist } from '../types';
import { wishlistService } from '../services/wishlistService';
import { WishlistCard } from '../components/WishlistCard';
import { CreateWishlistModal } from '../components/CreateWishlistModal';
import { useToast } from '../context/ToastContext';

export const Dashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'shared' ? 'shared' : 'my';
  const [activeTab, setActiveTab] = useState<'my' | 'shared'>(initialTab);

  const [myWishlists, setMyWishlists] = useState<Wishlist[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<Wishlist[]>([]);
  const [savedWishlists, setSavedWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { error, success } = useToast();

  // Sincronizar tab con URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'shared' && activeTab !== 'shared') {
      setActiveTab('shared');
    } else if (tabParam === 'my' && activeTab !== 'my') {
      setActiveTab('my');
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: 'my' | 'shared') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true);
      const [mine, shared, saved] = await Promise.all([
        wishlistService.getMyWishlists(),
        wishlistService.getSharedWithMeWishlists(),
        wishlistService.getSavedWishlists(),
      ]);
      setMyWishlists(mine);
      setSharedWishlists(shared);
      setSavedWishlists(saved);
    } catch (err: any) {
      error('Error al cargar las listas de regalos');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleDeleteWishlist = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta lista de regalos? Esta acción borrará todos sus regalos.')) {
      return;
    }

    try {
      await wishlistService.deleteWishlist(id);
      success('Lista eliminada correctamente');
      setMyWishlists((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      error('Error al eliminar la lista');
    }
  };

  const handleUnsaveWishlist = async (id: string) => {
    try {
      await wishlistService.unsaveWishlist(id);
      success('Lista desanclada de tus guardados');
      setSavedWishlists((prev) => prev.filter((w) => w.id !== id));
    } catch (err: any) {
      error('Error al quitar de guardados');
    }
  };

  const handleWishlistCreated = (newWishlist: Wishlist) => {
    setMyWishlists((prev) => [newWishlist, ...prev]);
  };

  // Combinar listas compartidas: whitelist privadas + guardadas públicas/privadas evitando duplicados
  const combinedSharedMap = new Map<string, Wishlist>();
  sharedWishlists.forEach((w) => combinedSharedMap.set(w.id, w));
  savedWishlists.forEach((w) => combinedSharedMap.set(w.id, w));
  const allSharedWishlists = Array.from(combinedSharedMap.values());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8 space-y-6">
      {/* Top Banner - Sleek Gaming Hub Style */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 text-zinc-100 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/60 text-[11px] font-mono font-semibold text-sky-400">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>CENTRO DE DESEOS & REGALOS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-100">
            Organiza tus regalos con precisión.
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
            Crea listas para cumpleaños, eventos o videojuegos con precios y prioridad. Compártelas con tus amigos y evita regalos duplicados.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Lista</span>
            </button>
          </div>
        </div>

        {/* Subtle grid pattern background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-sky-500/5 to-transparent pointer-events-none" />
      </div>

      {/* Tabs navigation - Segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => handleTabChange('my')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'my'
                ? 'bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Mis Listas</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/80 text-zinc-300 border border-zinc-800">
              {myWishlists.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange('shared')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all ${
              activeTab === 'shared'
                ? 'bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Compartidas</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-zinc-950/80 text-zinc-300 border border-zinc-800">
              {allSharedWishlists.length}
            </span>
          </button>
        </div>

        {activeTab === 'my' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-zinc-950 bg-sky-950/30 hover:bg-sky-400 border border-sky-800/60 hover:border-sky-400 px-3 py-1.5 rounded-lg transition-all self-start sm:self-auto uppercase tracking-wider"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Nueva Lista</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
          <p className="text-xs font-mono text-zinc-400">
            Cargando listas...
          </p>
        </div>
      ) : activeTab === 'my' ? (
        myWishlists.length === 0 ? (
          <div className="text-center py-14 px-4 bg-zinc-900/60 rounded-xl border border-dashed border-zinc-800 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 text-sky-400 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-zinc-100">Sin listas creadas</h3>
            <p className="text-xs text-zinc-400 mt-1 mb-5">
              Crea tu primera lista de deseos para organizar tus regalos o ítems pendientes.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear mi primera lista</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myWishlists.map((wishlist) => (
              <WishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                isOwner={true}
                onDelete={handleDeleteWishlist}
              />
            ))}
          </div>
        )
      ) : allSharedWishlists.length === 0 ? (
        <div className="text-center py-14 px-4 bg-zinc-900/60 rounded-xl border border-dashed border-zinc-800 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-100">No hay listas compartidas</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Cuando tus amigos te agreguen a la lista blanca de sus listas privadas o guardes listas públicas, aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allSharedWishlists.map((wishlist) => {
            const isSaved = savedWishlists.some((s) => s.id === wishlist.id);
            return (
              <WishlistCard
                key={wishlist.id}
                wishlist={wishlist}
                isOwner={false}
                onUnsave={isSaved ? handleUnsaveWishlist : undefined}
              />
            );
          })}
        </div>
      )}

      {/* Modal create wishlist */}
      <CreateWishlistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleWishlistCreated}
      />
    </div>
  );
};
