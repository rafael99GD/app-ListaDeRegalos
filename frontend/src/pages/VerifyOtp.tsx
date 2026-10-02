import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, CheckCircle2, RotateCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';

export const VerifyOtp: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { verifyOtp } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      error('El correo es requerido');
      return;
    }
    if (code.length !== 6) {
      error('El código OTP debe tener 6 dígitos');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await verifyOtp({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });

      if (res.success) {
        success('¡Cuenta verificada exitosamente! Bienvenido/a.');
        navigate('/');
      } else {
        error(res.message || 'Código OTP inválido');
      }
    } catch (err: any) {
      error('Error al procesar el código de verificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      error('Ingresa tu correo para reenviar el código');
      return;
    }

    try {
      setIsResending(true);
      const res = await authService.resendOtp(email.trim().toLowerCase());
      info(res.message || 'Nuevo código enviado');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al reenviar código');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-zinc-950">
      <div className="bg-zinc-900 rounded-xl max-w-md w-full p-7 sm:p-8 shadow-2xl border border-zinc-800">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400 mx-auto shadow-md mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">Verificación de Cuenta</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Introduce el código numérico de 6 dígitos que enviamos a tu correo
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-xs transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 text-center">
              Código OTP (6 dígitos)
            </label>
            <input
              type="text"
              required
              maxLength={6}
              autoFocus
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-2.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-sky-500 text-sky-400 bg-zinc-950 transition-colors"
            />
            <p className="text-[10px] text-zinc-500 text-center mt-1">
              (En modo de desarrollo, el código aparece impreso en la terminal del backend)
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[42px] text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Verificando...' : 'Verificar e Ingresar'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center justify-center gap-1.5 disabled:opacity-50 min-h-[34px] transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>{isResending ? 'Reenviando...' : '¿No recibiste el código? Reenviar OTP'}</span>
          </button>

          <Link
            to="/login"
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 flex items-center justify-center gap-1 mt-1 min-h-[34px] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Iniciar Sesión</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
