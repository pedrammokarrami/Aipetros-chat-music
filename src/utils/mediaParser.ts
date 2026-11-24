import type { AudioSynthPreset, MediaAttachment, MediaProvider } from '../types';

const URL_REGEX = /(https?:\/\/[^\s<>"']+|nava\.scribe\/[^\s<>"']+)/gi;

const ARTWORK_BY_PRESET: Record<AudioSynthPreset, string> = {
  santur: '/src/assets/images/album_rumi_santur_1795530694474.jpg',
  jazz: '/src/assets/images/album_midnight_jazz_1795530697266.jpg',
  podcast: '/src/assets/images/album_podcast_archive_1795530696326.jpg',
  guitar: '/src/assets/images/album_classic_rock_1795530694071.jpg',
};

const DEFAULT_LINER_NOTES: Record<AudioSynthPreset, string[]> = {
  santur: [
    '00:00 — Opening dastgah drone in warm walnut resonance.',
    '00:48 — Hammered dulcimer motif unfolds in gentle 6/8 cadence.',
    '01:45 — Reed flute (ney) enters with whispered couplets from the anthology.',
    '03:10 — Return to the courtyard silence as the overtones fade.',
  ],
  jazz: [
    '00:00 — Needle drops on 33 RPM mono pressing; warm tube floor rises.',
    '00:36 — Tenor saxophone states the nocturnal theme over brushed snare.',
    '02:04 — Upright bass solo anchored in modal minor-ninth harmonies.',
    '04:15 — Final brass chord lingers in candlelit room acoustics.',
  ],
  podcast: [
    '00:00 — Chapter I: Archival introduction and field recording excerpt.',
    '06:15 — Chapter II: Preserving magnetic cassettes via peer-to-peer relays.',
    '14:40 — Chapter III: Listener marginalia & live salon commentary.',
    '24:00 — Closing notes & recommended companion manuscripts.',
  ],
  guitar: [
    '00:00 — Quarter-inch analog tape hiss and spring reverb swell.',
    '01:12 — Hollow-body arpeggio builds over steady vintage percussion.',
    '03:05 — Extended modal improvisation driven through warm vacuum tubes.',
    '05:40 — Tape saturation taper into the final harmonic chord.',
  ],
};

export function isSafeHttpUrl(raw: string | undefined): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractYoutubeVideoId(rawUrl: string): string | null {
  try {
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const candidate = parsed.pathname.split('/').filter(Boolean)[0];
      return candidate && /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
    }
    if (host.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') && parts[1]) {
        return /^[a-zA-Z0-9_-]{11}$/.test(parts[1]) ? parts[1] : null;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function extractSpotifyInfo(
  rawUrl: string
): { type: 'track' | 'album' | 'episode' | 'playlist' | 'show'; id: string; embedUrl: string } | null {
  try {
    const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
    const parsed = new URL(normalized);
    if (!parsed.hostname.toLowerCase().includes('spotify.com')) return null;
    const match = parsed.pathname.match(/\/(track|album|episode|playlist|show)\/([a-zA-Z0-9]+)/);
    if (!match) return null;
    const type = match[1] as 'track' | 'album' | 'episode' | 'playlist' | 'show';
    const id = match[2];
    return {
      type,
      id,
      embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator`,
    };
  } catch {
    return null;
  }
}

export function extractFirstUrl(text: string): string | null {
  const matches = text.match(URL_REGEX);
  if (!matches || matches.length === 0) return null;
  return matches[0].replace(/[),.;!?]+$/, '');
}

export function stripUrlsFromText(text: string): string {
  return text.replace(URL_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

export function inferPresetFromText(raw: string): AudioSynthPreset {
  const lower = raw.toLowerCase();
  if (
    lower.includes('podcast') ||
    lower.includes('episode') ||
    lower.includes('talk') ||
    lower.includes('lecture') ||
    lower.includes('tech') ||
    lower.includes('archive') ||
    lower.includes('essay')
  ) {
    return 'podcast';
  }
  if (
    lower.includes('jazz') ||
    lower.includes('sax') ||
    lower.includes('vinyl') ||
    lower.includes('midnight') ||
    lower.includes('blues')
  ) {
    return 'jazz';
  }
  if (
    lower.includes('rock') ||
    lower.includes('guitar') ||
    lower.includes('tape') ||
    lower.includes('analog') ||
    lower.includes('zeppelin') ||
    lower.includes('floyd')
  ) {
    return 'guitar';
  }
  return 'santur';
}

function titleFromUrlPath(url: string): string {
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(normalized);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1] || parsed.hostname;
    const cleaned = decodeURIComponent(last)
      .replace(/\.(mp3|wav|ogg|m4a|flac|aac|mp4|webm|m3u8)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim();
    if (!cleaned || cleaned.length < 3) {
      return `Manuscript Stream — ${parsed.hostname}`;
    }
    return cleaned.replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return 'Manuscript Audio Stream';
  }
}

export function classifyMediaUrl(
  rawUrl: string,
  overrides?: Partial<
    Pick<MediaAttachment, 'title' | 'artistOrHost' | 'artwork' | 'durationSec' | 'preset'>
  >
): MediaAttachment | null {
  const url = rawUrl.trim();
  if (!url) return null;

  const lower = url.toLowerCase();
  const ytId = extractYoutubeVideoId(url);
  const spotifyInfo = extractSpotifyInfo(url);

  const isDirectAudio = /\.(mp3|wav|ogg|m4a|flac|aac)(\?.*)?$/i.test(lower);
  const isVideo =
    Boolean(ytId) ||
    /\.(mp4|webm|mov)(\?.*)?$/i.test(lower) ||
    lower.includes('youtube.com') ||
    lower.includes('youtu.be') ||
    lower.includes('vimeo.com');
  const isPodcast =
    spotifyInfo?.type === 'episode' ||
    spotifyInfo?.type === 'show' ||
    lower.includes('podcast') ||
    lower.includes('episode') ||
    lower.includes('podcasts.apple.com') ||
    lower.includes('rss') ||
    lower.includes('anchor.fm') ||
    lower.includes('castbox.fm') ||
    lower.includes('transistor.fm');
  const isStreamPlatform =
    Boolean(spotifyInfo) ||
    lower.includes('soundcloud.com') ||
    lower.includes('bandcamp.com') ||
    lower.includes('spotify.com') ||
    lower.includes('mixcloud.com') ||
    lower.includes('radiojavan.com') ||
    lower.includes('music.apple.com') ||
    lower.includes('audiomack.com') ||
    lower.includes('deezer.com') ||
    lower.includes('tidal.com') ||
    lower.includes('stream') ||
    lower.includes('radio') ||
    lower.includes('nava.scribe') ||
    lower.includes('.m3u8');

  if (!isDirectAudio && !isVideo && !isPodcast && !isStreamPlatform) {
    return null;
  }

  let kind: MediaAttachment['kind'] = 'stream';
  let sourceLabel = 'Audio Stream';
  let provider: MediaProvider = 'stream';
  let embedUrl: string | undefined;
  let inferredArtwork: string | undefined;

  if (spotifyInfo) {
    provider = 'spotify';
    embedUrl = spotifyInfo.embedUrl;
    kind = isPodcast ? 'podcast' : 'stream';
    sourceLabel = isPodcast ? 'Spotify Podcast' : 'Spotify Track';
  } else if (ytId) {
    provider = 'youtube';
    embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
    inferredArtwork = `https://i.ytimg.com/vi/${ytId}/mqdefault.jpg`;
    kind = 'video';
    sourceLabel = 'YouTube Recital';
  } else if (isPodcast) {
    provider = 'podcast';
    kind = 'podcast';
    sourceLabel = 'Podcast Episode';
  } else if (isVideo) {
    provider = lower.includes('youtu') ? 'youtube' : 'stream';
    kind = 'video';
    sourceLabel = lower.includes('youtu') ? 'Video Recital' : 'Video Stream';
  } else if (isDirectAudio) {
    provider = 'direct';
    kind = 'audio';
    sourceLabel = 'Lossless Audio';
  } else if (lower.includes('bandcamp')) {
    provider = 'bandcamp';
    sourceLabel = 'Bandcamp Folio';
  } else if (lower.includes('soundcloud')) {
    provider = 'soundcloud';
    sourceLabel = 'SoundCloud Reel';
  } else if (lower.includes('nava.scribe')) {
    provider = 'stream';
    sourceLabel = 'Nava-Negar P2P Relay';
  }

  const preset = overrides?.preset ?? inferPresetFromText(`${url} ${overrides?.title ?? ''}`);
  const defaultDuration = kind === 'podcast' ? 1845 : kind === 'video' ? 412 : 268;
  const safeOverrideArtwork = isSafeHttpUrl(overrides?.artwork) || overrides?.artwork?.startsWith('/src/assets/')
    ? overrides?.artwork
    : undefined;

  return {
    id: `media-${Math.abs(hashString(url))}`,
    url,
    title: overrides?.title?.trim() || (spotifyInfo ? `Spotify ${spotifyInfo.type.charAt(0).toUpperCase() + spotifyInfo.type.slice(1)}` : titleFromUrlPath(url)),
    artistOrHost:
      overrides?.artistOrHost?.trim() ||
      (provider === 'spotify'
        ? 'Spotify Stream'
        : provider === 'youtube'
          ? 'YouTube Broadcast'
          : kind === 'podcast'
            ? 'Archival Broadcast'
            : 'Manuscript Session'),
    kind,
    durationSec: overrides?.durationSec ?? defaultDuration,
    artwork: safeOverrideArtwork || inferredArtwork || ARTWORK_BY_PRESET[preset],
    preset,
    sourceLabel,
    provider,
    embedUrl,
    isDirectAudio,
    lyricsOrNotes: DEFAULT_LINER_NOTES[preset],
  };
}

export function parseMessageMedia(
  content: string,
  fallbackOverrides?: Partial<
    Pick<MediaAttachment, 'title' | 'artistOrHost' | 'artwork' | 'durationSec' | 'preset'>
  >
): { cleanText: string; media?: MediaAttachment } {
  const foundUrl = extractFirstUrl(content);
  if (!foundUrl) {
    return { cleanText: content };
  }
  const media = classifyMediaUrl(foundUrl, fallbackOverrides);
  if (!media) {
    return { cleanText: content };
  }
  return {
    cleanText: content,
    media,
  };
}

export interface ResolvedRemoteMedia {
  title?: string;
  artistOrHost?: string;
  artwork?: string;
  provider?: string;
}

const clientMetaCache = new Map<string, Promise<ResolvedRemoteMedia | null>>();

/** Fetches live artwork & metadata from the user's link via /api/media-meta (cached per URL) */
export function resolveRemoteMediaMetadata(rawUrl: string): Promise<ResolvedRemoteMedia | null> {
  const url = rawUrl.trim();
  if (!isSafeHttpUrl(url)) {
    return Promise.resolve(null);
  }
  // Skip synthetic local demo URLs like nava.scribe
  if (url.includes('nava.scribe')) {
    return Promise.resolve(null);
  }

  const existing = clientMetaCache.get(url);
  if (existing) return existing;

  const promise = (async (): Promise<ResolvedRemoteMedia | null> => {
    try {
      const res = await fetch(`/api/media-meta?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = (await res.json()) as ResolvedRemoteMedia;
      return {
        title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : undefined,
        artistOrHost:
          typeof data.artistOrHost === 'string' && data.artistOrHost.trim()
            ? data.artistOrHost.trim()
            : undefined,
        artwork: isSafeHttpUrl(data.artwork) ? data.artwork : undefined,
        provider: typeof data.provider === 'string' ? data.provider : undefined,
      };
    } catch {
      return null;
    }
  })();

  clientMetaCache.set(url, promise);
  return promise;
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function generateShortLink(
  kind: 'dossier' | 'lobby' | 'telegram' | 'p2p',
  seed: string,
  domain = 'nava.scribe'
): string {
  const code = Math.abs(hashString(`${kind}:${seed}`)).toString(36).slice(0, 6);
  if (kind === 'telegram') {
    return `https://t.me/NavaNegarRelayBot?start=nv_${code}`;
  }
  const prefix = kind === 'dossier' ? 'd' : kind === 'lobby' ? 'l' : 'p2p';
  return `https://${domain}/${prefix}/${code}`;
}

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash | 0;
}
