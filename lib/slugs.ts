export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'booking', 'sign-in', 'sign-up', 'onboarding',
  'register', 'master', 'owner', 'dashboard', 'settings',
  'static', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml',
])

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase())
}

export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)
}