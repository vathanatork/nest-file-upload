export const toPublicUrl = (file?: Express.Multer.File): string | undefined =>
    file ? '/' + file.path.replace(/\\/g, '/') : undefined;