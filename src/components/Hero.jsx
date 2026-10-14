import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imageUrl } from '../data/storeData.js';

const slides = ['SMART WEARABLE.', 'SMART PHONES.', 'EVERYDAY DEALS.'];

export default function Hero() {
  const [slide, setSlide] = useState(0);

  return (
    <section className="hero">
      <button
        className="hero-arrow left"
        onClick={() => setSlide((slide + slides.length - 1) % slides.length)}
        aria-label="Previous slide"
      >
        <ChevronLeft />
      </button>
      <div className="hero-copy">
        <p>Best Deal Online on smart watches</p>
        <h1>{slides[slide]}</h1>
        <h3>UP to 80% OFF</h3>
        <div className="dots">
          {slides.map((_, index) => (
            <span className={index === slide ? 'selected' : ''} key={index} />
          ))}
        </div>
      </div>
      <img
        className="hero-watch"
        src={imageUrl('photo-1523275335684-37898b6baf30', 700)}
        alt="Smart watch offer"
      />
      <button
        className="hero-arrow right"
        onClick={() => setSlide((slide + 1) % slides.length)}
        aria-label="Next slide"
      >
        <ChevronRight />
      </button>
    </section>
  );
}
