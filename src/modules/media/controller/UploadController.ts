import { Elysia, t } from 'elysia';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { successResponse, successSchema, errorSchema } from '../../../core/responses';
import { authPlugin } from '../../../core/auth';
import { UserRole } from '../../../core/roles';
import { ForbiddenError, NotFoundError, ValidationError } from '../../../core/errors';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

export const uploadController = new Elysia({ prefix: '/uploads', tags: ['Media'] })
  .use(authPlugin)
  .post('/', {
    isAuth: true,
    body: t.Object({ file: t.File() }),
    response: { 201: successSchema(), 403: errorSchema, 422: errorSchema },
    detail: { summary: 'Upload an image (Admin or Seller)' }
  }, async ({ body, user, set }) => {
    if (user!.role !== UserRole.ADMIN && user!.role !== UserRole.SELLER) {
      throw new ForbiddenError('Only admins and sellers can upload media');
    }
    if (body.file.size > MAX_SIZE) throw new ValidationError('File exceeds the 5MB limit', 'FILE_TOO_LARGE');
    if (!ALLOWED.has(body.file.type)) throw new ValidationError('Unsupported image type', 'INVALID_FILE_TYPE');

    await mkdir(UPLOAD_DIR, { recursive: true });
    const extension = (body.file.name.split('.').pop() ?? 'bin').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    const filename = `${crypto.randomUUID()}.${extension}`;
    await Bun.write(join(UPLOAD_DIR, filename), body.file);

    set.status = 201;
    return successResponse({ url: `/uploads/${filename}` }, 'File uploaded successfully', 201);
  })
  .get('/:filename', {
    params: t.Object({ filename: t.String({ pattern: '^[a-zA-Z0-9._-]+$' }) }),
    detail: { summary: 'Serve an uploaded file' }
  }, async ({ params }) => {
    const file = Bun.file(join(UPLOAD_DIR, params.filename));
    if (!(await file.exists())) throw new NotFoundError('File not found');
    return file;
  });
