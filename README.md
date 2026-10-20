# MegaMart

A React and Vite storefront with an Express API and SQLite-backed accounts,
carts, and cash-on-delivery orders.

The SQLite database runs through SQL.js (WebAssembly), so the server does not
depend on a Node-version-specific native SQLite binary.

## Run locally

```sh
npm install
npm run dev
```

`npm run dev` starts Vite and the API together. Open the Vite URL printed in
the terminal. The API listens on port `3001` by default and Vite proxies `/api`
requests to it.

## Customer flow

1. Add products to the cart. Guest carts are kept in SQLite and associated with
   an HttpOnly browser cookie.
2. Open **Cart** and review quantities, remove items, or continue shopping.
3. Continue to checkout. Sign in or create an account if needed; your cart
   remains available when you return.
4. In **My account**, add or edit resident and delivery addresses, or select
   **Use resident address as my delivery address** to keep them the same.
   Checkout prefills the saved delivery address.
5. Review the delivery details, enter the recipient name and phone number, and
   place the order using **Cash on delivery**.
6. Review the order confirmation or open **My account** to view order history.

Accounts use bcrypt password hashes and seven-day HttpOnly sessions. The
checkout stores the selected address and confirms a COD order; it does not
collect payment card details or process online payments.

## Catalog management API

Products and categories are stored in SQLite and served by the API. Public
catalog endpoints are `GET /api/products`, `GET /api/products/:productId`,
and `GET /api/categories`. The storefront loads its product and category data
from these endpoints.

Admin catalog endpoints require a signed-in admin session:

- `GET`, `POST /api/admin/products`
- `PUT`, `DELETE /api/admin/products/:productId`
- `GET`, `POST /api/admin/categories`
- `PUT`, `DELETE /api/admin/categories/:categoryId`

Product records use `id`, `name`, `price`, `old`, `save`, `image`, `tag`,
`description`, `storage`, and `categoryId`. Category records use `id`, `name`,
and `image`. IDs are lowercase URL-safe slugs, prices are integer rupee
amounts for the current storefront, and image values must be
HTTP or HTTPS URLs.

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` when starting the server to create the
initial admin account if it does not exist, or promote an existing account with
that email. Passwords must be 10–128 characters. Keep these values private;
the password is only used to create a new admin account and is not reset when
an existing account is promoted. Admins can use the endpoints with the normal
`/api/auth/login` session cookie. Category deletion is rejected while products
still reference that category.

After starting the server, sign in with the admin account in the storefront and
open `http://localhost:5173/admin` during development, or `/admin` on the
production site. The dashboard provides forms to add, edit, and delete
products and categories.

For local development, start the storefront and API together with:

```sh
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='use-a-private-password' npm run dev
```

## Production

```sh
npm run build
npm start
```

The Express server serves the built app and API on port `3001` by default. Set
`API_PORT` to change the server port and `DATABASE_PATH` to choose the SQLite
database file. For local Vite development with a non-default API port, set
`VITE_API_PROXY_TARGET` to the API origin, for example
`http://localhost:3100`. In production, set `NODE_ENV=production` and serve the
application over HTTPS so session cookies use the `Secure` attribute.

This starter does not include email verification, password recovery, shipping
integrations, or payment processing. Add those before using it for a live store.
# megamart-react-vite
