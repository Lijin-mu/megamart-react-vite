import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './lib/api.js';
import BrandSection from './components/BrandSection.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Categories from './components/Categories.jsx';
import Essentials from './components/Essentials.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ProductSection from './components/ProductSection.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import ProductListingPage from './pages/ProductListingPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderConfirmationPage from './pages/OrderConfirmationPage.jsx';
import OrderDetailsPage from './pages/OrderDetailsPage.jsx';

export default function App() {
  const [cart, setCart] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [apiError, setApiError] = useState('');
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    Promise.all([api.getCart(), api.currentUser()])
      .then(([cartData, userData]) => {
        setCart(cartData);
        setCurrentUser(userData.user);
      })
      .catch((error) => setApiError(error.message))
      .finally(() => setAuthReady(true));
  }, []);

  async function addToCart(product) {
    try {
      setCart(await api.addToCart(product.id));
      setApiError('');
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function updateCartItem(productId, quantity) {
    try {
      setCart(await api.updateCartItem(productId, quantity));
      setApiError('');
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function removeCartItem(productId) {
    try {
      setCart(await api.removeCartItem(productId));
      setApiError('');
    } catch (error) {
      setApiError(error.message);
    }
  }

  function applyCart(cartData) {
    setCart(cartData);
  }

  return (
    <>
      <Header
        cartCount={cart?.totalItems ?? 0}
        currentUser={currentUser}
        onCart={() => setCartOpen(true)}
      />
      {apiError && (
        <div className="container api-error" role="alert">
          {apiError}
          <button onClick={() => setApiError('')} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
      <Routes>
        <Route
          path="/"
          element={
            <main className="container">
              <Hero />
              <ProductSection onAdd={addToCart} />
              <Categories />
              <BrandSection />
              <Essentials />
            </main>
          }
        />
        <Route path="/products" element={<ProductListingPage onAdd={addToCart} />} />
        <Route path="/products/:productId" element={<ProductDetailPage onAdd={addToCart} />} />
        <Route
          path="/cart"
          element={
            <CartPage
              cart={cart}
              onUpdateQuantity={updateCartItem}
              onRemove={removeCartItem}
            />
          }
        />
        <Route
          path="/account/*"
          element={
            <AccountPage
              currentUser={currentUser}
              authReady={authReady}
              onUserChange={setCurrentUser}
              cart={cart}
            />
          }
        />
        <Route
          path="/account/orders/:orderNumber"
          element={<OrderDetailsPage currentUser={currentUser} authReady={authReady} />}
        />
        <Route
          path="/checkout"
          element={
            <CheckoutPage
              currentUser={currentUser}
              cart={cart}
              authReady={authReady}
              onCartChange={applyCart}
            />
          }
        />
        <Route
          path="/checkout/success/:orderNumber"
          element={
            <OrderConfirmationPage currentUser={currentUser} authReady={authReady} />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
      {cartOpen && (
        <CartDrawer
          cart={cart?.items ?? []}
          total={cart?.total ?? 0}
          onClose={() => setCartOpen(false)}
          onRemove={removeCartItem}
          onUpdateQuantity={updateCartItem}
        />
      )}
    </>
  );
}
