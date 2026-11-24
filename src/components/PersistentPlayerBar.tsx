import React from 'react';
import {
  FileText,
  Heart,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { SpotifyPlayerController } from '../hooks/useSpotifyPlayer';
import { formatDuration } from '../utils/mediaParser';
import { formatRemainingTime } from '../utils/playerState';
import { ArchivalImage } from './TazhibOrnament';

interface PersistentPlayerBarProps {
  player: SpotifyPlayerController;
}

export const PersistentPlayerBar: React.FC<PersistentPlayerBarProps> = ({ player }) => {
  const { currentTrack } = player;
  if (!currentTrack || player.theaterOpen) return null;

  const RepeatIcon = player.repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <aside
      aria-label="Active Music & Podcast Player"
      data-testid="persistent-player-bar"
      className="fixed left-0 right-0 bottom-[60px] md:bottom-0 z-30 bg-[#FAF4EA]/98 border-t-2 border-[#C6A553]/70 shadow-[0_-4px_16px_rgba(36,28,20,0.12)]"
    >
      {/* Mobile Compact Spotify Mini-Bar */}
      <div className="md:hidden px-3 py-1.5 flex items-center justify-between gap-2.5 h-[56px]">
        <button
          type="button"
          onClick={() => player.setTheaterOpen(true)}
          aria-label={`Expand ${currentTrack.title} player`}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          <div className="w-10 h-10 rounded-sm overflow-hidden border border-[#C6A553]/65 shrink-0">
            <ArchivalImage
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-calligraphy font-bold text-base text-[#241C14] truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-[#6E5B47] truncate">{currentTrack.artistOrHost}</p>
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => player.toggleLikeCurrent()}
            aria-label={player.isCurrentLiked ? 'Remove from liked tracks' : 'Like track'}
            aria-pressed={player.isCurrentLiked}
            className={`tactile-btn min-w-[38px] min-h-[38px] flex items-center justify-center rounded-sm ${
              player.isCurrentLiked ? 'text-[#8C2D28]' : 'text-[#6E5B47]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${player.isCurrentLiked ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            onClick={player.togglePlayPause}
            aria-label={player.isPlaying ? 'Pause' : 'Play'}
            className="tactile-btn min-w-[38px] min-h-[38px] rounded-full bg-[#3D3124] text-[#FAF4EA] border border-[#C6A553] flex items-center justify-center"
          >
            {player.isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={player.handleNext}
            aria-label="Next track"
            className="tactile-btn min-w-[38px] min-h-[38px] flex items-center justify-center text-[#3D3124]"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={player.dismissPlayer}
            aria-label="Dismiss mini player"
            className="tactile-btn min-w-[34px] min-h-[38px] flex items-center justify-center text-[#6E5B47]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Full 3-Zone Spotify Playback Bar */}
      <div className="hidden md:grid max-w-[1440px] mx-auto px-5 py-2.5 grid-cols-12 items-center gap-4">
        {/* Left Zone: Track Artwork + Title + Like */}
        <div className="col-span-4 flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => player.setTheaterOpen(true)}
            aria-label={`Open ${currentTrack.title} in Fullscreen Theater`}
            className="w-12 h-12 rounded-sm overflow-hidden border border-[#C6A553]/70 shrink-0 hover:opacity-90"
          >
            <ArchivalImage
              src={currentTrack.artwork}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </button>
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => player.setTheaterOpen(true)}
              className="block font-calligraphy text-lg font-bold text-[#241C14] hover:text-[#135757] truncate max-w-full text-left leading-tight"
            >
              {currentTrack.title}
            </button>
            <p className="text-xs text-[#6E5B47] truncate">{currentTrack.artistOrHost}</p>
          </div>
          <button
            type="button"
            onClick={() => player.toggleLikeCurrent()}
            aria-label={player.isCurrentLiked ? 'Remove track from liked' : 'Save track to liked'}
            aria-pressed={player.isCurrentLiked}
            className={`tactile-btn min-w-[36px] min-h-[36px] flex items-center justify-center rounded-sm hover:bg-[#EFE2D0] ${
              player.isCurrentLiked ? 'text-[#8C2D28]' : 'text-[#6E5B47]'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${player.isCurrentLiked ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Center Zone: Spotify Transport Controls + Seek Bar */}
        <div className="col-span-5 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={player.toggleShuffle}
              aria-label={player.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
              aria-pressed={player.shuffle}
              className={`tactile-btn relative p-1.5 rounded-sm hover:bg-[#EFE2D0] ${
                player.shuffle ? 'text-[#135757]' : 'text-[#6E5B47]'
              }`}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={player.handlePrevious}
              aria-label="Previous track or restart"
              className="tactile-btn p-1.5 rounded-sm text-[#3D3124] hover:bg-[#EFE2D0]"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={player.togglePlayPause}
              aria-label={player.isPlaying ? 'Pause playback' : 'Play audio'}
              className="tactile-btn wax-seal-btn w-9 h-9 rounded-full bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] flex items-center justify-center shadow-xs"
            >
              {player.isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={player.handleNext}
              aria-label="Next track"
              className="tactile-btn p-1.5 rounded-sm text-[#3D3124] hover:bg-[#EFE2D0]"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={player.handleCycleRepeat}
              aria-label={`Repeat mode: ${player.repeatMode}`}
              className={`tactile-btn p-1.5 rounded-sm hover:bg-[#EFE2D0] ${
                player.repeatMode !== 'off' ? 'text-[#135757]' : 'text-[#6E5B47]'
              }`}
            >
              <RepeatIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full max-w-md flex items-center gap-2 mt-1">
            <span className="font-mono text-[11px] text-[#6E5B47] tabular-nums w-9 text-right">
              {formatDuration(player.elapsed)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, player.duration)}
              value={Math.min(player.elapsed, player.duration)}
              aria-label="Seek bar"
              onChange={(e) => player.seekTo(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#1D7A7A] cursor-pointer"
            />
            <button
              type="button"
              onClick={player.toggleShowRemaining}
              aria-label="Toggle remaining time display"
              className="font-mono text-[11px] text-[#6E5B47] hover:text-[#241C14] tabular-nums w-11 text-left"
            >
              {player.showRemaining
                ? formatRemainingTime(player.elapsed, player.duration)
                : formatDuration(player.duration)}
            </button>
          </div>
        </div>

        {/* Right Zone: Liner Notes, Queue, Volume, Expand, Dismiss */}
        <div className="col-span-3 flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => {
              player.setActiveDrawer('notes');
              player.setTheaterOpen(true);
            }}
            aria-label="Open liner notes and lyrics"
            title="Lyrics & Liner Notes"
            className="tactile-btn p-2 rounded-sm text-[#6E5B47] hover:text-[#135757] hover:bg-[#EFE2D0]"
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              player.setActiveDrawer('queue');
              player.setTheaterOpen(true);
            }}
            aria-label={`Open queue (${player.queue.length} tracks)`}
            title="Up-Next Queue"
            className="tactile-btn p-2 rounded-sm text-[#6E5B47] hover:text-[#135757] hover:bg-[#EFE2D0]"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={player.toggleMute}
            aria-label={player.muted || player.volume === 0 ? 'Unmute player' : 'Mute player'}
            className="tactile-btn p-2 rounded-sm text-[#3D3124] hover:text-[#135757]"
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
            aria-label="Player bar volume"
            onChange={(e) => player.setVolume(Number(e.target.value))}
            className="w-20 accent-[#9B7B2F] cursor-pointer"
          />

          <button
            type="button"
            onClick={() => player.setTheaterOpen(true)}
            aria-label="Expand to Fullscreen Theater"
            title="Fullscreen Theater"
            className="tactile-btn p-2 rounded-sm text-[#3D3124] hover:text-[#135757] hover:bg-[#EFE2D0]"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={player.dismissPlayer}
            aria-label="Close player bar"
            title="Dismiss Player"
            className="tactile-btn p-2 rounded-sm text-[#6E5B47] hover:text-[#8C2D28] hover:bg-[#EFE2D0]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
