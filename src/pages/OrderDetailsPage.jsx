import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Download, PackageCheck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { downloadInvoice } from '../lib/invoice.js';

const trackingSteps = [
  { key: 'confirmed', label: 'Order confirmed' },
  { key: 'preparing', label: 'Preparing your order' },
  { key: 'out_for_delivery', label: 'Out for delivery' },
  { key: 'delivered', label: 'Delivered' },
];

function trackingIndex(status) {
  const normalized = String(status).toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (normalized === 'delivered') return 3;
  if (normalized === 'out_for_delivery' || normalized === 'shipped') return 2;
  if (normalized === 'preparing' || normalized === 'processing') return 1;
  return 0;
}

export default function OrderDetailsPage({ currentUser, authReady }) {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setOrder(null);
    setError('');
    if (!authReady) return () => { cancelled = true; };
    if (!currentUser) {
      setError('Sign in to view this order.');
      return () => { cancelled = true; };
    }

    api.orders()
      .then(({ orders }) => {
        if (cancelled) return;
        const match = orders.find((item) => item.orderNumber === orderNumber);
        if (match) setOrder(match);
        else setError('We could not find this order in your account.');
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message);
      });
    return () => { cancelled = true; };
  }, [authReady, currentUser, orderNumber]);

  if (!authReady || (!order && !error)) {
    return <main className="container flow-page"><h1>Loading order details…</h1></main>;
  }

  if (error) {
    return (
      <main className="container flow-page">
        <section className="account-panel order-detail-error">
          <h1>We couldn't load this order.</h1>
          <p className="form-error" role="alert">{error}</p>
          <Link className="back-link" to="/account/orders"><ArrowLeft size={15} /> Back to orders</Link>
        </section>
      </main>
    );
  }

  const activeStep = trackingIndex(order.status);
  const address = order.address;
  return (
    <main className="container flow-page order-detail-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link><span>/</span><Link to="/account">My account</Link>
        <span>/</span><Link to="/account/orders">Orders</Link><span>/</span><span>{order.orderNumber}</span>
      </div>
      <div className="order-detail-heading">
        <div>
          <p className="eyebrow">ORDER DETAILS</p>
          <h1>{order.orderNumber}</h1>
          <p>Placed {new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
        <button className="primary-link-button invoice-download" onClick={() => downloadInvoice(order)}>
          <Download size={16} /> Download invoice
        </button>
      </div>
      <section className="account-panel order-tracking-panel">
        <div className="account-panel-heading">
          <h2><PackageCheck size={20} /> Tracking progress</h2>
          <span className="order-status">{order.status}</span>
        </div>
        <div className="tracking-steps">
          {trackingSteps.map((step, index) => (
            <div className={`tracking-step ${index <= activeStep ? 'complete' : ''}`} key={step.key}>
              <span className="tracking-step-icon">{index <= activeStep ? <Check size={14} /> : index + 1}</span>
              <strong>{step.label}</strong>
            </div>
          ))}
        </div>
        <p className="tracking-note">We’ll update this timeline as your order progresses.</p>
      </section>
      <div className="order-detail-layout">
        <section className="account-panel order-detail-items">
          <div className="account-panel-heading"><h2>Items in this order</h2></div>
          {order.items.map((item) => (
            <div className="order-detail-item" key={item.productId}>
              <div><strong>{item.name}</strong><span>Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')}</span></div>
              <strong>₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}</strong>
            </div>
          ))}
          <div className="order-detail-total"><span>Order total</span><strong>₹{order.total.toLocaleString('en-IN')}</strong></div>
        </section>
        <aside className="account-panel order-delivery-panel">
          <h2>Delivery & payment</h2>
          <strong>{address.fullName}</strong>
          <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}<br />
            {address.city}, {address.state} {address.postalCode}<br />{address.phone}</p>
          <span>Cash on delivery</span>
        </aside>
      </div>
      <Link className="back-link order-detail-back" to="/account/orders"><ArrowLeft size={15} /> Back to orders</Link>
    </main>
  );
}
