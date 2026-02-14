export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  nationality: 'indian' | 'foreign';
  idType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
  idNumber?: string;          // Encrypted at rest. Only decrypted for authorized admin.
  address?: string;
  aadhaarDocumentUrl?: string;
  idDocumentUrl?: string;     // Legacy; prefer aadhaarDocumentUrl
  dataRetentionExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  nationality: 'indian' | 'foreign';
  idType?: 'aadhaar' | 'passport' | 'driving_license' | 'voter_id';
  idNumber?: string;
  aadhaarDocumentUrl?: string;
}
