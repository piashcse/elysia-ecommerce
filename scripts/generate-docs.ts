/**
 * Generate the Markdown API reference from docs/openapi.json.
 *
 * Usage:
 *   bun run docs:generate
 *
 * The generated pages are committed to the repository so the GitHub Pages
 * workflow only needs MkDocs (no database or running server).
 */
import { mkdir } from 'node:fs/promises';

interface PageConfig {
  tag: string;
  file: string;
  title: string;
  intro: string;
}

const PAGES: PageConfig[] = [
  {
    tag: 'Auth',
    file: 'authentication.md',
    title: 'Authentication & API Keys',
    intro:
      'Register, log in, rotate tokens, verify email addresses, reset passwords, configure TOTP two-factor authentication, and manage scoped API keys.',
  },
  {
    tag: 'User',
    file: 'users.md',
    title: 'Users & Profiles',
    intro:
      'Profile management, password changes, admin user administration, GDPR data export, and account deletion/anonymization.',
  },
  {
    tag: 'Seller',
    file: 'sellers.md',
    title: 'Seller Portal',
    intro:
      'Seller product management, order visibility, item-level fulfillment, payout balances, and storefront statistics.',
  },
  {
    tag: 'Product',
    file: 'products.md',
    title: 'Products & Variants',
    intro:
      'Catalog CRUD, product slugs, images, variants, related products, facets, questions and answers, and display currency/locale options.',
  },
  {
    tag: 'Category',
    file: 'categories.md',
    title: 'Categories',
    intro:
      'Hierarchical categories with slugs, SEO metadata, recursive trees, category product listings, and locale-aware responses.',
  },
  {
    tag: 'Brand',
    file: 'brands.md',
    title: 'Brands',
    intro: 'Brand CRUD with slugs and logos, used for catalog filtering and product attribution.',
  },
  {
    tag: 'Review',
    file: 'reviews.md',
    title: 'Reviews & Ratings',
    intro: 'Verified-purchase reviews, moderation, helpful votes, and customer review images.',
  },
  {
    tag: 'Translation',
    file: 'translations.md',
    title: 'Translations & Localization',
    intro:
      'Product and category translations keyed by BCP-47 locale. Catalog endpoints accept a `locale` query parameter to return localized content.',
  },
  {
    tag: 'Search',
    file: 'search.md',
    title: 'Search & Synonyms',
    intro:
      'PostgreSQL full-text search with trigram typo tolerance. Admins can maintain synonym mappings used to expand catalog queries.',
  },
  {
    tag: 'Cart',
    file: 'cart.md',
    title: 'Cart',
    intro:
      'Authenticated and guest carts using `X-Session-Id`, variant-aware line items, quantity updates, and guest-cart merging on login.',
  },
  {
    tag: 'Wishlist',
    file: 'wishlist.md',
    title: 'Wishlist',
    intro: 'Per-user wishlist with toggle, membership checks, pagination, and counts.',
  },
  {
    tag: 'Checkout',
    file: 'checkout.md',
    title: 'Checkout',
    intro:
      'Calculate a complete checkout quote (variants, coupons, gift cards, tax, shipping, and currency) without creating an order.',
  },
  {
    tag: 'Order',
    file: 'orders.md',
    title: 'Orders',
    intro:
      'Order creation with idempotency keys, guest tokens, order events/timeline, cancellation, expired-payment release, invoices, and statistics.',
  },
  {
    tag: 'Payment',
    file: 'payments.md',
    title: 'Payments & Payment Methods',
    intro:
      'Payment records, provider processing, refunds, saved tokenized methods, admin queries, and the signed payment webhook.',
  },
  {
    tag: 'Coupon',
    file: 'coupons.md',
    title: 'Coupons & Discounts',
    intro:
      'Percentage/fixed coupons with schedules, usage limits, product/category scopes, stacking rules, and optional shipping discounts.',
  },
  {
    tag: 'Gift Card',
    file: 'gift-cards.md',
    title: 'Gift Cards',
    intro:
      'Issue, list, deactivate, and check gift cards. Balances are redeemed at checkout and restored when an order is cancelled.',
  },
  {
    tag: 'Shipping',
    file: 'shipping.md',
    title: 'Shipping Methods',
    intro:
      'Configurable shipping methods with base/per-kg cost, delivery estimates, country eligibility, and free-shipping thresholds.',
  },
  {
    tag: 'Tax',
    file: 'taxes.md',
    title: 'Tax Rates',
    intro: 'Country/region tax rates used by checkout quotes and order pricing.',
  },
  {
    tag: 'Address',
    file: 'addresses.md',
    title: 'Addresses',
    intro: 'Saved shipping/billing addresses with default-address selection.',
  },
  {
    tag: 'Returns',
    file: 'returns.md',
    title: 'Returns & RMA',
    intro:
      'Return requests, approval/rejection, receiving, stock restoration, and refunds through the payment service.',
  },
  {
    tag: 'Notification',
    file: 'notifications.md',
    title: 'Notifications & Email',
    intro:
      'In-app notifications, notification preferences, and the transactional email outbox with retry/backoff processing.',
  },
  {
    tag: 'Currency',
    file: 'currencies.md',
    title: 'Currencies & FX',
    intro:
      'Exchange rates relative to USD, public conversion, admin currency management, and currency snapshots on orders and quotes.',
  },
  {
    tag: 'Media',
    file: 'media.md',
    title: 'Media Uploads',
    intro: 'Local image uploads for admins and sellers, served from `/uploads/:filename`.',
  },
  {
    tag: 'Admin',
    file: 'admin.md',
    title: 'Admin Reports & Audit',
    intro: 'Sales/product/category reporting and a searchable audit trail of mutating requests.',
  },
  {
    tag: 'System',
    file: 'system.md',
    title: 'System & Monitoring',
    intro: 'Health/readiness checks and Prometheus-style runtime metrics.',
  },
];

const METHOD_ORDER: Record<string, number> = { get: 0, post: 1, put: 2, patch: 3, delete: 4 };
const BASE_URL = 'http://localhost:3000';

const escapeCell = (value: unknown) =>
  String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim();

const escapeText = (value: unknown) => String(value ?? '').replaceAll('\n', ' ').trim();

const methodBadge = (method: string) =>
  `<span class="method-badge ${method.toLowerCase()}">${method.toUpperCase()}</span>`;

const refName = (ref: string) => ref.split('/').pop() ?? ref;

const typeLabel = (schema: any): string => {
  if (!schema) return 'any';
  if (schema['~kind'] === 'File') return 'file';
  if (schema.$ref) return refName(schema.$ref);
  if (schema.enum) return `enum(${schema.enum.join(', ')})`;
  if (schema.type === 'array') return `array<${typeLabel(schema.items)}>`;
  if (schema.oneOf) return schema.oneOf.map(typeLabel).join(' | ');
  if (schema.anyOf) return schema.anyOf.map(typeLabel).join(' | ');
  if (schema.type === 'object' || schema.properties) return 'object';
  return schema.format ? `${schema.type ?? 'string'} (${schema.format})` : schema.type ?? 'string';
};

const constraints = (schema: any): string => {
  if (!schema) return '';
  const parts: string[] = [];
  if (schema.minimum !== undefined) parts.push(`min ${schema.minimum}`);
  if (schema.maximum !== undefined) parts.push(`max ${schema.maximum}`);
  if (schema.minLength !== undefined) parts.push(`min length ${schema.minLength}`);
  if (schema.maxLength !== undefined) parts.push(`max length ${schema.maxLength}`);
  if (schema.minItems !== undefined) parts.push(`min items ${schema.minItems}`);
  if (schema.maxItems !== undefined) parts.push(`max items ${schema.maxItems}`);
  if (schema.pattern) parts.push(`pattern \`${schema.pattern}\``);
  if (schema.default !== undefined) parts.push(`default \`${JSON.stringify(schema.default)}\``);
  return parts.join(', ');
};

const SAMPLE_STRINGS: Record<string, string> = {
  email: 'customer@example.com',
  password: 'Password123!',
  firstName: 'Jane',
  lastName: 'Doe',
  name: 'Sample name',
  title: 'Sample title',
  description: 'Sample description',
  address: '1 Market Street',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94105',
  country: 'US',
  phone: '+14155550123',
  code: 'SAVE10',
  couponCode: 'SAVE10',
  couponCodes: 'SAVE10',
  giftCardCode: 'GIFT-1234',
  currency: 'USD',
  locale: 'en',
  sku: 'SKU-001',
  symbol: '$',
  term: 'laptop',
  question: 'Does this include a warranty?',
  answer: 'Yes, one year.',
  token: 'token-value',
  guestToken: 'guest-token',
  trackingNumber: 'TRACK-123',
  imageUrl: 'https://example.com/image.jpg',
  logoUrl: 'https://example.com/logo.png',
  reference: 'PAYOUT-001',
  notes: 'Optional note',
  status: 'pending',
};

const sampleValue = (name: string, schema: any, depth = 0): any => {
  if (!schema || depth > 4) return {};
  if (!Object.keys(schema).length) return {};
  if (schema['~kind'] === 'File') return '(binary file)';
  if (schema.example !== undefined) return schema.example;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.$ref) return {};

  const key = name.toLowerCase();
  if (key === 'statuscode') return 200;
  if (key === 'id' || key.endsWith('id')) return '00000000-0000-0000-0000-000000000000';
  if (SAMPLE_STRINGS[key] !== undefined) return SAMPLE_STRINGS[key];

  if (schema.type === 'array') {
    if (key === 'images') return ['https://example.com/image.jpg'];
    if (key === 'couponcodes') return ['SAVE10'];
    return [sampleValue(name, schema.items ?? { type: 'string' }, depth + 1)];
  }

  if (schema.type === 'object' || schema.properties) {
    return sampleObject(schema, depth + 1);
  }

  if (schema.type === 'integer' || schema.type === 'number') {
    if (/quantity|stock|attempts|limit|page|days|weight|rating|maxitems|minitems/i.test(key)) return 1;
    if (/price|amount|cost|rate|balance|discount|tax/i.test(key)) return 9.99;
    return schema.minimum ?? 1;
  }

  if (schema.type === 'boolean') return true;

  if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
  if (schema.format === 'email') return 'customer@example.com';
  if (schema.format === 'date-time') return '2026-01-01T00:00:00.000Z';
  if (schema.format === 'date') return '2026-01-01';
  if (schema.format === 'uri') return 'https://example.com/image.jpg';
  if (schema.format === 'binary') return '(binary file)';

  return SAMPLE_STRINGS[key] ?? 'string';
};

const sampleObject = (schema: any, depth = 0): Record<string, any> => {
  const properties = schema?.properties ?? {};
  const result: Record<string, any> = {};
  for (const [property, propertySchema] of Object.entries<any>(properties)) {
    result[property] = sampleValue(property, propertySchema, depth);
  }
  return result;
};

const isPublicRoute = (path: string, method: string): boolean => {
  method = method.toLowerCase();
  if (path === '/health' || path === '/api/v1/metrics') return true;
  if (path.startsWith('/api/v1/auth/')) {
    return /^\/api\/v1\/auth\/(register|login|refresh|verify-email|forgot-password|reset-password)$/.test(path);
  }
  if (method === 'get' && /^\/api\/v1\/(products|categories|brands|currencies)(\/|$)/.test(path)) return true;
  if (method === 'get' && path.startsWith('/api/v1/reviews/product/')) return true;
  if (method === 'get' && /^\/api\/v1\/shipping-methods(\/|$)/.test(path)) return true;
  if (method === 'get' && path.startsWith('/api/v1/uploads/')) return true;
  if (method === 'get' && path.includes('/translations')) return true;
  return false;
};

const roleLabel = (operation: any, path = '', method = 'get'): string => {
  const summary = operation.summary ?? '';
  if (operation.security?.length) {
    const hasAdmin = /\badmin\b/i.test(summary);
    const hasSeller = /\bseller\b/i.test(summary);
    if (hasAdmin && hasSeller) return 'Bearer · Admin/Seller';
    if (hasAdmin) return 'Bearer · Admin';
    if (hasSeller) return 'Bearer · Seller';
    if (/\bcustomer\b/i.test(summary)) return 'Bearer · Customer';
    return 'Bearer';
  }

  if (isPublicRoute(path, method)) return 'Public';
  if (path.startsWith('/api/v1/seller')) return 'Bearer · Seller';
  if (path === '/api/v1/payments/webhook') return 'Provider signature';
  if (path.startsWith('/api/v1/admin') || /\badmin\b/i.test(summary)) return 'Bearer · Admin';
  if (path.startsWith('/api/v1/cart') || path.startsWith('/api/v1/checkout')) return 'Guest session or Bearer';
  if (path.startsWith('/api/v1/orders') || path.startsWith('/api/v1/payments')) return 'Bearer or guest token';
  return 'Bearer';
};

const authBadge = (operation: any, path = '', method = 'get') => {
  const label = roleLabel(operation, path, method);
  const className = label === 'Public' ? 'auth-badge public' : 'auth-badge';
  return `<span class="${className}">${escapeText(label)}</span>`;
};

const pickBody = (operation: any) => {
  const content = operation.requestBody?.content ?? {};
  const multipart = content['multipart/form-data']?.schema;
  const multipartHasFile = Object.values<any>(multipart?.properties ?? {}).some(
    (property) => property['~kind'] === 'File' || property.format === 'binary'
  );
  const contentType =
    (multipartHasFile && 'multipart/form-data') ||
    (content['application/json'] && 'application/json') ||
    (content['multipart/form-data'] && 'multipart/form-data') ||
    Object.keys(content)[0];
  if (!contentType) return null;
  return { contentType, schema: content[contentType]?.schema ?? {} };
};

const renderParameterTable = (operation: any) => {
  const parameters = operation.parameters ?? [];
  if (!parameters.length) return '';
  const rows = parameters.map((parameter: any) => {
    const schema = parameter.schema ?? {};
    return `| \`${escapeCell(parameter.name)}\` | ${escapeCell(parameter.in)} | ${parameter.required ? 'Yes' : 'No'} | ${escapeCell(typeLabel(schema))} | ${escapeCell(constraints(schema) || parameter.description || '')} |`;
  });

  return [
    '| Parameter | In | Required | Type | Constraints / Description |',
    '|-----------|----|----------|------|---------------------------|',
    ...rows,
    '',
  ].join('\n');
};

const renderBody = (operation: any) => {
  const body = pickBody(operation);
  if (!body) return '';

  const schema = body.schema ?? {};
  const properties = schema.properties ?? {};
  const required = new Set<string>(schema.required ?? []);
  const rows = Object.entries<any>(properties).map(([property, propertySchema]) => {
    return `| \`${escapeCell(property)}\` | ${escapeCell(typeLabel(propertySchema))} | ${required.has(property) ? 'Yes' : 'No'} | ${escapeCell(constraints(propertySchema))} |`;
  });

  const sections = [
    `**Content type:** \`${body.contentType}\``,
    '',
    '| Field | Type | Required | Constraints |',
    '|-------|------|----------|-------------|',
    ...rows,
    '',
  ];

  if (body.contentType === 'application/json') {
    sections.push(
      '**Example request body**',
      '',
      '```json',
      JSON.stringify(sampleObject(schema), null, 2),
      '```',
      ''
    );
  }

  return sections.join('\n');
};

const curlExample = (method: string, path: string, operation: any) => {
  const body = pickBody(operation);
  const parts = [`curl -X '${method.toUpperCase()}' \\`, `  '${BASE_URL}${path}' \\`, `  -H 'accept: application/json' \\`];

  if (operation.security?.length) parts.push(`  -H 'Authorization: Bearer <token>' \\`);

  if (body?.contentType === 'application/json') {
    parts.push(
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${JSON.stringify(sampleObject(body.schema), null, 2).replaceAll("'", "'\\''")}'`
    );
  } else if (body?.contentType === 'multipart/form-data') {
    const firstFile = Object.entries<any>(body.schema?.properties ?? {}).find(
      ([, schema]) => schema.format === 'binary' || schema['~kind'] === 'File'
    );
    parts.push(`  -F '${firstFile?.[0] ?? 'file'}=@image.png'`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1]!.replace(/ \\$/, '');
  }

  return ['**Request**', '', '```bash', ...parts, '```', ''].join('\n');
};

const renderResponses = (operation: any) => {
  const responses = operation.responses ?? {};
  const statuses = Object.keys(responses).sort();
  if (!statuses.length) return '';

  const statusRows = statuses.map((status) => {
    const response = responses[status];
    return `| \`${status}\` | ${escapeCell(response.description || 'Response')} |`;
  });

  const success = statuses.find((status) => status.startsWith('2'));
  const successSchema = success ? responses[success]?.content?.['application/json']?.schema : null;
  const sections = [
    '**Responses**',
    '',
    '| Status | Description |',
    '|--------|-------------|',
    ...statusRows,
    '',
  ];

  if (successSchema) {
    const sample = sampleObject(successSchema);
    if ('success' in sample) sample.success = true;
    if ('statusCode' in sample) sample.statusCode = Number(success);
    if ('message' in sample) sample.message = 'Success';
    sections.push(
      '**Example success response**',
      '',
      '```json',
      JSON.stringify(sample, null, 2),
      '```',
      ''
    );
  }

  return sections.join('\n');
};

const renderEndpoint = (operation: any, path: string, method: string, index: number) => {
  const title = operation.summary ?? `${method.toUpperCase()} ${path}`;
  const description = operation.description ? `\n${escapeText(operation.description)}\n` : '';
  const parameters = renderParameterTable(operation);
  const body = renderBody(operation);
  const responses = renderResponses(operation);

  return [
    `### ${index}. ${escapeText(title)}`,
    '',
    '<div class="endpoint-header">',
    `  ${methodBadge(method)}`,
    `  <span class="endpoint-path">${escapeText(path)}</span>`,
    `  ${authBadge(operation, path, method)}`,
    '</div>',
    description,
    '**Authentication:** ' + escapeText(roleLabel(operation, path, method)),
    '',
    parameters,
    body,
    curlExample(method, path, operation),
    responses,
    '---',
    '',
  ].join('\n');
};

const loadOperations = (document: any) => {
  const operations: Array<{ path: string; method: string; operation: any; tag: string }> = [];
  for (const [path, item] of Object.entries<any>(document.paths ?? {})) {
    for (const [method, operation] of Object.entries<any>(item)) {
      if (!(method in METHOD_ORDER)) continue;
      operations.push({
        path,
        method,
        operation,
        tag: operation.tags?.[0] ?? (path === '/health' ? 'System' : 'Other'),
      });
    }
  }
  return operations;
};

const renderPage = (config: PageConfig, operations: Array<{ path: string; method: string; operation: any }>) => {
  const sorted = [...operations].sort((a, b) => {
    if (a.path !== b.path) return a.path.localeCompare(b.path);
    return (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99);
  });

  const tableRows = sorted.map(({ path, method, operation }) => {
    return `| ${methodBadge(method)} | \`${escapeCell(path)}\` | ${escapeCell(operation.summary ?? '')} | ${escapeCell(roleLabel(operation, path, method))} |`;
  });

  return [
    `# ${config.title}`,
    '',
    `> ${config.intro}`,
    '',
    '## Authentication',
    '',
    'Send `Authorization: Bearer <token>` for protected routes. API keys can also be sent with `X-API-Key: <key>`; grant the key `read`, `write`, `*`, or resource scopes such as `read:products`. Keys without scopes have full access.',
    '',
    'All routes below are available under `/api/v1`. The unversioned equivalents remain available for backwards compatibility.',
    '',
    '## Endpoints',
    '',
    '| Method | Endpoint | Description | Auth |',
    '|--------|----------|-------------|------|',
    ...tableRows,
    '',
    '---',
    '',
    '## Endpoint Details',
    '',
    ...sorted.map(({ path, method, operation }, index) => renderEndpoint(operation, path, method, index + 1)),
  ].join('\n');
};

const renderIndex = (document: any, operations: ReturnType<typeof loadOperations>) => {
  const groups = new Map<string, typeof operations>();
  for (const operation of operations) {
    groups.set(operation.tag, [...(groups.get(operation.tag) ?? []), operation]);
  }

  const sections = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, tagOperations]) => {
      const config = PAGES.find((page) => page.tag === tag);
      const title = config?.title ?? tag;
      const link = config ? `[${title}](../${config.file})` : title;
      const sorted = [...tagOperations].sort((a, b) => {
        if (a.path !== b.path) return a.path.localeCompare(b.path);
        return (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99);
      });

      return [
        `## ${title}`,
        '',
        link === title ? '' : `Full details: ${link}`,
        '',
        '| Method | Endpoint | Description | Auth |',
        '|--------|----------|-------------|------|',
        ...sorted.map(
          ({ path, method, operation }) =>
            `| ${methodBadge(method)} | \`${escapeCell(path)}\` | ${escapeCell(operation.summary ?? '')} | ${escapeCell(roleLabel(operation, path, method))} |`
        ),
        '',
      ].join('\n');
    });

  return [
    '# API Reference',
    '',
    `This reference documents **${operations.length} operations** across **${groups.size} modules**. It is generated from the application's OpenAPI schema.`,
    '',
    'All endpoints are served under the stable `/api/v1` prefix; unversioned routes remain for backwards compatibility.',
    '',
    'ENDPOINTS_TABLE',
    '',
    '## Modules',
    '',
    ...PAGES.filter((page) => groups.has(page.tag)).map(
      (page) => `- [${page.title}](../${page.file}) — ${groups.get(page.tag)?.length ?? 0} ${(groups.get(page.tag)?.length ?? 0) === 1 ? 'endpoint' : 'endpoints'}`
    ),
    '',
    ...sections,
  ]
    .join('\n')
    .replace('ENDPOINTS_TABLE', [
      '| Module | Endpoints |',
      '|--------|-----------|',
      ...[...groups.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tag, tagOperations]) => {
          const config = PAGES.find((page) => page.tag === tag);
          return `| ${config?.title ?? tag} | ${tagOperations.length} |`;
        }),
    ].join('\n'));
};

const document = await Bun.file('docs/openapi.json').json();
const operations = loadOperations(document);

await mkdir('docs/api-reference', { recursive: true });

let written = 0;
for (const config of PAGES) {
  const pageOperations = operations.filter((operation) => operation.tag === config.tag);
  if (!pageOperations.length) continue;
  await Bun.write(`docs/${config.file}`, renderPage(config, pageOperations));
  written += 1;
}

await Bun.write('docs/api-reference/index.md', renderIndex(document, operations));

console.log(`Generated ${written} module pages and api-reference/index.md (${operations.length} operations).`);
