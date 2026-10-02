import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gift, Sparkles, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Register: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim()) {
      error('Por favor ingresa tu nombre');
      return;
    }
    if (!lastName.trim()) {
      error('Por favor ingresa tus apellidos');
      return;
    }
    if (username.length < 3) {
      error('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }
    if (password.length < 6) {
      error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success) {
        success(res.message || 'Código OTP enviado a tu correo');
        navigate(`/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else {
        error(res.message || 'Error en el registro');
      }
    } catch (err: any) {
      error('Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-zinc-950">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-7 sm:p-8 shadow-2xl border border-zinc-800">
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400 mx-auto shadow-md mb-3">
            <Gift className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Crea tu cuenta</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Empieza a crear y compartir tus listas de regalos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Nombre
              </label>
              <input
                type="text"
                required
                placeholder="ej: Carlos"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Apellidos
              </label>
              <input
                type="text"
                required
                placeholder="ej: García Gómez"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Nombre de usuario (@username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="ej: carlos_gamer"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

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
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres con letras y números"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[42px] text-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Registrarme y recibir código'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-bold text-sky-400 hover:text-sky-300 hover:underline">
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
};
