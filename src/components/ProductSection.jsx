import { products } from '../data/storeData.js';
import SectionTitle from './SectionTitle.jsx';
import ProductCard from './ProductCard.jsx';

export default function ProductSection({ onAdd }) {
  return (
    <section className="content-section">
      <SectionTitle title="Grab the best deal on" accent="Smartphones" to="/products" />
      <div className="product-grid">
        {products.slice(0, 5).map((product) => (
          <ProductCard key={product.id} product={product} onAdd={onAdd} />
        ))}
      </div>
    </section>
  );
}
