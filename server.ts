import dns from 'node:dns/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ALLOWED_MEDIA_HOSTS = new Set([
  'open.spotify.com',
  'play.spotify.com',
  'spotify.com',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
  'vimeo.com',
  'www.vimeo.com',
  'bandcamp.com',
  'podcasts.apple.com',
  'music.apple.com',
  'mixcloud.com',
  'www.mixcloud.com',
  'castbox.fm',
  'audiomack.com',
  'deezer.com',
  'www.deezer.com',
  'tidal.com',
  'listen.tidal.com',
  'anchor.fm',
  'podcasters.spotify.com',
  'transistor.fm',
  'archive.org',
  'www.archive.org',
  'radiojavan.com',
  'www.radiojavan.com',
  'play.radiojavan.com',
  'genius.com',
]);

function isHostAllowed(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (ALLOWED_MEDIA_HOSTS.has(lower)) return true;
  if (lower.endsWith('.bandcamp.com')) return true;
  if (lower.endsWith('.transistor.fm')) return true;
  if (lower.endsWith('.podbean.com')) return true;
  if (lower.endsWith('.soundcloud.com')) return true;
  return false;
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    if (lower.startsWith('fe80')) return true;
    if (lower.startsWith('::ffff:')) {
      return isPrivateIp(lower.slice(7));
    }
    return false;
  }
  return true;
}

async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only http and https URLs are permitted');
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || net.isIP(host)) {
    throw new Error('Direct IP and local addresses are blocked');
  }

  if (!isHostAllowed(host)) {
    throw new Error('Host not in supported media metadata allowlist');
  }

  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error('Resolved address is not public');
  }

  return parsed;
}

function sanitizeHttpImageUrl(candidate: string | undefined, baseUrl: URL): string | undefined {
  if (!candidate) return undefined;
  try {
    const resolved = new URL(candidate.trim(), baseUrl);
    if (resolved.protocol !== 'https:' && resolved.protocol !== 'http:') return undefined;
    if (isPrivateIp(resolved.hostname) || resolved.hostname === 'localhost') return undefined;
    return resolved.toString();
  } catch {
    return undefined;
  }
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function extractMetaContent(html: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern1 = new RegExp(
    `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const pattern2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
    'i'
  );
  const match = html.match(pattern1) || html.match(pattern2);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractTitleTag(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
}

function extractYoutubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  }
  if (host.includes('youtube.com')) {
    const v = url.searchParams.get('v');
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
    const parts = url.pathname.split('/').filter(Boolean);
    if ((parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') && parts[1]) {
      return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
    }
  }
  return null;
}

async function fetchWithTimeout(
  targetUrl: string,
  timeoutMs = 4000,
  maxRedirects = 2
): Promise<Response> {
  let currentUrl = targetUrl;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'NAVA-NEGAR-Anthology/1.0 (+https://nava.scribe)',
          Accept: 'application/json, text/html;q=0.9',
        },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || hop === maxRedirects) {
        return response;
      }
      const nextUrl = new URL(location, currentUrl).toString();
      const verified = await assertSafePublicUrl(nextUrl);
      currentUrl = verified.toString();
      continue;
    }

    return response;
  }

  throw new Error('Too many redirects');
}

async function resolveOEmbed(parsed: URL): Promise<{
  title?: string;
  artistOrHost?: string;
  artwork?: string;
  provider?: string;
} | null> {
  const host = parsed.hostname.toLowerCase();
  let oembedEndpoint: string | null = null;
  let provider = 'stream';

  if (host.includes('spotify.com')) {
    oembedEndpoint = `https://open.spotify.com/oembed?url=${encodeURIComponent(parsed.toString())}`;
    provider = 'spotify';
  } else if (host.includes('youtube.com') || host === 'youtu.be') {
    oembedEndpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.toString())}&format=json`;
    provider = 'youtube';
  } else if (host.includes('soundcloud.com')) {
    oembedEndpoint = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(parsed.toString())}`;
    provider = 'soundcloud';
  } else if (host.includes('vimeo.com')) {
    oembedEndpoint = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(parsed.toString())}`;
    provider = 'vimeo';
  }

  if (!oembedEndpoint) return null;

  try {
    const res = await fetchWithTimeout(oembedEndpoint, 4000);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
      provider_name?: string;
    };
    return {
      title: typeof data.title === 'string' ? data.title.trim() : undefined,
      artistOrHost:
        typeof data.author_name === 'string'
          ? data.author_name.trim()
          : typeof data.provider_name === 'string'
            ? data.provider_name.trim()
            : undefined,
      artwork: sanitizeHttpImageUrl(data.thumbnail_url, parsed),
      provider,
    };
  } catch {
    return null;
  }
}

async function resolveOpenGraph(parsed: URL): Promise<{
  title?: string;
  artistOrHost?: string;
  artwork?: string;
} | null> {
  try {
    const res = await fetchWithTimeout(parsed.toString(), 4000);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    // Read up to 180KB of HTML head safely
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      let received = 0;
      while (received < 180_000) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (html.toLowerCase().includes('</head>')) break;
      }
      void reader.cancel().catch(() => {});
    } else {
      html = (await res.text()).slice(0, 180_000);
    }

    const ogImage =
      extractMetaContent(html, 'og:image:secure_url') ||
      extractMetaContent(html, 'og:image') ||
      extractMetaContent(html, 'twitter:image');
    const ogTitle =
      extractMetaContent(html, 'og:title') ||
      extractMetaContent(html, 'twitter:title') ||
      extractTitleTag(html);
    const ogAuthor =
      extractMetaContent(html, 'music:musician_description') ||
      extractMetaContent(html, 'author') ||
      extractMetaContent(html, 'og:site_name');

    return {
      title: ogTitle,
      artistOrHost: ogAuthor,
      artwork: sanitizeHttpImageUrl(ogImage, parsed),
    };
  } catch {
    return null;
  }
}

const metaCache = new Map<
  string,
  { expiresAt: number; payload: Record<string, string | undefined> }
>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.get('/api/media-meta', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
    if (!rawUrl || rawUrl.length > 2048) {
      res.status(400).json({ error: 'A valid media URL is required.' });
      return;
    }

    let parsed: URL;
    try {
      parsed = await assertSafePublicUrl(rawUrl);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unsupported URL' });
      return;
    }

    const cacheKey = parsed.toString();
    const cached = metaCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.json(cached.payload);
      return;
    }

    // Immediate borderless 16:9 YouTube thumbnail (no black letterbox bars)
    const ytId = extractYoutubeId(parsed);
    const ytCleanThumb = ytId ? `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg` : undefined;
    let result: Record<string, string | undefined> = {
      url: cacheKey,
      artwork: ytCleanThumb,
      provider: ytId ? 'youtube' : undefined,
    };

    const oembed = await resolveOEmbed(parsed);
    if (oembed) {
      result = {
        ...result,
        title: oembed.title || result.title,
        artistOrHost: oembed.artistOrHost || result.artistOrHost,
        artwork: ytCleanThumb || oembed.artwork || result.artwork,
        provider: oembed.provider || result.provider,
      };
    }

    if (!result.artwork || !result.title) {
      const og = await resolveOpenGraph(parsed);
      if (og) {
        result = {
          ...result,
          title: result.title || og.title,
          artistOrHost: result.artistOrHost || og.artistOrHost,
          artwork: result.artwork || og.artwork,
        };
      }
    }

    if (metaCache.size >= 500) {
      const oldestKey = metaCache.keys().next().value;
      if (oldestKey) metaCache.delete(oldestKey);
    }
    metaCache.set(cacheKey, {
      expiresAt: Date.now() + 1000 * 60 * 30,
      payload: result,
    });
    res.json(result);
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NAVA-NEGAR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
