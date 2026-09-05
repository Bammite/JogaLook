import { useMemo } from 'react';

/**
 * Safely decodes an SVG from a data URI (utf8 or base64)
 */
function safeDecodeSvgDataUri(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return null;
  const prefixUtf8 = 'data:image/svg+xml;utf8,';
  const prefixBase64 = 'data:image/svg+xml;base64,';

  if (dataUri.startsWith(prefixUtf8)) {
    const rawContent = dataUri.slice(prefixUtf8.length);
    try {
      return decodeURIComponent(rawContent);
    } catch (e) {
      try {
        const sanitized = rawContent.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
        return decodeURIComponent(sanitized);
      } catch (_) {
        return rawContent;
      }
    }
  }

  if (dataUri.startsWith(prefixBase64)) {
    try {
      return atob(dataUri.slice(prefixBase64.length));
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * If the SVG is just wrapping a single raster image without any vector paths or flocking text,
 * extract the direct URL to render it as a standard <img /> tag for maximum performance & compatibility.
 */
function extractImageUrlFromSvg(svgString) {
  if (!svgString || typeof svgString !== 'string') return null;

  // If the SVG has text or vector paths, we want to render the full SVG so flocking/design is visible
  if (/<text[\s>]/i.test(svgString) || /<path[\s>]/i.test(svgString) || /<polygon[\s>]/i.test(svgString)) {
    return null;
  }

  const match = svgString.match(/<image[^>]+(?:href|xlink:href)=["']([^"']+)["']/i);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Prepares an SVG string for inline HTML rendering:
 * - Adds xmlns:xlink if needed
 * - Mirrors href to xlink:href for Safari compatibility
 * - Ensures responsive scaling
 */
function prepareSvgString(svg) {
  let res = svg;
  if (res.includes('<image') && !res.includes('xmlns:xlink')) {
    res = res.replace(/<svg\b/i, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }
  res = res.replace(/<image([^>]*?)\bhref="([^"]+)"(?![^>]*\bxlink:href)/gi, '<image$1href="$2" xlink:href="$2"');

  if (!res.includes('preserveAspectRatio')) {
    res = res.replace(/<svg\b/i, '<svg preserveAspectRatio="xMidYMid meet"');
  }

  // Ensure svg element has width="100%" height="100%"
  if (!res.includes('width="100%"') && !res.includes("width='100%'")) {
    res = res.replace(/<svg\b/i, '<svg width="100%" height="100%"');
  }

  return res;
}

/**
 * Resolves media information from any input:
 * returns { type: 'image', url } | { type: 'svg', svg } | { type: 'empty' }
 */
export function parseJerseyMedia(src, rawSvg) {
  // 1. Raw SVG string passed explicitly
  if (rawSvg && typeof rawSvg === 'string' && rawSvg.trim().startsWith('<svg')) {
    const trimmed = rawSvg.trim();
    const extractedImg = extractImageUrlFromSvg(trimmed);
    if (extractedImg) {
      return { type: 'image', url: extractedImg };
    }
    return { type: 'svg', svg: prepareSvgString(trimmed) };
  }

  if (!src || typeof src !== 'string') {
    return { type: 'empty' };
  }

  const trimmed = src.trim();

  // 2. Direct SVG string inside src
  if (trimmed.startsWith('<svg')) {
    const extractedImg = extractImageUrlFromSvg(trimmed);
    if (extractedImg) {
      return { type: 'image', url: extractedImg };
    }
    return { type: 'svg', svg: prepareSvgString(trimmed) };
  }

  // 3. SVG data URI (utf8 or base64)
  if (trimmed.startsWith('data:image/svg+xml')) {
    const decoded = safeDecodeSvgDataUri(trimmed);
    if (decoded && decoded.trim().startsWith('<svg')) {
      const extractedImg = extractImageUrlFromSvg(decoded.trim());
      if (extractedImg) {
        return { type: 'image', url: extractedImg };
      }
      return { type: 'svg', svg: prepareSvgString(decoded.trim()) };
    }
  }

  // 4. Regular image URL (http, https, data:image/png, /assets/...)
  return { type: 'image', url: trimmed };
}

/**
 * Universal Jersey Preview Component
 * Renders either a native <img> or responsive inline <svg>
 */
export default function JerseyPreview({
  item,
  side = 'front', // 'front' | 'back'
  src,
  rawSvg,
  alt = 'Aperçu maillot',
  className = '',
  style = {}
}) {
  const media = useMemo(() => {
    let effectiveSrc = src;
    let effectiveSvg = rawSvg;

    if (item) {
      if (side === 'front') {
        effectiveSvg = item.svg_front || (item.svg_content && !item.svg_back ? item.svg_content : null);
        effectiveSrc = item.preview_front || item.image;
      } else {
        effectiveSvg = item.svg_back;
        effectiveSrc = item.preview_back || item.preview_front || item.image;
      }
    }

    return parseJerseyMedia(effectiveSrc, effectiveSvg);
  }, [item, side, src, rawSvg]);

  if (media.type === 'svg') {
    return (
      <div
        className={`jersey-preview-svg-host ${className}`}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...style
        }}
        dangerouslySetInnerHTML={{ __html: media.svg }}
      />
    );
  }

  if (media.type === 'image') {
    return (
      <img
        src={media.url}
        alt={alt}
        className={`jersey-preview-img ${className}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          ...style
        }}
        loading="lazy"
        onError={(e) => {
          // Fallback if the image fails to load
          if (item?.image && e.currentTarget.src !== item.image) {
            e.currentTarget.src = item.image;
          }
        }}
      />
    );
  }

  return (
    <div
      className={`jersey-preview-empty ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        color: '#94a3b8',
        fontSize: '1.2rem',
        ...style
      }}
    >
      <span>🎽</span>
    </div>
  );
}
