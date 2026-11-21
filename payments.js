// GURUJI PALMISTRY — Cashfree Payments (PG API v2023-08-01)
//
// Keys come only from environment variables — never from the repository:
//   CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV=production|sandbox
//
// Flow: the server creates a Cashfree order for a booking and returns its
// payment_session_id → the browser opens Cashfree checkout → after payment the
// server asks Cashfree for the order status (never trusting the browser) and
// marks the booking paid. A webhook triggers the same server-side check.

'use strict';

// Cashfree dates its API versions. 2023-08-01 is the stable version this code is
// written against; set CASHFREE_API_VERSION to move to a newer one.
const DEFAULT_API_VERSION = '2023-08-01';

function cashfreeConfig(env = process.env) {
  const appId = (env.CASHFREE_APP_ID || '').trim();
  const secret = (env.CASHFREE_SECRET_KEY || '').trim();
  const mode = (env.CASHFREE_ENV || 'sandbox').trim().toLowerCase() === 'production' ? 'production' : 'sandbox';
  return {
    enabled: Boolean(appId && secret),
    appId, secret, mode,
    apiVersion: (env.CASHFREE_API_VERSION || DEFAULT_API_VERSION).trim(),
    baseUrl: mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
  };
}

class PaymentGatewayError extends Error {
  constructor(message, status = 502) { super(message); this.status = status; }
}

function createCashfree(config = cashfreeConfig(), fetchImpl = globalThis.fetch) {
  async function call(method, path, body) {
    if (!config.enabled) throw new PaymentGatewayError('Online payments are not configured yet', 503);
    let res;
    try {
      res = await fetchImpl(config.baseUrl + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': config.apiVersion || DEFAULT_API_VERSION,
          'x-client-id': config.appId,
          'x-client-secret': config.secret
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000)
      });
    } catch (e) {
      throw new PaymentGatewayError('Could not reach the payment gateway. Please try again.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      // Log Cashfree's reason for the server logs; show the devotee a plain message
      console.error(`[payments] Cashfree ${method} ${path} → ${res.status}: ${data.message || data.code || 'error'}`);
      throw new PaymentGatewayError('The payment gateway could not process this request. Please try again in a moment.');
    }
    return data;
  }

  return {
    mode: config.mode,
    enabled: config.enabled,
    apiVersion: config.apiVersion || DEFAULT_API_VERSION,

    /** Creates a Cashfree order; returns { orderId, paymentSessionId }. */
    async createOrder({ orderId, amount, customer, returnUrl, notifyUrl, note }) {
      // Cashfree: order_id is 3–45 characters of letters, numbers, _ and -
      if (!/^[A-Za-z0-9_-]{3,45}$/.test(String(orderId))) throw new PaymentGatewayError('Invalid booking reference for payment', 500);
      if (!(Number(amount) >= 1)) throw new PaymentGatewayError('The amount must be at least ₹1', 422);
      if (String(returnUrl).length > 250) throw new PaymentGatewayError('The payment return address is too long', 500);
      const body = {
        order_id: orderId,
        order_amount: Number(Number(amount).toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          // Cashfree allows only alphanumerics here, 3–50 characters
          customer_id: ('C' + String(customer.phone)).replace(/[^A-Za-z0-9]/g, '').slice(0, 50),
          customer_phone: customer.phone,
          customer_name: customer.name || undefined,
          customer_email: customer.email || undefined
        },
        order_meta: { return_url: returnUrl, notify_url: notifyUrl || undefined },
        order_note: note ? String(note).slice(0, 200) : undefined
      };
      const data = await call('POST', '/orders', body);
      if (!data.payment_session_id) throw new PaymentGatewayError('The payment gateway did not return a payment session.');
      return { orderId: data.order_id, paymentSessionId: data.payment_session_id };
    },

    /** Returns { status: 'PAID'|'ACTIVE'|'EXPIRED'|'TERMINATED'|..., amount } straight from Cashfree. */
    async getOrder(orderId) {
      const data = await call('GET', '/orders/' + encodeURIComponent(orderId));
      return { status: data.order_status, amount: Number(data.order_amount), currency: data.order_currency, raw: data };
    }
  };
}

module.exports = { cashfreeConfig, createCashfree, PaymentGatewayError };
