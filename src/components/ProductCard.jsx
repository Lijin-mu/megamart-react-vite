import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <Link className="product-card-link" to={`/products/${product.id}`}>
        <div className="product-image">
          <img src={product.image} alt={product.name} />
          <span className="discount">{product.tag}</span>
        </div>
        <div className="product-info">
          <h3>{product.name}</h3>
          <div className="prices">
            <b>₹{product.price.toLocaleString('en-IN')}</b>
            <del>₹{product.old.toLocaleString('en-IN')}</del>
          </div>
          <div className="save-row">
            <span>Save - {product.save}</span>
          </div>
        </div>
      </Link>
      <button
        className="product-add"
        aria-label={`Add ${product.name} to cart`}
        onClick={() => onAdd(product)}
      >
        <Plus size={14} />
        Add
      </button>
    </article>
  );
}
