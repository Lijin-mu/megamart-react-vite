import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { brands, imageUrl } from '../data/storeData.js';
import SectionTitle from './SectionTitle.jsx';

export default function BrandSection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  useEffect(() => {
    if (!emblaApi) return undefined;

    const updateCarouselState = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
      setSnapCount(emblaApi.scrollSnapList().length);
    };

    emblaApi.on('select', updateCarouselState);
    emblaApi.on('reInit', updateCarouselState);
    updateCarouselState();

    return () => {
      emblaApi.off('select', updateCarouselState);
      emblaApi.off('reInit', updateCarouselState);
    };
  }, [emblaApi]);

  return (
    <section className="content-section brand-section" aria-label="Top electronics brands">
      <SectionTitle title="Top" accent="Electronics Brands" />
      <div className="brand-viewport" ref={emblaRef}>
        <div className="brand-grid">
          {brands.map((brand, index) => (
            <article
              className={`brand-card ${brand.tone}`}
              key={brand.name}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${brands.length}`}
            >
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
      </div>
      {snapCount > 1 && (
        <div className="brand-slider-controls" aria-label="Brand carousel controls">
          <button
            className="brand-slider-arrow"
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Previous brand"
          >
            <ChevronLeft />
          </button>
          <div className="slider-dots" aria-label="Choose a brand slide">
            {Array.from({ length: snapCount }, (_, index) => (
              <button
                className={`brand-slider-dot${index === selectedIndex ? ' selected' : ''}`}
                key={index}
                type="button"
                aria-label={`Go to brand slide ${index + 1}`}
                aria-current={index === selectedIndex ? 'true' : undefined}
                onClick={() => emblaApi?.scrollTo(index)}
              />
            ))}
          </div>
          <button
            className="brand-slider-arrow"
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Next brand"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}
