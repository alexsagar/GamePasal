import React from 'react';

// Lightweight SEO component without react-helmet (React 19 peer conflict)
// Injects meta tags and JSON-LD via direct DOM updates.
export default function SEO({
  title,
  description,
  keywords,
  canonical,
  robots = 'index, follow',
  jsonLd
}) {
  React.useEffect(() => {
    if (title) document.title = title;

    const ensureTag = (selector, create) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };

    if (description) {
      const el = ensureTag('meta[name="description"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'description');
        return m;
      });
      el.setAttribute('content', description);
    }

    if (keywords) {
      const el = ensureTag('meta[name="keywords"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'keywords');
        return m;
      });
      el.setAttribute('content', keywords);
    }

    if (robots) {
      const el = ensureTag('meta[name="robots"]', () => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'robots');
        return m;
      });
      el.setAttribute('content', robots);
    }

    if (canonical) {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonical);
    }

    // JSON-LD structured data
    let ldScript;
    if (jsonLd) {
      ldScript = document.createElement('script');
      ldScript.type = 'application/ld+json';
      ldScript.text = JSON.stringify(jsonLd);
      document.head.appendChild(ldScript);
    }

    return () => {
      // Remove only the structured data we added on unmount/navigation
      if (ldScript && document.head.contains(ldScript)) {
        document.head.removeChild(ldScript);
      }
    };
  }, [title, description, keywords, canonical, robots, jsonLd]);

  return null;
}


