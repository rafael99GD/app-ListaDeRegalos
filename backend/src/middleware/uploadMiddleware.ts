import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { UPLOADS_ITEMS_DIR } from '../utils/fileStorage';

// Configuración de almacenamiento en disco
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_ITEMS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueName);
  },
});

// Filtro estricto: solo png, jpg, jpeg
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = ['.png', '.jpg', '.jpeg'];
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/pjpeg'];

  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen con formato .png, .jpg o .jpeg'));
  }
};

export const uploadItemImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB máximo
  },
});

/**
 * Middleware para envolver upload y capturar errores de tamaño o formato limpiamente
 */
export const handleItemUpload = (req: Request, res: Response, next: NextFunction): void => {
  const upload = uploadItemImage.single('image');

  upload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'La imagen excede el tamaño máximo permitido de 2MB',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: `Error al subir archivo: ${err.message}`,
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'Error en el archivo subido',
      });
      return;
    }
    next();
  });
};
