import type { MediaAttachment, RepeatMode } from '../types';
import { formatDuration } from './mediaParser';

export function cycleRepeatMode(current: RepeatMode): RepeatMode {
  if (current === 'off') return 'all';
  if (current === 'all') return 'one';
  return 'off';
}

/** Exact Spotify Previous-Track rule: > 3s restarts current track; <= 3s skips to previous track */
export function getPreviousTrackDecision(
  currentIndex: number,
  elapsedSec: number,
  queueLength: number,
  repeatMode: RepeatMode
): { action: 'restart' | 'switch'; index: number } {
  if (queueLength <= 0) {
    return { action: 'restart', index: 0 };
  }
  if (elapsedSec > 3) {
    return { action: 'restart', index: currentIndex };
  }
  if (currentIndex > 0) {
    return { action: 'switch', index: currentIndex - 1 };
  }
  if (repeatMode === 'all' && queueLength > 1) {
    return { action: 'switch', index: queueLength - 1 };
  }
  return { action: 'restart', index: 0 };
}

/** Exact Spotify Next-Track rule respecting Shuffle, Repeat All, Repeat One, and manual vs auto-end */
export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  shuffle: boolean,
  repeatMode: RepeatMode,
  isAutoAdvance: boolean,
  randomFn: () => number = Math.random
): number | null {
  if (queueLength <= 0) return null;

  if (isAutoAdvance && repeatMode === 'one') {
    return currentIndex;
  }

  if (shuffle && queueLength > 1) {
    let pick = Math.floor(randomFn() * queueLength);
    if (pick === currentIndex) {
      pick = (currentIndex + 1) % queueLength;
    }
    return pick;
  }

  if (currentIndex + 1 < queueLength) {
    return currentIndex + 1;
  }

  if (repeatMode === 'all' || (!isAutoAdvance && queueLength > 1)) {
    return 0;
  }

  return null;
}

export function enqueueTrack(
  queue: MediaAttachment[],
  track: MediaAttachment
): MediaAttachment[] {
  if (queue.some((item) => item.id === track.id || item.url === track.url)) {
    return queue;
  }
  return [...queue, track];
}

export function playTrackInQueue(
  queue: MediaAttachment[],
  track: MediaAttachment
): { queue: MediaAttachment[]; index: number } {
  const existingIdx = queue.findIndex(
    (item) => item.id === track.id || item.url === track.url
  );
  if (existingIdx >= 0) {
    // Merge any upgraded artwork/title metadata onto existing entry
    const updated = queue.map((item, idx) =>
      idx === existingIdx ? { ...item, ...track } : item
    );
    return { queue: updated, index: existingIdx };
  }
  const nextQueue = [track, ...queue];
  return { queue: nextQueue, index: 0 };
}

export function removeTrackFromQueue(
  queue: MediaAttachment[],
  currentIndex: number,
  removeId: string
): { queue: MediaAttachment[]; currentIndex: number } {
  const removeIdx = queue.findIndex((t) => t.id === removeId);
  if (removeIdx === -1) return { queue, currentIndex };
  const nextQueue = queue.filter((t) => t.id !== removeId);
  if (nextQueue.length === 0) {
    return { queue: [], currentIndex: 0 };
  }
  let nextIndex = currentIndex;
  if (removeIdx < currentIndex) {
    nextIndex = currentIndex - 1;
  } else if (removeIdx === currentIndex) {
    nextIndex = Math.min(currentIndex, nextQueue.length - 1);
  }
  return { queue: nextQueue, currentIndex: nextIndex };
}

export function toggleLikedTrack(likedIds: string[], trackId: string): string[] {
  if (likedIds.includes(trackId)) {
    return likedIds.filter((id) => id !== trackId);
  }
  return [trackId, ...likedIds];
}

export function formatRemainingTime(elapsedSec: number, durationSec: number): string {
  const remaining = Math.max(0, Math.floor(durationSec - elapsedSec));
  return `-${formatDuration(remaining)}`;
}
