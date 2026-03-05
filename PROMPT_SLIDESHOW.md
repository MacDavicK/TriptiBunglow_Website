# FRONTEND PROMPT — Image Slideshow (Cursor Agent)

> **Scope:** 2 new files, 2 modified files. Zero new dependencies.
> **Acceptance:** `npx tsc --noEmit && npm run build` — zero errors

---

## CONTEXT

This is the `frontend/` of a MERN booking system for two vacation bungalows. The existing codebase uses React 18 + TypeScript + Tailwind CSS 3 + lucide-react icons. Study the existing `components/ui/` patterns (Card.tsx, Button.tsx) before writing — match their style exactly: named exports, `cn()` from `@/utils/cn`, Tailwind-only styling.

**No new npm dependencies.** Use only what's already in package.json. CSS transitions + React state for all animation. Touch events via native React handlers.

---

## TASK 1: Create `ImageSlideshow` component

**Create:** `frontend/src/components/ui/ImageSlideshow.tsx`

### Props interface:

```typescript
export interface ImageSlideshowProps {
  images: string[];
  alt: string;
  /** 'hero' = full-width tall banner, 'card' = compact inside a property card */
  variant?: 'hero' | 'card';
  /** Auto-advance interval in ms. Default 5000. Set 0 to disable. */
  interval?: number;
  className?: string;
  /** Content rendered on top of the hero image (headline, CTA). Only used with variant='hero'. */
  overlay?: React.ReactNode;
}
```

### Behavior requirements:

1. **Auto-play:** advances every `interval` ms. Pauses on hover (desktop) and on touch (mobile). Resumes 3s after interaction ends.
2. **Swipe:** native touch events (touchstart/touchmove/touchend). Swipe left = next, swipe right = prev. Threshold: 50px.
3. **Arrows:** left/right chevrons from `lucide-react` (`ChevronLeft`, `ChevronRight`). Visible on hover (desktop) or always visible on mobile. Positioned absolutely on left/right edges, vertically centered. Semi-transparent dark background circle, white icon. Size: hero = `h-10 w-10`, card = `h-8 w-8`.
4. **Dots:** row of small circles below the image (inside the component). Active dot = filled indigo-600, inactive = gray-300 with hover highlight. Clicking a dot jumps to that slide.
5. **Keyboard:** when the carousel is focused (tabIndex=0), ArrowLeft/ArrowRight navigate slides.
6. **Transition:** CSS `transition-opacity duration-700 ease-in-out` crossfade between slides. No horizontal sliding — simple opacity fade. Current slide = `opacity-100 z-10`, all others = `opacity-0 z-0`.
7. **Empty state:** if `images` is empty, show a centered gray placeholder div with "No images" text.
8. **Accessibility:** `role="region"`, `aria-roledescription="carousel"`, `aria-label={alt}`, each slide has `aria-hidden` when not current.
9. **Image loading:** first image = `loading="eager"`, rest = `loading="lazy"`. All `draggable={false}`, `object-cover`.

### Visual specs per variant:

**`hero`:**
- Height: `h-[28rem] md:h-[36rem]`, full width
- Dark gradient overlay on bottom: `bg-gradient-to-t from-black/60 via-black/20 to-transparent` — always present so overlay text is readable
- The `overlay` ReactNode is rendered on top of the gradient, positioned `absolute bottom-0 left-0 right-0 z-30` with padding
- Dots are white (not indigo) for contrast, positioned at the bottom above the overlay
- Arrows are slightly larger with more opacity
- No rounded corners (full bleed)

**`card`:**
- `aspect-video w-full`, rounded top corners (`rounded-t-xl`) to match Card component
- No gradient overlay, no overlay prop rendering
- Standard indigo dots below the image
- Arrows appear on hover only (use `group` + `opacity-0 group-hover:opacity-100` pattern)

---

## TASK 2: Update `HomePage.tsx`

**File:** `frontend/src/pages/HomePage.tsx`

### Changes:

1. **Import** `ImageSlideshow` from `@/components/ui/ImageSlideshow`.

2. **Define hero images array** at the top of the file (temporary hardcoded URLs — these will come from the API later):

```typescript
// TODO: Replace with dynamic images from API when property photos are uploaded
const HERO_IMAGES: string[] = [
  // Populate with actual Cloudinary URLs once photos are uploaded.
  // For now, leave empty — the component handles the empty state gracefully.
];
```

3. **Replace the entire hero `<section>`** (the one with the `<h1>` and "View Properties" button) with the `ImageSlideshow` in hero mode:

```tsx
<ImageSlideshow
  images={HERO_IMAGES}
  alt="Tripti and Spandan Bungalows"
  variant="hero"
  interval={6000}
  overlay={
    <div className="px-6 pb-12 pt-4 text-center md:pb-16">
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg md:text-5xl">
        Vacation Bungalows in Thane
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 drop-shadow md:text-lg">
        Two spacious bungalows with large lawns, fully equipped kitchens,
        and room for up to 50 guests. Perfect for family gatherings, parties, and weekend getaways.
      </p>
      <Link
        to="/property/tripti-bungalow"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
      >
        View Properties
      </Link>
    </div>
  }
/>
```

Note the design change: white text + white CTA button on dark gradient, instead of the current dark-on-light hero. This is intentional for the slideshow overlay to look professional.

4. **Replace the property card image area** — inside the `.map()` that renders property cards, replace the current `<div className="aspect-video bg-gray-200">` block (which shows `property.photos?.[0]` or "No image") with:

```tsx
<ImageSlideshow
  images={property.photos ?? []}
  alt={property.name}
  variant="card"
  interval={0}  /* No auto-play for cards — user swipes/clicks manually */
/>
```

Set `interval={0}` for cards so they don't all animate independently (that would be chaotic). User can still swipe or use arrows.

5. **Keep everything else unchanged** — the property name, price, amenities badges, and "Book Now" button below the card slideshow remain exactly as they are.

---

## TASK 3: Update `PropertyPage.tsx`

**File:** `frontend/src/pages/PropertyPage.tsx`

Replace the single hero image block at the top:

```tsx
<div className="aspect-video max-h-96 w-full overflow-hidden rounded-xl bg-gray-200">
  {property.photos?.[0] ? (
    <img src={property.photos[0]} ... />
  ) : (
    <div ...>No image</div>
  )}
</div>
```

With:

```tsx
<ImageSlideshow
  images={property.photos ?? []}
  alt={property.name}
  variant="card"
  interval={5000}
  className="max-h-96 rounded-xl"
/>
```

Import `ImageSlideshow` at the top of the file.

---

## FILES CHANGED SUMMARY

| # | File | Action |
|---|------|--------|
| 1 | `frontend/src/components/ui/ImageSlideshow.tsx` | **Created** — reusable slideshow component |
| 2 | `frontend/src/pages/HomePage.tsx` | Modified — hero slideshow + card slideshows |
| 3 | `frontend/src/pages/PropertyPage.tsx` | Modified — property detail slideshow |

---

## VERIFICATION

```bash
cd frontend
npx tsc --noEmit       # Zero errors
npm run build          # Builds successfully
npm run dev            # Open in browser
```

**Visual checks:**
1. HomePage hero: shows "No images" placeholder gracefully (until real photos are added). Overlay text is still visible and styled.
2. HomePage cards: each card shows a slideshow with arrows on hover, dots below. No auto-play.
3. PropertyPage: slideshow auto-plays every 5s, swipeable on mobile, arrows + dots work.
4. Resize to 375px mobile width: everything remains usable, arrows visible, swipe works.
5. Focus the carousel with Tab key, press ArrowLeft/ArrowRight — slides navigate.
