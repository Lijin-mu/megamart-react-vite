import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products } from '../data/storeData.js';
import ProductCard from '../components/ProductCard.jsx';

export default function ProductListingPage({ onAdd }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? 'featured';

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(query),
    );

    if (sort === 'price-low') {
      return [...filtered].sort((a, b) => a.price - b.price);
    }
    if (sort === 'price-high') {
      return [...filtered].sort((a, b) => b.price - a.price);
    }
    return filtered;
  }, [search, sort]);

  function updateParam(name, value) {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(name, value);
    } else {
      nextParams.delete(name);
    }
    setSearchParams(nextParams);
  }

  return (
    <main className="container catalog-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link>
        <span>/</span>
        <span>Smartphones</span>
      </div>
      <div className="catalog-title-row">
        <div>
          <p className="eyebrow">MEGAMART COLLECTION</p>
          <h1>
            Shop <span>Smartphones</span>
          </h1>
          <p className="catalog-subtitle">
            Find your next phone from our latest online deals.
          </p>
        </div>
        <label className="catalog-sort">
          Sort by
          <select
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </label>
      </div>
      {search && (
        <div className="search-summary">
          Search results for <strong>“{search}”</strong>
          <button onClick={() => updateParam('search', '')}>Clear search</button>
        </div>
      )}
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Categories</h2>
          <Link className="filter-category active" to="/products">
            Smartphones <span>{products.length}</span>
          </Link>
          <div className="filter-promo">
            <span>MEGAMART PICKS</span>
            <strong>Smart choices. Better prices.</strong>
            <p>Discover a great deal for every day.</p>
          </div>
        </aside>
        <section className="catalog-results" aria-label="Smartphone products">
          <p className="result-count">
            Showing {visibleProducts.length} of {products.length} products
          </p>
          {visibleProducts.length ? (
            <div className="product-grid catalog-product-grid">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={onAdd}
                />
              ))}
            </div>
          ) : (
            <div className="no-products">
              <h2>No products found</h2>
              <p>Try a different search term.</p>
              <button onClick={() => updateParam('search', '')}>Show all phones</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
