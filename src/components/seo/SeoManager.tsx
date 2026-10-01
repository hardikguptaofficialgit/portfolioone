import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';
import {
  AUTHOR_GITHUB,
  AUTHOR_LINKEDIN,
  AUTHOR_NAME,
  AUTHOR_X,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
} from '@/lib/seo/site-config';

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: AUTHOR_NAME,
  alternateName: 'Stryker',
  url: SITE_URL,
  email: CONTACT_EMAIL,
  jobTitle: 'Software Engineer',
  sameAs: [AUTHOR_GITHUB, AUTHOR_LINKEDIN, AUTHOR_X],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  author: { '@type': 'Person', name: AUTHOR_NAME },
};

export function SeoManager() {
  const { pathname } = useLocation();

  const seo = useMemo(() => {
    if (pathname.startsWith('/blogs/') && pathname !== '/blogs/') {
      return null;
    }

    if (pathname === '/') {
      return {
        title: `${SITE_NAME} | ${SITE_TAGLINE}`,
        description: DEFAULT_DESCRIPTION,
        canonicalPath: '/',
        jsonLd: [personJsonLd, websiteJsonLd],
      };
    }

    if (pathname === '/blogs' || pathname === '/blog') {
      return {
        title: `Blog | ${SITE_NAME}`,
        description:
          'Technical writing by Hardik Gupta on full-stack engineering, AI agents, observability, SaaS architecture, and shipping products.',
        canonicalPath: '/blogs',
      };
    }

    if (pathname === '/desktop') {
      return {
        title: `Interactive Desktop | ${SITE_NAME}`,
        description:
          'Windows-inspired interactive portfolio desktop by Hardik Gupta — apps, widgets, and experiments in the browser.',
        canonicalPath: '/desktop',
      };
    }

    if (pathname === '/dooms') {
      return {
        title: `Dooms Waitlist | ${SITE_NAME}`,
        description: 'Join the waitlist for Dooms — a project by Hardik Gupta.',
        canonicalPath: '/dooms',
        noindex: true,
      };
    }

    return {
      title: `Page not found | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      noindex: true,
    };
  }, [pathname]);

  useSeo(seo ? { ...seo, ogImage: DEFAULT_OG_IMAGE } : null);

  return null;
}
