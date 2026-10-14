import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const initialAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
};

export default function CheckoutPage({ currentUser, cart, onCartChange, authReady }) {
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady && !currentUser) {
      navigate('/account', { replace: true, state: { from: '/checkout' } });
    }
  }, [authReady, currentUser, navigate]);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    setAddress((current) => ({
      ...current,
      fullName: current.fullName || currentUser.name,
    }));
    api.accountAddresses()
      .then(({ addresses }) => {
        if (addresses.delivery) {
          setAddress((current) => ({
            ...current,
            ...addresses.delivery,
            fullName: current.fullName || currentUser.name,
          }));
        }
      })
      .catch((requestError) => setError(requestError.message));
  }, [authReady, currentUser]);

  function updateAddress(event) {
    setAddress((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = await api.checkout(address);
      onCartChange({ items: [], totalItems: 0, total: 0 });
      navigate(`/checkout/success/${encodeURIComponent(result.order.orderNumber)}`, {
        state: { order: result.order },
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!authReady || !currentUser || !cart) {
    return <main className="container flow-page"><h1>Preparing secure checkout…</h1></main>;
  }

  if (cart.items.length === 0) {
    return (
      <main className="container flow-page empty-checkout">
        <p className="eyebrow">CHECKOUT</p>
        <h1>Your cart is empty</h1>
        <p>Add products to your cart before checking out.</p>
        <Link className="primary-link-button" to="/products">Browse smartphones</Link>
      </main>
    );
  }

  return (
    <main className="container flow-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link><span>/</span><Link to="/cart">Cart</Link><span>/</span><span>Checkout</span>
      </div>
      <Link className="back-link" to="/cart"><ArrowLeft size={16} /> Back to cart</Link>
      <div className="flow-title checkout-page-title">
        <div>
          <p className="eyebrow">ALMOST THERE</p>
          <h1>Checkout</h1>
          <p>Signed in as {currentUser.email}</p>
        </div>
        <ShieldCheck size={30} />
      </div>
      <div className="checkout-layout">
        <form className="checkout-address" onSubmit={placeOrder}>
          <div className="checkout-section-heading">
            <span>1</span>
            <div>
              <h2>Delivery address</h2>
              <p>Where should we deliver your order?</p>
            </div>
            <Link className="manage-address-link" to="/account">Manage saved addresses</Link>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="flow-form address-form">
            <label className="full-span">
              Full name
              <input name="fullName" autoComplete="name" maxLength={80} required value={address.fullName} onChange={updateAddress} />
            </label>
            <label>
              Phone number
              <input name="phone" type="tel" autoComplete="tel" maxLength={20} required value={address.phone} onChange={updateAddress} placeholder="+91 98765 43210" />
            </label>
            <label className="full-span">
              Address line 1
              <input name="addressLine1" autoComplete="address-line1" maxLength={160} required value={address.addressLine1} onChange={updateAddress} placeholder="House number and street" />
            </label>
            <label className="full-span">
              Address line 2 <span className="optional-label">Optional</span>
              <input name="addressLine2" autoComplete="address-line2" maxLength={160} value={address.addressLine2} onChange={updateAddress} placeholder="Apartment, suite, landmark" />
            </label>
            <label>
              City
              <input name="city" autoComplete="address-level2" maxLength={80} required value={address.city} onChange={updateAddress} />
            </label>
            <label>
              State
              <input name="state" autoComplete="address-level1" maxLength={80} required value={address.state} onChange={updateAddress} />
            </label>
            <label>
              Postal code
              <input name="postalCode" autoComplete="postal-code" maxLength={12} required value={address.postalCode} onChange={updateAddress} />
            </label>
          </div>
          <div className="checkout-section-heading payment-heading">
            <span>2</span>
            <div><h2>Payment method</h2><p>Simple, secure payment when your order arrives.</p></div>
          </div>
          <div className="cod-option">
            <span className="cod-radio"><Check size={13} /></span>
            <div><strong>Cash on delivery</strong><p>Pay in cash when your MegaMart order is delivered.</p></div>
            <span className="cod-selected">Selected</span>
          </div>
          <button className="primary-link-button place-order-button" type="submit" disabled={busy}>
            {busy ? 'Placing your order…' : 'Place COD order'}
            {!busy && <ArrowRight size={17} />}
          </button>
          <p className="checkout-terms"><ShieldCheck size={14} /> Your order details are securely saved to your account.</p>
        </form>
        <aside className="order-summary checkout-summary">
          <h2>Order summary</h2>
          {cart.items.map((item) => (
            <div className="checkout-summary-item" key={item.id}>
              <img src={item.image} alt="" />
              <span>{item.name}<small>Qty {item.quantity}</small></span>
              <b>₹{(item.price * item.quantity).toLocaleString('en-IN')}</b>
            </div>
          ))}
          <div><span>Subtotal</span><b>₹{cart.total.toLocaleString('en-IN')}</b></div>
          <div><span>Delivery</span><b className="free-delivery">FREE</b></div>
          <div className="summary-total"><strong>Total due on delivery</strong><strong>₹{cart.total.toLocaleString('en-IN')}</strong></div>
          <p><MapPin size={14} /> Delivery pin code will be confirmed with your address.</p>
        </aside>
      </div>
    </main>
  );
}
