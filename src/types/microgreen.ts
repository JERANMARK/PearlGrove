export interface Microgreen {
  id: string;
  name: string;
  notes?: string;
  description: string;
  bestSuitedFor: string[];
  profile: string[];
  image: string;
  price?: number;
  discountPrice?: number | null;
  stock?: number;
  isAvailable?: boolean;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
}

export type FlavorProfile = 'Mild' | 'Sweet' | 'Peppery' | 'Colourful';

export interface EnquiryFormData {
  name: string;
  phone: string;
  businessType: string;
  selectedVarieties: string[];
  message: string;
}