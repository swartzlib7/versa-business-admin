// White-label business profile fixture.
// VBA public facet template — generic placeholder content any business can adopt.
// Replace this profile with your own brand and contact details.

export interface BusinessProfile {
  name: string;
  slogan: string;
  tagline: string;
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
  name: 'Versa AGi',
  slogan: 'Agentic General infrastructure',
  tagline: '- built to fulfill expectations -',
  logoUrl: '/brand/logo.svg',
  description:
    'Versa - Business Admin brings your projects, operations, customer support, integrations, and knowledge into a single dashboard — so every part of the business is visible and connected.',
  purpose:
    'Give teams a single pane of glass to plan work, serve customers, and keep the business running smoothly.',
  production:
    'Projects, tasks, support tickets, metrics, integrations, and a searchable knowledge base — all in one template, ready to customize.',
  contactEmail: 'hello@example.com',
  contactPhone: '+1 (555) 010-1000',
  address: '100 Market Street, Suite 400, Austin, TX',
  website: 'https://example.com',
};
