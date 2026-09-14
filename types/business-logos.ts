export type BusinessLogoInput = {
  businessName: string;
  logoUrl: string;
  websiteUrl?: string | null;
  isVisible: boolean;
  sortOrder: number;
};

export type BusinessLogoRow = {
  id: string;
  business_name: string;
  logo_url: string;
  website_url: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PublicBusinessLogo = {
  id: string;
  business_name: string;
  logo_url: string;
  website_url: string | null;
  sort_order: number;
};
