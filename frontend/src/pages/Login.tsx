import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Gift, Lock, User, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      error('Por favor completa todos los campos');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login({
        identifier: identifier.trim().toLowerCase(),
        password,
      });

      if (res.success) {
        success('¡Bienvenido/a de nuevo!');
        navigate(from, { replace: true });
      } else if (res.isVerified === false) {
        info('Tu cuenta requiere verificación previa.');
        navigate(`/verify-otp?email=${encodeURIComponent(res.email || identifier.trim())}`);
      } else {
        error(res.message || 'Credenciales inválidas');
      }
    } catch (err: any) {
      error('Error al iniciar sesión');
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
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Iniciar Sesión</h2>
          <p className="text-xs text-zinc-400 mt-1">Accede a tus listas de regalos y deseos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Usuario o Correo
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                placeholder="ej: usuario o tu@correo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Contraseña
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
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
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Iniciando sesión...' : 'Entrar a mi cuenta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-400">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/register" className="font-bold text-sky-400 hover:text-sky-300 hover:underline">
            Regístrate gratis
          </Link>
        </div>
      </div>
    </div>
  );
};
