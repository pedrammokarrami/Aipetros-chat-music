import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  FileText,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  RotateCcw,
  RotateCw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { SpotifyPlayerController } from '../hooks/useSpotifyPlayer';
import { formatDuration, isSafeHttpUrl } from '../utils/mediaParser';
import { formatRemainingTime } from '../utils/playerState';
import { soundEngine } from '../utils/soundEngine';
import { ArchivalImage, CalligraphicDivider, TazhibFrame } from './TazhibOrnament';

function isSafeEmbedUrl(url?: string): boolean {
  if (!url) return false;
  return (
    url.startsWith('https://open.spotify.com/embed/') ||
    url.startsWith('https://www.youtube.com/embed/')
  );
}

interface FullscreenTheaterModalProps {
  player: SpotifyPlayerController;
}

const WAVE_BARS = [
  28, 46, 62, 85, 54, 72, 96, 68, 42, 76, 92, 58, 84, 65, 48, 88, 70, 52, 95, 64, 44, 78, 56, 36,
];

export const FullscreenTheaterModal: React.FC<FullscreenTheaterModalProps> = ({ player }) => {
  const [copied, setCopied] = useState(false);

  const media = player.currentTrack;
  if (!player.theaterOpen || !media) return null;

  const RepeatIcon = player.repeatMode === 'one' ? Repeat1 : Repeat;
  const repeatLabel =
    player.repeatMode === 'off'
      ? 'Repeat Off'
      : player.repeatMode === 'all'
        ? 'Repeat All'
        : 'Repeat One';

  const handleClose = () => {
    soundEngine.playPageTurn();
    player.setTheaterOpen(false);
  };

  const handleCopyUrl = () => {
    soundEngine.playInkClick();
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(media.url).catch(() => {});
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const progressPct =
    player.duration > 0 ? Math.min(100, (player.elapsed / player.duration) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241C14]/86 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="theater-title"
      data-testid="fullscreen-theater-modal"
    >
      <TazhibFrame className="w-full max-w-4xl p-5 sm:p-8 animate-ink-reveal my-auto">
        {/* Top Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#C6A553]/35">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
              Fullscreen Listening Theater · {media.sourceLabel}
              {player.shuffle ? ' · Shuffle On' : ''}
              {player.repeatMode !== 'off' ? ` · ${repeatLabel}` : ''}
            </p>
            <h2
              id="theater-title"
              className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14] truncate mt-0.5"
            >
              {media.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSafeEmbedUrl(media.embedUrl) && (
              <div
                className="hidden sm:inline-flex p-0.5 bg-[#EFE2D0] border border-[#C6A553]/55 rounded-sm"
                role="tablist"
                aria-label="Player mode"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={player.viewMode === 'deck'}
                  onClick={() => {
                    soundEngine.playInkClick();
                    player.setViewMode('deck');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-sm whitespace-nowrap ${
                    player.viewMode === 'deck'
                      ? 'bg-[#3D3124] text-[#FAF4EA]'
                      : 'text-[#3D3124]'
                  }`}
                >
                  Manuscript Deck
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={player.viewMode === 'embed'}
                  onClick={() => {
                    soundEngine.playInkClick();
                    player.setViewMode('embed');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-sm whitespace-nowrap ${
                    player.viewMode === 'embed'
                      ? 'bg-[#3D3124] text-[#FAF4EA]'
                      : 'text-[#3D3124]'
                  }`}
                >
                  Original Embed
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleClose}
              aria-label="Close Fullscreen Theater"
              className="tactile-btn min-w-[44px] min-h-[42px] px-3 inline-flex items-center gap-1.5 bg-[#EFE2D0] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/55 rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Center Stage */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Stage: Real Link Artwork OR Live Original Embed */}
          <div className="md:col-span-5">
            {player.viewMode === 'embed' && isSafeEmbedUrl(media.embedUrl) ? (
              <div className="rounded-sm overflow-hidden border-2 border-[#C6A553]/70 bg-[#241C14] shadow-md">
                <iframe
                  src={media.embedUrl}
                  title={`Embedded player for ${media.title}`}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full h-[352px] border-0"
                />
              </div>
            ) : (
              <div className="relative aspect-square rounded-sm overflow-hidden border-2 border-[#C6A553]/70 shadow-md bg-[#EFE2D0]">
                <ArchivalImage
                  src={media.artwork}
                  alt={media.title}
                  fallbackTitle={media.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Right Stage: Spotify-Parity Controls & Optional Queue / Liner Notes Panel */}
          <div className="md:col-span-7 flex flex-col justify-between">
            {/* Artist + Like + Source URL */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-calligraphy italic text-xl text-[#6E5B47] truncate">
                  {media.artistOrHost}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="tactile-btn inline-flex items-center gap-1.5 text-[#135757] hover:text-[#241C14]"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Stream link copied' : 'Copy stream link'}</span>
                  </button>
                  {isSafeHttpUrl(media.url) && (
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#6E5B47] hover:text-[#241C14]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Source</span>
                    </a>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => player.toggleLikeCurrent()}
                aria-pressed={player.isCurrentLiked}
                aria-label={
                  player.isCurrentLiked ? 'Remove from Liked Anthology' : 'Save to Liked Anthology'
                }
                className={`tactile-btn min-w-[44px] min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-sm border font-mono text-xs whitespace-nowrap shrink-0 ${
                  player.isCurrentLiked
                    ? 'bg-[#8C2D28]/12 border-[#8C2D28]/55 text-[#8C2D28]'
                    : 'bg-[#FAF4EA] border-[#C6A553]/55 text-[#3D3124] hover:border-[#8C2D28]'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${player.isCurrentLiked ? 'fill-current' : ''}`}
                  aria-hidden="true"
                />
                <span>{player.isCurrentLiked ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <p className="mt-2.5 font-mono text-[11px] text-[#6E5B47] truncate bg-[#EFE2D0]/80 border border-[#C6A553]/30 px-3 py-1.5 rounded-sm">
              {media.url}
            </p>

            {/* Acoustic Waveform & Spotify Progress Scrubber */}
            <div className="my-5 py-4 px-4 rounded-sm vellum-inset">
              <div className="h-14 flex items-end justify-between gap-1" aria-hidden="true">
                {WAVE_BARS.map((base, idx) => {
                  const waveBoost = player.isPlaying
                    ? Math.sin((player.waveTick * 0.9 + idx * 0.7) % (Math.PI * 2)) * 22
                    : 0;
                  const height = Math.max(14, Math.min(100, base + waveBoost));
                  const filled = (idx / WAVE_BARS.length) * 100 <= progressPct;
                  return (
                    <span
                      key={idx}
                      style={{ transform: `scaleY(${(height / 100).toFixed(2)})` }}
                      className={`flex-1 h-full origin-bottom rounded-xs transition-transform duration-150 ${
                        filled ? 'bg-[#1D7A7A]' : 'bg-[#9B7B2F]/45'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Scrubber */}
              <div className="mt-3.5">
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, player.duration)}
                  value={Math.min(player.elapsed, player.duration)}
                  aria-label="Seek playback position"
                  onChange={(e) => player.seekTo(Number(e.target.value))}
                  className="w-full accent-[#1D7A7A] cursor-pointer"
                />
                <div className="flex items-center justify-between font-mono text-xs text-[#6E5B47] tabular-nums mt-1">
                  <span>{formatDuration(player.elapsed)}</span>
                  <span className="text-[11px] text-[#135757]">
                    {player.viewMode === 'embed'
                      ? 'Original Embed Active'
                      : player.isPlaying
                        ? media.isDirectAudio
                          ? 'Playing Direct Audio'
                          : 'Playing Acoustic Relay'
                        : 'Paused'}
                  </span>
                  <button
                    type="button"
                    onClick={player.toggleShowRemaining}
                    aria-label="Toggle remaining duration"
                    className="hover:text-[#241C14] underline-offset-2 hover:underline"
                  >
                    {player.showRemaining
                      ? formatRemainingTime(player.elapsed, player.duration)
                      : formatDuration(player.duration)}
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Spotify Transport Row: Shuffle, -15s, Prev, Play/Pause, Next, +15s, Repeat */}
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
              <button
                type="button"
                onClick={player.toggleShuffle}
                aria-label={player.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                aria-pressed={player.shuffle}
                title="Shuffle"
                className={`tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm border ${
                  player.shuffle
                    ? 'bg-[#1D7A7A] text-[#FAF4EA] border-[#135757]'
                    : 'bg-[#FAF4EA] text-[#3D3124] border-[#C6A553]/50 hover:bg-[#EFE2D0]'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => player.skipBy(-15)}
                aria-label="Rewind 15 seconds"
                title="Rewind 15s"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center border border-[#C6A553]/50 bg-[#FAF4EA] hover:bg-[#EFE2D0] rounded-sm text-[#3D3124]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={player.handlePrevious}
                aria-label="Previous track"
                title="Previous Track (or Restart)"
                className="tactile-btn min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#C6A553]/55 bg-[#FAF4EA] hover:bg-[#EFE2D0] rounded-sm text-[#3D3124]"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={player.togglePlayPause}
                aria-label={player.isPlaying ? 'Pause playback' : 'Play audio'}
                className="tactile-btn wax-seal-btn min-w-[104px] min-h-[46px] px-5 inline-flex items-center justify-center gap-2 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap shadow-sm"
              >
                {player.isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                <span>{player.isPlaying ? 'Pause' : 'Play'}</span>
              </button>

              <button
                type="button"
                onClick={player.handleNext}
                aria-label="Next track"
                title="Next Track"
                className="tactile-btn min-w-[44px] min-h-[44px] flex items-center justify-center border border-[#C6A553]/55 bg-[#FAF4EA] hover:bg-[#EFE2D0] rounded-sm text-[#3D3124]"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              <button
                type="button"
                onClick={() => player.skipBy(15)}
                aria-label="Forward 15 seconds"
                title="Forward 15s"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center border border-[#C6A553]/50 bg-[#FAF4EA] hover:bg-[#EFE2D0] rounded-sm text-[#3D3124]"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={player.handleCycleRepeat}
                aria-label={`Cycle repeat mode (currently ${repeatLabel})`}
                title={repeatLabel}
                className={`tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center rounded-sm border ${
                  player.repeatMode !== 'off'
                    ? 'bg-[#1D7A7A] text-[#FAF4EA] border-[#135757]'
                    : 'bg-[#FAF4EA] text-[#3D3124] border-[#C6A553]/50 hover:bg-[#EFE2D0]'
                }`}
              >
                <RepeatIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Spotify Utility Row: Speed, Volume, Lyrics/Notes, Queue */}
            <div className="mt-4 pt-3.5 border-t border-[#C6A553]/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={player.cycleSpeed}
                  aria-label={`Playback speed ${player.speed}x`}
                  className="tactile-btn min-h-[38px] px-3 font-mono text-xs tabular-nums border border-[#C6A553]/55 bg-[#FAF4EA] hover:bg-[#EFE2D0] rounded-sm text-[#3D3124] whitespace-nowrap"
                >
                  {player.speed}x
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPageTurn();
                    player.setActiveDrawer(player.activeDrawer === 'notes' ? 'none' : 'notes');
                  }}
                  aria-expanded={player.activeDrawer === 'notes'}
                  className={`tactile-btn min-h-[38px] px-3 inline-flex items-center gap-1.5 font-mono text-xs rounded-sm border whitespace-nowrap ${
                    player.activeDrawer === 'notes'
                      ? 'bg-[#3D3124] text-[#FAF4EA] border-[#C6A553]'
                      : 'bg-[#FAF4EA] text-[#3D3124] border-[#C6A553]/55 hover:bg-[#EFE2D0]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Liner Notes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPageTurn();
                    player.setActiveDrawer(player.activeDrawer === 'queue' ? 'none' : 'queue');
                  }}
                  aria-expanded={player.activeDrawer === 'queue'}
                  className={`tactile-btn min-h-[38px] px-3 inline-flex items-center gap-1.5 font-mono text-xs rounded-sm border whitespace-nowrap ${
                    player.activeDrawer === 'queue'
                      ? 'bg-[#3D3124] text-[#FAF4EA] border-[#C6A553]'
                      : 'bg-[#FAF4EA] text-[#3D3124] border-[#C6A553]/55 hover:bg-[#EFE2D0]'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Queue ({player.queue.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={player.toggleMute}
                  aria-label={player.muted || player.volume === 0 ? 'Unmute theater audio' : 'Mute theater audio'}
                  className="tactile-btn min-w-[38px] min-h-[38px] flex items-center justify-center text-[#3D3124] hover:text-[#135757]"
                >
                  {player.muted || player.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-[#8C2D28]" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={player.volume}
                  aria-label="Theater volume"
                  onChange={(e) => player.setVolume(Number(e.target.value))}
                  className="w-24 accent-[#9B7B2F] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Spotify Queue or Liner Notes Drawer */}
        {player.activeDrawer === 'queue' && (
          <div
            className="mt-5 p-4 vellum-inset rounded-sm animate-unroll"
            aria-label="Up-Next Playback Queue"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#C6A553]/35">
              <h3 className="font-calligraphy text-lg font-bold text-[#241C14]">
                Up-Next Queue ({player.queue.length} tracks)
              </h3>
              <span className="font-mono text-[11px] text-[#6E5B47]">
                Click any track to play immediately
              </span>
            </div>
            <ul className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
              {player.queue.map((item, idx) => {
                const isCurrent = idx === player.currentIndex;
                return (
                  <li
                    key={`${item.id}-${idx}`}
                    className={`flex items-center justify-between gap-2 p-2 rounded-sm border ${
                      isCurrent
                        ? 'bg-[#FAF4EA] border-[#1D7A7A]'
                        : 'bg-transparent border-transparent hover:bg-[#FAF4EA]/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => player.jumpToQueueIndex(idx)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                    >
                      <span className="font-mono text-[11px] text-[#9B7B2F] w-5 tabular-nums shrink-0">
                        {isCurrent ? '▶' : `${idx + 1}.`}
                      </span>
                      <div className="w-9 h-9 rounded-sm overflow-hidden border border-[#C6A553]/50 shrink-0">
                        <ArchivalImage
                          src={item.artwork}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-calligraphy font-bold text-base text-[#241C14] truncate leading-tight">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#6E5B47] truncate">
                          {item.artistOrHost} · {formatDuration(item.durationSec)}
                        </p>
                      </div>
                    </button>
                    {player.queue.length > 1 && (
                      <button
                        type="button"
                        onClick={() => player.removeFromQueue(item.id)}
                        aria-label={`Remove ${item.title} from queue`}
                        className="p-1.5 text-[#6E5B47] hover:text-[#8C2D28]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {player.activeDrawer === 'notes' && (
          <div
            className="mt-5 p-4 vellum-inset rounded-sm animate-unroll"
            aria-label="Liner Notes and Lyrics"
          >
            <h3 className="font-calligraphy text-lg font-bold text-[#241C14] pb-2 border-b border-[#C6A553]/35">
              Manuscript Liner Notes &amp; Timestamps
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-[#3D3124]">
              {(
                media.lyricsOrNotes || [
                  '00:00 — Archival stream synchronized through NAVA-NEGAR.',
                  '01:15 — Acoustic theme develops with warm parchment acoustics.',
                ]
              ).map((line, i) => (
                <li key={i} className="font-serif leading-relaxed">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}

        <CalligraphicDivider className="mt-6 mb-0" />
      </TazhibFrame>
    </div>
  );
};
