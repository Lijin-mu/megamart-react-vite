import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { imageUrl } from '../data/storeData.js';

const slides = [
  {
    caption: 'Best Deal Online on smart watches',
    title: 'SMART WEARABLE.',
    image: 'photo-1523275335684-37898b6baf30',
    alt: 'Smart watch offer',
  },
  {
    caption: 'Explore the latest in mobile technology',
    title: 'SMART PHONES.',
    image: 'photo-1511707171634-5f897ff02aa9',
    alt: 'Smartphone offer',
  },
  {
    caption: 'Great prices on your everyday favorites',
    title: 'EVERYDAY DEALS.',
    image: 'photo-1542838132-92c53300491e',
    alt: 'Fresh everyday essentials',
  },
];

export default function Hero() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return undefined;

    const updateSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', updateSelectedIndex);
    updateSelectedIndex();
    return () => emblaApi.off('select', updateSelectedIndex);
  }, [emblaApi]);

  return (
    <section className="hero" aria-label="Featured deals" aria-roledescription="carousel">
      <div className="hero-viewport" ref={emblaRef}>
        <div className="hero-slides">
          {slides.map((slide, index) => (
            <article
              className="hero-slide"
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${slides.length}`}
            >
              <div className="hero-copy">
                <p>{slide.caption}</p>
                <h1>{slide.title}</h1>
                <h3>UP to 80% OFF</h3>
              </div>
              <img className="hero-watch" src={imageUrl(slide.image, 700)} alt={slide.alt} />
            </article>
          ))}
        </div>
      </div>
      <div className="dots hero-dots" aria-label="Choose a slide">
        {slides.map((slide, index) => (
          <button
            className={`hero-dot${index === selectedIndex ? ' selected' : ''}`}
            key={slide.title}
            type="button"
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === selectedIndex ? 'true' : undefined}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
      <button
        className="hero-arrow left"
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        aria-label="Previous slide"
      >
        <ChevronLeft />
      </button>
      <button
        className="hero-arrow right"
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        aria-label="Next slide"
      >
        <ChevronRight />
      </button>
    </section>
  );
}
