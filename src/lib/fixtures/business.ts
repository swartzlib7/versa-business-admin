// White-label business profile fixture.
// Sample data is intentionally GENERIC so any producer can adopt the template.
// Tone: makers, founders, and people who ship real work — not a consulting brochure.
// Essence aligned to Versa AGi / Unified Global Production Network (uGPN):
// human intention + production, shared across people (and their agents).

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
  name: 'Northstar Works',
  slogan: 'Declare what you will make. Ship it. Share it with the world.',
  logoUrl: '/brand/logo.svg',
  description:
    'A sample workspace for makers, founders, and operators who turn ambition into products, services, and contribution — alone or with a small team of people and AI agents.',
  purpose:
    'Help every individual who wants to build something real — a business, a craft, a service, a contribution to society — move from intention to finished work without losing the human at the center.',
  production:
    'We produce goods, services, and digital offerings; coordinate projects and tasks; and connect local production to customers and collaborators across languages and borders — a practical slice of a Unified Global Production Network.',
  contactEmail: 'hello@example.com',
  contactPhone: '+1 (555) 010-1000',
  address: '100 Market Street, Suite 400, Austin, TX',
  website: 'https://example.com',
};
