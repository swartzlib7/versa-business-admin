// White-label business profile fixture.
// Sample data is intentionally GENERIC so any business can adopt the template.
// Customers replace this profile with their own brand and contact details.

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
  name: 'Northstar Consulting Group',
  slogan: 'Clarity, structure, and results for growing teams.',
  logoUrl: '/brand/logo.svg',
  description:
    'We help organizations plan work, serve customers, and keep teams aligned — with clear processes, practical tools, and people who care about outcomes.',
  purpose:
    'Our purpose is to make everyday business operations simpler and more reliable so leaders can focus on customers and growth.',
  production:
    'We deliver consulting engagements, managed service packages, and ready-to-use operational playbooks for small and mid-size businesses.',
  contactEmail: 'hello@example.com',
  contactPhone: '+1 (555) 010-1000',
  address: '100 Market Street, Suite 400, Austin, TX',
  website: 'https://example.com',
};
