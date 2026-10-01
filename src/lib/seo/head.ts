export type SeoInput = {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: 'website' | 'article';
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  if (!href) return;
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function upsertJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | undefined) {
  const id = 'seo-json-ld';
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export function applySeo(input: SeoInput, siteUrl: string) {
  const canonical = input.canonicalPath
    ? `${siteUrl}${input.canonicalPath.startsWith('/') ? input.canonicalPath : `/${input.canonicalPath}`}`
    : `${siteUrl}${window.location.pathname}`;

  document.title = input.title;
  upsertLink('canonical', canonical);

  upsertMeta('name', 'description', input.description);
  upsertMeta('name', 'robots', input.noindex ? 'noindex, nofollow' : 'index, follow');
  upsertMeta('name', 'author', 'Hardik Gupta');

  upsertMeta('property', 'og:title', input.title);
  upsertMeta('property', 'og:description', input.description);
  upsertMeta('property', 'og:url', canonical);
  upsertMeta('property', 'og:type', input.ogType || 'website');
  upsertMeta('property', 'og:image', input.ogImage || `${siteUrl}/logoimage.png`);
  upsertMeta('property', 'og:site_name', 'Stryker Inside');

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', input.title);
  upsertMeta('name', 'twitter:description', input.description);
  upsertMeta('name', 'twitter:image', input.ogImage || `${siteUrl}/logoimage.png`);
  upsertMeta('name', 'twitter:site', '@stryker_inside');
  upsertMeta('name', 'twitter:creator', '@stryker_inside');

  upsertJsonLd(input.jsonLd);
}
