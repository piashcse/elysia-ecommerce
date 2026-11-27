import { Elysia } from 'elysia';
import { eq } from 'drizzle-orm';
import { db } from '../../../config/database';
import { brands, categories, products } from '../../../database/schema';
import envConfig from '../../../config/env';

const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const sitemapController = new Elysia({ tags: ['SEO'] })
  .get('/sitemap.xml', async () => {
    const [productRows, categoryRows, brandRows] = await Promise.all([
      db.select({ slug: products.slug }).from(products).where(eq(products.isActive, true)),
      db.select({ slug: categories.slug }).from(categories).where(eq(categories.isActive, true)),
      db.select({ slug: brands.slug }).from(brands).where(eq(brands.isActive, true)),
    ]);

    const urls = [
      ...productRows.filter((item) => item.slug).map((item) => `${envConfig.APP_URL}/products/${item.slug}`),
      ...categoryRows.filter((item) => item.slug).map((item) => `${envConfig.APP_URL}/categories/${item.slug}`),
      ...brandRows.filter((item) => item.slug).map((item) => `${envConfig.APP_URL}/brands/${item.slug}`),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
      .map((url) => `<url><loc>${escape(url)}</loc></url>`)
      .join('')}</urlset>`;

    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
  });
