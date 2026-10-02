import React from 'react';
import { X, ExternalLink, Gift, UserPlus, CreditCard, Gamepad2, Info } from 'lucide-react';
import { Item } from '../types';

interface SteamGiftGuideModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onReserveClick: (item: Item) => void;
}

export const SteamGiftGuideModal: React.FC<SteamGiftGuideModalProps> = ({
  isOpen,
  item,
  onClose,
  onReserveClick,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full shadow-2xl border border-zinc-800 overflow-hidden transform transition-all animate-slideUp sm:animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-[#171a21] text-white flex items-center justify-between border-b border-[#2a475e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2a475e] text-[#66c0f4] flex items-center justify-center shadow-inner">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ¿Cómo regalar este juego?
              </h3>
              <p className="text-xs text-[#8f98a0]">Opciones para regalar títulos de Steam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#8f98a0] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-zinc-300 text-xs">
          {/* Item Preview */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase tracking-wider mb-0.5">Juego de Steam:</p>
              <h4 className="font-bold text-zinc-100 text-sm truncate">{item.title}</h4>
              {item.price !== null && (
                <span className="text-xs font-mono font-bold text-sky-400">
                  {item.price.toFixed(2)} {item.currency}
                </span>
              )}
            </div>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a475e] hover:bg-[#1b2838] text-[#66c0f4] text-xs font-bold transition-colors flex-shrink-0"
              >
                <span>Ver en Steam</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Opciones */}
          <div className="space-y-3">
            {/* Opción A */}
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <UserPlus className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span>Opción 1: Regalo directo por Steam</span>
              </div>
              <ul className="text-zinc-400 space-y-1.5 list-disc list-inside pl-1 leading-relaxed">
                <li>Añade al destinatario a tu lista de amigos en Steam.</li>
                <li>Abre el juego en Steam y elige la opción <strong>&quot;Comprar como regalo&quot;</strong>.</li>
                <li>Selecciona a tu amigo en la lista de destinatarios.</li>
                <li>
                  <strong>¡Importante!</strong> Vuelve aquí y marca el regalo como <strong>Reservado</strong> para que otros invitados no lo compren.
                </li>
              </ul>
            </div>

            {/* Opción B */}
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/70 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Opción 2: Aportación de dinero (Bizum o transferencia)</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                Si no tienes cuenta de Steam o prefieres que lo compre directamente, puedes enviarle el importe por Bizum o transferencia y marcar el regalo aquí para que quede asignado con tu nombre.
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Tanto si lo compras en Steam como si envías el dinero, pulsa a continuación en <strong>&quot;Voy a regalar esto&quot;</strong> para reservar el regalo en esta web.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-950/70 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200"
          >
            Cerrar
          </button>
          {!item.isPurchased && (
            <button
              onClick={() => {
                onClose();
                onReserveClick(item);
              }}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Gift className="w-4 h-4" />
              <span>Voy a regalar esto</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
