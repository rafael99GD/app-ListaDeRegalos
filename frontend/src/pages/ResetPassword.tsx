import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || code.length !== 6 || newPassword.length < 6) {
      error('Por favor completa todos los campos correctamente');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authService.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });

      success(res.message || 'Contraseña actualizada correctamente');
      navigate('/login');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-zinc-950">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-8 shadow-2xl border border-zinc-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-lg shadow-sky-950/40 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Nueva Contraseña</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Ingresa el código que te enviamos y define tu nueva contraseña
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 text-center">
              Código OTP (6 dígitos)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-2.5 rounded-lg border border-zinc-800 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-zinc-100 bg-zinc-950 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
              Nueva Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="Mínimo 6 caracteres con letras y números"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-zinc-400 hover:text-sky-400 inline-flex items-center gap-1.5 min-h-[36px] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
