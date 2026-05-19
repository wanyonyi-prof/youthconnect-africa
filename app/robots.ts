import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/auth/*', '/login', '/signup'],
    },
    sitemap: 'https://youthconnect-africa.vercel.app/sitemap.xml',
  }
}