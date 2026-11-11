const assert = require('node:assert/strict');

const { InvoiceService } = require('./dist/services/invoice.service');
const Invoice = require('./dist/models/invoice.model').default;
const { OrderService } = require('./dist/services/order.service');
const ejs = require('ejs');
const path = require('node:path');

async function main() {
  const order = { id: 1, createdAt: new Date('2026-07-01T12:00:00Z'), items: [], totalPrice: 0, totalTax: 0 };
  OrderService.getOrderDetails = async () => order;
  let rendered;
  InvoiceService.generatePaginatedInvoicePdf = async (_, data) => {
    rendered = data;
    return { filePath: 'test.pdf' };
  };
  Invoice.create = async data => data;
  const invoice = await InvoiceService.create(1, null, {
    invoiceDate: '2026-07-17', orderDate: '2026-07-12', invoiceNumber: 'TEST'
  });
  assert.equal(invoice.date.toISOString().slice(0, 10), '2026-07-17');
  assert.equal(invoice.orderDate, '2026-07-12');
  assert.equal(rendered.orderDate, '2026-07-12');
  assert.equal(rendered.invoiceDate, '2026-07-17');
  const html = await ejs.renderFile(path.join(__dirname, 'templates/invoice.ejs'), {
    ...rendered, isLastPage: true, currentPage: 1, totalPages: 1
  });
  assert.match(html, /Lieferdatum vom:<\/strong><br\/>2026-07-12/);
  assert.match(html, /Rechnungsdatum:<\/strong><br\/>2026-07-17/);
  Invoice.findByPk = async () => ({ ...invoice, order, save: async () => {} });
  await InvoiceService.regeneratePdf(1);
  assert.equal(rendered.orderDate, '2026-07-12');
  assert.equal(rendered.invoiceDate, '2026-07-17');
  Invoice.findByPk = async () => ({ ...invoice, orderDate: null, order, save: async () => {} });
  await InvoiceService.regeneratePdf(1);
  assert.equal(rendered.orderDate, '2026-07-01');
  const defaultInvoice = await InvoiceService.create(1);
  assert.equal(defaultInvoice.orderDate, '2026-07-01');
  for (const value of ['2026-02-30', 'invalid', 123, '17.07.2026']) {
    await assert.rejects(() => InvoiceService.create(1, null, { orderDate: value }), /orderDate/);
    await assert.rejects(() => InvoiceService.create(1, null, { invoiceDate: value }), /invoiceDate/);
  }
  console.log('Invoice dates: persistence, regeneration, template and validation passed');
  const migration = require('./migrations/20261109000000-add-invoice-order-date');
  let added = 0;
  const queryInterface = {
    describeTable: async () => added ? { orderDate: {} } : {},
    addColumn: async (table, column, options) => {
      assert.equal(table, 'invoices');
      assert.equal(column, 'orderDate');
      assert.equal(options.allowNull, true);
      added++;
    },
  };
  await migration.up(queryInterface, { DATEONLY: 'DATEONLY' });
  await migration.up(queryInterface, { DATEONLY: 'DATEONLY' });
  assert.equal(added, 1);
  const { InvoiceController } = require('./dist/controllers/invoice.controller');
  const originalCreate = InvoiceService.create;
  InvoiceService.create = async (id, user, data) => {
    assert.equal(id, 42);
    assert.equal(data.orderDate, '2020-02-12');
    assert.equal(data.invoiceDate, '2021-03-15');
    return { id: 7, number: 'TEST', pdfPath: __filename };
  };
  let status, body;
  const res = { status(code) { status = code; return this; }, json(data) { body = data; } };
  await InvoiceController.createInvoice({ params: { orderId: '42' }, query: { format: 'json' },
    body: { orderDate: '2020-02-12', invoiceDate: '2021-03-15' } }, res, error => { throw error; });
  assert.equal(status, 201);
  assert.deepEqual(body, { id: 7, number: 'TEST' });
  InvoiceService.create = originalCreate;
  console.log('Mobile invoice response and idempotent schema migration passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
