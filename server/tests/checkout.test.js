import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'megamart-checkout-'));
const databasePath = join(temporaryDirectory, 'test.sqlite');
const cookies = new Map();
let serverProcess;
let baseUrl;

async function getAvailablePort() {
  const server = createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return port;
}

async function waitForApi() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`API exited unexpectedly with code ${serverProcess.exitCode}.`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await delay(100);
    }
  }
  throw new Error('API did not start in time.');
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (cookies.size) {
    headers.Cookie = [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const setCookie = response.headers.get('set-cookie') ?? '';
  for (const match of setCookie.matchAll(/(mm_(?:cart|session))=([^;,\s]*)/g)) {
    if (match[2]) cookies.set(match[1], match[2]);
    else cookies.delete(match[1]);
  }
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  };
}

test('account, persistent cart, COD checkout, and order history work end to end', async (t) => {
  const port = await getAvailablePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const startServer = () =>
    spawn(process.execPath, ['server/index.js'], {
      cwd: projectDirectory,
      env: { ...process.env, API_PORT: String(port), DATABASE_PATH: databasePath },
      stdio: 'ignore',
    });
  serverProcess = startServer();
  t.after(async () => {
    if (serverProcess.exitCode === null) {
      serverProcess.kill('SIGTERM');
      await once(serverProcess, 'exit');
    }
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });
  await waitForApi();

  const email = `checkout-${process.pid}@example.test`;
  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test Shopper', email, password: 'sample-password-2026' },
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.body.user.email, email);
  assert.ok(cookies.has('mm_session'));

  const emptyAddresses = await request('/api/account/addresses');
  assert.equal(emptyAddresses.status, 200);
  assert.equal(emptyAddresses.body.addresses.resident, null);
  assert.equal(emptyAddresses.body.addresses.delivery, null);

  const residentAddress = {
    addressLine1: '10 Home Lane',
    addressLine2: '',
    city: 'Mysuru',
    state: 'Karnataka',
    postalCode: '570001',
  };
  const deliveryAddress = {
    addressLine1: '42 Sample Street',
    addressLine2: 'Apartment 4',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
  };
  const savedAddresses = await request('/api/account/addresses', {
    method: 'PUT',
    body: {
      resident: residentAddress,
      delivery: deliveryAddress,
      sameAsResident: false,
    },
  });
  assert.equal(savedAddresses.status, 200);
  assert.equal(savedAddresses.body.addresses.delivery.city, 'Bengaluru');

  const sharedAddress = await request('/api/account/addresses', {
    method: 'PUT',
    body: {
      resident: residentAddress,
      delivery: deliveryAddress,
      sameAsResident: true,
    },
  });
  assert.deepEqual(sharedAddress.body.addresses.delivery, residentAddress);

  const independentAddresses = await request('/api/account/addresses', {
    method: 'PUT',
    body: {
      resident: residentAddress,
      delivery: deliveryAddress,
      sameAsResident: false,
    },
  });
  assert.equal(independentAddresses.body.addresses.delivery.city, 'Bengaluru');

  const duplicateAccount = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test Shopper', email, password: 'sample-password-2026' },
  });
  assert.equal(duplicateAccount.status, 409);

  const cartResponse = await request('/api/cart', {
    method: 'POST',
    body: { productId: 'galaxy-m33', quantity: 2 },
  });
  assert.equal(cartResponse.status, 200);
  assert.equal(cartResponse.body.totalItems, 2);
  assert.equal(cartResponse.body.items[0].quantity, 2);
  assert.ok(cookies.has('mm_cart'));

  const updatedCart = await request('/api/cart/galaxy-m33', {
    method: 'PATCH',
    body: { quantity: 3 },
  });
  assert.equal(updatedCart.body.total, 16999 * 3);

  const invalidCheckout = await request('/api/checkout', {
    method: 'POST',
    body: { fullName: 'Test Shopper' },
  });
  assert.equal(invalidCheckout.status, 400);
  assert.equal((await request('/api/cart')).body.totalItems, 3);

  const checkout = await request('/api/checkout', {
    method: 'POST',
    body: {
      fullName: 'Test Shopper',
      phone: '+91 98765 43210',
      addressLine1: '42 Sample Street',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
    },
  });
  assert.equal(checkout.status, 201);
  assert.equal(checkout.body.order.paymentMethod, 'cash_on_delivery');
  assert.equal(checkout.body.order.total, 16999 * 3);
  assert.equal((await request('/api/cart')).body.totalItems, 0);

  const orderHistory = await request('/api/orders');
  assert.equal(orderHistory.status, 200);
  assert.equal(orderHistory.body.orders.length, 1);
  assert.equal(orderHistory.body.orders[0].orderNumber, checkout.body.order.orderNumber);
  assert.equal(orderHistory.body.orders[0].items[0].quantity, 3);

  const logout = await request('/api/auth/logout', { method: 'POST' });
  assert.equal(logout.status, 204);
  const unauthorizedOrders = await request('/api/orders');
  assert.equal(unauthorizedOrders.status, 401);

  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'sample-password-2026' },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.email, email);
  assert.equal((await request('/api/orders')).body.orders.length, 1);
  const persistedAddresses = await request('/api/account/addresses');
  assert.equal(persistedAddresses.body.addresses.resident.city, 'Mysuru');
  assert.equal(persistedAddresses.body.addresses.delivery.city, 'Bengaluru');

  serverProcess.kill('SIGTERM');
  await once(serverProcess, 'exit');
  serverProcess = startServer();
  await waitForApi();
  const reloadedCart = await request('/api/cart');
  assert.equal(reloadedCart.body.totalItems, 0);
  assert.equal((await request('/api/orders')).body.orders.length, 1);
});
