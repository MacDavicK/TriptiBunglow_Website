export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  nationality: 'indian' | 'foreign';
  idType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
  idNumber?: string;          // Encrypted at rest. Only decrypted for authorized admin.
  idDocumentUrl?: string;     // Cloudinary URL
  dataRetentionExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  nationality: 'indian' | 'foreign';
  idType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
  idNumber?: string;
}
