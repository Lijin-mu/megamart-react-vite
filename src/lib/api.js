async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'The request could not be completed.');
  return result;
}

export const api = {
  currentUser: () => request('/auth/me'),
  register: (details) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(details) }),
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCart: () => request('/cart'),
  addToCart: (productId, quantity = 1) =>
    request('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (productId, quantity) =>
    request(`/cart/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),
  removeCartItem: (productId) =>
    request(`/cart/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
  orders: () => request('/orders'),
  accountAddresses: () => request('/account/addresses'),
  saveAccountAddresses: (addresses) =>
    request('/account/addresses', { method: 'PUT', body: JSON.stringify(addresses) }),
  checkout: (address) =>
    request('/checkout', { method: 'POST', body: JSON.stringify(address) }),
};
