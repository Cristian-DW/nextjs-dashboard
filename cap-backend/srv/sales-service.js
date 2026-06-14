const cds = require('@sap/cds');

module.exports = class SalesService extends cds.ApplicationService {

  async init() {
    const { POSSales, POSSaleItems, Invoices, InvoiceItems } = this.entities;

    // ── Auto-compute total on POS sale creation ────────────────────────────
    this.before('CREATE', POSSales, async (req) => {
      const { items } = req.data;
      if (items && items.length > 0) {
        const total = items.reduce((sum, item) => {
          const subtotal = item.unit_price * item.quantity;
          const discount = subtotal * ((item.discount_pct || 0) / 100);
          item.subtotal = subtotal - discount;
          return sum + item.subtotal;
        }, 0);
        req.data.total_amount = total;
        req.data.sale_date = req.data.sale_date || new Date().toISOString();
        req.data.status = req.data.status || 'completed';
      }
    });

    // ── Emit Event Mesh message after sale is created ─────────────────────────
    this.after('CREATE', POSSales, async (data, req) => {
      const messaging = await cds.connect.to('messaging');
      messaging.emit('deltux/pos/Sales/Created', {
        sale_id: data.id,
        total_amount: data.total_amount,
        timestamp: data.sale_date
      });
      console.log(`[Event Mesh] Emitted deltux/pos/Sales/Created for sale ${data.id}`);
    });

    // ── Auto-compute invoice totals ────────────────────────────────────────
    this.before('CREATE', Invoices, async (req) => {
      const { items } = req.data;
      if (items && items.length > 0) {
        const total = items.reduce((sum, item) => {
          item.subtotal = item.unit_price * item.quantity;
          return sum + item.subtotal;
        }, 0);
        req.data.amount = total;
        req.data.date = req.data.date || new Date().toISOString().split('T')[0];
        req.data.status = req.data.status || 'pending';
      }
    });

    await super.init();
  }
};
