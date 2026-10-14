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
