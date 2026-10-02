import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { authService } from '../services/authService';
import { useToast } from '../context/ToastContext';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await authService.forgotPassword(email.trim().toLowerCase());
      success(res.message || 'Código de recuperación enviado');
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al procesar solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-zinc-950">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-8 shadow-2xl border border-zinc-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mx-auto shadow-lg shadow-sky-950/40 mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Recuperar Contraseña</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Ingresa tu correo para recibir un código de recuperación
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px]"
            >
              <span>{isSubmitting ? 'Enviando código...' : 'Enviar Código de Recuperación'}</span>
              <ArrowRight className="w-4 h-4" />
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
