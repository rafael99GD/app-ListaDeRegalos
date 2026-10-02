import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { UPLOADS_AVATARS_DIR } from '../utils/fileStorage';

// Configuración de almacenamiento local para avatares
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_AVATARS_DIR);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const userId = req.user?.id || 'anon';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `avatar-${userId}-${uniqueSuffix}${ext}`);
  },
});

// Filtro estricto de seguridad: Solo image/jpeg y image/png
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error('Formato de archivo no válido. Solo se permiten imágenes JPEG o PNG.')
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Límite máximo de 5MB
  },
});

export const handleAvatarUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uploadSingle = upload.single('avatar');

  uploadSingle(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          message: 'La imagen de perfil no puede exceder los 5MB de tamaño',
        });
        return;
      }
      res.status(400).json({
        success: false,
        message: `Error al procesar la imagen: ${err.message}`,
      });
      return;
    }

    if (err) {
      res.status(400).json({
        success: false,
        message: err.message || 'Error al procesar la subida del avatar',
      });
      return;
    }

    next();
  });
};
