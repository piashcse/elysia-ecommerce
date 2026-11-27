import { describe, expect, test } from 'bun:test';
import {
  api,
  app,
  createAdmin,
  createCategory,
  createCustomer,
  createProduct,
  createSeller,
} from './helpers';

const setup = async () => {
  const admin = await createAdmin();
  const seller = await createSeller();
  const customer = await createCustomer();
  const category = await createCategory(admin.token);
  return { admin, seller, customer, category };
};

describe('Catalog growth: brands, hierarchy, search facets, media, reviews, and Q&A', () => {
  test('brands, slugs, facets, related products, and category trees work', async () => {
    const { admin, seller, category } = await setup();
    const suffix = Date.now();

    const brand = await api('/brands', {
      method: 'POST',
      token: admin.token,
      body: { name: `Brand ${suffix}` },
    });
    expect(brand.status).toBe(201);

    const child = await api('/categories', {
      method: 'POST',
      token: admin.token,
      body: { name: `Child ${suffix}`, parentId: category.id, slug: `child-${suffix}` },
    });
    expect(child.status).toBe(201);

    const product = await createProduct(admin.token, seller.user.id, child.body.data.id, {
      name: `Catalog ${suffix}`,
      slug: `catalog-${suffix}`,
      brandId: brand.body.data.id,
    });

    const bySlug = await api(`/products/slug/catalog-${suffix}`);
    expect(bySlug.status).toBe(200);
    expect(bySlug.body.data.brand.id).toBe(brand.body.data.id);

    const brandFiltered = await api(`/products?brandId=${brand.body.data.id}`);
    expect(brandFiltered.body.data.items.length).toBeGreaterThanOrEqual(1);

    const facets = await api('/products/facets');
    expect(facets.status).toBe(200);
    expect(facets.body.data.brands.length).toBeGreaterThanOrEqual(1);

    const related = await api(`/products/${product.id}/related`);
    expect(related.status).toBe(200);

    const tree = await api('/categories/tree');
    expect(tree.status).toBe(200);
    expect(tree.body.data.some((item: any) => item.id === category.id)).toBe(true);

    const sitemap = await api('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(String(sitemap.body)).toContain('<urlset');
  });

  test('review images and product Q&A work', async () => {
    const { admin, seller, customer, category } = await setup();
    const product = await createProduct(admin.token, seller.user.id, category.id);

    const review = await api('/reviews', {
      method: 'POST',
      token: customer.token,
      body: {
        productId: product.id,
        rating: 5,
        title: 'With photo',
        comment: 'Looks good',
        images: ['https://example.com/review.jpg'],
      },
    });
    expect(review.status).toBe(201);

    const reviews = await api(`/reviews/product/${product.id}`);
    expect(reviews.body.data.items[0].images.length).toBe(1);

    const question = await api(`/products/${product.id}/questions`, {
      method: 'POST',
      token: customer.token,
      body: { question: 'Does this include a warranty?' },
    });
    expect(question.status).toBe(201);

    const answer = await api(`/questions/${question.body.data.id}/answers`, {
      method: 'POST',
      token: seller.token,
      body: { answer: 'Yes, one year.' },
    });
    expect(answer.status).toBe(201);

    const qa = await api(`/products/${product.id}/questions`);
    expect(qa.body.data[0].answers.length).toBe(1);
  });

  test('sellers can upload and serve images', async () => {
    const { seller } = await setup();
    const form = new FormData();
    form.append('file', new File([new Uint8Array([137, 80, 78, 71])], 'test.png', { type: 'image/png' }));

    const response = await app.handle(new Request('http://localhost/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${seller.token}` },
      body: form,
    }));
    expect(response.status).toBe(201);
    const body = await response.json() as any;
    expect(body.data.url).toMatch(/^\/uploads\//);

    const file = await api(body.data.url);
    expect(file.status).toBe(200);
  });
});
