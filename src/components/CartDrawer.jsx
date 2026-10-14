import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';

export default function CartDrawer({ cart, total, onClose, onRemove, onUpdateQuantity }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <aside className="cart-panel" onClick={(event) => event.stopPropagation()}>
        <div className="cart-head">
          <h2>Your cart ({cart.length})</h2>
          <button onClick={onClose} aria-label="Close cart">
            <X />
          </button>
        </div>
        {cart.length === 0 ? (
          <p className="empty-cart">Your cart is empty. Add a product to get started.</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((product) => (
                <div className="cart-item" key={product.id}>
                  <img src={product.image} alt={product.name} />
                  <div>
                    <b>{product.name}</b>
                    <p>₹{product.price.toLocaleString('en-IN')} each</p>
                    <div className="drawer-quantity">
                      <button
                        onClick={() => onUpdateQuantity(product.id, product.quantity - 1)}
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        <Minus size={12} />
                      </button>
                      <span>{product.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(product.id, product.quantity + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemove(product.id)}
                    aria-label={`Remove ${product.name} from cart`}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-total">
              <span>Total</span>
              <b>₹{total.toLocaleString('en-IN')}</b>
            </div>
            <Link className="checkout drawer-checkout" to="/checkout" onClick={onClose}>
              Proceed to checkout
            </Link>
            <Link className="drawer-view-cart" to="/cart" onClick={onClose}>
              View cart
            </Link>
          </>
        )}
      </aside>
    </div>
  );
}
