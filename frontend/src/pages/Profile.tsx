import React, { useState, useEffect, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  Shield,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';

export const Profile: React.FC = () => {
  const { user, updateUserData } = useAuth();
  const { success, error, info } = useToast();

  // Estados del perfil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Estados de seguridad
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de carga
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Manejador de subida de avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta en cliente de formato
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      error('Solo se admiten imágenes en formato JPEG o PNG.');
      return;
    }

    // Validación de peso (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('La imagen no puede superar los 5MB.');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const res = await userService.uploadAvatar(file);
      updateUserData({ avatarUrl: res.user.avatarUrl });
      success('Foto de perfil actualizada correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al subir la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manejador de eliminación de avatar
  const handleDeleteAvatar = async () => {
    if (!user?.avatarUrl) return;

    try {
      setIsUploadingAvatar(true);
      const res = await userService.deleteAvatar();
      updateUserData({ avatarUrl: null });
      info(res.message || 'Foto de perfil eliminada');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al eliminar la foto de perfil');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Guardar datos básicos del perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      error('El nombre no puede estar vacío');
      return;
    }
    if (!lastName.trim()) {
      error('Los apellidos no pueden estar vacíos');
      return;
    }
    if (username.trim().length < 3) {
      error('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    try {
      setIsSavingProfile(true);
      const res = await userService.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
      });
      updateUserData(res.user);
      success('Datos personales actualizados correctamente');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al actualizar el perfil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Guardar configuración de seguridad (Email y Contraseña)
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword.length < 6) {
      error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      error('Las contraseñas no coinciden');
      return;
    }

    if (newPassword && !currentPassword) {
      error('Debes ingresar tu contraseña actual para confirmar el cambio');
      return;
    }

    try {
      setIsSavingSecurity(true);
      const payload: any = {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        username: user?.username || '',
        email: email.trim().toLowerCase(),
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await userService.updateProfile(payload);
      updateUserData(res.user);
      success('Ajustes de seguridad actualizados con éxito');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al actualizar seguridad');
    } finally {
      setIsSavingSecurity(false);
    }
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    return 'WH';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 px-4 sm:px-6 lg:px-8 pt-6 pb-28 sm:py-8 animate-fadeIn">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabecera del perfil */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Contenedor de Avatar con microinteracción */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-700/80 shadow-2xl flex items-center justify-center relative">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-sky-400 font-mono">
                    {getInitials()}
                  </span>
                )}

                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Botón flotante para seleccionar archivo */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-sky-500 hover:bg-sky-400 text-zinc-950 rounded-xl shadow-lg border border-sky-300 transition-all hover:scale-105"
                title="Cambiar foto de perfil (JPG/PNG)"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Datos resumen */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-zinc-100 tracking-tight">
                  {firstName && lastName ? `${firstName} ${lastName}` : user?.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  @{user?.username}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{user?.email}</span>
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteAvatar}
                    disabled={isUploadingAvatar}
                    className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar foto</span>
                  </button>
                )}
                <span className="text-[11px] text-zinc-500">
                  Formatos permitidos: PNG, JPG (máx. 5MB)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 1: Información Personal */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-800">
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Información Personal</h2>
              <p className="text-xs text-zinc-400">
                Tu nombre público para amigos y eventos de Amigo Invisible
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Apellidos
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tus apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nombre de usuario (@identificador único)
              </label>
              <input
                type="text"
                required
                placeholder="tu_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs font-mono transition-colors"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Tus amigos te encontrarán buscando este identificador.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Guardando...' : 'Guardar Cambios'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sección 2: Seguridad y Credenciales */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sm:p-8 shadow-xl">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-zinc-800">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Seguridad y Credenciales</h2>
              <p className="text-xs text-zinc-400">
                Modifica tu correo electrónico o actualiza tu contraseña de acceso
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveSecurity} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>Cambiar Contraseña (Opcional)</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Contraseña Actual
                </label>
                <input
                  type="password"
                  placeholder="Requerida solo si vas a cambiar tu contraseña"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500 text-xs transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSecurity}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingSecurity ? 'Actualizando...' : 'Actualizar Credenciales'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
