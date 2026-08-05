/**
 * Combines file-upload handling and Swagger documentation into a single decorator.
 *
 * Bundles three things, so an upload route needs only one line instead of three
 * separate decorators:
 *  - `FileInterceptor` (via {@link imageUploadConfig}) to receive and store the file
 *  - `@ApiConsumes('multipart/form-data')` to mark the endpoint as a file upload
 *  - `@ApiBody` to render a file-picker (and any extra text fields) in Swagger UI
 *
 * @param fieldName - Name of the multipart form field carrying the file.
 *                    Must match the field name the client sends. Defaults to `'file'`.
 * @param config - Optional upload settings (destination folder, max size, allowed
 *                 file types) passed through to {@link imageUploadConfig}. Omit to
 *                 use the defaults (`./uploads`, 5MB, images only).
 * @param dto - Optional additional Swagger properties schema
 *
 * @returns A composed decorator that adds file-upload handling and Swagger docs
 *          to the route it annotates.
 *
 * @remarks Only handles `multipart/form-data` requests. Requires `@nestjs/swagger`
 *          to be set up for the Swagger portions to take effect.
 *
 */
import {applyDecorators, Type, UseInterceptors} from "@nestjs/common";
import {FileInterceptor, FilesInterceptor} from "@nestjs/platform-express";
import {imageUploadConfig, UploadConfig} from "./multer.config";
import {ApiBody, ApiConsumes} from "@nestjs/swagger";

export const ApiFileUpload = (fieldName = 'file', config?: UploadConfig, dto?: Type) => {
    return applyDecorators(
        UseInterceptors(FileInterceptor(fieldName, imageUploadConfig(config))),
        ApiConsumes('multipart/form-data'),
        ApiBody({ type: dto }),
    );
};

export const ApiFilesUpload = (
    fieldName = 'files',
    config?: UploadConfig,
    dto?: Type,
    maxCount = 10,
) => {
    return applyDecorators(
        UseInterceptors(FilesInterceptor(fieldName, maxCount, imageUploadConfig(config))),
        ApiConsumes('multipart/form-data'),
        ApiBody({ type: dto }),
    );
};