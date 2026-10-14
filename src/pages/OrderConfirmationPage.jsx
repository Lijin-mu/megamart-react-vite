import { useEffect, useState } from 'react';
import { Check, PackageCheck } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function OrderConfirmationPage({ currentUser, authReady }) {
  const { orderNumber } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authReady || order) return;
    if (!currentUser) {
      setError('Sign in to view this order.');
      return;
    }
    api.orders()
      .then((result) => {
        const previousOrder = result.orders.find((item) => item.orderNumber === orderNumber);
        if (!previousOrder) {
          setError('We could not find this order in your account.');
          return;
        }
        setOrder(previousOrder);
      })
      .catch((requestError) => setError(requestError.message));
  }, [authReady, currentUser, order, orderNumber]);

  return (
    <main className="container flow-page confirmation-page">
      {error ? (
        <section className="confirmation-card">
          <p className="eyebrow">ORDER LOOKUP</p>
          <h1>We couldn't load this order.</h1>
          <p className="form-error" role="alert">{error}</p>
          <Link className="primary-link-button" to="/account">View your account</Link>
        </section>
      ) : (
        <section className="confirmation-card">
          <div className="confirmation-check"><Check size={30} /></div>
          <p className="eyebrow">THANK YOU FOR SHOPPING WITH US</p>
          <h1>Your order is confirmed!</h1>
          <p className="confirmation-message">
            We’ll prepare your order and deliver it to the address you provided. Pay cash when it arrives.
          </p>
          <div className="confirmation-order-number">
            <span>Order number</span><strong>{order?.orderNumber ?? orderNumber}</strong>
          </div>
          {order && (
            <div className="confirmation-meta">
              <span><PackageCheck size={17} /> {order.items.length} product{order.items.length === 1 ? '' : 's'}</span>
              <strong>₹{order.total.toLocaleString('en-IN')} · Cash on delivery</strong>
            </div>
          )}
          <div className="confirmation-actions">
            <Link className="primary-link-button" to="/products">Continue shopping</Link>
            <Link className="confirmation-account-link" to="/account">View my orders</Link>
          </div>
        </section>
      )}
    </main>
  );
}
