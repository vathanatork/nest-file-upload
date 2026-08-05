# nest-file-upload

Reusable NestJS decorators for file uploads. Each decorator bundles the Multer interceptor, `@ApiConsumes('multipart/form-data')`, and `@ApiBody` into a single line — so your routes stay clean and your Swagger docs show the right file pickers automatically.

Four decorators cover the common cases:

| Decorator | Use for | Pair with |
|-----------|---------|-----------|
| `@ApiFileUpload` | One file | `@UploadedFile()` |
| `@ApiFilesUpload` | Many files, one field | `@UploadedFiles()` |
| `@ApiFileFieldUpload` | Multiple named fields (avatar + background) | `@UploadedFiles()` |
| `@ApiNoFileUpload` | Multipart form, text only (no files) | `@Body()` |

## Installation

```bash
npm install github:vathanatork/nest-file-upload
```

Peer dependencies (your project must already have these):

```bash
npm install @nestjs/common @nestjs/platform-express @nestjs/swagger multer
```

## Setup

The decorators save files to disk, but two things must be configured in your app for uploads to work end to end.

### 1. Create the uploads folder

Multer does **not** create the destination folder automatically. Create your uploads root before running:

```bash
mkdir -p uploads
```

Or create it on boot in `main.ts`:

```typescript
import { existsSync, mkdirSync } from 'fs';

if (!existsSync('./uploads')) {
  mkdirSync('./uploads', { recursive: true });
}
```

### 2. Serve the uploaded files

Saving a file to disk doesn't make it reachable by URL. Add static serving in `main.ts` so a saved file becomes viewable:

```typescript
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  await app.listen(3000);
}
bootstrap();
```

A file saved to `uploads/user/photo.jpg` is then reachable at `http://localhost:3000/uploads/user/photo.jpg`.

## Upload options

Every decorator accepts an optional `config` object:

```typescript
interface UploadConfig {
  des?: string;          // subfolder under ./uploads (e.g. 'user' -> ./uploads/user)
  maxSizeMb?: number;    // max file size in MB (default: 5)
  allowedTypes?: FileType[]; // allowed extensions (default: ['jpg','jpeg','png','webp'])
}
```

Example:

```typescript
@ApiFilesUpload('files', { des: 'docs', maxSizeMb: 10, allowedTypes: ['pdf'] }, CreateDocDto)
```

Omit `config` to use the defaults.

## The DTO and Swagger

The `dto` argument documents the request body in Swagger. For file pickers to appear, the DTO must declare the file field(s) as **binary**, in addition to its normal `@ApiProperty()` text fields.

> Important: the binary property on the DTO is for **documentation only**. At runtime the file arrives via `@UploadedFile()` / `@UploadedFiles()`, not through `@Body()`. If you skip the DTO, Swagger shows a generic `string` body with no picker.

## Usage

### Single file

```typescript
export class CreateUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file: any;
}
```

```typescript
@Post()
@ApiFileUpload('file', { des: 'user' }, CreateUserDto)
create(
  @Body() dto: CreateUserDto,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.userService.create(dto, file);
}
```

### Multiple files (one field)

```typescript
export class CreateGalleryDto {
  @ApiProperty()
  title: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files: any[];
}
```

```typescript
@Post('gallery')
@ApiFilesUpload('files', { des: 'gallery' }, CreateGalleryDto, 5)
create(
  @Body() dto: CreateGalleryDto,
  @UploadedFiles() files: Express.Multer.File[],
) {}
```

### Multiple named fields

```typescript
export class CreateUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  avatar?: any;

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  background?: any;
}
```

```typescript
@Post()
@ApiFileFieldUpload(
  [
    { name: 'avatar', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ],
  { des: 'user' },
  CreateUserDto,
)
create(
  @Body() dto: CreateUserDto,
  @UploadedFiles()
  files: { avatar?: Express.Multer.File[]; background?: Express.Multer.File[] },
) {
  const avatar = files['avatar'];
  const background = files['background'];
}
```

Each field is an **array** even with `maxCount: 1`, so read the single file with `files.avatar?.[0]`.

### Form-data, no files

```typescript
@Patch('settings')
@ApiNoFileUpload(UpdateSettingsDto)
update(@Body() dto: UpdateSettingsDto) {}
```

Parses text fields from a multipart form but rejects any file. For plain JSON bodies, don't use this — use no interceptor at all.

## Storing the file path

After a file is saved, store its public URL (not the raw disk path). A `toPublicUrl` helper converts a Multer file into a URL matching the `/uploads/` prefix:

```typescript
import { toPublicUrl } from 'nest-file-upload';

user.imageUrl = toPublicUrl(file); // '/uploads/user/1699-123.jpg'
```

## Notes

- Rejected file types throw a `BadRequestException` with the allowed list in the message.
- Files over `maxSizeMb` are rejected by Multer's size limit.
- Field names in `@ApiFileFieldUpload` must match both the client's form field names and the DTO's binary property names.