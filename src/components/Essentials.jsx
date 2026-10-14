import { essentials, imageUrl } from '../data/storeData.js';
import SectionTitle from './SectionTitle.jsx';

export default function Essentials() {
  return (
    <section className="content-section essentials-section">
      <SectionTitle title="Daily" accent="Essentials" />
      <div className="essentials-grid">
        {essentials.map(([name, image]) => (
          <article className="essential-card" key={name}>
            <div className="essential-image">
              <img src={imageUrl(image, 280)} alt={name} />
            </div>
            <p>{name}</p>
            <strong>UP to 50% OFF</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
