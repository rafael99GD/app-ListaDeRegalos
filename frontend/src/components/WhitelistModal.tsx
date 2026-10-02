import React, { useState } from 'react';
import { X, UserPlus, Trash2, ShieldCheck, User } from 'lucide-react';
import { WhitelistUser } from '../types';
import { wishlistService } from '../services/wishlistService';
import { useToast } from '../context/ToastContext';

interface WhitelistModalProps {
  isOpen: boolean;
  wishlistId: string;
  whitelistUsers: WhitelistUser[];
  onClose: () => void;
  onUpdate: () => void;
}

export const WhitelistModal: React.FC<WhitelistModalProps> = ({
  isOpen,
  wishlistId,
  whitelistUsers,
  onClose,
  onUpdate,
}) => {
  const [username, setUsername] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    try {
      setIsAdding(true);
      await wishlistService.addToWhitelist(wishlistId, username.trim().toLowerCase());
      success(`Usuario @${username.trim()} añadido a los autorizados`);
      setUsername('');
      onUpdate();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al autorizar usuario');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveUser = async (userId: string, username: string) => {
    if (!window.confirm(`¿Seguro que deseas revocar el acceso a @${username}?`)) return;

    try {
      setDeletingId(userId);
      await wishlistService.removeFromWhitelist(wishlistId, userId);
      success(`Acceso revocado a @${username}`);
      onUpdate();
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al revocar acceso');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-md w-full shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[85vh] transform transition-all animate-slideUp sm:animate-fadeIn">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400 shadow-sm">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Acceso a Lista Privada</h3>
              <p className="text-xs text-zinc-400">Gestiona quién puede ver esta lista</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add user form */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-950/60 flex-shrink-0">
          <form onSubmit={handleAddUser} className="space-y-2">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Invitar por nombre de usuario
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500 text-sm font-mono font-bold">
                  @
                </span>
                <input
                  type="text"
                  placeholder="ejemplo_usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isAdding || !username.trim()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 min-h-[38px]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAdding ? 'Añadiendo...' : 'Autorizar'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Users list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-2.5">
          <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Usuarios con acceso ({whitelistUsers.length})
          </h4>

          {whitelistUsers.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <User className="w-9 h-9 mx-auto mb-2 opacity-30 text-sky-400" />
              <p className="text-xs font-semibold text-zinc-300">Aún no has añadido ningún invitado a esta lista.</p>
              <p className="text-[11px] text-zinc-500 mt-1">Solo tú puedes verla en este momento.</p>
            </div>
          ) : (
            whitelistUsers.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700/60 text-sky-400 font-mono font-bold flex items-center justify-center text-xs">
                    {item.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-200">@{item.user.username}</p>
                    <p className="text-[11px] text-zinc-500">{item.user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={deletingId === item.userId}
                  onClick={() => handleRemoveUser(item.userId, item.user.username)}
                  className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50 min-h-[34px] min-w-[34px] flex items-center justify-center"
                  title="Revocar acceso"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/70 border-t border-zinc-800 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
