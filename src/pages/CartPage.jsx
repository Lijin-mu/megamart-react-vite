import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartPage({ cart, onUpdateQuantity, onRemove }) {
  if (!cart) {
    return (
      <main className="container flow-page">
        <p className="eyebrow">YOUR MEGAMART BAG</p>
        <h1>Loading your cart…</h1>
      </main>
    );
  }

  return (
    <main className="container flow-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Cart</span>
      </div>
      <div className="flow-title">
        <div>
          <p className="eyebrow">YOUR MEGAMART BAG</p>
          <h1>Your cart</h1>
          <p>{cart.totalItems} item{cart.totalItems === 1 ? '' : 's'} ready for checkout</p>
        </div>
        <ShoppingBag size={30} />
      </div>
      {cart.items.length === 0 ? (
        <section className="empty-cart-page">
          <div className="empty-cart-icon"><ShoppingBag size={28} /></div>
          <h2>Your cart is waiting</h2>
          <p>Explore the latest smartphone deals and find something you love.</p>
          <Link className="primary-link-button" to="/products">Browse smartphones</Link>
        </section>
      ) : (
        <div className="cart-page-layout">
          <section className="cart-page-items" aria-label="Items in your cart">
            {cart.items.map((item) => (
              <article className="cart-page-item" key={item.id}>
                <Link to={`/products/${item.id}`} className="cart-page-image">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-page-item-info">
                  <Link className="cart-page-product-name" to={`/products/${item.id}`}>
                    {item.name}
                  </Link>
                  <p>In stock · Free delivery</p>
                  <button className="remove-cart-item" onClick={() => onRemove(item.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
                <div className="cart-page-item-controls">
                  <strong>₹{item.price.toLocaleString('en-IN')}</strong>
                  <div className="quantity-control">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      aria-label={`Decrease ${item.name} quantity`}
                    ><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      aria-label={`Increase ${item.name} quantity`}
                    ><Plus size={14} /></button>
                  </div>
                </div>
              </article>
            ))}
            <Link className="continue-shopping" to="/products">
              <ArrowRight size={15} /> Continue shopping
            </Link>
          </section>
          <aside className="order-summary">
            <h2>Order summary</h2>
            <div><span>Subtotal</span><b>₹{cart.total.toLocaleString('en-IN')}</b></div>
            <div><span>Delivery</span><b className="free-delivery">FREE</b></div>
            <div className="summary-total">
              <strong>Total</strong><strong>₹{cart.total.toLocaleString('en-IN')}</strong>
            </div>
            <p>Inclusive of all taxes. Pay cash when your order arrives.</p>
            <Link className="primary-link-button checkout-link" to="/checkout">
              Continue to checkout <ArrowRight size={17} />
            </Link>
            <span className="secure-note">Secure checkout · Cash on delivery</span>
          </aside>
        </div>
      )}
    </main>
  );
}
