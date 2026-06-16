const cds = require('@sap/cds');

// ── Custom REST endpoints for Integration Suite & health monitoring ──────────

cds.on('bootstrap', (app) => {

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'deltux-pos-srv',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        catalog:  '/odata/v4/catalog',
        sales:    '/odata/v4/sales',
        admin:    '/odata/v4/admin',
        openapi:  '/api/openapi.json',
        metadata: '/odata/v4/catalog/$metadata',
      }
    });
  });

  // ── OpenAPI Spec for Integration Suite import ─────────────────────────────
  app.get('/api/openapi.json', (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({
      openapi: '3.0.0',
      info: {
        title: 'Deltux POS API',
        version: '1.0.0',
        description: 'REST & OData v4 APIs for Deltux POS. Consume from SAP Integration Suite or any HTTP client.',
        contact: { name: 'Cristian Castro', email: 'cristian.castrop@seidor.com' },
      },
      servers: [{ url: baseUrl, description: 'Current server' }],
      tags: [
        { name: 'Catalog', description: 'Product catalog — read-only' },
        { name: 'Sales', description: 'Sales & invoicing — full CRUD' },
        { name: 'Admin', description: 'Administration & management' },
        { name: 'System', description: 'Health & metadata' },
      ],
      paths: {
        '/api/health': {
          get: {
            tags: ['System'],
            summary: 'Health check',
            responses: { '200': { description: 'Service is UP' } }
          }
        },
        '/odata/v4/catalog/Products': {
          get: {
            tags: ['Catalog'],
            summary: 'List all products',
            parameters: [
              { name: '$top', in: 'query', schema: { type: 'integer' }, description: 'Max records' },
              { name: '$skip', in: 'query', schema: { type: 'integer' }, description: 'Offset' },
              { name: '$filter', in: 'query', schema: { type: 'string' }, description: 'OData filter expression' },
              { name: '$expand', in: 'query', schema: { type: 'string' }, description: 'Expand related entities (e.g. category,supplier)' },
            ],
            responses: { '200': { description: 'Array of products' } }
          }
        },
        '/odata/v4/catalog/Categories': {
          get: { tags: ['Catalog'], summary: 'List categories', responses: { '200': { description: 'Array of categories' } } }
        },
        '/odata/v4/catalog/Customers': {
          get: { tags: ['Catalog'], summary: 'List customers', responses: { '200': { description: 'Array of customers' } } }
        },
        '/odata/v4/sales/POSSales': {
          get: { tags: ['Sales'], summary: 'List POS sales', responses: { '200': { description: 'Array of sales' } } },
          post: {
            tags: ['Sales'],
            summary: 'Create a POS sale',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      customer_id: { type: 'string', format: 'uuid' },
                      payment_method: { type: 'string', enum: ['cash', 'card', 'transfer'] },
                      notes: { type: 'string' },
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            product_id: { type: 'string', format: 'uuid' },
                            quantity: { type: 'integer' },
                            unit_price: { type: 'integer' },
                            discount_pct: { type: 'integer', default: 0 },
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            responses: { '201': { description: 'Sale created' } }
          }
        },
        '/odata/v4/sales/Invoices': {
          get: { tags: ['Sales'], summary: 'List invoices', responses: { '200': { description: 'Array of invoices' } } },
          post: { tags: ['Sales'], summary: 'Create invoice', responses: { '201': { description: 'Invoice created' } } }
        },
        '/odata/v4/admin/Products': {
          get: { tags: ['Admin'], summary: 'List products (admin)', responses: { '200': { description: 'Array of products' } } },
          post: { tags: ['Admin'], summary: 'Create product', responses: { '201': { description: 'Product created' } } }
        },
        '/odata/v4/admin/LowStockAlerts': {
          get: { tags: ['Admin'], summary: 'Products below stock threshold', responses: { '200': { description: 'Low stock products' } } }
        },
      }
    });
  });

  // ── CORS for Integration Suite ─────────────────────────────────────────────
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Key');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
});
