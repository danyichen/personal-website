import { MetadataRoute } from 'next'
import { projects } from './projects/data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://danyichen.com'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    ...projects.map((p) => ({
      url: `${baseUrl}/projects/${p.id}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.6,
    })),
  ]
}