/**
 * ============================================================
 * PHOTO UPLOAD GUIDE
 * ============================================================
 *
 * When ready to replace placeholders with real photos:
 *
 * 1. Upload photos to Cloudinary under these folders:
 *    - tripti-bungalow/photos/no-15/   → Bungalow No. 15 exterior, rooms, lawn, kitchen, etc.
 *    - tripti-bungalow/photos/no-14/   → Bungalow No. 14 exterior, rooms, lawn, BBQ area, etc.
 *    - tripti-bungalow/photos/shared/  → Colony entrance, street view, neighborhood
 *
 * 2. Recommended photo order per bungalow (14 photos):
 *    01 - Exterior front view
 *    02 - Lawn / garden overview
 *    03 - Outdoor seating area
 *    04 - Living room / hall
 *    05 - Bedroom 1
 *    06 - Bedroom 2
 *    07 - Kitchen
 *    08 - Bathroom 1
 *    09 - Bathroom 2
 *    10 - Balcony view
 *    11 - Terrace
 *    12 - Parking area
 *    13 - Night exterior / lighting
 *    14 - BBQ area (No. 14 only) / Additional lawn angle (No. 15)
 *
 * 3. Add Cloudinary URLs to the seed data:
 *    backend/src/seeds/seed.ts → PROPERTIES[].photos array
 *    Then run: cd backend && npm run seed
 *
 * 4. Once seed photos are populated, the frontend automatically
 *    uses property.photos from the API instead of these placeholders.
 * ============================================================
 */

export const PLACEHOLDER_IMAGES_NO_15 = Array.from({ length: 14 }, (_, i) =>
  `https://picsum.photos/seed/bungalow15-${i + 1}/800/500`
);

export const PLACEHOLDER_IMAGES_NO_14 = Array.from({ length: 14 }, (_, i) =>
  `https://picsum.photos/seed/bungalow14-${i + 1}/800/500`
);

export const PLACEHOLDER_IMAGES_HERO = Array.from({ length: 8 }, (_, i) =>
  `https://picsum.photos/seed/hero-${i + 1}/1200/600`
);
