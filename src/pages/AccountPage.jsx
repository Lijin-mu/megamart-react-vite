import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Home,
  LogOut,
  MapPin,
  PackageCheck,
  UserRound,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

const emptyAddress = {
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
};

function AccountAddressForm({ title, icon: Icon, address, onChange, disabled }) {
  return (
    <fieldset className="saved-address-form" disabled={disabled}>
      <legend><Icon size={18} /> {title}</legend>
      <div className="flow-form address-form">
        <label className="full-span">
          Address line 1
          <input
            autoComplete="address-line1"
            name="addressLine1"
            maxLength={160}
            required
            value={address.addressLine1}
            onChange={onChange}
            placeholder="House number and street"
          />
        </label>
        <label className="full-span">
          Address line 2 <span className="optional-label">Optional</span>
          <input
            autoComplete="address-line2"
            name="addressLine2"
            maxLength={160}
            value={address.addressLine2}
            onChange={onChange}
            placeholder="Apartment, suite, landmark"
          />
        </label>
        <label>
          City
          <input
            autoComplete="address-level2"
            name="city"
            maxLength={80}
            required
            value={address.city}
            onChange={onChange}
          />
        </label>
        <label>
          State
          <input
            autoComplete="address-level1"
            name="state"
            maxLength={80}
            required
            value={address.state}
            onChange={onChange}
          />
        </label>
        <label>
          Postal code
          <input
            autoComplete="postal-code"
            name="postalCode"
            maxLength={12}
            required
            value={address.postalCode}
            onChange={onChange}
          />
        </label>
      </div>
    </fieldset>
  );
}

export default function AccountPage({ currentUser, onUserChange, cart, authReady }) {
  const [mode, setMode] = useState('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState('');
  const [addresses, setAddresses] = useState({
    resident: { ...emptyAddress },
    delivery: { ...emptyAddress },
    sameAsResident: false,
  });
  const [addressesLoaded, setAddressesLoaded] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressMessage, setAddressMessage] = useState('');
  const [savingAddresses, setSavingAddresses] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    api.orders()
      .then((result) => setOrders(result.orders))
      .catch((requestError) => setOrdersError(requestError.message));
    api.accountAddresses()
      .then(({ addresses: savedAddresses }) => {
        setAddresses({
          resident: savedAddresses.resident ?? { ...emptyAddress },
          delivery: savedAddresses.delivery ?? { ...emptyAddress },
          sameAsResident: savedAddresses.sameAsResident,
        });
      })
      .catch((requestError) => setAddressError(requestError.message))
      .finally(() => setAddressesLoaded(true));
  }, [currentUser]);

  function updateAddress(type, event) {
    const { name: field, value } = event.target;
    setAddresses((current) => {
      const resident =
        type === 'resident'
          ? { ...current.resident, [field]: value }
          : current.resident;
      const delivery =
        current.sameAsResident
          ? resident
          : type === 'delivery'
            ? { ...current.delivery, [field]: value }
            : current.delivery;
      return { ...current, resident, delivery };
    });
    setAddressError('');
    setAddressMessage('');
  }

  function setSameAddress(checked) {
    setAddresses((current) => ({
      ...current,
      sameAsResident: checked,
      delivery: checked ? { ...current.resident } : current.delivery,
    }));
    setAddressError('');
    setAddressMessage('');
  }

  async function saveAddresses(event) {
    event.preventDefault();
    setAddressError('');
    setAddressMessage('');
    setSavingAddresses(true);
    try {
      const result = await api.saveAccountAddresses(addresses);
      setAddresses(result.addresses);
      setAddressMessage('Your addresses have been saved.');
    } catch (requestError) {
      setAddressError(requestError.message);
    } finally {
      setSavingAddresses(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result =
        mode === 'register'
          ? await api.register({ name, email, password })
          : await api.login({ email, password });
      onUserChange(result.user);
      navigate(location.state?.from === '/checkout' ? '/checkout' : '/account', {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setError('');
    try {
      await api.logout();
      onUserChange(null);
      setOrders([]);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  if (!authReady) {
    return <main className="container flow-page"><h1>Loading your account…</h1></main>;
  }

  return (
    <main className="container flow-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link><span>/</span><span>My account</span>
      </div>
      {currentUser ? (
        <section className="account-dashboard">
          <div className="account-dashboard-heading">
            <div className="account-avatar"><UserRound size={23} /></div>
            <div>
              <p className="eyebrow">MEGAMART ACCOUNT</p>
              <h1>Welcome, {currentUser.name}</h1>
              <p>{currentUser.email}</p>
            </div>
            <button className="account-logout" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <nav className="account-navigation" aria-label="Account pages">
            <Link className={location.pathname === '/account' ? 'active' : ''} to="/account">
              <UserRound size={16} /> Overview
            </Link>
            <Link className={location.pathname === '/account/addresses' ? 'active' : ''} to="/account/addresses">
              <MapPin size={16} /> Addresses
            </Link>
            <Link className={location.pathname === '/account/orders' ? 'active' : ''} to="/account/orders">
              <PackageCheck size={16} /> Orders
            </Link>
          </nav>
          {location.pathname === '/account/addresses' && (
          <section className="account-panel saved-addresses-panel">
            <div className="account-panel-heading">
              <h2><MapPin size={19} /> Saved addresses</h2>
              <span className="saved-address-caption">Used to speed up checkout</span>
            </div>
            {addressError && <p className="form-error" role="alert">{addressError}</p>}
            {addressMessage && <p className="form-success" role="status">{addressMessage}</p>}
            {!addressesLoaded ? (
              <p className="address-loading">Loading saved addresses…</p>
            ) : (
              <form className="saved-addresses-form" onSubmit={saveAddresses}>
                <AccountAddressForm
                  title="Resident address"
                  icon={Home}
                  address={addresses.resident}
                  onChange={(event) => updateAddress('resident', event)}
                  disabled={savingAddresses}
                />
                <label className="same-address-option">
                  <input
                    type="checkbox"
                    checked={addresses.sameAsResident}
                    onChange={(event) => setSameAddress(event.target.checked)}
                    disabled={savingAddresses}
                  />
                  <span>Use resident address as my delivery address</span>
                </label>
                <AccountAddressForm
                  title="Delivery address"
                  icon={MapPin}
                  address={addresses.delivery}
                  onChange={(event) => updateAddress('delivery', event)}
                  disabled={savingAddresses || addresses.sameAsResident}
                />
                <div className="address-save-row">
                  <p>
                    {addresses.sameAsResident
                      ? 'Delivery address will stay in sync with your resident address.'
                      : 'The delivery address will be prefilled during checkout.'}
                  </p>
                  <button
                    className="primary-link-button address-save-button"
                    type="submit"
                    disabled={savingAddresses || !addressesLoaded}
                  >
                    {savingAddresses ? 'Saving…' : 'Save addresses'}
                  </button>
                </div>
              </form>
            )}
          </section>
          )}
          {location.pathname === '/account/orders' && <div className="account-panel">
            <div className="account-panel-heading">
              <h2><PackageCheck size={20} /> Your orders</h2>
              <Link to="/products">Continue shopping <ArrowRight size={14} /></Link>
            </div>
            {ordersError && <p className="form-error" role="alert">{ordersError}</p>}
            {orders.length === 0 ? (
              <div className="no-orders">
                <p>No orders yet. Your next great deal is waiting.</p>
                <Link to="/products">Explore smartphones</Link>
              </div>
            ) : (
              <div className="order-history">
                {orders.map((order) => (
                  <article className="order-history-item" key={order.id}>
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.items.length} product{order.items.length === 1 ? '' : 's'}</span>
                    </div>
                    <span className="order-status">{order.status}</span>
                    <div className="order-history-total">
                      <strong>₹{order.total.toLocaleString('en-IN')}</strong>
                      <Link to={`/account/orders/${encodeURIComponent(order.orderNumber)}`}>View details <ArrowRight size={13} /></Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>}
          {location.pathname === '/account' && (
            <>
              <section className="account-overview">
                <div className="account-overview-intro">
                  <p className="eyebrow">YOUR MEGAMART</p>
                  <h2>Everything you need, in one place.</h2>
                  <p>Manage your details, keep delivery addresses up to date, and follow your orders.</p>
                </div>
                <div className="account-overview-links">
                  <Link className="account-overview-card" to="/account/addresses">
                    <MapPin size={20} />
                    <strong>Saved addresses</strong>
                    <span>Manage your delivery details</span>
                    <ArrowRight size={16} />
                  </Link>
                  <Link className="account-overview-card" to="/account/orders">
                    <PackageCheck size={20} />
                    <strong>Your orders</strong>
                    <span>{orders.length} order{orders.length === 1 ? '' : 's'} · View tracking and invoices</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </section>
              {ordersError && <p className="form-error" role="alert">{ordersError}</p>}
            </>
          )}
          {location.pathname === '/account' && cart?.totalItems > 0 && (
            <Link className="account-cart-reminder" to="/cart">
              You have {cart.totalItems} item{cart.totalItems === 1 ? '' : 's'} in your cart
              <ArrowRight size={16} />
            </Link>
          )}
        </section>
      ) : (
        <section className="account-layout">
          <aside className="account-promo">
            <span>SHOP SMARTER WITH MEGAMART</span>
            <h1>Your favorites, all in one place.</h1>
            <p>Create an account to keep track of your orders and get through checkout faster.</p>
            <ul>
              <li><PackageCheck size={16} /> Follow your orders</li>
              <li><UserRound size={16} /> Keep your details together</li>
            </ul>
          </aside>
          <div className="account-form-wrap">
            <p className="eyebrow">{mode === 'register' ? 'JOIN MEGAMART' : 'WELCOME BACK'}</p>
            <h2>{mode === 'register' ? 'Create your account' : 'Sign in to your account'}</h2>
            <p className="account-form-hint">
              {mode === 'register' ? 'A few details and you are ready to shop.' : 'Enter your account details to continue.'}
            </p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <form className="flow-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <label>
                  Full name
                  <input
                    autoComplete="name"
                    maxLength={80}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Password
                <input
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  type="password"
                  minLength={mode === 'register' ? 10 : undefined}
                  maxLength={128}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'register' ? 'At least 10 characters' : 'Your password'}
                />
              </label>
              <button className="primary-link-button form-submit" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
                {!busy && <ArrowRight size={17} />}
              </button>
            </form>
            <p className="account-switch">
              {mode === 'register' ? 'Already have an account?' : 'New to MegaMart?'}
              <button
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                }}
              >
                {mode === 'register' ? 'Sign in' : 'Create account'}
              </button>
            </p>
            {location.state?.from === '/checkout' && cart?.totalItems > 0 && (
              <p className="checkout-return-note">
                Your {cart.totalItems} cart item{cart.totalItems === 1 ? '' : 's'} will be here after you sign in.
              </p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
