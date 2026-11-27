/**
 * Refresh docs/openapi.json from a running server.
 *
 * Usage:
 *   DOCS_OPENAPI_URL=http://localhost:3000/swagger/json bun run docs:snapshot
 */
const source = process.env.DOCS_OPENAPI_URL ?? 'http://localhost:3000/swagger/json';

const response = await fetch(source);
if (!response.ok) {
  throw new Error(`Failed to fetch OpenAPI document from ${source}: ${response.status}`);
}

const document = await response.json() as Record<string, any>;
const paths = Object.fromEntries(
  Object.entries(document.paths ?? {}).filter(([path]) => path.startsWith('/api/v1') || path === '/health')
);

// Elysia's OpenAPI plugin does not expose raw XML responders, so document the
// sitemap explicitly to keep the reference complete.
if (!paths['/api/v1/sitemap.xml']) {
  paths['/api/v1/sitemap.xml'] = {
    get: {
      tags: ['SEO'],
      summary: 'SEO sitemap (XML)',
      description: 'Returns an XML sitemap of active products, categories, and brands.',
      operationId: 'getSitemap',
      responses: {
        200: {
          description: 'XML sitemap',
          content: {
            'application/xml': {
              schema: { type: 'string' },
            },
          },
        },
      },
    },
  };
}

const snapshot = {
  openapi: document.openapi,
  info: document.info,
  paths,
  components: document.components,
  tags: document.tags,
};

await Bun.write('docs/openapi.json', `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${Object.keys(paths).length} paths to docs/openapi.json`);
