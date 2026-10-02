import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Sparkles, AlertCircle, Flame, Edit2 } from 'lucide-react';
import { Item } from '../types';
import { itemService } from '../services/itemService';
import { getFullImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';

interface AddItemModalProps {
  isOpen: boolean;
  wishlistId: string;
  itemToEdit?: Item | null;
  onClose: () => void;
  onSuccess: (item: Item) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  wishlistId,
  itemToEdit = null,
  onClose,
  onSuccess,
}) => {
  const isEditing = Boolean(itemToEdit);

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [url, setUrl] = useState('');
  const [priority, setPriority] = useState<number>(5);
  const [imageMode, setImageMode] = useState<'upload' | 'url' | 'none'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title || '');
      setPrice(itemToEdit.price !== null && itemToEdit.price !== undefined ? String(itemToEdit.price) : '');
      setCurrency(itemToEdit.currency || 'EUR');
      setUrl(itemToEdit.url || '');
      setPriority(itemToEdit.priority || 5);

      if (itemToEdit.imageType === 'URL' && itemToEdit.imageUrl) {
        setImageMode('url');
        setImageUrl(itemToEdit.imageUrl);
        setPreviewUrl(null);
      } else if (itemToEdit.imageType === 'LOCAL' && itemToEdit.imageUrl) {
        setImageMode('upload');
        setPreviewUrl(getFullImageUrl(itemToEdit.imageUrl));
        setImageUrl('');
      } else {
        setImageMode('none');
        setImageUrl('');
        setPreviewUrl(null);
      }
      setSelectedFile(null);
    } else {
      setTitle('');
      setPrice('');
      setCurrency('EUR');
      setUrl('');
      setPriority(5);
      setImageMode('upload');
      setImageUrl('');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      error('Solo se admiten imágenes PNG, JPG o JPEG');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      error('El archivo no debe exceder los 2MB');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl && !previewUrl.startsWith('http') && !previewUrl.startsWith('/')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getDesireLevelInfo = (level: number) => {
    if (level >= 9) {
      return {
        label: '¡Imprescindible!',
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50',
        fill: 'bg-rose-500',
        emoji: '🔥',
      };
    }
    if (level >= 7) {
      return {
        label: 'Deseo alto',
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-900/50',
        fill: 'bg-orange-500',
        emoji: '⭐',
      };
    }
    if (level >= 5) {
      return {
        label: 'Buen deseo',
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50',
        fill: 'bg-amber-500',
        emoji: '✨',
      };
    }
    return {
      label: 'Casual / Detalle',
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
      fill: 'bg-slate-400',
      emoji: '🎁',
    };
  };

  const desireInfo = getDesireLevelInfo(priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      error('El título del regalo es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      if (price) formData.append('price', price);
      formData.append('currency', currency);
      if (url.trim()) formData.append('url', url.trim());
      formData.append('priority', String(priority));

      if (imageMode === 'upload' && selectedFile) {
        formData.append('image', selectedFile);
      } else if (imageMode === 'url' && imageUrl.trim()) {
        formData.append('imageUrl', imageUrl.trim());
      } else if (imageMode === 'none' && isEditing) {
        formData.append('removeImage', 'true');
      }

      if (isEditing && itemToEdit) {
        const updated = await itemService.updateItem(itemToEdit.id, formData);
        success('¡Regalo actualizado con éxito!');
        onSuccess(updated);
      } else {
        const newItem = await itemService.addItem(wishlistId, formData);
        success('¡Regalo añadido a tu lista!');
        onSuccess(newItem);
      }

      onClose();
    } catch (err: any) {
      error(err.response?.data?.message || (isEditing ? 'Error al actualizar regalo' : 'Error al agregar el regalo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-900 rounded-t-2xl sm:rounded-xl max-w-lg w-full shadow-2xl border border-zinc-800 overflow-hidden max-h-[92vh] flex flex-col transform transition-all animate-slideUp sm:animate-fadeIn">
        {/* Mobile drag handle */}
        <div className="pt-3 pb-1 sm:hidden flex justify-center">
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4 bg-zinc-950/70 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400 shadow-sm">
              {isEditing ? <Edit2 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                {isEditing ? 'Editar Regalo' : 'Añadir Regalo'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isEditing ? 'Modifica los detalles de este regalo' : 'Agrega un deseo a tu lista de regalos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
              Título del regalo <span className="text-sky-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Auriculares Bluetooth con cancelación de ruido"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          {/* Nivel de Deseo (1-10) */}
          <div className="p-3.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Nivel de deseo (1 al 10)</span>
              </label>
              <div
                className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm transition-all ${desireInfo.bg} ${desireInfo.color}`}
              >
                <span>{desireInfo.emoji}</span>
                <span>{priority} / 10</span>
                <span>•</span>
                <span>{desireInfo.label}</span>
              </div>
            </div>

            {/* Range slider */}
            <div className="space-y-1">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-500 px-1">
                <span>1 (Casual)</span>
                <span>5 (Normal)</span>
                <span>10 (¡Máximo!)</span>
              </div>
            </div>

            {/* Quick tap selector buttons */}
            <div className="grid grid-cols-10 gap-1 pt-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPriority(num)}
                  className={`py-1 rounded-md text-xs font-mono font-bold transition-all ${
                    priority === num
                      ? 'bg-sky-500 text-zinc-950 shadow-sm'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                Precio estimado (opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="49.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-sky-500 text-sm transition-colors"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="MXN">MXN ($)</option>
              </select>
            </div>
          </div>

          {/* Direct Link */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Enlace de compra en tienda (opcional)</span>
            </label>
            <input
              type="url"
              placeholder="https://tienda.com/producto/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
            />
          </div>

          {/* Image Mode Tabs */}
          <div>
            <label className="block text-xs font-bold uppercase text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
              <span>Imagen del regalo</span>
            </label>
            <div className="flex bg-zinc-950/80 border border-zinc-800/80 p-1 rounded-lg mb-3">
              <button
                type="button"
                onClick={() => setImageMode('upload')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  imageMode === 'upload'
                    ? 'bg-sky-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                Subir Archivo
              </button>
              <button
                type="button"
                onClick={() => setImageMode('url')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  imageMode === 'url'
                    ? 'bg-sky-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                Enlace URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode('none')}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${
                  imageMode === 'none'
                    ? 'bg-sky-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                Sin Imagen
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {imageMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".png, .jpg, .jpeg"
                  className="hidden"
                />
                {!previewUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-zinc-800 hover:border-sky-500/50 rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-zinc-950/60 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-sky-400">
                      <Upload className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-300">
                      Haz clic para seleccionar una foto
                    </p>
                    <p className="text-[11px] text-zinc-500">PNG, JPG o JPEG (Máx. 2MB)</p>
                  </div>
                ) : (
                  <div className="relative rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-md border border-zinc-800"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-zinc-200 truncate max-w-[200px]">
                          {selectedFile ? selectedFile.name : 'Imagen actual'}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Imagen guardada'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-md transition-colors"
                      title="Quitar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: External URL */}
            {imageMode === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto-producto.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-sky-500 text-sm transition-colors"
                />
                {imageUrl && (
                  <div className="p-2 border border-zinc-800 rounded-lg flex items-center gap-3 bg-zinc-950">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                      className="w-12 h-12 object-cover rounded-md border border-zinc-800"
                    />
                    <span className="text-xs text-zinc-400">Vista previa de la URL</span>
                  </div>
                )}
              </div>
            )}

            {imageMode === 'none' && (
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-zinc-500" />
                <span>Se utilizará un icono temático de regalo por defecto.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800 flex-shrink-0">
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
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar Cambios'
                : 'Guardar Regalo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
