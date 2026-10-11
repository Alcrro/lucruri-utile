/**
 * Numele cozilor pg-boss, partajate între web (publică) și worker (consumă). docs/architecture.md.
 * Un nume nou aici = coadă creată automat la pornirea worker-ului.
 */
export const QUEUES = {
  supplierImport: 'supplier.import',
  compatibilityRecompute: 'compatibility.recompute',
  stripeProcessEvent: 'stripe.process-event',
  paymentCapture: 'payment.capture',
  paymentCancel: 'payment.cancel',
  orderForwardToSupplier: 'order.forward-to-supplier',
  invoiceIssue: 'invoice.issue',
  invoiceStorno: 'invoice.storno',
  dbBackup: 'db.backup',
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];
