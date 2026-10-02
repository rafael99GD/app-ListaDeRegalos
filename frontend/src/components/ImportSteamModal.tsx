import React, { useState } from 'react';
import {
  X,
  Gamepad2,
  Search,
  CheckSquare,
  Square,
  Loader2,
  ExternalLink,
  Sparkles,
  Info,
  ArrowRight,
} from 'lucide-react';
import { SteamWishlistItem, Item } from '../types';
import { steamService } from '../services/steamService';
import { itemService } from '../services/itemService';
import { useToast } from '../context/ToastContext';

interface ImportSteamModalProps {
  isOpen: boolean;
  wishlistId: string;
  onClose: () => void;
  onSuccess: (newItems: Item[]) => void;
}

export const ImportSteamModal: React.FC<ImportSteamModalProps> = ({
  isOpen,
  wishlistId,
  onClose,
  onSuccess,
}) => {
  const [steamIdentifier, setSteamIdentifier] = useState('');
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [steamItems, setSteamItems] = useState<SteamWishlistItem[]>([]);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<number>>(new Set());
  const [filterQuery, setFilterQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleFetchWishlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!steamIdentifier.trim()) {
      error('Por favor ingresa un ID, vanity name o enlace de perfil de Steam');
      return;
    }

    try {
      setIsLoadingWishlist(true);
      const items = await steamService.getSteamWishlist(steamIdentifier.trim());
      setSteamItems(items);
      // Seleccionar todos por defecto
      setSelectedAppIds(new Set(items.map((i) => i.appId)));
      setHasSearched(true);
      if (items.length === 0) {
        error('No se encontraron juegos en la lista de deseados o la lista está vacía');
      } else {
        success(`¡Se encontraron ${items.length} juegos en la lista de deseados!`);
      }
    } catch (err: any) {
      error(
        err.response?.data?.message ||
          'Error al consultar Steam. Verifica que la lista y detalles de juegos sean públicos.'
      );
    } finally {
      setIsLoadingWishlist(false);
    }
  };

  const handleToggleSelect = (appId: number) => {
    setSelectedAppIds((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedAppIds(new Set(filteredItems.map((i) => i.appId)));
  };

  const handleDeselectAll = () => {
    setSelectedAppIds(new Set());
  };

  const handleImportSelected = async () => {
    const itemsToImport = steamItems.filter((i) => selectedAppIds.has(i.appId));
    if (itemsToImport.length === 0) {
      error('Debes seleccionar al menos un juego para importar');
      return;
    }

    try {
      setIsImporting(true);
      const payload = itemsToImport.map((i) => ({
        title: i.title,
        price: i.price,
        currency: i.currency || 'EUR',
        url: i.url,
        imageUrl: i.imageUrl,
        imageType: 'URL' as const,
      }));

      const res = await itemService.addItemsBatch(wishlistId, payload);
      success(`¡${res.count} juegos importados con éxito a tu lista!`);
      if (res.items) {
        onSuccess(res.items);
      }
      handleClose();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al importar los juegos a la lista');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSteamIdentifier('');
    setSteamItems([]);
    setSelectedAppIds(new Set());
    setFilterQuery('');
    setHasSearched(false);
    onClose();
  };

  const filteredItems = steamItems.filter((item) =>
    item.title.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-2xl w-full shadow-2xl border border-zinc-800 overflow-hidden transform transition-all animate-slideUp sm:animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-[#171a21] text-white flex items-center justify-between border-b border-[#2a475e] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2a475e] text-[#66c0f4] flex items-center justify-center shadow-inner">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Importar Lista de Deseados de Steam
              </h3>
              <p className="text-xs text-[#8f98a0]">
                Añade tus juegos deseados automáticamente a esta lista
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-[#8f98a0] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Step 1: Input de Steam */}
          {!hasSearched ? (
            <form onSubmit={handleFetchWishlist} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                  ID de Steam, Vanity URL o Enlace de Perfil
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej: gaben, 76561198000000000 o https://steamcommunity.com/id/tu_usuario"
                    value={steamIdentifier}
                    onChange={(e) => setSteamIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-[#66c0f4] text-xs transition-colors"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  Tip: También puedes escribir <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-sky-400 font-mono text-xs">demo</code> para probar de inmediato con juegos de ejemplo.
                </p>
              </div>

              {/* Notice sobre privacidad */}
              <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
                <Info className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-zinc-200">Requisito de privacidad en Steam:</p>
                  <p className="text-zinc-400 leading-relaxed">
                    Para que podamos leer tu lista, entra en Steam &gt; <strong>Editar perfil</strong> &gt; <strong>Configuración de privacidad</strong> y asegúrate de que el perfil y los <strong>&quot;Detalles de los juegos&quot;</strong> estén en <strong>Público</strong>.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoadingWishlist || !steamIdentifier.trim()}
                className="w-full py-2.5 px-4 bg-[#1b2838] hover:bg-[#2a475e] text-[#66c0f4] border border-[#2a475e] text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[40px]"
              >
                {isLoadingWishlist ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Consultando lista en Steam...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar Deseados en Steam</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Lista y selección de juegos */
            <div className="space-y-3">
              {/* Header de resultados y acciones masivas */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">
                    Juegos disponibles ({steamItems.length})
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {selectedAppIds.size} de {steamItems.length} seleccionados para importar
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-750 border border-zinc-700"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-sky-400" />
                    <span>Seleccionar todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-800 text-zinc-200 hover:bg-zinc-750 border border-zinc-700"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Deseleccionar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasSearched(false)}
                    className="text-xs text-sky-400 font-bold hover:underline ml-1"
                  >
                    Cambiar ID
                  </button>
                </div>
              </div>

              {/* Buscador interno */}
              {steamItems.length > 5 && (
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar por título..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              )}

              {/* Lista de juegos */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredItems.map((item) => {
                  const isChecked = selectedAppIds.has(item.appId);
                  return (
                    <div
                      key={item.appId}
                      onClick={() => handleToggleSelect(item.appId)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-sky-500/80 bg-sky-950/20'
                          : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 text-sky-500 rounded border-zinc-700 bg-zinc-900 focus:ring-sky-500 cursor-pointer flex-shrink-0"
                        />
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-20 h-10 object-cover rounded-md flex-shrink-0 bg-zinc-800"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-zinc-100 truncate">
                            {item.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.price !== null ? (
                              <span className="text-xs font-mono font-bold text-sky-400">
                                {item.price.toFixed(2)} {item.currency}
                              </span>
                            ) : (
                              <span className="text-[11px] italic text-zinc-500">Precio no disponible</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="Abrir en Steam Store"
                        className="p-1.5 text-zinc-500 hover:text-sky-400 rounded-md hover:bg-zinc-800 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}

                {filteredItems.length === 0 && (
                  <p className="text-center py-6 text-xs text-zinc-500">
                    No hay juegos que coincidan con la búsqueda.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {hasSearched && (
          <div className="px-6 py-3.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={isImporting || selectedAppIds.size === 0}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importando {selectedAppIds.size} juegos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Importar {selectedAppIds.size} {selectedAppIds.size === 1 ? 'juego' : 'juegos'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
