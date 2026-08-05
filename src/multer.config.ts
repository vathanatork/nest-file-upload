import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

type FileType = 'jpg' | 'jpeg' | 'png' | 'webp' | 'pdf';
export interface UploadConfig {
    des?: string;
    maxSizeMb?: number;
    allowedTypes?: FileType[];
}

export const imageUploadConfig = ({
    des,
    maxSizeMb = 5,
    allowedTypes = ['jpg', 'jpeg', 'png', 'webp'],
}: UploadConfig = {}): MulterOptions => {
    return {
        storage: diskStorage({
            destination: './uploads/' + des,
            filename: (req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${unique}-${file.originalname}`);
            },
        }),
        limits: { fileSize: maxSizeMb * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const ext = extname(file.originalname).toLowerCase().replace('.', '');
            const extOk = allowedTypes.includes(ext as FileType);
            const mimeOk = new RegExp(`(${allowedTypes.join('|')})$`).test(file.mimetype);
            if (extOk && mimeOk) {
                cb(null, true);
            } else {
                cb(new BadRequestException(`Only ${allowedTypes.join(', ')} files are allowed`), false);
            }
        },
    };
};
