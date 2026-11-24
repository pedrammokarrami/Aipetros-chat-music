import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Headphones,
  Lock,
  Maximize2,
  MessageSquare,
  Plus,
  Radio,
  Send,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type {
  ChannelsSubTab,
  ChatMessage,
  FriendUser,
  ListeningLobby,
  MediaAttachment,
} from '../types';
import {
  classifyMediaUrl,
  formatDuration,
  resolveRemoteMediaMetadata,
} from '../utils/mediaParser';
import { validateNewLobby, type NewLobbyInput } from '../utils/socialState';
import { soundEngine } from '../utils/soundEngine';
import { MediaPreviewCard } from './MediaPreviewCard';
import { ArchivalImage, TazhibFrame } from './TazhibOrnament';

interface ChannelsViewProps {
  subTab: ChannelsSubTab;
  onSubTabChange: (tab: ChannelsSubTab) => void;
  lobbies: ListeningLobby[];
  activeLobbyId: string | null;
  onSelectLobby: (lobbyId: string | null) => void;
  onHostLobby: (input: NewLobbyInput) => void;
  onSendLobbyMessage: (lobbyId: string, content: string) => void;
  friends: FriendUser[];
  dmThreads: Record<string, ChatMessage[]>;
  activeDmHandle: string | null;
  onSelectDm: (handle: string | null) => void;
  onSendDmMessage: (friendHandle: string, content: string) => void;
  onQuickAddFriendByHandle: (rawHandle: string) => void;
  onOpenTheater: (media: MediaAttachment) => void;
  onToggleInlinePlay: (media: MediaAttachment) => void;
  onAddToQueue: (media: MediaAttachment) => void;
  activeMediaId?: string | null;
  isPlayerPlaying?: boolean;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({
  subTab,
  onSubTabChange,
  lobbies,
  activeLobbyId,
  onSelectLobby,
  onHostLobby,
  onSendLobbyMessage,
  friends,
  dmThreads,
  activeDmHandle,
  onSelectDm,
  onSendDmMessage,
  onQuickAddFriendByHandle,
  onOpenTheater,
  onToggleInlinePlay,
  onAddToQueue,
  activeMediaId = null,
  isPlayerPlaying = false,
}) => {
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);

  // Lobby message draft
  const [lobbyDraft, setLobbyDraft] = useState('');

  // DM message draft & quick handle add
  const [dmDraft, setDmDraft] = useState('');
  const [friendSearchOrHandle, setFriendSearchOrHandle] = useState('');

  // Host lobby form
  const [lobbyTitle, setLobbyTitle] = useState('');
  const [clubName, setClubName] = useState('');
  const [genreTag, setGenreTag] = useState('#JazzSession');
  const [streamUrl, setStreamUrl] = useState('');
  const [lobbyDetectedArt, setLobbyDetectedArt] = useState<string | null>(null);
  const [lobbyStatus, setLobbyStatus] = useState<'LIVE' | 'WAITING ROOM'>('LIVE');
  const [lobbyDesc, setLobbyDesc] = useState('');
  const [hostError, setHostError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = streamUrl.trim();
    if (!trimmed) {
      setLobbyDetectedArt(null);
      return;
    }
    const immediate = classifyMediaUrl(trimmed);
    if (immediate?.artwork) setLobbyDetectedArt(immediate.artwork);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void resolveRemoteMediaMetadata(trimmed).then((meta) => {
        if (cancelled || !meta) return;
        if (meta.artwork) setLobbyDetectedArt(meta.artwork);
        if (meta.title) setLobbyTitle((prev) => prev || meta.title || '');
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [streamUrl]);

  const activeLobby = lobbies.find((l) => l.id === activeLobbyId) || null;
  const activeDmFriend =
    friends.find((f) => f.handle.toLowerCase() === activeDmHandle?.toLowerCase()) || null;
  const activeDmMessages = activeDmFriend ? dmThreads[activeDmFriend.handle] || [] : [];

  const filteredFriends = friends.filter((f) => {
    const q = friendSearchOrHandle.trim().toLowerCase();
    if (!q) return true;
    return (
      f.name.toLowerCase().includes(q) ||
      f.handle.toLowerCase().includes(q) ||
      f.listeningTo.toLowerCase().includes(q)
    );
  });

  const handleSubmitHostLobby = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: NewLobbyInput = {
      title: lobbyTitle,
      clubName,
      genreTag,
      streamUrl,
      coverImageUrl: lobbyDetectedArt || undefined,
      status: lobbyStatus,
      description: lobbyDesc,
    };
    const error = validateNewLobby(payload);
    if (error) {
      soundEngine.playInkClick();
      setHostError(error);
      return;
    }
    soundEngine.playSealPress();
    onHostLobby(payload);
    setLobbyTitle('');
    setClubName('');
    setStreamUrl('');
    setLobbyDesc('');
    setLobbyDetectedArt(null);
    setHostError(null);
    setHostModalOpen(false);
  };

  const handleSendLobby = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLobby || !lobbyDraft.trim()) return;
    soundEngine.playInkClick();
    onSendLobbyMessage(activeLobby.id, lobbyDraft);
    setLobbyDraft('');
  };

  const handleSendDm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDmFriend || !dmDraft.trim()) return;
    soundEngine.playInkClick();
    onSendDmMessage(activeDmFriend.handle, dmDraft);
    setDmDraft('');
  };

  const handleQuickAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendSearchOrHandle.trim()) return;
    soundEngine.playInkClick();
    onQuickAddFriendByHandle(friendSearchOrHandle);
    setFriendSearchOrHandle('');
  };

  // Full-height Live Lobby Chat Room View
  if (subTab === 'LOBBIES' && activeLobby) {
    return (
      <section
        className="animate-unroll flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-8.5rem)] min-h-[520px]"
        aria-label={`Listening Lobby: ${activeLobby.title}`}
      >
        <TazhibFrame className="flex-1 flex flex-col overflow-hidden">
          {/* Lobby Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-[#C6A553]/40 bg-[#FAF4EA] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playQuillScratch();
                  onSelectLobby(null);
                  setMembersDrawerOpen(false);
                }}
                aria-label="Back to listening lobbies"
                className="tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 bg-[#EFE2D0] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/55 rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>BACK</span>
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span
                    className={
                      activeLobby.status === 'LIVE'
                        ? 'text-[#8C2D28] font-semibold'
                        : 'text-[#135757]'
                    }
                  >
                    [{activeLobby.status}]
                  </span>
                  <span className="text-[#6E5B47] truncate">{activeLobby.clubName}</span>
                </div>
                <h2 className="font-calligraphy text-xl sm:text-2xl font-bold text-[#241C14] truncate leading-tight">
                  {activeLobby.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPageTurn();
                setMembersDrawerOpen((open) => !open);
              }}
              aria-expanded={membersDrawerOpen}
              aria-label="Toggle online members drawer"
              className={`tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 border rounded-sm font-mono text-xs whitespace-nowrap shrink-0 ${
                membersDrawerOpen
                  ? 'bg-[#1D7A7A] text-[#FAF4EA] border-[#1D7A7A]'
                  : 'bg-[#F5EADD] text-[#3D3124] border-[#C6A553]/55 hover:border-[#1D7A7A]'
              }`}
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums">{activeLobby.members.length}</span>
              <span className="hidden sm:inline">Members</span>
            </button>
          </div>

          {/* Synced Media / Stream Link Header */}
          <div className="px-4 py-3 bg-[#EFE2D0]/85 border-b border-[#C6A553]/35 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-sm bg-[#3D3124] text-[#C6A553] flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-[#135757] truncate">
                  SYNCED STREAM · {formatDuration(activeLobby.stream.durationSec)} ·{' '}
                  {activeLobby.stream.sourceLabel}
                </p>
                <p className="font-calligraphy text-base sm:text-lg font-bold text-[#241C14] truncate leading-tight">
                  {activeLobby.stream.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSealPress();
                onOpenTheater(activeLobby.stream);
              }}
              className="tactile-btn min-h-[38px] px-3.5 inline-flex items-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
            >
              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open Theater</span>
            </button>
          </div>

          {/* Chat Feed + Optional Online Members Drawer */}
          <div className="flex-1 flex min-h-0 relative overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activeLobby.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[78%] rounded-sm p-3.5 border ${
                      msg.isMe
                        ? 'bg-[#EFE2D0] border-[#1D7A7A]/45'
                        : 'bg-[#FAF4EA] border-[#C6A553]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-calligraphy font-bold text-base text-[#241C14]">
                        {msg.senderName}{' '}
                        <span className="font-mono font-normal text-[11px] text-[#6E5B47]">
                          {msg.senderHandle}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-[#6E5B47] tabular-nums">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#3D3124] leading-relaxed break-words">
                      {msg.content}
                    </p>
                    {msg.media && (
                      <MediaPreviewCard
                        media={msg.media}
                        onOpenTheater={onOpenTheater}
                        onToggleInlinePlay={onToggleInlinePlay}
                        onAddToQueue={onAddToQueue}
                        isActiveTrack={activeMediaId === msg.media.id}
                        isPlaying={isPlayerPlaying && activeMediaId === msg.media.id}
                        compact
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Online Members Drawer */}
            {membersDrawerOpen && (
              <aside
                aria-label="Online Lobby Members"
                className="w-64 sm:w-72 border-l border-[#C6A553]/45 bg-[#FAF4EA] p-4 overflow-y-auto animate-drawer-slide absolute right-0 top-0 bottom-0 md:static z-10 shadow-lg md:shadow-none"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#C6A553]/30">
                  <h3 className="font-calligraphy text-lg font-bold text-[#241C14]">
                    Online Members ({activeLobby.members.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMembersDrawerOpen(false)}
                    aria-label="Close members drawer"
                    className="md:hidden p-1 text-[#6E5B47] hover:text-[#241C14]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <ul className="mt-3 space-y-3">
                  {activeLobby.members.map((member) => (
                    <li
                      key={member.handle}
                      className="flex items-center gap-2.5 pb-2.5 border-b border-[#C6A553]/20 last:border-b-0"
                    >
                      <span className="w-9 h-9 rounded-sm bg-[#3D3124] text-[#C6A553] font-calligraphy font-bold flex items-center justify-center shrink-0">
                        {member.initials}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#241C14] truncate">
                          {member.name}
                        </p>
                        <p className="font-mono text-[10px] text-[#135757]">
                          {member.role} · {member.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>

          {/* Live Chat Input */}
          <form
            onSubmit={handleSendLobby}
            className="p-3.5 border-t border-[#C6A553]/40 bg-[#FAF4EA]"
          >
            <label htmlFor="lobby-chat-input" className="sr-only">
              Send a message or audio link to {activeLobby.title}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="lobby-chat-input"
                type="text"
                value={lobbyDraft}
                onChange={(e) => setLobbyDraft(e.target.value)}
                placeholder="Write a note or paste any music/podcast URL for inline preview..."
                className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/75 focus:outline-none focus:border-[#1D7A7A]"
              />
              <button
                type="submit"
                aria-label="Send lobby message"
                className="tactile-btn min-h-[44px] px-4 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm inline-flex items-center gap-1.5 font-mono text-xs whitespace-nowrap"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </TazhibFrame>
      </section>
    );
  }

  // Full-height 1-on-1 Encrypted Private Chat Screen
  if (subTab === 'DMS' && activeDmFriend) {
    return (
      <section
        className="animate-unroll flex flex-col h-[calc(100vh-11rem)] md:h-[calc(100vh-8.5rem)] min-h-[520px]"
        aria-label={`Private direct message with ${activeDmFriend.name}`}
      >
        <TazhibFrame accent="turquoise" className="flex-1 flex flex-col overflow-hidden">
          {/* Private Chat Header */}
          <div className="p-3.5 sm:p-4 border-b border-[#C6A553]/40 bg-[#FAF4EA] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playQuillScratch();
                  onSelectDm(null);
                }}
                aria-label="Back to friends list"
                className="tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 bg-[#EFE2D0] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/55 rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>BACK</span>
              </button>
              <div className="w-10 h-10 rounded-sm bg-[#3D3124] text-[#C6A553] font-calligraphy font-bold text-lg flex items-center justify-center shrink-0">
                {activeDmFriend.initials}
              </div>
              <div className="min-w-0">
                <h2 className="font-calligraphy text-xl font-bold text-[#241C14] truncate leading-tight">
                  {activeDmFriend.name}{' '}
                  <span className="font-mono text-xs font-normal text-[#6E5B47]">
                    {activeDmFriend.handle}
                  </span>
                </h2>
                <p className="text-xs text-[#135757] truncate">{activeDmFriend.listeningTo}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1D7A7A]/10 border border-[#1D7A7A]/40 rounded-sm font-mono text-[11px] text-[#135757] whitespace-nowrap">
              <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>E2E P2P // ZERO SERVER STORAGE</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {activeDmMessages.length === 0 ? (
              <div className="py-12 text-center">
                <p className="font-calligraphy italic text-2xl text-[#6E5B47]">
                  Direct manuscript thread opened with {activeDmFriend.name}.
                </p>
                <p className="mt-1 text-xs font-mono text-[#6E5B47]">
                  Messages stay peer-to-peer on your local device. Paste any audio link for an
                  inline preview.
                </p>
              </div>
            ) : (
              activeDmMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[78%] rounded-sm p-3.5 border ${
                      msg.isMe
                        ? 'bg-[#EFE2D0] border-[#1D7A7A]/45'
                        : 'bg-[#FAF4EA] border-[#C6A553]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-calligraphy font-bold text-base text-[#241C14]">
                        {msg.senderName}
                      </span>
                      <span className="font-mono text-[11px] text-[#6E5B47] tabular-nums">
                        {msg.timestamp}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#3D3124] leading-relaxed break-words">
                      {msg.content}
                    </p>
                    {msg.media && (
                      <MediaPreviewCard
                        media={msg.media}
                        onOpenTheater={onOpenTheater}
                        onToggleInlinePlay={onToggleInlinePlay}
                        onAddToQueue={onAddToQueue}
                        isActiveTrack={activeMediaId === msg.media.id}
                        isPlaying={isPlayerPlaying && activeMediaId === msg.media.id}
                        compact
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DM Input */}
          <form
            onSubmit={handleSendDm}
            className="p-3.5 border-t border-[#C6A553]/40 bg-[#FAF4EA]"
          >
            <label htmlFor="dm-chat-input" className="sr-only">
              Write encrypted direct message to {activeDmFriend.name}
            </label>
            <div className="flex items-center gap-2">
              <input
                id="dm-chat-input"
                type="text"
                value={dmDraft}
                onChange={(e) => setDmDraft(e.target.value)}
                placeholder={`Send encrypted message or stream URL to ${activeDmFriend.handle}...`}
                className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/75 focus:outline-none focus:border-[#1D7A7A]"
              />
              <button
                type="submit"
                aria-label="Send direct message"
                className="tactile-btn min-h-[44px] px-4 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm inline-flex items-center gap-1.5 font-mono text-xs whitespace-nowrap"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>
        </TazhibFrame>
      </section>
    );
  }

  return (
    <section className="animate-unroll" aria-label="Channels Hub">
      {/* Top Header & Unified Social Hub Switcher */}
      <div className="pb-5 border-b border-[#C6A553]/40 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-[#135757] uppercase">
            Unified Social Hub · Synced Audio &amp; Private Relay
          </p>
          <h2 className="font-calligraphy text-3xl sm:text-4xl font-bold text-[#241C14] mt-1">
            Salons, Lobbies &amp; Direct Letters
          </h2>
        </div>

        {/* Top Switcher */}
        <div
          className="inline-flex p-1 bg-[#EFE2D0] border border-[#C6A553]/55 rounded-sm self-start lg:self-auto"
          role="tablist"
          aria-label="Switch between Lobbies and Direct Messages"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'LOBBIES'}
            onClick={() => {
              soundEngine.playQuillScratch();
              onSubTabChange('LOBBIES');
            }}
            className={`tactile-btn min-h-[38px] px-3.5 py-1.5 text-xs font-mono rounded-sm whitespace-nowrap transition-colors ${
              subTab === 'LOBBIES'
                ? 'bg-[#3D3124] text-[#FAF4EA]'
                : 'text-[#3D3124] hover:text-[#135757]'
            }`}
          >
            CLUBS &amp; LISTENING LOBBIES
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'DMS'}
            onClick={() => {
              soundEngine.playQuillScratch();
              onSubTabChange('DMS');
            }}
            className={`tactile-btn min-h-[38px] px-3.5 py-1.5 text-xs font-mono rounded-sm whitespace-nowrap transition-colors ${
              subTab === 'DMS'
                ? 'bg-[#3D3124] text-[#FAF4EA]'
                : 'text-[#3D3124] hover:text-[#135757]'
            }`}
          >
            DIRECT MESSAGES &amp; FRIENDS
          </button>
        </div>
      </div>

      {/* LOBBIES LIST VIEW */}
      {subTab === 'LOBBIES' ? (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-sm text-[#6E5B47]">
              Join a synchronized listening room or host your own music/podcast salon.
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playPageTurn();
                setHostError(null);
                setHostModalOpen(true);
              }}
              className="tactile-btn wax-seal-btn min-h-[42px] px-4 py-2 inline-flex items-center gap-2 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 text-[#C6A553]" aria-hidden="true" />
              <span>+ HOST LISTENING LOBBY</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lobbies.map((lobby) => (
              <TazhibFrame key={lobby.id} dense className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span
                      className={
                        lobby.status === 'LIVE'
                          ? 'text-[#8C2D28] font-semibold'
                          : 'text-[#135757] font-medium'
                      }
                    >
                      [{lobby.status}]
                    </span>
                    <span className="text-[#6E5B47] tabular-nums">
                      {lobby.members.length} online · {lobby.genreTag}
                    </span>
                  </div>

                  <h3 className="font-calligraphy text-2xl font-bold text-[#241C14] mt-1.5">
                    {lobby.title}
                  </h3>
                  <p className="text-xs font-mono text-[#135757] mt-0.5">{lobby.clubName}</p>
                  <p className="text-sm text-[#3D3124] mt-2 leading-relaxed">{lobby.description}</p>

                  <div className="mt-3 p-2.5 vellum-inset rounded-sm text-xs flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-[#9B7B2F] shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium text-[#241C14]">
                      {lobby.stream.title}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#C6A553]/30 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-[#6E5B47] truncate">
                    Host: {lobby.hostName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onSelectLobby(lobby.id);
                    }}
                    className="tactile-btn min-h-[40px] px-4 inline-flex items-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap"
                  >
                    <Radio className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Enter Salon</span>
                  </button>
                </div>
              </TazhibFrame>
            ))}
          </div>
        </div>
      ) : (
        /* DIRECT MESSAGES & FRIENDS LIST VIEW */
        <div className="mt-5">
          {/* Quick Handle Search & Add Friend Bar */}
          <form
            onSubmit={handleQuickAddFriend}
            className="p-4 vellum-sheet rounded-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            <label htmlFor="friend-handle-search" className="sr-only">
              Search friends or enter a scribe handle to add
            </label>
            <input
              id="friend-handle-search"
              type="text"
              value={friendSearchOrHandle}
              onChange={(e) => setFriendSearchOrHandle(e.target.value)}
              placeholder="Filter friends or type @handle (e.g. @hafez_lute) to Add Friend..."
              className="flex-1 min-h-[42px] px-3.5 py-2 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/75 focus:outline-none focus:border-[#1D7A7A]"
            />
            <button
              type="submit"
              className="tactile-btn min-h-[42px] px-4 inline-flex items-center justify-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>Add Friend</span>
            </button>
          </form>

          {/* Friends Directory */}
          <div className="mt-5 space-y-3">
            {filteredFriends.length === 0 ? (
              <TazhibFrame className="p-6 text-center">
                <p className="font-calligraphy italic text-xl text-[#6E5B47]">
                  No connected friends match “{friendSearchOrHandle}”.
                </p>
                <p className="mt-1 text-xs font-mono text-[#6E5B47]">
                  Click “Add Friend” above to inscribe that handle directly into your ledger.
                </p>
              </TazhibFrame>
            ) : (
              filteredFriends.map((friend) => {
                const thread = dmThreads[friend.handle] || [];
                const lastMsg = thread[thread.length - 1];
                return (
                  <TazhibFrame
                    key={friend.id}
                    dense
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-sm bg-[#3D3124] text-[#C6A553] border border-[#C6A553]/70 flex items-center justify-center font-calligraphy font-bold text-lg shrink-0">
                        {friend.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <h3 className="font-calligraphy text-xl font-bold text-[#241C14] leading-tight">
                            {friend.name}
                          </h3>
                          <span className="font-mono text-xs text-[#6E5B47]">{friend.handle}</span>
                          <span className="font-mono text-[11px] text-[#135757]">
                            · {friend.online ? 'Online' : 'Away'}
                          </span>
                        </div>
                        <p className="text-xs text-[#135757] mt-0.5 truncate">
                          Listening: {friend.listeningTo}
                        </p>
                        {lastMsg && (
                          <p className="text-xs text-[#6E5B47] mt-1 truncate">
                            Last note ({lastMsg.timestamp}): {lastMsg.content}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playPageTurn();
                        onSelectDm(friend.handle);
                      }}
                      aria-label={`Message ${friend.name}`}
                      className="tactile-btn min-h-[40px] px-4 inline-flex items-center justify-center gap-1.5 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs whitespace-nowrap shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>MESSAGE</span>
                    </button>
                  </TazhibFrame>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* + HOST LISTENING LOBBY Modal */}
      {hostModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#241C14]/75 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="host-lobby-title"
        >
          <TazhibFrame accent="turquoise" className="w-full max-w-lg p-6 animate-ink-reveal my-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#C6A553]/35 pb-3.5">
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
                  Open Synchronized Salon
                </p>
                <h2
                  id="host-lobby-title"
                  className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14]"
                >
                  Host Listening Lobby
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHostModalOpen(false)}
                aria-label="Close host lobby modal"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitHostLobby} className="mt-4 space-y-4">
              {hostError && (
                <div
                  role="alert"
                  className="p-3 text-xs font-mono text-[#8C2D28] bg-[#8C2D28]/10 border border-[#8C2D28]/40 rounded-sm"
                >
                  {hostError}
                </div>
              )}

              <div>
                <label htmlFor="lobby-name" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Lobby Title *
                </label>
                <input
                  id="lobby-name"
                  type="text"
                  value={lobbyTitle}
                  onChange={(e) => setLobbyTitle(e.target.value)}
                  placeholder="e.g., Sunset Ambient Vinyl & Poetry"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="lobby-club" className="block text-xs font-mono text-[#6E5B47] mb-1">
                    Club / Circle Name
                  </label>
                  <input
                    id="lobby-club"
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="e.g., Shiraz Listening Guild"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
                  />
                </div>
                <div>
                  <label htmlFor="lobby-genre" className="block text-xs font-mono text-[#6E5B47] mb-1">
                    Genre Tag
                  </label>
                  <input
                    id="lobby-genre"
                    type="text"
                    value={genreTag}
                    onChange={(e) => setGenreTag(e.target.value)}
                    placeholder="#JazzSession"
                    className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lobby-stream" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Music / Podcast Stream Link *
                </label>
                <input
                  id="lobby-stream"
                  type="url"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/... or https://youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
                />
                {lobbyDetectedArt && (
                  <div className="mt-2.5 p-2.5 bg-[#EFE2D0]/85 border border-[#C6A553]/45 rounded-sm flex items-center gap-3">
                    <div className="w-12 h-12 rounded-sm overflow-hidden border border-[#C6A553]/65 shrink-0">
                      <ArchivalImage
                        src={lobbyDetectedArt}
                        alt="Detected lobby cover artwork"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-[#135757] font-semibold">
                        Cover artwork detected from link
                      </p>
                      <p className="font-mono text-[10px] text-[#6E5B47] truncate">
                        {lobbyDetectedArt}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#6E5B47]">Room Mode:</span>
                {(['LIVE', 'WAITING ROOM'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      soundEngine.playInkClick();
                      setLobbyStatus(mode);
                    }}
                    className={`tactile-btn px-3 py-1.5 text-xs font-mono rounded-sm border ${
                      lobbyStatus === mode
                        ? 'bg-[#3D3124] text-[#FAF4EA] border-[#C6A553]'
                        : 'bg-[#F5EADD] text-[#3D3124] border-[#C6A553]/45'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div>
                <label htmlFor="lobby-desc" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Salon Note (optional)
                </label>
                <textarea
                  id="lobby-desc"
                  rows={2}
                  value={lobbyDesc}
                  onChange={(e) => setLobbyDesc(e.target.value)}
                  placeholder="Describe the mood or episode you are cueing..."
                  className="w-full px-3.5 py-2 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#C6A553]/30">
                <button
                  type="button"
                  onClick={() => setHostModalOpen(false)}
                  className="tactile-btn min-h-[42px] px-4 py-2 text-xs font-mono text-[#6E5B47] hover:text-[#241C14]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tactile-btn wax-seal-btn min-h-[42px] px-5 py-2 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs"
                >
                  Launch Synced Lobby
                </button>
              </div>
            </form>
          </TazhibFrame>
        </div>
      )}
    </section>
  );
};
