import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import express from 'express';
import { categories, imageUrl, products } from '../src/data/storeData.js';
import { openDatabase } from './database.js';

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(serverDirectory, '..');
const databasePath = process.env.DATABASE_PATH ?? resolve(projectDirectory, 'data/megamart.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

const database = await openDatabase(databasePath);
database.pragma('foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS cart_lines (
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    PRIMARY KEY (cart_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL REFERENCES users(id),
    status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    total INTEGER NOT NULL,
    address_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (order_id, product_id)
  );
  CREATE TABLE IF NOT EXISTS account_addresses (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    resident_json TEXT NOT NULL,
    delivery_json TEXT NOT NULL,
    same_as_resident INTEGER NOT NULL DEFAULT 0 CHECK (same_as_resident IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    image TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    old INTEGER NOT NULL CHECK (old >= 0),
    save TEXT NOT NULL,
    image TEXT NOT NULL,
    tag TEXT NOT NULL,
    description TEXT NOT NULL,
    storage TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE CASCADE
  );
`);

if (!database.prepare('PRAGMA table_info(users)').all().some((column) => column.name === 'role')) {
  database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer'");
}

if (database.prepare('SELECT COUNT(*) AS count FROM categories').get().count === 0) {
  const insertCategory = database.prepare(
    'INSERT INTO categories (id, name, image) VALUES (?, ?, ?)',
  );
  for (const [name, image] of categories) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    insertCategory.run(id, name, imageUrl(image, 240));
  }
}

if (database.prepare('SELECT COUNT(*) AS count FROM products').get().count === 0) {
  const insertProduct = database.prepare(`
    INSERT INTO products (id, name, price, old, save, image, tag, description, storage, category_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const product of products) {
    insertProduct.run(
      product.id,
      product.name,
      product.price,
      product.old,
      product.save,
      product.image,
      product.tag,
      product.description,
      product.storage,
      'mobile',
    );
  }
}

const adminEmailSetting = process.env.ADMIN_EMAIL;
const adminEmail = adminEmailSetting?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminEmailSetting !== undefined || adminPassword !== undefined) {
  if (
    !adminEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail) ||
    typeof adminPassword !== 'string' ||
    adminPassword.length < 10 ||
    adminPassword.length > 128
  ) {
    throw new Error('Set a valid ADMIN_EMAIL and an ADMIN_PASSWORD between 10 and 128 characters.');
  }
  const existingAdmin = database.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existingAdmin) {
    database.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingAdmin.id);
  } else {
    database
      .prepare(`
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, 'MegaMart Admin', ?, ?, 'admin')
      `)
      .run(randomUUID(), adminEmail, await bcrypt.hash(adminPassword, 12));
  }
}

const app = express();
const port = Number(process.env.API_PORT ?? 3001);
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = `Path=/; HttpOnly; SameSite=Lax${isProduction ? '; Secure' : ''}`;
const authAttempts = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

function readCookies(request) {
  const cookies = {};
  for (const pair of (request.headers.cookie ?? '').split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    const key = pair.slice(0, separator).trim();
    try {
      cookies[key] = decodeURIComponent(pair.slice(separator + 1).trim());
    } catch {
      cookies[key] = '';
    }
  }
  return cookies;
}

function getCartId(request, response) {
  const existingId = readCookies(request).mm_cart;
  if (existingId && /^[\da-f-]{36}$/i.test(existingId)) return existingId;

  const cartId = randomUUID();
  response.append('Set-Cookie', `mm_cart=${cartId}; ${cookieOptions}; Max-Age=2592000`);
  return cartId;
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function setSessionCookie(response, userId) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  database
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(hashToken(token), userId, expiresAt);
  response.append('Set-Cookie', `mm_session=${token}; ${cookieOptions}; Max-Age=604800`);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.role ? { role: user.role } : {}),
  };
}

function requireUser(request, response, next) {
  const token = readCookies(request).mm_session;
  if (!token || !/^[\w-]{40,50}$/.test(token)) {
    return response.status(401).json({ error: 'Sign in to continue.' });
  }

  const session = database
    .prepare(`
      SELECT users.id, users.name, users.email, users.role, sessions.token_hash
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `)
    .get(hashToken(token), Date.now());

  if (!session) {
    response.append('Set-Cookie', `mm_session=; ${cookieOptions}; Max-Age=0`);
    return response.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }

  request.user = publicUser(session);
  request.sessionTokenHash = session.token_hash;
  return next();
}

function requireAdmin(request, response, next) {
  if (request.user.role !== 'admin') {
    return response.status(403).json({ error: 'Administrator access is required.' });
  }
  return next();
}

function limitAuthAttempts(request, response, next) {
  const now = Date.now();
  const key = request.ip;
  const record = authAttempts.get(key);
  if (record && record.resetAt > now && record.count >= 10) {
    return response.status(429).json({ error: 'Too many attempts. Please try again in 15 minutes.' });
  }
  if (!record || record.resetAt <= now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.count += 1;
  }
  return next();
}

function getCart(cartId) {
  const rows = database
    .prepare(`
      SELECT products.*, products.category_id AS categoryId, cart_lines.quantity
      FROM cart_lines JOIN products ON products.id = cart_lines.product_id
      WHERE cart_lines.cart_id = ? ORDER BY cart_lines.rowid
    `)
    .all(cartId);
  const items = rows;
  return {
    items,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  };
}

function productFromRow(row) {
  if (!row) return null;
  const { category_id: categoryId = row.categoryId, ...product } = row;
  return { ...product, categoryId };
}

function validProduct(product) {
  return (
    product &&
    typeof product === 'object' &&
    !Array.isArray(product) &&
    validText(product.id, 80) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id) &&
    validText(product.name, 160) &&
    Number.isSafeInteger(product.price) &&
    product.price >= 0 &&
    Number.isSafeInteger(product.old) &&
    product.old >= 0 &&
    validText(product.save, 40) &&
    validText(product.image, 1000) &&
    /^https?:\/\//i.test(product.image) &&
    validText(product.tag, 40) &&
    validText(product.description, 2000) &&
    validText(product.storage, 80) &&
    validText(product.categoryId, 80)
  );
}

function validCategory(category) {
  return (
    category &&
    typeof category === 'object' &&
    !Array.isArray(category) &&
    validText(category.id, 80) &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.id) &&
    validText(category.name, 80) &&
    validText(category.image, 1000) &&
    /^https?:\/\//i.test(category.image)
  );
}

function validText(value, maximum = 120) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maximum;
}

function validAddress(address, { includeRecipient = true } = {}) {
  if (!address || typeof address !== 'object' || Array.isArray(address)) return false;
  return (
    (!includeRecipient || validText(address.fullName, 80)) &&
    (!includeRecipient || /^[+\d][\d\s()-]{7,19}$/.test(address.phone ?? '')) &&
    validText(address.addressLine1, 160) &&
    (address.addressLine2 === '' || validText(address.addressLine2, 160)) &&
    validText(address.city, 80) &&
    validText(address.state, 80) &&
    /^[A-Za-z0-9 -]{4,12}$/.test(address.postalCode ?? '')
  );
}

function normalizeAddress(address, { includeRecipient = true } = {}) {
  return {
    ...(includeRecipient
      ? { fullName: address.fullName.trim(), phone: address.phone.trim() }
      : {}),
    addressLine1: address.addressLine1.trim(),
    addressLine2: (address.addressLine2 ?? '').trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
  };
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.get('/api/categories', (_request, response) => {
  const rows = database
    .prepare('SELECT id, name, image FROM categories ORDER BY name COLLATE NOCASE')
    .all();
  response.json({ categories: rows });
});

app.get('/api/products', (_request, response) => {
  const rows = database
    .prepare(`
      SELECT id, name, price, old, save, image, tag, description, storage,
        category_id AS categoryId
      FROM products ORDER BY rowid
    `)
    .all();
  response.json({ products: rows });
});

app.get('/api/products/:productId', (request, response) => {
  const product = database
    .prepare(`
      SELECT id, name, price, old, save, image, tag, description, storage,
        category_id AS categoryId
      FROM products WHERE id = ?
    `)
    .get(request.params.productId);
  if (!product) return response.status(404).json({ error: 'Product not found.' });
  return response.json({ product });
});

app.get('/api/admin/products', requireUser, requireAdmin, (_request, response) => {
  const rows = database
    .prepare(`
      SELECT id, name, price, old, save, image, tag, description, storage,
        category_id AS categoryId
      FROM products ORDER BY rowid
    `)
    .all();
  response.json({ products: rows });
});

app.post('/api/admin/products', requireUser, requireAdmin, (request, response, next) => {
  const product = request.body;
  if (!validProduct(product)) {
    return response.status(400).json({ error: 'Enter all product fields with valid values.' });
  }
  if (!database.prepare('SELECT id FROM categories WHERE id = ?').get(product.categoryId)) {
    return response.status(400).json({ error: 'Choose an existing product category.' });
  }
  try {
    database
      .prepare(`
        INSERT INTO products
          (id, name, price, old, save, image, tag, description, storage, category_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        product.id,
        product.name.trim(),
        product.price,
        product.old,
        product.save.trim(),
        product.image.trim(),
        product.tag.trim(),
        product.description.trim(),
        product.storage.trim(),
        product.categoryId,
      );
    return response.status(201).json({ product: productFromRow(product) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'A product with that ID already exists.' });
    }
    return next(error);
  }
});

app.put('/api/admin/products/:productId', requireUser, requireAdmin, (request, response, next) => {
  const product = request.body;
  if (!validProduct(product) || product.id !== request.params.productId) {
    return response.status(400).json({ error: 'Enter all product fields and keep the product ID unchanged.' });
  }
  if (!database.prepare('SELECT id FROM categories WHERE id = ?').get(product.categoryId)) {
    return response.status(400).json({ error: 'Choose an existing product category.' });
  }
  const result = database
    .prepare(`
      UPDATE products SET name = ?, price = ?, old = ?, save = ?, image = ?, tag = ?,
        description = ?, storage = ?, category_id = ?
      WHERE id = ?
    `)
    .run(
      product.name.trim(),
      product.price,
      product.old,
      product.save.trim(),
      product.image.trim(),
      product.tag.trim(),
      product.description.trim(),
      product.storage.trim(),
      product.categoryId,
      product.id,
    );
  if (!result.changes) return response.status(404).json({ error: 'Product not found.' });
  return response.json({ product: productFromRow(product) });
});

app.delete('/api/admin/products/:productId', requireUser, requireAdmin, (request, response) => {
  const removeProduct = database.transaction(() => {
    database.prepare('DELETE FROM cart_lines WHERE product_id = ?').run(request.params.productId);
    return database.prepare('DELETE FROM products WHERE id = ?').run(request.params.productId);
  });
  if (!removeProduct().changes) return response.status(404).json({ error: 'Product not found.' });
  return response.status(204).end();
});

app.get('/api/admin/categories', requireUser, requireAdmin, (_request, response) => {
  const rows = database
    .prepare('SELECT id, name, image FROM categories ORDER BY name COLLATE NOCASE')
    .all();
  response.json({ categories: rows });
});

app.post('/api/admin/categories', requireUser, requireAdmin, (request, response, next) => {
  const category = request.body;
  if (!validCategory(category)) {
    return response.status(400).json({ error: 'Enter a valid category ID, name, and image URL.' });
  }
  try {
    database
      .prepare('INSERT INTO categories (id, name, image) VALUES (?, ?, ?)')
      .run(category.id, category.name.trim(), category.image.trim());
    return response.status(201).json({
      category: { id: category.id, name: category.name.trim(), image: category.image.trim() },
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'A category with that ID or name already exists.' });
    }
    return next(error);
  }
});

app.put('/api/admin/categories/:categoryId', requireUser, requireAdmin, (request, response, next) => {
  const category = request.body;
  if (!validCategory(category) || category.id !== request.params.categoryId) {
    return response.status(400).json({ error: 'Enter valid category fields and keep the category ID unchanged.' });
  }
  try {
    const result = database
      .prepare('UPDATE categories SET name = ?, image = ? WHERE id = ?')
      .run(category.name.trim(), category.image.trim(), category.id);
    if (!result.changes) return response.status(404).json({ error: 'Category not found.' });
    return response.json({
      category: { id: category.id, name: category.name.trim(), image: category.image.trim() },
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'A category with that name already exists.' });
    }
    return next(error);
  }
});

app.delete('/api/admin/categories/:categoryId', requireUser, requireAdmin, (request, response) => {
  if (
    database
      .prepare('SELECT 1 FROM products WHERE category_id = ? LIMIT 1')
      .get(request.params.categoryId)
  ) {
    return response.status(409).json({ error: 'Move or delete this category’s products first.' });
  }
  const result = database
    .prepare('DELETE FROM categories WHERE id = ?')
    .run(request.params.categoryId);
  if (!result.changes) return response.status(404).json({ error: 'Category not found.' });
  return response.status(204).end();
});

app.post('/api/auth/register', limitAuthAttempts, async (request, response, next) => {
  const { name, email, password } = request.body ?? {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (
    !validText(name, 80) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
    typeof password !== 'string' ||
    password.length < 10 ||
    password.length > 128
  ) {
    return response.status(400).json({
      error: 'Enter your name, a valid email, and a password between 10 and 128 characters.',
    });
  }

  try {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 12);
    database
      .prepare('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)')
      .run(id, name.trim(), normalizedEmail, passwordHash);
    setSessionCookie(response, id);
    return response.status(201).json({
      user: { id, name: name.trim(), email: normalizedEmail },
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return response.status(409).json({ error: 'An account with that email already exists.' });
    }
    return next(error);
  }
});

app.post('/api/auth/login', limitAuthAttempts, async (request, response, next) => {
  const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
  const password = request.body?.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string') {
    return response.status(400).json({ error: 'Enter a valid email and password.' });
  }

  try {
    const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({ error: 'Email or password is incorrect.' });
    }
    setSessionCookie(response, user.id);
    return response.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/auth/me', (request, response) => {
  const token = readCookies(request).mm_session;
  if (!token || !/^[\w-]{40,50}$/.test(token)) return response.json({ user: null });
  const session = database
    .prepare(`
      SELECT users.id, users.name, users.email, users.role
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `)
    .get(hashToken(token), Date.now());
  response.json({ user: session ? publicUser(session) : null });
});

app.post('/api/auth/logout', requireUser, (request, response) => {
  database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(request.sessionTokenHash);
  response.append('Set-Cookie', `mm_session=; ${cookieOptions}; Max-Age=0`);
  response.status(204).end();
});

app.get('/api/account/addresses', requireUser, (request, response) => {
  const addresses = database
    .prepare(`
      SELECT resident_json AS resident, delivery_json AS delivery,
        same_as_resident AS sameAsResident
      FROM account_addresses WHERE user_id = ?
    `)
    .get(request.user.id);
  response.json({
    addresses: addresses
      ? {
          resident: JSON.parse(addresses.resident),
          delivery: JSON.parse(addresses.delivery),
          sameAsResident: Boolean(addresses.sameAsResident),
        }
      : {
          resident: null,
          delivery: null,
          sameAsResident: false,
        },
  });
});

app.put('/api/account/addresses', requireUser, (request, response) => {
  const { resident, delivery, sameAsResident } = request.body ?? {};
  if (
    typeof sameAsResident !== 'boolean' ||
    !validAddress(resident, { includeRecipient: false }) ||
    (!sameAsResident && !validAddress(delivery, { includeRecipient: false }))
  ) {
    return response.status(400).json({
      error: 'Enter a valid resident and delivery address, or choose to use the resident address for delivery.',
    });
  }

  const normalizedResident = normalizeAddress(resident, { includeRecipient: false });
  const normalizedDelivery = sameAsResident
    ? normalizedResident
    : normalizeAddress(delivery, { includeRecipient: false });
  database
    .prepare(`
      INSERT INTO account_addresses (user_id, resident_json, delivery_json, same_as_resident)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET resident_json = excluded.resident_json,
        delivery_json = excluded.delivery_json, same_as_resident = excluded.same_as_resident,
        updated_at = CURRENT_TIMESTAMP
    `)
    .run(
      request.user.id,
      JSON.stringify(normalizedResident),
      JSON.stringify(normalizedDelivery),
      sameAsResident ? 1 : 0,
    );
  response.json({
    addresses: {
      resident: normalizedResident,
      delivery: normalizedDelivery,
      sameAsResident,
    },
  });
});

app.get('/api/cart', (request, response) => {
  response.json(getCart(getCartId(request, response)));
});

app.post('/api/cart', (request, response) => {
  const { productId, quantity = 1 } = request.body ?? {};
  if (!database.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
    return response.status(404).json({ error: 'That product is no longer available.' });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return response.status(400).json({ error: 'Quantity must be between 1 and 99.' });
  }

  const cartId = getCartId(request, response);
  database
    .prepare(`
      INSERT INTO cart_lines (cart_id, product_id, quantity) VALUES (?, ?, ?)
      ON CONFLICT(cart_id, product_id) DO UPDATE SET quantity = MIN(99, quantity + excluded.quantity)
    `)
    .run(cartId, productId, quantity);
  return response.json(getCart(cartId));
});

app.patch('/api/cart/:productId', (request, response) => {
  const { productId } = request.params;
  const { quantity } = request.body ?? {};
  if (!database.prepare('SELECT id FROM products WHERE id = ?').get(productId)) {
    return response.status(404).json({ error: 'That product is no longer available.' });
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return response.status(400).json({ error: 'Quantity must be between 0 and 99.' });
  }

  const cartId = getCartId(request, response);
  if (quantity === 0) {
    database.prepare('DELETE FROM cart_lines WHERE cart_id = ? AND product_id = ?').run(cartId, productId);
  } else {
    database
      .prepare('UPDATE cart_lines SET quantity = ? WHERE cart_id = ? AND product_id = ?')
      .run(quantity, cartId, productId);
  }
  return response.json(getCart(cartId));
});

app.delete('/api/cart/:productId', (request, response) => {
  const cartId = getCartId(request, response);
  database
    .prepare('DELETE FROM cart_lines WHERE cart_id = ? AND product_id = ?')
    .run(cartId, request.params.productId);
  return response.json(getCart(cartId));
});

app.get('/api/orders', requireUser, (request, response) => {
  const orders = database
    .prepare(`
      SELECT id, order_number AS orderNumber, status, payment_method AS paymentMethod,
        total, address_json AS address, created_at AS createdAt
      FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `)
    .all(request.user.id)
    .map((order) => ({
      ...order,
      address: JSON.parse(order.address),
      items: database
        .prepare(`
          SELECT product_id AS productId, name, unit_price AS unitPrice, quantity
          FROM order_items WHERE order_id = ?
        `)
        .all(order.id),
    }));
  response.json({ orders });
});

app.post('/api/checkout', requireUser, (request, response) => {
  const { fullName, phone, addressLine1, addressLine2 = '', city, state, postalCode } =
    request.body ?? {};
  if (!validAddress({ fullName, phone, addressLine1, addressLine2, city, state, postalCode })) {
    return response.status(400).json({ error: 'Complete each required delivery address field.' });
  }

  const cartId = getCartId(request, response);
  const cart = getCart(cartId);
  if (!cart.items.length) return response.status(400).json({ error: 'Your cart is empty.' });

  const orderId = randomUUID();
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
    .toString('hex')
    .toUpperCase()}`;
  const address = normalizeAddress({
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
  });

  const createOrder = database.transaction(() => {
    database
      .prepare(`
        INSERT INTO orders (id, order_number, user_id, status, payment_method, total, address_json)
        VALUES (?, ?, ?, 'confirmed', 'cash_on_delivery', ?, ?)
      `)
      .run(orderId, orderNumber, request.user.id, cart.total, JSON.stringify(address));
    const addItem = database.prepare(`
      INSERT INTO order_items (order_id, product_id, name, unit_price, quantity)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const item of cart.items) {
      addItem.run(orderId, item.id, item.name, item.price, item.quantity);
    }
    database.prepare('DELETE FROM cart_lines WHERE cart_id = ?').run(cartId);
  });

  createOrder();
  return response.status(201).json({
    order: {
      id: orderId,
      orderNumber,
      status: 'confirmed',
      paymentMethod: 'cash_on_delivery',
      total: cart.total,
      address,
      items: cart.items,
    },
  });
});

app.use('/api', (_request, response) => response.status(404).json({ error: 'API endpoint not found.' }));

app.use(express.static(resolve(projectDirectory, 'dist')));
app.use((request, response, next) => {
  if (request.method !== 'GET') return next();
  return response.sendFile(resolve(projectDirectory, 'dist/index.html'));
});

app.use((error, request, response, _next) => {
  console.error(`[${new Date().toISOString()}] ${request.method} ${request.path}`, error);
  response.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
});

app.listen(port, () => {
  console.log(`MegaMart API listening on http://localhost:${port}`);
});
