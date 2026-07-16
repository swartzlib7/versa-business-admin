// White-label business profile fixture.
// Each customer customizes this to represent their business on the public site.

export interface BusinessProfile {
  name: string;
  slogan: string;
  logoUrl: string;
  description: string;
  purpose: string;
  production: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website: string;
}

export const business: BusinessProfile = {
  name: 'Versa Voice AI',
  slogan: 'AI-powered business operations, beautifully orchestrated.',
  logoUrl: '/brand/logo.svg',
  description:
    'We help businesses integrate AI agents into their daily operations — from project management and task coordination to knowledge management and customer engagement.',
  purpose:
    'Our mission is to make AI collaboration accessible, practical, and beautiful for every business. We build tools that bridge the gap between human creativity and AI capability.',
  production:
    'We produce custom AI agent workflows, voice-enabled business systems, and integrated mission control dashboards for businesses of all sizes.',
  contactEmail: 'hello@versavoice.ai',
  contactPhone: '+1 (555) 010-2025',
  address: 'Johannesburg, South Africa',
  website: 'https://versavoice.ai',
};
