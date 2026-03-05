import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ImageSlideshowProps {
  images: string[];
  alt: string;
  /** 'hero' = full-width tall banner, 'card' = compact inside a property card */
  variant?: 'hero' | 'card';
  /** Auto-advance interval in ms. Default 5000. Set 0 to disable. */
  interval?: number;
  className?: string;
  /** Content rendered on top of the hero image (headline, CTA). Only used with variant='hero'. */
  overlay?: ReactNode;
}

const SWIPE_THRESHOLD = 50;
const RESUME_DELAY = 3000;

export function ImageSlideshow({
  images,
  alt,
  variant = 'card',
  interval = 5000,
  className,
  overlay,
}: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isPaused = useRef(false);
  const touchStartX = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout>>();
  const isHero = variant === 'hero';

  const slideCount = images.length;

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      setCurrentIndex((index + slideCount) % slideCount);
    },
    [slideCount],
  );

  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

  useEffect(() => {
    if (interval <= 0 || slideCount <= 1) return;
    const id = setInterval(() => {
      if (!isPaused.current) {
        setCurrentIndex((prev) => (prev + 1) % slideCount);
      }
    }, interval);
    return () => clearInterval(id);
  }, [interval, slideCount]);

  const scheduleResume = useCallback(() => {
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      isPaused.current = false;
    }, RESUME_DELAY);
  }, []);

  const handleMouseEnter = () => {
    isPaused.current = true;
  };
  const handleMouseLeave = () => {
    scheduleResume();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isPaused.current = true;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) goNext();
      else goPrev();
    }
    scheduleResume();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goNext();
    }
  };

  useEffect(() => {
    return () => clearTimeout(resumeTimer.current);
  }, []);

  if (slideCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-200 text-gray-400',
          isHero ? 'h-[28rem] md:h-[36rem] w-full' : 'aspect-video w-full rounded-t-xl',
          className,
        )}
      >
        No images
      </div>
    );
  }

  const arrowSize = isHero ? 'h-10 w-10' : 'h-8 w-8';

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'group relative w-full overflow-hidden outline-none',
        isHero ? 'h-[28rem] md:h-[36rem]' : 'aspect-video rounded-t-xl',
        className,
      )}
    >
      {/* Slides */}
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={`${alt} – slide ${i + 1}`}
          loading={i === 0 ? 'eager' : 'lazy'}
          draggable={false}
          aria-hidden={i !== currentIndex}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out',
            i === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0',
          )}
        />
      ))}

      {/* Hero gradient overlay */}
      {isHero && (
        <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}

      {/* Hero overlay content */}
      {isHero && overlay && (
        <div className="absolute bottom-0 left-0 right-0 z-30">{overlay}</div>
      )}

      {/* Nav arrows */}
      {slideCount > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className={cn(
              'absolute left-3 top-1/2 z-20 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/60 focus:outline-none',
              arrowSize,
              isHero ? 'opacity-80' : 'opacity-0 group-hover:opacity-100 md:opacity-0',
            )}
          >
            <ChevronLeft className={isHero ? 'h-6 w-6' : 'h-5 w-5'} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className={cn(
              'absolute right-3 top-1/2 z-20 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/40 text-white transition-opacity hover:bg-black/60 focus:outline-none',
              arrowSize,
              isHero ? 'opacity-80' : 'opacity-0 group-hover:opacity-100 md:opacity-0',
            )}
          >
            <ChevronRight className={isHero ? 'h-6 w-6' : 'h-5 w-5'} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {slideCount > 1 && (
        <div
          className={cn(
            'absolute left-1/2 z-30 flex -translate-x-1/2 gap-2',
            isHero ? 'bottom-28 md:bottom-36' : 'bottom-3',
          )}
        >
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                'h-2.5 w-2.5 rounded-full transition-colors',
                isHero
                  ? i === currentIndex
                    ? 'bg-white'
                    : 'bg-white/50 hover:bg-white/80'
                  : i === currentIndex
                    ? 'bg-indigo-600'
                    : 'bg-gray-300 hover:bg-gray-400',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
