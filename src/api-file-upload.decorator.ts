import {applyDecorators, Type, UseInterceptors} from "@nestjs/common";
import {FileFieldsInterceptor, FileInterceptor, FilesInterceptor, NoFilesInterceptor} from "@nestjs/platform-express";
import {imageUploadConfig, UploadConfig} from "./multer.config";
import {ApiBody, ApiConsumes} from "@nestjs/swagger";
import {MulterField} from "@nestjs/platform-express/multer/interfaces/multer-options.interface";

/**
 * Single file upload.
 *
 * @param fieldName - Form field name for the file. Default `'file'`.
 * @param config - Upload options: `des` (subfolder), `maxSizeMb` (default 5), `allowedTypes`.
 * @param dto - DTO for Swagger. Add a binary property named like `fieldName`:
 *   ```typescript
 *   @ApiProperty({ type: 'string', format: 'binary' })
 *   file: any;
 *   ```
 *
 * @pairsWith `@UploadedFile() file: Express.Multer.File` in the handler. The DTO's
 * binary property is documentation only — the file arrives via `@UploadedFile()`,
 * NOT via `@Body()`. Text fields arrive via `@Body() dto`.
 *
 * @returns The uploaded file object (`Express.Multer.File`) with `filename`,
 * `path`, `destination`, `mimetype`, `size`, `originalname`. Use
 * {@link toPublicUrl} to convert `file.path` into a stored URL.
 *
 * @example
 * ```typescript
 * @ApiFileUpload('file', { des: 'user' }, CreateUserDto)
 * create(@Body() dto: CreateUserDto, @UploadedFile() file: Express.Multer.File) {}
 * ```
 */
export const ApiFileUpload = (fieldName = 'file', config?: UploadConfig, dto?: Type) => {
    return applyDecorators(
        UseInterceptors(FileInterceptor(fieldName, imageUploadConfig(config))),
        ApiConsumes('multipart/form-data'),
        ApiBody({ type: dto }),
    );
};

/**
 * Multiple files under one field.
 *
 * @param fieldName - Form field name. Default `'files'`.
 * @param config - Upload options (see ApiFileUpload).
 * @param dto - DTO for Swagger.
 * @param maxCount - Max files. Default `10`.
 *
 * **Add an array-of-binary property to the DTO:**
 * ```typescript
 * @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
 * files: any[];
 * ```
 *
 * @pairsWith `@UploadedFiles() files: Express.Multer.File[]`.
 *
 * @return the array of file object Express.Multer.File
 *
 * @example
 * ```typescript
 * @ApiFilesUpload('files', { des: 'gallery' }, CreateGalleryDto, 5)
 * create(@Body() dto: CreateGalleryDto, @UploadedFiles() files: Express.Multer.File[]) {}
 * ```
 */
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

/**
 * Multiple named file fields (e.g. avatar + background).
 *
 * @param uploadedFields - Field list: `[{ name: 'avatar', maxCount: 1 }, ...]`.
 * @param config - Upload options (see ApiFileUpload).
 * @param dto - DTO for Swagger.
 *
 * **Add one binary property per field to the DTO, matching the names:**
 * ```typescript
 * @ApiProperty({ type: 'string', format: 'binary', required: false })
 * avatar?: any;
 *
 * @ApiProperty({ type: 'string', format: 'binary', required: false })
 * background?: any;
 * ```
 *
 * @pairsWith `@UploadedFiles()`** — an object keyed by field name.
 * @return Each field is an array; get the file with `files['avatar']`.**
 *
 * @example
 * ```typescript
 * @ApiFileFieldUpload(
 *   [{ name: 'avatar', maxCount: 1 }, { name: 'background', maxCount: 1 }],
 *   { des: 'user' },
 *   CreateUserDto,
 * )
 * create(
 *   @Body() dto: CreateUserDto,
 *   @UploadedFiles() files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] },
 * ) {}
 * ```
 */
export const ApiFileFieldUpload = (uploadedFields: MulterField[], config?: UploadConfig, dto?: Type) => {
    return applyDecorators(
        UseInterceptors(FileFieldsInterceptor(uploadedFields, imageUploadConfig(config))),
        ApiConsumes('multipart/form-data'),
        ApiBody({ type: dto }),
    );
}

/**
 * Multipart form with text fields but no files.
 *
 * @param dto - DTO for Swagger (text fields only, each with `@ApiProperty()`).
 *
 * @pairWith `@Body() dto`.**
 *
 * @error Files are rejected and throw an error exception.
 *
 * @example
 * ```typescript
 * @ApiNoFileUpload(UpdateSettingsDto)
 * update(@Body() dto: UpdateSettingsDto) {}
 * ```
 */
export const ApiNoFileUpload = (dto?: Type) => {
    return applyDecorators(
        UseInterceptors(NoFilesInterceptor()),
        ApiConsumes('multipart/form-data'),
        ApiBody({ type: dto }),
    );
}