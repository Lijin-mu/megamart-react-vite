import { useState } from 'react';
import SectionTitle from './SectionTitle.jsx';

export default function Categories({ categories }) {
  const [selected, setSelected] = useState('Mobile');

  return (
    <section className="content-section categories-section">
      <SectionTitle title="Shop From" accent="Top Categories" />
      <div className="category-circles">
        {categories.map(({ id, name, image }) => (
          <button
            className={`category-item ${selected === name ? 'selected' : ''}`}
            key={id}
            onClick={() => setSelected(name)}
          >
            <span className="category-circle">
              <img src={image} alt="" />
            </span>
            <span>{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
