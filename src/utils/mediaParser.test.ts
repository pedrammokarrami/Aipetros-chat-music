import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyMediaUrl,
  extractFirstUrl,
  extractSpotifyInfo,
  extractYoutubeVideoId,
  formatDuration,
  generateShortLink,
  isSafeHttpUrl,
  parseMessageMedia,
} from './mediaParser';

test('extractFirstUrl finds audio and stream links inside prose', () => {
  const url = extractFirstUrl(
    'Listening to this sublime santur recital https://soundcloud.com/shajarian-circle/midnight-dastgah-homayoun.mp3 tonight!'
  );
  assert.equal(url, 'https://soundcloud.com/shajarian-circle/midnight-dastgah-homayoun.mp3');
});

test('extractYoutubeVideoId and classifyMediaUrl extract YouTube thumbnail artwork directly from link', () => {
  assert.equal(
    extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42'), 'dQw4w9WgXcQ');

  const yt = classifyMediaUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.ok(yt);
  assert.equal(yt.provider, 'youtube');
  assert.equal(yt.artwork, 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg');
  assert.match(yt.embedUrl || '', /^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ/);
});

test('extractSpotifyInfo and classifyMediaUrl identify Spotify track & episode embeds', () => {
  const info = extractSpotifyInfo('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=123');
  assert.ok(info);
  assert.equal(info.type, 'track');
  assert.equal(info.id, '4cOdK2wGLETKBW3PvgPWqT');
  assert.match(info.embedUrl, /^https:\/\/open\.spotify\.com\/embed\/track\/4cOdK2wGLETKBW3PvgPWqT/);

  const media = classifyMediaUrl('https://open.spotify.com/episode/512ojhOuo1ktJprKbVcKyQ');
  assert.ok(media);
  assert.equal(media.provider, 'spotify');
  assert.equal(media.kind, 'podcast');
});

test('isSafeHttpUrl blocks javascript and data URI schemes', () => {
  assert.equal(isSafeHttpUrl('https://i.ytimg.com/vi/abc/hqdefault.jpg'), true);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl('data:text/html,<script>alert(1)</script>'), false);
  assert.equal(isSafeHttpUrl(''), false);
});

test('classifyMediaUrl identifies podcasts, audio files, videos, and streams', () => {
  const podcast = classifyMediaUrl('https://podcasts.apple.com/archive/ep-42-history-of-persian-lutes');
  assert.ok(podcast);
  assert.equal(podcast.kind, 'podcast');
  assert.equal(podcast.preset, 'podcast');

  const audio = classifyMediaUrl('https://cdn.nava.audio/vinyl/autumn-jazz-session.mp3');
  assert.ok(audio);
  assert.equal(audio.kind, 'audio');
  assert.equal(audio.isDirectAudio, true);
  assert.equal(audio.preset, 'jazz');

  const plain = classifyMediaUrl('https://example.com/about-us');
  assert.equal(plain, null);
});

test('parseMessageMedia attaches inline media preview when chat contains stream URL', () => {
  const result = parseMessageMedia(
    'Drop in for the live vinyl spin https://nava.scribe/stream/tehran-midnight-jazz'
  );
  assert.ok(result.media);
  assert.equal(result.media.sourceLabel, 'Nava-Negar P2P Relay');
  assert.equal(result.media.preset, 'jazz');
});

test('formatDuration renders clean mm:ss tabular timestamps', () => {
  assert.equal(formatDuration(0), '0:00');
  assert.equal(formatDuration(65), '1:05');
  assert.equal(formatDuration(1845), '30:45');
});

test('generateShortLink builds Telegram failover and custom domain links', () => {
  const tg = generateShortLink('telegram', 'darius_khattat');
  assert.match(tg, /^https:\/\/t\.me\/NavaNegarRelayBot\?start=nv_[a-z0-9]+$/);
  const p2p = generateShortLink('p2p', 'lobby-1', 'nava.scribe');
  assert.match(p2p, /^https:\/\/nava\.scribe\/p2p\/[a-z0-9]+$/);
});
