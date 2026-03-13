const BASE = 'https://generate.chghosts.fr';

export default function sitemap() {
  const routes = ['', '/convert', '/compress', '/resize', '/convert-video', '/convert-audio', '/generate', '/password', '/base64', '/units', '/pwa', '/audit'];
  return routes.map((route) => ({
    url: `${BASE}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}
