import React, { useState } from 'react';
import {
  Headphones,
  ListPlus,
  MessageSquare,
  Pause,
  Play,
  Radio,
  Search,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type {
  ExploreClub,
  FriendUser,
  ListeningLobby,
  MediaAttachment,
  TrendingComposition,
} from '../types';
import { filterExploreContent } from '../utils/socialState';
import { soundEngine } from '../utils/soundEngine';
import { ArchivalImage, CalligraphicDivider, TazhibFrame } from './TazhibOrnament';

interface ExploreViewProps {
  clubs: ExploreClub[];
  lobbies: ListeningLobby[];
  trending: TrendingComposition[];
  discoverScribes: FriendUser[];
  friends: FriendUser[];
  activeMediaId?: string | null;
  isPlayerPlaying?: boolean;
  onJoinLobby: (lobbyId: string) => void;
  onAddFriend: (handle: string, name: string, initials: string) => void;
  onStartDm: (friendHandle: string) => void;
  onOpenTheater: (media: MediaAttachment) => void;
  onToggleInlinePlay: (media: MediaAttachment) => void;
  onAddToQueue: (media: MediaAttachment) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  clubs,
  lobbies,
  trending,
  discoverScribes,
  friends,
  activeMediaId = null,
  isPlayerPlaying = false,
  onJoinLobby,
  onAddFriend,
  onStartDm,
  onOpenTheater,
  onToggleInlinePlay,
  onAddToQueue,
}) => {
  const [query, setQuery] = useState('');

  const allScribes = [
    ...discoverScribes,
    ...friends.filter(
      (f) => !discoverScribes.some((d) => d.handle.toLowerCase() === f.handle.toLowerCase())
    ),
  ];

  const filtered = filterExploreContent(query, clubs, lobbies, trending, allScribes);

  const isFriend = (handle: string) =>
    friends.some((f) => f.handle.toLowerCase() === handle.toLowerCase());

  return (
    <section className="animate-unroll" aria-label="Explore Anthology">
      {/* Header & Search */}
      <div className="pb-5 border-b border-[#C6A553]/40 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-[#135757] uppercase">
            Curatorial Index · Salons &amp; Recordings
          </p>
          <h2 className="font-calligraphy text-3xl sm:text-4xl font-bold text-[#241C14] mt-1">
            Explore Clubs &amp; Active Lobbies
          </h2>
        </div>

        <div className="relative w-full md:w-80">
          <label htmlFor="explore-search" className="sr-only">
            Search clubs, lobbies, compositions, or scribes
          </label>
          <Search
            className="w-4 h-4 text-[#6E5B47] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="explore-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs, #tags, or @scribes..."
            className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#FAF4EA] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/75 focus:outline-none focus:border-[#1D7A7A]"
          />
        </div>
      </div>

      {/* 1. Active Listening Lobbies */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-calligraphy text-2xl font-bold text-[#241C14]">
            Active Listening Lobbies
          </h3>
          <span className="font-mono text-xs text-[#6E5B47] tabular-nums">
            {filtered.lobbies.length} rooms open
          </span>
        </div>

        {filtered.lobbies.length === 0 ? (
          <p className="text-sm text-[#6E5B47] italic py-4">No listening lobbies match “{query}”.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.lobbies.map((lobby) => (
              <TazhibFrame key={lobby.id} dense className="p-4 sm:p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span
                      className={
                        lobby.status === 'LIVE' ? 'text-[#8C2D28] font-semibold' : 'text-[#135757]'
                      }
                    >
                      [{lobby.status}]
                    </span>
                    <span className="text-[#6E5B47] tabular-nums">
                      {lobby.members.length} listening · {lobby.genreTag}
                    </span>
                  </div>
                  <h4 className="font-calligraphy text-xl font-bold text-[#241C14] mt-1.5">
                    {lobby.title}
                  </h4>
                  <p className="text-xs text-[#6E5B47] mt-1 line-clamp-2">{lobby.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#C6A553]/30 flex items-center justify-between gap-3">
                  <span className="text-xs font-mono text-[#6E5B47] truncate">
                    Host: {lobby.hostHandle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onJoinLobby(lobby.id);
                    }}
                    className="tactile-btn min-h-[38px] px-3.5 py-1.5 inline-flex items-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553]/75 rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
                  >
                    <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Join Lobby</span>
                  </button>
                </div>
              </TazhibFrame>
            ))}
          </div>
        )}
      </div>

      <CalligraphicDivider className="my-7" />

      {/* 2. Trending Compositions & Podcasts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-calligraphy text-2xl font-bold text-[#241C14]">
            Trending Compositions &amp; Broadcasts
          </h3>
          <span className="font-mono text-xs text-[#6E5B47]">Tap to open Theater</span>
        </div>

        <TazhibFrame dense className="divide-y divide-[#C6A553]/30">
          {filtered.trending.length === 0 ? (
            <p className="p-5 text-sm text-[#6E5B47] italic">
              No trending recordings match “{query}”.
            </p>
          ) : (
            filtered.trending.map((item) => (
              <div
                key={item.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#EFE2D0]/55 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-sm text-[#9B7B2F] font-semibold tabular-nums w-6 shrink-0">
                    {item.rank}.
                  </span>
                  <div className="w-12 h-12 rounded-sm overflow-hidden border border-[#C6A553]/50 shrink-0">
                    <ArchivalImage
                      src={item.media.artwork}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-calligraphy text-lg font-bold text-[#241C14] truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#6E5B47] truncate">
                      {item.artist} · <span className="font-mono">{item.tag}</span> ·{' '}
                      <span className="font-mono tabular-nums">{item.plays.toLocaleString()} plays</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddToQueue(item.media)}
                    aria-label={`Add ${item.title} to queue`}
                    title="Add to Queue"
                    className="tactile-btn min-w-[38px] min-h-[40px] flex items-center justify-center bg-[#FAF4EA] hover:bg-[#EFE2D0] text-[#3D3124] border border-[#C6A553]/50 rounded-sm"
                  >
                    <ListPlus className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleInlinePlay(item.media)}
                    aria-label={
                      activeMediaId === item.media.id && isPlayerPlaying
                        ? `Pause ${item.title}`
                        : `Play ${item.title}`
                    }
                    className="tactile-btn min-w-[44px] min-h-[40px] px-3 inline-flex items-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553]/75 rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
                  >
                    {activeMediaId === item.media.id && isPlayerPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {activeMediaId === item.media.id && isPlayerPlaying ? 'Pause' : 'Play'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onOpenTheater(item.media);
                    }}
                    aria-label={`Open ${item.title} in Fullscreen Theater`}
                    className="tactile-btn min-h-[40px] px-2.5 bg-[#FAF4EA] hover:bg-[#EFE2D0] text-[#3D3124] border border-[#C6A553]/60 rounded-sm font-mono text-xs whitespace-nowrap hidden md:inline-flex items-center"
                  >
                    Theater
                  </button>
                </div>
              </div>
            ))
          )}
        </TazhibFrame>
      </div>

      <CalligraphicDivider className="my-7" />

      {/* 3. Featured Music & Podcast Clubs */}
      <div>
        <h3 className="font-calligraphy text-2xl font-bold text-[#241C14] mb-3">
          Music &amp; Podcast Clubs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.clubs.map((club) => (
            <TazhibFrame key={club.id} dense className="p-4 flex gap-4 items-stretch">
              <div className="w-20 sm:w-24 shrink-0 rounded-sm overflow-hidden border border-[#C6A553]/50 bg-[#EFE2D0]">
                <ArchivalImage
                  src={club.artwork}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <div>
                  <p className="font-mono text-[11px] text-[#135757]">
                    {club.genreTag} · <span className="tabular-nums">{club.memberCount} scribes</span>
                  </p>
                  <h4 className="font-calligraphy text-xl font-bold text-[#241C14] leading-snug mt-0.5">
                    {club.name}
                  </h4>
                  <p className="text-xs text-[#6E5B47] mt-1 line-clamp-2">{club.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#6E5B47] truncate">
                    Curated by {club.curator}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playQuillScratch();
                      onJoinLobby(club.linkedLobbyId);
                    }}
                    className="tactile-btn text-xs font-mono text-[#135757] hover:text-[#241C14] underline underline-offset-4 whitespace-nowrap shrink-0"
                  >
                    Open Salon →
                  </button>
                </div>
              </div>
            </TazhibFrame>
          ))}
        </div>
      </div>

      <CalligraphicDivider className="my-7" />

      {/* 4. Discover Scribes / Players */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-calligraphy text-2xl font-bold text-[#241C14]">
            Discover Scribes &amp; Listeners
          </h3>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[#6E5B47]">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{filtered.scribes.length} profiles</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.scribes.map((scribe) => {
            const connected = isFriend(scribe.handle);
            return (
              <div
                key={scribe.handle}
                className="p-4 vellum-sheet rounded-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-sm bg-[#3D3124] text-[#C6A553] border border-[#C6A553]/70 flex items-center justify-center font-calligraphy font-bold text-base shrink-0">
                    {scribe.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="font-calligraphy text-lg font-bold text-[#241C14] truncate">
                      {scribe.name}
                    </p>
                    <p className="font-mono text-[11px] text-[#6E5B47] truncate">
                      {scribe.handle} · Rep {scribe.reputation}
                    </p>
                    <p className="text-xs text-[#135757] truncate mt-0.5 inline-flex items-center gap-1 max-w-full">
                      <Headphones className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span className="truncate">{scribe.listeningTo}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {connected ? (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playQuillScratch();
                        onStartDm(scribe.handle);
                      }}
                      className="tactile-btn min-h-[38px] px-3 inline-flex items-center gap-1.5 bg-[#EFE2D0] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/60 rounded-sm font-mono text-xs whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Message</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playInkClick();
                        onAddFriend(scribe.handle, scribe.name, scribe.initials);
                      }}
                      className="tactile-btn min-h-[38px] px-3 inline-flex items-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553]/70 rounded-sm font-mono text-xs whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Add Friend</span>
                    </button>
                  )}
                  {connected && (
                    <span className="sr-only">
                      <UserCheck className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
