import { useState } from 'react';
import { ArrowLeft, Check, ShoppingCart, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { products } from '../data/storeData.js';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductDetailPage({ onAdd }) {
  const { productId } = useParams();
  const product = products.find((item) => item.id === productId);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="container not-found-page">
        <p className="eyebrow">PRODUCT NOT FOUND</p>
        <h1>We couldn't find that product.</h1>
        <Link className="primary-link-button" to="/products">
          Browse smartphones
        </Link>
      </main>
    );
  }

  const relatedProducts = products.filter((item) => item.id !== product.id).slice(0, 4);

  function addToCart() {
    onAdd(product);
    setAdded(true);
  }

  return (
    <main className="container detail-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/products">Smartphones</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <Link className="back-link" to="/products">
        <ArrowLeft size={16} /> Back to smartphones
      </Link>
      <section className="detail-panel">
        <div className="detail-image-wrap">
          <span className="discount detail-discount">{product.tag}</span>
          <img className="detail-image" src={product.image} alt={product.name} />
        </div>
        <div className="detail-info">
          <p className="eyebrow">MEGAMART SMARTPHONES</p>
          <h1>{product.name}</h1>
          <div className="detail-rating" aria-label="Rated 4.8 out of 5">
            <span>★★★★★</span> <b>4.8</b> <span className="rating-reviews">· 126 reviews</span>
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="detail-price">
            <strong>₹{product.price.toLocaleString('en-IN')}</strong>
            <del>₹{product.old.toLocaleString('en-IN')}</del>
            <span>Save {product.save}</span>
          </div>
          <p className="tax-note">Inclusive of all taxes</p>
          <div className="detail-feature">
            <Check size={17} /> Genuine product with manufacturer warranty
          </div>
          <div className="detail-feature">
            <Truck size={17} /> Free delivery on this order
          </div>
          <div className="detail-storage">
            <span>Storage</span>
            <strong>{product.storage}</strong>
          </div>
          <button className="detail-add-button" onClick={addToCart}>
            {added ? <Check size={19} /> : <ShoppingCart size={19} />}
            {added ? 'Added to cart' : 'Add to cart'}
          </button>
          <p className="delivery-note">Delivery to <strong>423651</strong> · Check availability at checkout</p>
        </div>
      </section>
      <section className="detail-description-card">
        <h2>Product details</h2>
        <p>{product.description}</p>
        <dl>
          <div>
            <dt>Category</dt>
            <dd>Smartphones</dd>
          </div>
          <div>
            <dt>Storage</dt>
            <dd>{product.storage}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>In stock</dd>
          </div>
        </dl>
      </section>
      <section className="content-section related-products">
        <div className="section-heading">
          <h2>
            You may also <span>like</span>
          </h2>
        </div>
        <div className="product-grid">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard
              key={relatedProduct.id}
              product={relatedProduct}
              onAdd={onAdd}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
