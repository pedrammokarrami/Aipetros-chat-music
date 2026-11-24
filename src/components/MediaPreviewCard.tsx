import React, { useEffect, useState } from 'react';
import { Headphones, ListPlus, Maximize2, Pause, Play, Radio, Video } from 'lucide-react';
import type { MediaAttachment } from '../types';
import { formatDuration, resolveRemoteMediaMetadata } from '../utils/mediaParser';
import { soundEngine } from '../utils/soundEngine';
import { ArchivalImage } from './TazhibOrnament';

interface MediaPreviewCardProps {
  media: MediaAttachment;
  onOpenTheater: (media: MediaAttachment) => void;
  onToggleInlinePlay?: (media: MediaAttachment) => void;
  onAddToQueue?: (media: MediaAttachment) => void;
  isActiveTrack?: boolean;
  isPlaying?: boolean;
  compact?: boolean;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  onOpenTheater,
  onToggleInlinePlay,
  onAddToQueue,
  isActiveTrack = false,
  isPlaying = false,
  compact = false,
}) => {
  const [resolvedMedia, setResolvedMedia] = useState<MediaAttachment>(media);

  useEffect(() => {
    setResolvedMedia(media);
    let cancelled = false;
    void resolveRemoteMediaMetadata(media.url).then((meta) => {
      if (cancelled || !meta) return;
      if (!meta.artwork && !meta.title && !meta.artistOrHost) return;
      setResolvedMedia((prev) => ({
        ...prev,
        artwork: meta.artwork || prev.artwork,
        title:
          prev.title.startsWith('Spotify ') || prev.title.startsWith('Manuscript Stream')
            ? meta.title || prev.title
            : prev.title,
        artistOrHost:
          prev.artistOrHost === 'Spotify Stream' ||
          prev.artistOrHost === 'YouTube Broadcast' ||
          prev.artistOrHost === 'Manuscript Session'
            ? meta.artistOrHost || prev.artistOrHost
            : prev.artistOrHost,
      }));
    });
    return () => {
      cancelled = true;
    };
  }, [media]);

  const KindIcon =
    resolvedMedia.kind === 'video'
      ? Video
      : resolvedMedia.kind === 'podcast'
        ? Headphones
        : Radio;

  const handlePlayButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleInlinePlay) {
      onToggleInlinePlay(resolvedMedia);
    } else {
      soundEngine.playSealPress();
      onOpenTheater(resolvedMedia);
    }
  };

  const handleOpenTheater = () => {
    soundEngine.playSealPress();
    onOpenTheater(resolvedMedia);
  };

  const handleQueueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToQueue) {
      onAddToQueue(resolvedMedia);
    }
  };

  return (
    <div
      className={`group w-full flex items-center gap-3 rounded-sm border transition-colors ${
        isActiveTrack
          ? 'border-[#1D7A7A] bg-[#EFE2D0]/95'
          : 'border-[#C6A553]/55 bg-[#F5EADD]/90 hover:bg-[#FAF4EA] hover:border-[#1D7A7A]'
      } ${compact ? 'p-2.5 mt-2' : 'p-3 mt-3'}`}
    >
      {/* Artwork Thumbnail + Direct Play/Pause Trigger */}
      <button
        type="button"
        onClick={handlePlayButton}
        aria-label={
          isActiveTrack && isPlaying
            ? `Pause ${resolvedMedia.title}`
            : `Play ${resolvedMedia.title}`
        }
        className={`tactile-btn relative shrink-0 overflow-hidden rounded-sm border border-[#9B7B2F]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A] ${
          compact ? 'w-14 h-14' : 'w-16 h-16 sm:w-20 sm:h-20'
        }`}
      >
        <ArchivalImage
          src={resolvedMedia.artwork}
          alt={resolvedMedia.title}
          fallbackTitle={resolvedMedia.title}
          className="w-full h-full object-cover"
        />
        <span className="absolute inset-0 bg-[#241C14]/35 group-hover:bg-[#135757]/50 transition-colors flex items-center justify-center">
          <span className="w-8 h-8 rounded-full bg-[#FAF4EA]/95 border border-[#C6A553] text-[#241C14] flex items-center justify-center shadow">
            {isActiveTrack && isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </span>
        </span>
      </button>

      {/* Main Track Metadata (click expands to Fullscreen Theater) */}
      <button
        type="button"
        onClick={handleOpenTheater}
        aria-label={`Play and expand ${resolvedMedia.title} in Fullscreen Theater`}
        className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A]"
      >
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#135757] truncate">
          <KindIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{resolvedMedia.sourceLabel}</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatDuration(resolvedMedia.durationSec)}</span>
          {isActiveTrack && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-[#8C2D28]">
                {isPlaying ? 'Now Playing' : 'Paused'}
              </span>
            </>
          )}
        </div>
        <p className="font-calligraphy text-base sm:text-lg font-bold text-[#241C14] truncate mt-0.5 leading-snug">
          {resolvedMedia.title}
        </p>
        <p className="text-xs text-[#6E5B47] truncate">{resolvedMedia.artistOrHost}</p>

        {/* Mini ornamental waveform bar */}
        <div className="mt-2 flex items-end gap-0.5 h-2.5" aria-hidden="true">
          {[35, 65, 90, 50, 75, 100, 60, 40, 85, 70, 45, 95, 55, 35, 60, 45].map((pct, i) => (
            <span
              key={i}
              style={{ height: `${pct}%` }}
              className={`w-1 rounded-xs transition-colors ${
                isActiveTrack && isPlaying
                  ? 'bg-[#1D7A7A]'
                  : 'bg-[#9B7B2F]/45 group-hover:bg-[#1D7A7A]/70'
              }`}
            />
          ))}
        </div>
      </button>

      {/* Right Utility Actions: + Queue & Theater */}
      <div className="shrink-0 flex items-center gap-1">
        {onAddToQueue && (
          <button
            type="button"
            onClick={handleQueueClick}
            aria-label={`Add ${resolvedMedia.title} to queue`}
            title="Add to Up-Next Queue"
            className="tactile-btn min-w-[36px] min-h-[36px] flex items-center justify-center rounded-sm text-[#6E5B47] hover:text-[#135757] hover:bg-[#EFE2D0]"
          >
            <ListPlus className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={handleOpenTheater}
          aria-label={`Open ${resolvedMedia.title} in Fullscreen Theater`}
          title="Open Fullscreen Theater"
          className="tactile-btn min-w-[36px] min-h-[36px] px-1.5 flex flex-col items-center justify-center gap-0.5 rounded-sm text-[#6E5B47] hover:text-[#135757] hover:bg-[#EFE2D0]"
        >
          <Maximize2 className="w-4 h-4" aria-hidden="true" />
          <span className="text-[10px] font-mono hidden sm:inline whitespace-nowrap">Theater</span>
        </button>
      </div>
    </div>
  );
};
