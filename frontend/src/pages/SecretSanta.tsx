import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Gift,
  Sparkles,
  Users,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Lock,
  ArrowRight,
  Shuffle,
  X,
  Search,
} from 'lucide-react';
import { secretSantaService } from '../services/secretSantaService';
import { friendService } from '../services/friendService';
import {
  SecretSantaGroupListItem,
  SecretSantaGroupDetail,
  Friend,
  FriendSearchResult,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const SecretSanta: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [groups, setGroups] = useState<SecretSantaGroupListItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SecretSantaGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Modal de Crear Evento
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createBudget, setCreateBudget] = useState('');
  const [createDate, setCreateDate] = useState('');
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [creating, setCreating] = useState(false);

  // Sorteo en progreso
  const [drawing, setDrawing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Cargar grupos
  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await secretSantaService.getGroups();
      setGroups(data);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar los eventos de Amigo Invisible');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Cargar detalle de un grupo
  const handleSelectGroup = async (groupId: string) => {
    try {
      setLoadingDetail(true);
      setIsRevealed(false);
      const detail = await secretSantaService.getGroupById(groupId);
      setSelectedGroup(detail);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al cargar el detalle del evento');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Abrir modal de creación y cargar amigos disponibles
  const handleOpenCreateModal = async () => {
    setIsCreateModalOpen(true);
    setCreateTitle('');
    setCreateDescription('');
    setCreateBudget('');
    setCreateDate('');
    setSelectedMemberIds([]);
    setSearchQuery('');
    setSearchResults([]);

    try {
      const friends = await friendService.getFriends();
      setFriendsList(friends);
    } catch (err) {
      console.error('Error cargando amigos para el modal:', err);
    }
  };

  // Buscar usuarios adicionales para invitar
  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      try {
        const results = await friendService.searchUsers(q);
        setSearchResults(results);
      } catch (err) {
        console.error('Error buscando usuarios:', err);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Alternar selección de miembro
  const toggleMemberSelection = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== userId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, userId]);
    }
  };

  // Crear grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      error('Introduce un título para el evento');
      return;
    }

    try {
      setCreating(true);
      const newGroup = await secretSantaService.createGroup({
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        budget: createBudget ? parseFloat(createBudget) : undefined,
        exchangeDate: createDate ? new Date(createDate).toISOString() : undefined,
        memberIds: selectedMemberIds,
      });

      success('¡Evento de Amigo Invisible creado con éxito!');
      setIsCreateModalOpen(false);
      await loadGroups();
      handleSelectGroup(newGroup.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al crear el grupo de Amigo Invisible');
    } finally {
      setCreating(false);
    }
  };

  // Realizar sorteo
  const handleDraw = async () => {
    if (!selectedGroup) return;
    if (selectedGroup.members.length < 3) {
      error('Se requieren al menos 3 participantes para realizar el sorteo.');
      return;
    }

    const confirmDraw = window.confirm(
      '¿Estás seguro de realizar el sorteo ahora?\n\n' +
      'Se emparejarán automáticamente todos los participantes y se les enviará una notificación por correo electrónico. ' +
      'Esta acción no se puede deshacer.'
    );
    if (!confirmDraw) return;

    try {
      setDrawing(true);
      const res = await secretSantaService.drawSecretSanta(selectedGroup.id);
      success(res.message || '¡Sorteo realizado con éxito!');
      await loadGroups();
      await handleSelectGroup(selectedGroup.id);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al realizar el sorteo');
    } finally {
      setDrawing(false);
    }
  };

  // Eliminar grupo
  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;
    const confirmDelete = window.confirm(
      '¿Deseas eliminar definitivamente este evento de Amigo Invisible?'
    );
    if (!confirmDelete) return;

    try {
      setDeleting(true);
      await secretSantaService.deleteGroup(selectedGroup.id);
      success('Evento eliminado correctamente');
      setSelectedGroup(null);
      await loadGroups();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al eliminar el evento');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-zinc-900 border border-zinc-800 text-sky-400 rounded-xl shadow-md">
              <Gift className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
                  Amigo Invisible
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-sky-400">
                  Modo Confidencial
                </span>
              </div>
              <p className="text-zinc-400 text-sm mt-0.5">
                Organiza sorteos secretos sin que nadie sepa a quién regalas y consulta directamente sus listas de deseos.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-sm px-5 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Sorteo</span>
        </button>
      </div>

      {/* Grid Principal: Listado y Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Lista de Eventos */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Tus Sorteos ({groups.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold">Cargando eventos...</p>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 px-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
              <div className="w-12 h-12 mx-auto mb-3 text-zinc-500 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700/60">
                <Gift className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="font-bold text-zinc-200 mb-1 text-sm">
                No tienes sorteos activos
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Crea tu primer evento de Amigo Invisible e invita a tus amigos o familiares.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Crear nuevo evento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-sky-500 bg-zinc-850 shadow-md ring-1 ring-sky-500/50'
                        : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-zinc-100 text-sm line-clamp-1">
                        {group.title}
                      </h3>
                      {group.status === 'DRAWN' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/80 flex-shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Sorteado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700 flex-shrink-0">
                          <Clock className="w-3 h-3" /> Borrador
                        </span>
                      )}
                    </div>

                    {group.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1 mb-3">
                        {group.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-zinc-500" />
                        {group.membersCount} participantes
                      </span>
                      {group.budget > 0 && (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                          Máx. {group.budget} €
                        </span>
                      )}
                      {group.isCreator && (
                        <span className="text-[10px] bg-zinc-800 border border-zinc-700 text-sky-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          Organizador
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha: Detalle del Evento y Tarjeta de Revelación */}
        <div className="lg:col-span-8">
          {loadingDetail ? (
            <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
              <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-xs font-semibold text-zinc-400">Cargando detalles del Amigo Invisible...</p>
            </div>
          ) : selectedGroup ? (
            <div className="space-y-6">
              {/* Tarjeta de Encabezado del Evento */}
              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-zinc-100">
                        {selectedGroup.title}
                      </h2>
                      {selectedGroup.status === 'DRAWN' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-800/80">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sorteo Realizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded border border-zinc-700">
                          <Clock className="w-3.5 h-3.5" /> Esperando Sorteo
                        </span>
                      )}
                    </div>
                    {selectedGroup.description && (
                      <p className="text-zinc-300 text-sm mt-1">
                        {selectedGroup.description}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 mt-2">
                      Organizado por <span className="font-semibold text-zinc-300">
                        {selectedGroup.creator.firstName && selectedGroup.creator.lastName
                          ? `${selectedGroup.creator.firstName} ${selectedGroup.creator.lastName} (@${selectedGroup.creator.username})`
                          : `@${selectedGroup.creator.username}`}
                      </span>
                    </p>
                  </div>

                  {/* Acciones de Organizador */}
                  <div className="flex items-center gap-2">
                    {selectedGroup.isCreator && selectedGroup.status === 'DRAFT' && (
                      <button
                        onClick={handleDraw}
                        disabled={drawing || selectedGroup.members.length < 3}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all min-h-[38px] ${
                          selectedGroup.members.length < 3
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                            : 'bg-sky-500 hover:bg-sky-400 text-zinc-950 shadow-sky-500/20'
                        }`}
                        title={
                          selectedGroup.members.length < 3
                            ? 'Se requieren mínimo 3 miembros para sortear'
                            : 'Ejecutar sorteo de emparejamientos'
                        }
                      >
                        <Shuffle className={`w-4 h-4 ${drawing ? 'animate-spin' : ''}`} />
                        <span>{drawing ? 'Sorteando...' : 'Realizar Sorteo'}</span>
                      </button>
                    )}

                    {selectedGroup.isCreator && (
                      <button
                        onClick={handleDeleteGroup}
                        disabled={deleting}
                        title="Eliminar evento"
                        className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center border border-transparent hover:border-zinc-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Métricas del Evento */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 text-sm">
                  <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-850 text-sky-400 flex items-center justify-center border border-zinc-700/60">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Participantes</p>
                      <p className="font-bold text-zinc-200">
                        {selectedGroup.members.length} personas
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-850 text-emerald-400 flex items-center justify-center border border-zinc-700/60">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Presupuesto</p>
                      <p className="font-bold text-zinc-200">
                        {selectedGroup.budget > 0 ? `${selectedGroup.budget} €` : 'Libre'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 col-span-2 sm:col-span-1 bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-850 text-amber-400 flex items-center justify-center border border-zinc-700/60">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Intercambio</p>
                      <p className="font-bold text-zinc-200">
                        {selectedGroup.exchangeDate
                          ? new Date(selectedGroup.exchangeDate).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TARJETA INTERACTIVA DE REVELACIÓN (CONFIDENCIAL / MISTERIO) */}
              {selectedGroup.status === 'DRAWN' ? (
                <div className="relative overflow-hidden rounded-xl p-6 sm:p-8 bg-zinc-950 border border-zinc-800 text-zinc-100 shadow-2xl">
                  {/* Línea de acento cyber-glow superior */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-600" />
                  <div className="absolute -top-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                  {!isRevealed ? (
                    // Estado Oculto / Misterioso
                    <div className="text-center py-6 sm:py-8 max-w-lg mx-auto relative z-10">
                      <div className="w-16 h-16 mx-auto mb-4 bg-zinc-900 border border-sky-500/40 text-sky-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/10">
                        <Lock className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black mb-2 tracking-tight text-zinc-100">
                        Asignación Secreta Cifrada
                      </h3>
                      <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                        El sorteo se ha completado. Para proteger el anonimato y evitar spoilers accidentales en pantalla, tu asignación está oculta.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsRevealed(true);
                          info('¡Amigo invisible revelado!');
                        }}
                        className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-black px-6 py-3 rounded-lg shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] transition-all text-xs uppercase tracking-wider min-h-[44px]"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Desbloquear y Revelar Destinatario</span>
                      </button>
                    </div>
                  ) : (
                    // Estado Revelado
                    <div className="relative z-10 transition-all duration-300">
                      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
                        <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>[ ASIGNACIÓN CONFIDENCIAL DESBLOQUEADA ]</span>
                        </div>
                        <button
                          onClick={() => setIsRevealed(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-zinc-900 hover:bg-zinc-850 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-800 transition-colors min-h-[34px]"
                        >
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Ocultar secreto</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                          {selectedGroup.myAssignedTo?.avatarUrl ? (
                            <img
                              src={selectedGroup.myAssignedTo.avatarUrl}
                              alt={selectedGroup.myAssignedTo.username}
                              className="w-16 h-16 rounded-xl object-cover shadow-lg shadow-sky-500/30 border border-sky-400/50 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 text-zinc-950 flex items-center justify-center font-black text-2xl shadow-lg shadow-sky-500/30 border border-sky-400/50 flex-shrink-0">
                              {selectedGroup.myAssignedTo?.username.slice(0, 2).toUpperCase() || '🎁'}
                            </div>
                          )}
                          <div>
                            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Tu objetivo de regalo:</p>
                            <h4 className="text-2xl sm:text-3xl font-black text-zinc-100 font-mono tracking-tight">
                              {selectedGroup.myAssignedTo?.firstName && selectedGroup.myAssignedTo?.lastName
                                ? `${selectedGroup.myAssignedTo.firstName} ${selectedGroup.myAssignedTo.lastName}`
                                : `@${selectedGroup.myAssignedTo?.username}`}
                            </h4>
                            {selectedGroup.myAssignedTo?.firstName && selectedGroup.myAssignedTo?.lastName && (
                              <p className="text-xs text-sky-400 font-mono font-medium">
                                @{selectedGroup.myAssignedTo?.username}
                              </p>
                            )}
                            {selectedGroup.budget > 0 && (
                              <p className="text-xs text-emerald-400 font-mono font-bold mt-1 inline-flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                                Presupuesto orientativo: {selectedGroup.budget} €
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Listas de deseos de la persona asignada */}
                      <div className="mt-8 pt-6 border-t border-zinc-800">
                        <h5 className="font-bold text-zinc-200 text-sm mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-sky-400" />
                          Listas de Deseos de @{selectedGroup.myAssignedTo?.username}
                        </h5>

                        {selectedGroup.myAssignedWishlists && selectedGroup.myAssignedWishlists.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedGroup.myAssignedWishlists.map((wl) => (
                              <Link
                                key={wl.id}
                                to={`/w/${wl.shareSlug}`}
                                className="flex items-center justify-between p-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-sky-500/50 transition-all group"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-zinc-100 text-sm truncate group-hover:text-sky-400 transition-colors">
                                    {wl.title}
                                  </p>
                                  <p className="text-xs text-zinc-400">
                                    {wl._count?.items ?? 0} regalos guardados
                                  </p>
                                </div>
                                <div className="p-2 rounded-md bg-zinc-800 group-hover:bg-sky-500 group-hover:text-zinc-950 text-zinc-300 transition-colors flex-shrink-0">
                                  <ArrowRight className="w-4 h-4" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 text-center text-xs text-zinc-400">
                            @{selectedGroup.myAssignedTo?.username} aún no tiene listas de deseos públicas.
                            ¡Pídele que añada sus regalos favoritos a Wishlist Hub!
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Sorteo aún pendiente
                <div className="p-6 rounded-xl bg-zinc-900 border border-amber-900/40 text-amber-300">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm mb-1 text-zinc-100">
                        Sorteo pendiente de realización
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {selectedGroup.isCreator
                          ? selectedGroup.members.length >= 3
                            ? 'Tienes suficientes participantes (mínimo 3). Cuando quieras puedes pulsar "Realizar Sorteo" arriba para barajar los nombres y notificar por email a todos.'
                            : `Necesitas invitar al menos a ${3 - selectedGroup.members.length} participante(s) más para poder realizar el sorteo (mínimo 3).`
                          : `El organizador (${
                              selectedGroup.creator.firstName && selectedGroup.creator.lastName
                                ? `${selectedGroup.creator.firstName} ${selectedGroup.creator.lastName} (@${selectedGroup.creator.username})`
                                : `@${selectedGroup.creator.username}`
                            }) aún no ha realizado el sorteo. Te llegará una notificación cuando se hayan asignado los regalos.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Miembros Participantes con Blindaje de Privacidad */}
              <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <Users className="w-4 h-4 text-zinc-400" />
                    Participantes ({selectedGroup.members.length})
                  </h3>
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-sky-400" /> Asignaciones blindadas
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedGroup.members.map((member) => {
                    const isMe = member.userId === user?.id;
                    const hasFullName = Boolean(member.user.firstName || member.user.lastName);
                    const fullName = [member.user.firstName, member.user.lastName].filter(Boolean).join(' ');
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                          isMe
                            ? 'border-sky-500/50 bg-sky-950/20'
                            : 'border-zinc-800/80 bg-zinc-950/60'
                        }`}
                      >
                        {member.user.avatarUrl ? (
                          <img
                            src={member.user.avatarUrl}
                            alt={member.user.username}
                            className="w-9 h-9 rounded-lg object-cover border border-zinc-700/60 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold font-mono text-xs text-zinc-200 flex-shrink-0">
                            {member.user.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-zinc-200 truncate">
                            {hasFullName ? fullName : `@${member.user.username}`} {isMe && '(Tú)'}
                          </p>
                          {hasFullName && (
                            <p className="text-[11px] text-zinc-400 font-mono truncate">
                              @{member.user.username}
                            </p>
                          )}
                          <p className="text-[11px] text-zinc-400 truncate">
                            {member.hasAssignment ? (
                              <span className="text-emerald-400 font-medium">
                                ✓ Emparejado
                              </span>
                            ) : (
                              'En espera'
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 px-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
              <div className="w-14 h-14 mx-auto mb-4 text-sky-400 flex items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700/60">
                <Gift className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-zinc-100 mb-1">
                Selecciona un evento de Amigo Invisible
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Haz clic en cualquier evento de la lista izquierda para descubrir tu regalo asignado, ver sus listas o gestionar el sorteo.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR EVENTO */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-zinc-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sky-400">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-zinc-100">
                  Nuevo Amigo Invisible
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Amigo Invisible Gaming 2026 o Evento Familiar"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                  Descripción o Instrucciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Entrega de regalos en la cena. Temática libre..."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                    Presupuesto (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Ej: 20"
                    value={createBudget}
                    onChange={(e) => setCreateBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                    Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={(e) => setCreateDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>
              </div>

              {/* SELECCIÓN DE PARTICIPANTES */}
              <div className="pt-2">
                <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                  Invitar Amigos ({selectedMemberIds.length} seleccionados)
                </label>
                <p className="text-xs text-zinc-500 mb-2">
                  Tú ya estás incluido automáticamente como participante y organizador.
                </p>

                {/* Lista de amigos registrados */}
                {friendsList.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-zinc-950 border border-zinc-800 mb-3">
                    {friendsList.map((f) => {
                      const isSelected = selectedMemberIds.includes(f.id);
                      const hasFullName = Boolean(f.firstName || f.lastName);
                      const fullName = [f.firstName, f.lastName].filter(Boolean).join(' ');
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleMemberSelection(f.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-md text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-sky-500 text-zinc-950 font-bold shadow-sm'
                              : 'hover:bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            {f.avatarUrl ? (
                              <img src={f.avatarUrl} alt="" className="w-5 h-5 rounded-md object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-[10px] font-mono flex-shrink-0">
                                {f.username.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold truncate">
                              {hasFullName ? `${fullName} (@${f.username})` : `@${f.username}`}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="flex items-center gap-1 font-bold ml-2 flex-shrink-0">
                              ✓ Seleccionado
                            </span>
                          ) : (
                            <span className="text-zinc-500 ml-2 flex-shrink-0">+ Añadir</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 mb-3">
                    Aún no tienes amigos añadidos en tu red. Puedes buscarlos por nombre abajo.
                  </div>
                )}

                {/* Buscador de usuarios para añadir */}
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar otros usuarios por @username..."
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-100 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                    {searchResults.map((u) => {
                      const isSelected = selectedMemberIds.includes(u.id);
                      const hasFullName = Boolean(u.firstName || u.lastName);
                      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ');
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleMemberSelection(u.id)}
                          className={`w-full flex items-center justify-between p-1.5 rounded-md text-xs transition-all ${
                            isSelected
                              ? 'bg-sky-500 text-zinc-950 font-bold'
                              : 'hover:bg-zinc-900 text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="w-4 h-4 rounded-md object-cover flex-shrink-0" />
                            ) : null}
                            <span className="truncate">
                              {hasFullName ? `${fullName} (@${u.username})` : `@${u.username}`}
                            </span>
                          </div>
                          <span>{isSelected ? '✓' : '+'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-semibold min-h-[38px] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold px-5 py-2 rounded-lg shadow-sm transition-all text-xs min-h-[38px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{creating ? 'Creando...' : 'Crear Sorteo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretSanta;
