import { brands, imageUrl } from '../data/storeData.js';
import SectionTitle from './SectionTitle.jsx';

export default function BrandSection() {
  return (
    <section className="content-section brand-section">
      <SectionTitle title="Top" accent="Electronics Brands" />
      <div className="brand-grid">
        {brands.map((brand) => (
          <article className={`brand-card ${brand.tone}`} key={brand.name}>
            <div className="brand-text">
              <span className="brand-label">{brand.name}</span>
              <strong>{brand.brand}</strong>
              <p>UP to 80% OFF</p>
            </div>
            <img
              src={imageUrl(brand.photo, 360)}
              alt={`${brand.brand} phone offer`}
            />
          </article>
        ))}
      </div>
      <div className="slider-dots">
        {Array.from({ length: 7 }, (_, index) => (
          <i key={index} />
        ))}
      </div>
    </section>
  );
}
