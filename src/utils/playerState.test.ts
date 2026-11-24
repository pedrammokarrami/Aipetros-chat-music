import test from 'node:test';
import assert from 'node:assert/strict';
import type { MediaAttachment } from '../types';
import {
  cycleRepeatMode,
  enqueueTrack,
  formatRemainingTime,
  getNextTrackIndex,
  getPreviousTrackDecision,
  playTrackInQueue,
  removeTrackFromQueue,
  toggleLikedTrack,
} from './playerState';

const makeTrack = (id: string): MediaAttachment => ({
  id,
  url: `https://nava.scribe/stream/${id}`,
  title: `Track ${id}`,
  artistOrHost: 'Anthology',
  kind: 'stream',
  durationSec: 200,
  preset: 'santur',
  sourceLabel: 'Stream',
});

test('cycleRepeatMode transitions off -> all -> one -> off', () => {
  assert.equal(cycleRepeatMode('off'), 'all');
  assert.equal(cycleRepeatMode('all'), 'one');
  assert.equal(cycleRepeatMode('one'), 'off');
});

test('getPreviousTrackDecision follows Spotify >3s restart vs previous track rule', () => {
  // Past 3 seconds: restart current track
  assert.deepEqual(getPreviousTrackDecision(2, 5, 4, 'off'), { action: 'restart', index: 2 });
  // Within 3 seconds: go to previous track
  assert.deepEqual(getPreviousTrackDecision(2, 2, 4, 'off'), { action: 'switch', index: 1 });
  // At track 0 with Repeat All: wrap to last track
  assert.deepEqual(getPreviousTrackDecision(0, 1, 4, 'all'), { action: 'switch', index: 3 });
  // At track 0 with Repeat Off: restart track 0
  assert.deepEqual(getPreviousTrackDecision(0, 1, 4, 'off'), { action: 'restart', index: 0 });
});

test('getNextTrackIndex respects Repeat One, Repeat All, Repeat Off, and Shuffle', () => {
  // Auto-advance with Repeat One replays same track
  assert.equal(getNextTrackIndex(1, 4, false, 'one', true), 1);
  // Manual skip with Repeat One still advances to next track (Spotify behavior)
  assert.equal(getNextTrackIndex(1, 4, false, 'one', false), 2);
  // Auto-advance at end of queue with Repeat Off stops (null)
  assert.equal(getNextTrackIndex(3, 4, false, 'off', true), null);
  // Auto-advance at end of queue with Repeat All wraps to 0
  assert.equal(getNextTrackIndex(3, 4, false, 'all', true), 0);
  // Shuffle avoids repeating current index when queue has >1 items
  const picked = getNextTrackIndex(1, 4, true, 'off', false, () => 0.25); // floor(0.25*4) = 1 -> bumped to 2
  assert.equal(picked, 2);
});

test('queue operations deduplicate, play, and adjust active index on removal', () => {
  const t1 = makeTrack('1');
  const t2 = makeTrack('2');
  const t3 = makeTrack('3');

  let queue = enqueueTrack([t1, t2], t2);
  assert.equal(queue.length, 2);
  queue = enqueueTrack(queue, t3);
  assert.equal(queue.length, 3);

  const played = playTrackInQueue(queue, t3);
  assert.equal(played.index, 2);

  const afterRemoveBefore = removeTrackFromQueue(played.queue, 2, '1');
  assert.equal(afterRemoveBefore.queue.length, 2);
  assert.equal(afterRemoveBefore.currentIndex, 1);
});

test('toggleLikedTrack and formatRemainingTime work cleanly', () => {
  const liked = toggleLikedTrack([], 't-1');
  assert.deepEqual(liked, ['t-1']);
  assert.deepEqual(toggleLikedTrack(liked, 't-1'), []);
  assert.equal(formatRemainingTime(45, 200), '-2:35');
});
