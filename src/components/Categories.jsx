import { useState } from 'react';
import { categories, imageUrl } from '../data/storeData.js';
import SectionTitle from './SectionTitle.jsx';

export default function Categories() {
  const [selected, setSelected] = useState('Mobile');

  return (
    <section className="content-section categories-section">
      <SectionTitle title="Shop From" accent="Top Categories" />
      <div className="category-circles">
        {categories.map(([name, image]) => (
          <button
            className={`category-item ${selected === name ? 'selected' : ''}`}
            key={name}
            onClick={() => setSelected(name)}
          >
            <span className="category-circle">
              <img src={imageUrl(image, 240)} alt="" />
            </span>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
