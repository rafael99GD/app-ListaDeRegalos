import React, { useState } from 'react';
import { X, Globe, Lock, Sparkles, Calendar } from 'lucide-react';
import { Wishlist, Visibility } from '../types';
import { wishlistService } from '../services/wishlistService';
import { useToast } from '../context/ToastContext';

interface CreateWishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (wishlist: Wishlist) => void;
}

const OCCASIONS = [
  'Navidad 🎄',
  'San Valentín 💘',
  'Cumpleaños 🎂',
  'Boda 💍',
  'Baby Shower 🍼',
  'Aniversario 🥂',
  'Graduación 🎓',
];

export const CreateWishlistModal: React.FC<CreateWishlistModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [occasion, setOccasion] = useState('Navidad');
  const [customOccasion, setCustomOccasion] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('El título de la lista es obligatorio');
      return;
    }

    try {
      setIsSubmitting(true);
      const finalOccasion = occasion === 'custom' ? customOccasion.trim() : occasion;

      const created = await wishlistService.createWishlist({
        title: title.trim(),
        description: description.trim() || undefined,
        occasion: finalOccasion || undefined,
        visibility,
      });

      success('¡Lista de regalos creada con éxito!');
      onSuccess(created);
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setOccasion('Navidad');
      setCustomOccasion('');
      setVisibility('PUBLIC');
    } catch (err: any) {
      error(err.response?.data?.message || 'Error al crear la lista de regalos');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full shadow-2xl border border-zinc-800 overflow-hidden transform transition-all animate-slideUp sm:animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Nueva Lista de Regalos</h3>
              <p className="text-xs text-zinc-400">Configura los detalles de tu lista</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
              Título de la lista <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Mis Deseos de Navidad, Cumpleaños 30..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
              Descripción o mensaje para los invitados
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Ideas de cosas que me harían mucha ilusión este año..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors resize-none"
            />
          </div>

          {/* Occasion */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>Ocasión especial</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {OCCASIONS.map((occ) => {
                const pureName = occ.split(' ')[0];
                const isSelected = occasion === pureName;
                return (
                  <button
                    key={pureName}
                    type="button"
                    onClick={() => setOccasion(pureName)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                      isSelected
                        ? 'bg-sky-500 border-sky-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setOccasion('custom')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                  occasion === 'custom'
                    ? 'bg-sky-500 border-sky-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                Otro ✨
              </button>
            </div>
            {occasion === 'custom' && (
              <input
                type="text"
                placeholder="Escribe la ocasión personalizada..."
                value={customOccasion}
                onChange={(e) => setCustomOccasion(e.target.value)}
                className="w-full mt-2 px-3.5 py-2 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
              />
            )}
          </div>

          {/* Visibility Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-2">
              Visibilidad de la lista
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setVisibility('PUBLIC')}
                className={`p-3.5 rounded-lg border text-left transition-all flex flex-col gap-1.5 ${
                  visibility === 'PUBLIC'
                    ? 'bg-zinc-950 border-sky-500 ring-1 ring-sky-500/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${visibility === 'PUBLIC' ? 'text-sky-400' : 'text-zinc-500'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${visibility === 'PUBLIC' ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    Pública
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Cualquiera con el enlace puede ver los regalos y reservarlos.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setVisibility('PRIVATE')}
                className={`p-3.5 rounded-lg border text-left transition-all flex flex-col gap-1.5 ${
                  visibility === 'PRIVATE'
                    ? 'bg-zinc-950 border-sky-500 ring-1 ring-sky-500/50'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${visibility === 'PRIVATE' ? 'text-sky-400' : 'text-zinc-500'}`} />
                  <span className={`text-xs font-bold uppercase tracking-wider ${visibility === 'PRIVATE' ? 'text-zinc-100' : 'text-zinc-400'}`}>
                    Privada
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Solo tú y los usuarios que agregues a la lista blanca tienen acceso.
                </p>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Creando lista...' : 'Crear Lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
