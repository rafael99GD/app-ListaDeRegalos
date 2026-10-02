import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Clock,
  Search,
  Check,
  X,
  Trash2,
  Gift,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { friendService } from '../services/friendService';
import {
  Friend,
  FriendRequest,
  FriendSearchResult,
  Wishlist,
} from '../types';
import { useToast } from '../context/ToastContext';

export const Friends: React.FC = () => {
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Amigo seleccionado para ver sus listas
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendWishlists, setFriendWishlists] = useState<Wishlist[]>([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsData, requestsData] = await Promise.all([
        friendService.getFriends(),
        friendService.getFriendRequests(),
      ]);
      setFriends(friendsData);
      setIncomingRequests(requestsData.incoming);
      setOutgoingRequests(requestsData.outgoing);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar información de amigos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Buscar usuarios
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) {
      info('Introduce al menos 2 caracteres para buscar');
      return;
    }

    try {
      setSearching(true);
      const results = await friendService.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al buscar usuarios');
    } finally {
      setSearching(false);
    }
  };

  // Enviar solicitud de amistad
  const handleSendRequest = async (targetUserId: string) => {
    try {
      await friendService.sendFriendRequest(targetUserId);
      success('¡Solicitud de amistad enviada!');
      // Actualizar estado en resultados de búsqueda
      setSearchResults((prev) =>
        prev.map((u) => (u.id === targetUserId ? { ...u, status: 'REQUEST_SENT' } : u))
      );
      // Recargar solicitudes
      const reqs = await friendService.getFriendRequests();
      setOutgoingRequests(reqs.outgoing);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al enviar la solicitud');
    }
  };

  // Responder solicitud
  const handleRespond = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      await friendService.respondFriendRequest(requestId, status);
      success(status === 'ACCEPTED' ? '¡Solicitud aceptada!' : 'Solicitud rechazada');
      await loadData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al responder la solicitud');
    }
  };

  // Eliminar amistad
  const handleRemoveFriend = async (friendId: string, username: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar a @${username} de tus amigos?`
    );
    if (!confirmDelete) return;

    try {
      await friendService.removeFriend(friendId);
      success(`Has eliminado a @${username} de tus amigos`);
      setFriends((prev) => prev.filter((f) => f.id !== friendId));
      if (selectedFriend?.id === friendId) {
        setSelectedFriend(null);
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al eliminar amigo');
    }
  };

  // Ver listas de un amigo
  const handleViewWishlists = async (friend: Friend) => {
    setSelectedFriend(friend);
    try {
      setLoadingWishlists(true);
      const wishlists = await friendService.getFriendWishlists(friend.id);
      setFriendWishlists(wishlists);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al obtener listas del amigo');
    } finally {
      setLoadingWishlists(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-zinc-900 border border-zinc-800 text-sky-400 rounded-xl shadow-md">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Mis Amigos
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              Conecta con amigos para ver sus listas de deseos y organizar regalos juntos.
            </p>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="flex items-center p-1 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all min-h-[34px] ${
              activeTab === 'friends'
                ? 'bg-sky-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Amigos ({friends.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all relative min-h-[34px] ${
              activeTab === 'requests'
                ? 'bg-sky-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Solicitudes
            {incomingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all min-h-[34px] ${
              activeTab === 'search'
                ? 'bg-sky-500 text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            Buscar Usuarios
          </button>
        </div>
      </div>

      {/* Contenido según Tab Activo */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Cargando comunidad...</p>
        </div>
      ) : activeTab === 'friends' ? (
        /* TAB 1: LISTADO DE AMIGOS */
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-14 px-6 bg-zinc-900 rounded-xl border border-dashed border-zinc-800 max-w-md mx-auto">
              <div className="w-14 h-14 mx-auto mb-4 text-sky-400 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700/60">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-1">
                Aún no tienes amigos agregados
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
                Busca usuarios por su nombre de usuario para agregarlos a tu red y compartir listas.
              </p>
              <button
                onClick={() => setActiveTab('search')}
                className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] text-xs min-h-[40px]"
              >
                <Search className="w-4 h-4" />
                <span>Buscar Amigos</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {friends.map((friend) => {
                const displayName =
                  friend.firstName && friend.lastName
                    ? `${friend.firstName} ${friend.lastName}`
                    : friend.firstName || friend.username;

                return (
                  <div
                    key={friend.id}
                    className="p-5 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm flex flex-col justify-between transition-all hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-zinc-800 border border-zinc-700/60 text-sky-400 overflow-hidden flex items-center justify-center font-mono font-black text-sm shadow-sm flex-shrink-0">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            friend.username.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-100 text-sm">
                            {displayName}
                            <span className="text-sky-400 font-mono text-xs font-normal ml-1.5">
                              (@{friend.username})
                            </span>
                          </h3>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Gift className="w-3.5 h-3.5 text-sky-400" />
                            {friend.wishlistsCount} {friend.wishlistsCount === 1 ? 'lista' : 'listas'} disponibles
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                        title="Eliminar de amigos"
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center border border-transparent hover:border-zinc-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  <button
                    onClick={() => handleViewWishlists(friend)}
                    className="w-full inline-flex items-center justify-center gap-2 bg-zinc-850 hover:bg-zinc-800 text-sky-400 hover:text-sky-300 font-bold text-xs py-2 rounded-lg border border-zinc-800 hover:border-sky-500/40 transition-colors min-h-[36px]"
                  >
                    <span>Ver sus Listas de Deseos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
            </div>
          )}
        </div>
      ) : activeTab === 'requests' ? (
        /* TAB 2: SOLICITUDES DE AMISTAD */
        <div className="space-y-8">
          {/* Solicitudes Recibidas */}
          <div>
            <h2 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Solicitudes Recibidas ({incomingRequests.length})
            </h2>

            {incomingRequests.length === 0 ? (
              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center text-xs text-zinc-400">
                No tienes solicitudes de amistad pendientes por responder.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 text-sky-400 overflow-hidden flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {req.user.avatarUrl ? (
                          <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          req.user.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-100">
                          {req.user.firstName && req.user.lastName
                            ? `${req.user.firstName} ${req.user.lastName}`
                            : req.user.firstName || req.user.username}
                          <span className="text-sky-400 font-mono text-xs font-normal ml-1">
                            (@{req.user.username})
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          {new Date(req.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespond(req.id, 'ACCEPTED')}
                        className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors min-h-[34px]"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, 'REJECTED')}
                        className="inline-flex items-center gap-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold text-xs px-3 py-1.5 rounded-lg border border-zinc-700 transition-colors min-h-[34px]"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Solicitudes Enviadas */}
          <div>
            <h2 className="text-sm font-bold text-zinc-100 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-zinc-400" />
              Solicitudes Enviadas ({outgoingRequests.length})
            </h2>

            {outgoingRequests.length === 0 ? (
              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-center text-xs text-zinc-400">
                No tienes solicitudes enviadas pendientes.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 text-zinc-300 overflow-hidden flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {req.user.avatarUrl ? (
                          <img src={req.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          req.user.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-100">
                          {req.user.firstName && req.user.lastName
                            ? `${req.user.firstName} ${req.user.lastName}`
                            : req.user.firstName || req.user.username}
                          <span className="text-sky-400 font-mono text-xs font-normal ml-1">
                            (@{req.user.username})
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Enviada el {new Date(req.createdAt).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-900/60">
                      Pendiente
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* TAB 3: BUSCADOR DE USUARIOS */
        <div className="max-w-2xl mx-auto space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Buscar por @username o correo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-100 text-sm focus:outline-none focus:border-sky-500 shadow-sm min-h-[42px] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-5 py-2.5 rounded-lg shadow-sm transition-all text-xs flex items-center gap-2 min-h-[42px]"
            >
              <span>{searching ? 'Buscando...' : 'Buscar'}</span>
            </button>
          </form>

          {/* Resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Resultados encontrados ({searchResults.length})
              </h3>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 text-sky-400 overflow-hidden flex items-center justify-center font-mono font-bold text-xs flex-shrink-0">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.username.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-zinc-100">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.firstName || user.username}
                          <span className="text-sky-400 font-mono text-xs font-normal ml-1">
                            (@{user.username})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      {user.status === 'FRIEND' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-3 py-1.5 rounded-md border border-emerald-800/80">
                          <ShieldCheck className="w-4 h-4" /> Ya sois amigos
                        </span>
                      ) : user.status === 'REQUEST_SENT' ? (
                        <span className="text-xs font-mono font-bold text-amber-300 bg-amber-950/40 px-3 py-1.5 rounded-md border border-amber-900/60">
                          Solicitud enviada
                        </span>
                      ) : user.status === 'REQUEST_RECEIVED' ? (
                        <button
                          onClick={() => setActiveTab('requests')}
                          className="text-xs font-bold text-sky-400 hover:text-sky-300 bg-zinc-800 px-3 py-1.5 rounded-md border border-zinc-700 transition-colors min-h-[34px]"
                        >
                          Ver en Solicitudes
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.id)}
                          className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all min-h-[34px]"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Enviar Solicitud</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA VER LISTAS DE UN AMIGO */}
      {selectedFriend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full p-6 shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700/60 text-sky-400 flex items-center justify-center font-mono font-bold text-xs">
                  {selectedFriend.username.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-100">
                    Listas de @{selectedFriend.username}
                  </h3>
                  <p className="text-xs text-zinc-400">Listas públicas y compartidas contigo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFriend(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingWishlists ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-semibold">Cargando listas de deseos...</p>
              </div>
            ) : friendWishlists.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                @{selectedFriend.username} aún no tiene listas de deseos públicas o compartidas disponibles.
              </div>
            ) : (
              <div className="space-y-3">
                {friendWishlists.map((wl) => (
                  <Link
                    key={wl.id}
                    to={`/w/${wl.shareSlug}`}
                    onClick={() => setSelectedFriend(null)}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-sky-500/50 transition-all group"
                  >
                    <div>
                      <h4 className="font-bold text-zinc-100 text-sm group-hover:text-sky-400 transition-colors">
                        {wl.title}
                      </h4>
                      {wl.occasion && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Ocasión: {wl.occasion}
                        </p>
                      )}
                      <p className="text-xs text-zinc-500 mt-1">
                        {wl._count?.items ?? wl.items?.length ?? 0} regalos en la lista
                      </p>
                    </div>

                    <div className="p-2 rounded-md bg-zinc-800 text-zinc-400 group-hover:bg-sky-500 group-hover:text-zinc-950 transition-all shadow-sm">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
