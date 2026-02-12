export interface Property {
  _id: string;
  name: string;
  slug: string;
  description: string;
  ratePerNight: number;       // paise (2500000 = ₹25,000)
  securityDeposit: number;    // paise (500000 = ₹5,000)
  maxGuests: number;
  amenities: string[];
  photos: string[];           // Cloudinary URLs
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight version for listing pages */
export interface PropertyListItem {
  _id: string;
  name: string;
  slug: string;
  ratePerNight: number;
  maxGuests: number;
  photos: string[];           // First photo for card thumbnail
  amenities: string[];
}
