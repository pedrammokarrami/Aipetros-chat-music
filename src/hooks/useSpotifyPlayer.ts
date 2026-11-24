import { useCallback, useEffect, useRef, useState } from 'react';
import type { MediaAttachment, RepeatMode } from '../types';
import { resolveRemoteMediaMetadata } from '../utils/mediaParser';
import {
  cycleRepeatMode,
  enqueueTrack,
  getNextTrackIndex,
  getPreviousTrackDecision,
  playTrackInQueue,
  removeTrackFromQueue,
  toggleLikedTrack,
} from '../utils/playerState';
import { soundEngine } from '../utils/soundEngine';

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;
export type TheaterDrawerMode = 'none' | 'queue' | 'notes';
export type PlayerViewMode = 'deck' | 'embed';

const LIKED_TRACKS_KEY = 'nava_negar_liked_tracks';
const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];

function loadInitialLikedTracks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LIKED_TRACKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function useSpotifyPlayer(initialSeedTracks: MediaAttachment[]) {
  const [queue, setQueue] = useState<MediaAttachment[]>(initialSeedTracks);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);
  const [theaterOpen, setTheaterOpen] = useState<boolean>(false);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [duration, setDuration] = useState<number>(
    initialSeedTracks[0]?.durationSec ?? 268
  );

  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [volume, setVolumeState] = useState<number>(0.75);
  const [muted, setMuted] = useState<boolean>(false);
  const [prevVolume, setPrevVolume] = useState<number>(0.75);
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [showRemaining, setShowRemaining] = useState<boolean>(false);
  const [likedIds, setLikedIds] = useState<string[]>(loadInitialLikedTracks);
  const [activeDrawer, setActiveDrawer] = useState<TheaterDrawerMode>('none');
  const [viewMode, setViewMode] = useState<PlayerViewMode>('deck');
  const [waveTick, setWaveTick] = useState<number>(0);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const usingHtmlAudioRef = useRef<boolean>(false);

  const currentTrack: MediaAttachment | null =
    hasActiveSession && queue.length > 0 ? queue[currentIndex] ?? queue[0] : null;

  // Persist liked tracks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LIKED_TRACKS_KEY, JSON.stringify(likedIds));
    }
  }, [likedIds]);

  const stopAllAudio = useCallback(() => {
    soundEngine.stopAmbientStream();
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = '';
      audioElRef.current = null;
    }
    usingHtmlAudioRef.current = false;
  }, []);

  // Automatically fetch real cover artwork & metadata from the active track's user link
  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;
    void resolveRemoteMediaMetadata(currentTrack.url).then((meta) => {
      if (cancelled || !meta) return;
      if (!meta.artwork && !meta.title && !meta.artistOrHost) return;
      setQueue((prev) =>
        prev.map((item) => {
          if (item.id !== currentTrack.id) return item;
          return {
            ...item,
            artwork: meta.artwork || item.artwork,
            title:
              item.title.startsWith('Spotify ') || item.title.startsWith('Manuscript Stream')
                ? meta.title || item.title
                : item.title,
            artistOrHost:
              item.artistOrHost === 'Spotify Stream' ||
              item.artistOrHost === 'YouTube Broadcast' ||
              item.artistOrHost === 'Manuscript Session'
                ? meta.artistOrHost || item.artistOrHost
                : item.artistOrHost,
          };
        })
      );
    });
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id, currentTrack?.url]);

  // Start / synchronize audio playback whenever track, playing state, or deck/embed mode changes
  useEffect(() => {
    if (!currentTrack || !isPlaying || viewMode === 'embed') {
      stopAllAudio();
      return;
    }

    const effectiveVol = muted ? 0 : volume;
    setDuration(currentTrack.durationSec);

    if (currentTrack.isDirectAudio) {
      const audio = new Audio(currentTrack.url);
      audio.crossOrigin = 'anonymous';
      audio.volume = effectiveVol;
      audio.playbackRate = speed;
      audio.currentTime = Math.min(elapsed, Math.max(0, currentTrack.durationSec - 1));
      audioElRef.current = audio;
      usingHtmlAudioRef.current = true;

      const onMeta = () => {
        if (Number.isFinite(audio.duration) && audio.duration > 1) {
          setDuration(Math.floor(audio.duration));
        }
      };
      const onError = () => {
        // Gracefully fall back to our harmonic manuscript synthesizer if remote audio is blocked
        usingHtmlAudioRef.current = false;
        audioElRef.current = null;
        soundEngine.startAmbientStream(currentTrack.preset, effectiveVol, speed);
      };

      audio.addEventListener('loadedmetadata', onMeta);
      audio.addEventListener('error', onError);
      void audio.play().catch(() => {
        onError();
      });

      return () => {
        audio.removeEventListener('loadedmetadata', onMeta);
        audio.removeEventListener('error', onError);
        stopAllAudio();
      };
    }

    soundEngine.startAmbientStream(currentTrack.preset, effectiveVol, speed);
    return () => {
      stopAllAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, isPlaying, viewMode]);

  // Keep live volume and playback rate synced without restarting the track
  useEffect(() => {
    const effectiveVol = muted ? 0 : volume;
    if (audioElRef.current && usingHtmlAudioRef.current) {
      audioElRef.current.volume = effectiveVol;
      audioElRef.current.playbackRate = speed;
    } else if (isPlaying && currentTrack && viewMode === 'deck') {
      soundEngine.updateAmbientStream(effectiveVol, speed);
    }
  }, [volume, muted, speed, isPlaying, currentTrack, viewMode]);

  const advanceNext = useCallback(
    (isAutoAdvance: boolean) => {
      if (queue.length === 0) return;
      const nextIdx = getNextTrackIndex(
        currentIndex,
        queue.length,
        shuffle,
        repeatMode,
        isAutoAdvance
      );
      if (nextIdx === null) {
        setIsPlaying(false);
        setElapsed(0);
        return;
      }
      if (nextIdx === currentIndex) {
        setElapsed(0);
        if (audioElRef.current) {
          audioElRef.current.currentTime = 0;
        }
        setIsPlaying(true);
        return;
      }
      setCurrentIndex(nextIdx);
      setElapsed(0);
      setDuration(queue[nextIdx]?.durationSec ?? 268);
      setIsPlaying(true);
    },
    [queue, currentIndex, shuffle, repeatMode]
  );

  // Elapsed playback ticker & waveform animation clock
  useEffect(() => {
    if (!currentTrack || !isPlaying || viewMode === 'embed') return;
    const intervalMs = Math.max(250, Math.round(1000 / speed));
    const timer = window.setInterval(() => {
      setWaveTick((t) => t + 1);
      if (audioElRef.current && usingHtmlAudioRef.current && !audioElRef.current.paused) {
        const cur = audioElRef.current.currentTime;
        const dur =
          Number.isFinite(audioElRef.current.duration) && audioElRef.current.duration > 0
            ? audioElRef.current.duration
            : duration;
        setElapsed(cur);
        if (cur >= dur - 0.4) {
          advanceNext(true);
        }
      } else {
        setElapsed((prev) => {
          if (prev + 1 >= duration) {
            window.setTimeout(() => advanceNext(true), 0);
            return duration;
          }
          return prev + 1;
        });
      }
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [currentTrack, isPlaying, speed, duration, viewMode, advanceNext]);

  const playTrack = useCallback(
    (track: MediaAttachment, openTheater = false) => {
      soundEngine.playSealPress();
      const result = playTrackInQueue(queue, track);
      setQueue(result.queue);
      setCurrentIndex(result.index);
      setHasActiveSession(true);
      setElapsed(0);
      setDuration(track.durationSec);
      setViewMode('deck');
      setIsPlaying(true);
      if (openTheater) {
        setTheaterOpen(true);
      }
    },
    [queue]
  );

  const togglePlayTrackCard = useCallback(
    (track: MediaAttachment) => {
      if (currentTrack && (currentTrack.id === track.id || currentTrack.url === track.url)) {
        soundEngine.playInkClick();
        setIsPlaying((prev) => !prev);
        return;
      }
      playTrack(track, false);
    },
    [currentTrack, playTrack]
  );

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    soundEngine.playInkClick();
    setIsPlaying((prev) => !prev);
  }, [currentTrack]);

  const handlePrevious = useCallback(() => {
    if (!currentTrack) return;
    soundEngine.playInkClick();
    const decision = getPreviousTrackDecision(currentIndex, elapsed, queue.length, repeatMode);
    if (decision.action === 'restart') {
      setElapsed(0);
      if (audioElRef.current) {
        audioElRef.current.currentTime = 0;
      }
    } else {
      setCurrentIndex(decision.index);
      setElapsed(0);
      setDuration(queue[decision.index]?.durationSec ?? 268);
      setIsPlaying(true);
    }
  }, [currentTrack, currentIndex, elapsed, queue, repeatMode]);

  const handleNext = useCallback(() => {
    if (!currentTrack) return;
    soundEngine.playInkClick();
    advanceNext(false);
  }, [currentTrack, advanceNext]);

  const seekTo = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(duration, seconds));
      setElapsed(clamped);
      if (audioElRef.current && usingHtmlAudioRef.current) {
        audioElRef.current.currentTime = clamped;
      }
    },
    [duration]
  );

  const skipBy = useCallback(
    (deltaSec: number) => {
      soundEngine.playInkClick();
      seekTo(elapsed + deltaSec);
    },
    [elapsed, seekTo]
  );

  const toggleShuffle = useCallback(() => {
    soundEngine.playInkClick();
    setShuffle((prev) => !prev);
  }, []);

  const handleCycleRepeat = useCallback(() => {
    soundEngine.playInkClick();
    setRepeatMode((prev) => cycleRepeatMode(prev));
  }, []);

  const setVolume = useCallback((nextVol: number) => {
    const clamped = Math.max(0, Math.min(1, nextVol));
    setVolumeState(clamped);
    if (clamped > 0) {
      setPrevVolume(clamped);
      setMuted(false);
    } else {
      setMuted(true);
    }
  }, []);

  const toggleMute = useCallback(() => {
    soundEngine.playInkClick();
    if (muted || volume === 0) {
      setMuted(false);
      setVolumeState(prevVolume > 0 ? prevVolume : 0.7);
    } else {
      setPrevVolume(volume);
      setMuted(true);
    }
  }, [muted, volume, prevVolume]);

  const cycleSpeed = useCallback(() => {
    soundEngine.playInkClick();
    setSpeed((prev) => {
      const idx = SPEEDS.indexOf(prev);
      return SPEEDS[(idx + 1) % SPEEDS.length];
    });
  }, []);

  const toggleLikeCurrent = useCallback(
    (trackId?: string) => {
      const id = trackId || currentTrack?.id;
      if (!id) return;
      soundEngine.playInkClick();
      setLikedIds((prev) => toggleLikedTrack(prev, id));
    },
    [currentTrack?.id]
  );

  const addToQueue = useCallback((track: MediaAttachment) => {
    soundEngine.playInkClick();
    setQueue((prev) => enqueueTrack(prev, track));
  }, []);

  const jumpToQueueIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return;
      soundEngine.playInkClick();
      setCurrentIndex(index);
      setHasActiveSession(true);
      setElapsed(0);
      setDuration(queue[index].durationSec);
      setViewMode('deck');
      setIsPlaying(true);
    },
    [queue]
  );

  const removeFromQueue = useCallback(
    (trackId: string) => {
      soundEngine.playInkClick();
      const next = removeTrackFromQueue(queue, currentIndex, trackId);
      setQueue(next.queue);
      setCurrentIndex(next.currentIndex);
      if (next.queue.length === 0) {
        stopAllAudio();
        setHasActiveSession(false);
        setTheaterOpen(false);
        setIsPlaying(false);
      }
    },
    [queue, currentIndex, stopAllAudio]
  );

  const dismissPlayer = useCallback(() => {
    soundEngine.playPageTurn();
    stopAllAudio();
    setIsPlaying(false);
    setTheaterOpen(false);
    setHasActiveSession(false);
  }, [stopAllAudio]);

  // Spotify-style global keyboard shortcuts when not focused on form inputs
  useEffect(() => {
    if (!hasActiveSession) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipBy(5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipBy(-5);
      } else if (e.key.toLowerCase() === 'm') {
        toggleMute();
      } else if (e.key.toLowerCase() === 'n') {
        handleNext();
      } else if (e.key.toLowerCase() === 'p') {
        handlePrevious();
      } else if (e.key === 'Escape' && theaterOpen) {
        setTheaterOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    hasActiveSession,
    theaterOpen,
    togglePlayPause,
    skipBy,
    toggleMute,
    handleNext,
    handlePrevious,
  ]);

  return {
    queue,
    currentIndex,
    currentTrack,
    hasActiveSession,
    theaterOpen,
    setTheaterOpen,
    isPlaying,
    elapsed,
    duration,
    shuffle,
    repeatMode,
    volume: muted ? 0 : volume,
    muted,
    speed,
    showRemaining,
    toggleShowRemaining: () => setShowRemaining((prev) => !prev),
    likedIds,
    isCurrentLiked: currentTrack ? likedIds.includes(currentTrack.id) : false,
    activeDrawer,
    setActiveDrawer,
    viewMode,
    setViewMode,
    waveTick,
    playTrack,
    togglePlayTrackCard,
    togglePlayPause,
    handlePrevious,
    handleNext,
    seekTo,
    skipBy,
    toggleShuffle,
    handleCycleRepeat,
    setVolume,
    toggleMute,
    cycleSpeed,
    toggleLikeCurrent,
    addToQueue,
    jumpToQueueIndex,
    removeFromQueue,
    dismissPlayer,
  };
}

export type SpotifyPlayerController = ReturnType<typeof useSpotifyPlayer>;
