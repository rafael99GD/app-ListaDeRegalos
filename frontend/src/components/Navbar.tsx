import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Gift,
  LogOut,
  User as UserIcon,
  Plus,
  Sparkles,
  Sun,
  Moon,
  List,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { info } = useToast();

  const handleLogout = () => {
    logout();
    info('Has cerrado sesión correctamente');
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-zinc-950/85 dark:bg-zinc-950/85 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sky-400 shadow-sm group-hover:border-sky-500/50 group-hover:text-sky-300 transition-all flex-shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex items-center">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-zinc-100">
                  Wishlist<span className="text-sky-400 ml-1">Hub</span>
                </span>
                <span className="hidden sm:inline-block ml-2.5 text-[10px] font-mono uppercase tracking-wider text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 font-medium">
                  Gaming Edition
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1.5">
                <Link
                  to="/"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                    location.pathname === '/'
                      ? 'text-sky-400 bg-zinc-900 border border-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  Mis Listas
                </Link>
                <Link
                  to="/friends"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    location.pathname === '/friends'
                      ? 'text-sky-400 bg-zinc-900 border border-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Amigos</span>
                </Link>
                <Link
                  to="/secret-santa"
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    location.pathname === '/secret-santa'
                      ? 'text-sky-400 bg-zinc-900 border border-zinc-800'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Amigo Invisible</span>
                </Link>
              </nav>
            )}

            {/* Navigation & User actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Botón de Modo Oscuro / Claro */}
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Modo oscuro activo' : 'Modo claro activo'}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-sky-400" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {isAuthenticated ? (
                <>
                  {onOpenCreateModal && (
                    <button
                      onClick={onOpenCreateModal}
                      className="hidden sm:inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm hover:shadow transition-all min-h-[40px] active:scale-[0.98]"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Nueva Lista</span>
                    </button>
                  )}

                  <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

                  <Link
                    to="/profile"
                    title="Mi perfil y ajustes"
                    className={`flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded-lg border transition-all min-h-[40px] ${
                      location.pathname === '/profile'
                        ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-zinc-100'
                    }`}
                  >
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-5 h-5 rounded-md object-cover" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <span className="hidden md:inline font-medium text-zinc-200">
                      @{user?.username}
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    aria-label="Cerrar sesión"
                    className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 rounded-lg border border-transparent hover:border-zinc-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-xs font-semibold uppercase tracking-wider text-zinc-300 hover:text-sky-400 px-3 py-2 rounded-lg transition-colors min-h-[40px] flex items-center"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg shadow-sm transition-all min-h-[40px] active:scale-[0.98]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Registro</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Barra de navegación inferior móvil estilizada para gaming (5 pestañas) */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 shadow-2xl">
          <div className="grid grid-cols-5 h-16">
            <Link
              to="/?tab=my"
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                location.pathname === '/' && (!location.search || location.search.includes('tab=my'))
                  ? 'text-sky-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Listas</span>
            </Link>

            <Link
              to="/friends"
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                location.pathname === '/friends'
                  ? 'text-sky-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Amigos</span>
            </Link>

            {onOpenCreateModal && (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold text-sky-400"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 flex items-center justify-center shadow-lg shadow-sky-950/50 -mt-5 border-2 border-zinc-950 transition-transform active:scale-95">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <span>Crear</span>
              </button>
            )}

            <Link
              to="/secret-santa"
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                location.pathname === '/secret-santa'
                  ? 'text-sky-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Sorteo</span>
            </Link>

            <Link
              to="/profile"
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                location.pathname === '/profile'
                  ? 'text-sky-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4" />
              )}
              <span>Perfil</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
};
