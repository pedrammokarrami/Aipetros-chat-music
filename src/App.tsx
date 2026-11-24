import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  Compass,
  Headphones,
  Radio,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AlertsView } from './components/AlertsView';
import { ChannelsView } from './components/ChannelsView';
import { ExploreView } from './components/ExploreView';
import { FeedView } from './components/FeedView';
import { FullscreenTheaterModal } from './components/FullscreenTheaterModal';
import { LockedManuscriptGate } from './components/LockedManuscriptGate';
import { PersistentPlayerBar } from './components/PersistentPlayerBar';
import { BridgeSettingsModal, ScribeProfileModal } from './components/ProfileSettingsModals';
import { CalligraphicDivider, NavaNegarEmblem, TazhibFrame } from './components/TazhibOrnament';
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer';
import {
  DISCOVER_SCRIBES,
  EXPLORE_CLUBS,
  INITIAL_BRIDGE_SETTINGS,
  INITIAL_DM_THREADS,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_FRIENDS,
  INITIAL_LOBBIES,
  INITIAL_NOTIFICATIONS,
  INITIAL_POSTS,
  INITIAL_USER_PROFILE,
  TRENDING_COMPOSITIONS,
} from './data/seedData';
import type {
  ActiveTab,
  BridgeSettings,
  ChannelsSubTab,
  ChatMessage,
  DossierPost,
  FriendRequest,
  FriendUser,
  ListeningLobby,
  MediaAttachment,
  NotificationItem,
  UserProfile,
} from './types';
import { generateShortLink, parseMessageMedia } from './utils/mediaParser';
import {
  acceptFriendRequestState,
  addCommentToPost,
  createDossierPost,
  createFriendFromHandle,
  createListeningLobby,
  declineFriendRequestState,
  togglePostLike,
  type NewDossierInput,
  type NewLobbyInput,
} from './utils/socialState';
import { soundEngine } from './utils/soundEngine';

const UNLOCK_STORAGE_KEY = 'nava_negar_unlocked';

function getInitialUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('autostart') === '1') return true;
  return window.localStorage.getItem(UNLOCK_STORAGE_KEY) === 'true';
}

export default function App() {
  const [unlocked, setUnlocked] = useState<boolean>(getInitialUnlocked);
  const [activeTab, setActiveTab] = useState<ActiveTab>('FEED');
  const [channelsSubTab, setChannelsSubTab] = useState<ChannelsSubTab>('LOBBIES');
  const [activeLobbyId, setActiveLobbyId] = useState<string | null>(null);
  const [activeDmHandle, setActiveDmHandle] = useState<string | null>(null);

  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [pingMs, setPingMs] = useState<number>(12);

  // Domain State
  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [bridgeSettings, setBridgeSettings] = useState<BridgeSettings>(INITIAL_BRIDGE_SETTINGS);
  const [posts, setPosts] = useState<DossierPost[]>(INITIAL_POSTS);
  const [lobbies, setLobbies] = useState<ListeningLobby[]>(INITIAL_LOBBIES);
  const [friends, setFriends] = useState<FriendUser[]>(INITIAL_FRIENDS);
  const [dmThreads, setDmThreads] = useState<Record<string, ChatMessage[]>>(INITIAL_DM_THREADS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(INITIAL_FRIEND_REQUESTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Overlays & Modals
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const initialTracks = useMemo<MediaAttachment[]>(() => {
    const seen = new Set<string>();
    const list: MediaAttachment[] = [];
    for (const post of INITIAL_POSTS) {
      if (post.media && !seen.has(post.media.id)) {
        seen.add(post.media.id);
        list.push(post.media);
      }
    }
    for (const item of TRENDING_COMPOSITIONS) {
      if (item.media && !seen.has(item.media.id)) {
        seen.add(item.media.id);
        list.push(item.media);
      }
    }
    return list;
  }, []);

  const player = useSpotifyPlayer(initialTracks);

  // Subtle realistic local P2P ping indicator update
  useEffect(() => {
    if (!bridgeSettings.localP2PMesh) return;
    const interval = window.setInterval(() => {
      setPingMs((prev) => {
        const options = [11, 12, 12, 13, 14];
        const next = options[(prev + Math.floor(Date.now() / 4000)) % options.length];
        return next;
      });
    }, 4500);
    return () => window.clearInterval(interval);
  }, [bridgeSettings.localP2PMesh]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const alertBadgeCount = useMemo(
    () => friendRequests.length + notifications.filter((n) => !n.read).length,
    [friendRequests.length, notifications]
  );

  const userRecentPosts = useMemo(
    () => posts.filter((p) => p.authorHandle.toLowerCase() === user.handle.toLowerCase()),
    [posts, user.handle]
  );

  const handleUnlock = (channel: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(UNLOCK_STORAGE_KEY, 'true');
    }
    setUnlocked(true);
    setUser((prev) => ({
      ...prev,
      artisanReputation: prev.artisanReputation + 25,
      referralsSent: prev.referralsSent + 1,
    }));
    setNotifications((prev) => [
      {
        id: `notif-unlock-${Date.now()}`,
        type: 'referral',
        actorName: 'Nava-Negar Anthology',
        actorHandle: '@scribe_seal',
        message: `unsealed via ${channel} invitation (+25 Artisan Reputation).`,
        timestamp: 'Just now',
        read: false,
        targetTab: 'FEED',
      },
      ...prev,
    ]);
    showToast(`Anthology unsealed via ${channel} · +25 Artisan Reputation`);
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    soundEngine.setMuted(nextMuted);
    setMuted(nextMuted);
    if (!nextMuted) {
      soundEngine.playInkClick();
    }
  };

  const handleSwitchTab = (tab: ActiveTab) => {
    if (tab !== activeTab) {
      soundEngine.playQuillScratch();
      setActiveTab(tab);
    }
  };

  // Feed Actions
  const handleCreatePost = (input: NewDossierInput) => {
    const newPost = createDossierPost(input, user);
    setPosts((prev) => [newPost, ...prev]);
    setUser((prev) => ({ ...prev, artisanReputation: prev.artisanReputation + 10 }));
    showToast('New dossier inscribed to the public feed (+10 Reputation)');
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) => togglePostLike(prev, postId));
  };

  const handleAddComment = (postId: string, content: string) => {
    setPosts((prev) => addCommentToPost(prev, postId, content, user));
  };

  const handleAddFriend = (handle: string, name: string, initials: string) => {
    if (friends.some((f) => f.handle.toLowerCase() === handle.toLowerCase())) {
      showToast(`${name} is already in your Friends list`);
      return;
    }
    const newFriend: FriendUser = {
      id: `fr-${Date.now()}`,
      handle,
      name,
      initials,
      online: true,
      listeningTo: 'Browsing NAVA-NEGAR',
      reputation: 620,
      bio: 'Connected through the public manuscript anthology.',
    };
    setFriends((prev) => [newFriend, ...prev]);
    setDmThreads((prev) => ({
      ...prev,
      [handle]: prev[handle] || [],
    }));
    showToast(`Added ${name} (${handle}) to Friends`);
  };

  const handleQuickAddFriendByHandle = (rawHandle: string) => {
    const created = createFriendFromHandle(rawHandle);
    if (!created) {
      showToast('Enter a valid handle such as @hafez_lute');
      return;
    }
    if (friends.some((f) => f.handle.toLowerCase() === created.handle.toLowerCase())) {
      showToast(`${created.handle} is already in your Friends list`);
      return;
    }
    setFriends((prev) => [created, ...prev]);
    setDmThreads((prev) => ({ ...prev, [created.handle]: [] }));
    showToast(`Connected with ${created.name} (${created.handle})`);
  };

  const handleShareToLobby = (lobbyId: string, post: DossierPost) => {
    const targetLobby = lobbies.find((l) => l.id === lobbyId);
    if (!targetLobby) return;
    const shareUrl =
      post.media?.url || generateShortLink('dossier', post.id, bridgeSettings.customShortDomain);
    const content = `Shared dossier "${post.title}" (${post.workTitle} — ${post.artistName}) ${shareUrl}`;
    const parsed = parseMessageMedia(content, {
      title: post.workTitle,
      artistOrHost: post.artistName,
      artwork: post.media?.artwork,
      preset: post.media?.preset,
    });

    const sharedMsg: ChatMessage = {
      id: `lmsg-share-${Date.now()}`,
      senderHandle: user.handle,
      senderName: user.name,
      senderInitials: user.initials,
      content,
      timestamp: 'Just now',
      isMe: true,
      media: parsed.media || post.media,
    };

    setLobbies((prev) =>
      prev.map((l) => (l.id === lobbyId ? { ...l, messages: [...l.messages, sharedMsg] } : l))
    );
    showToast(`Dispatched dossier to ${targetLobby.title}`);
  };

  const handleShareToDm = (friendHandle: string, post: DossierPost) => {
    const shareUrl =
      post.media?.url || generateShortLink('dossier', post.id, bridgeSettings.customShortDomain);
    const content = `Thought you would appreciate this dossier: "${post.title}" ${shareUrl}`;
    const parsed = parseMessageMedia(content, {
      title: post.workTitle,
      artistOrHost: post.artistName,
      artwork: post.media?.artwork,
      preset: post.media?.preset,
    });

    const msg: ChatMessage = {
      id: `dm-share-${Date.now()}`,
      senderHandle: user.handle,
      senderName: user.name,
      senderInitials: user.initials,
      content,
      timestamp: 'Just now',
      isMe: true,
      media: parsed.media || post.media,
    };

    setDmThreads((prev) => ({
      ...prev,
      [friendHandle]: [...(prev[friendHandle] || []), msg],
    }));
    showToast(`Sent encrypted dossier scroll to ${friendHandle}`);
  };

  // Channels Actions
  const handleHostLobby = (input: NewLobbyInput) => {
    const created = createListeningLobby(input, user);
    setLobbies((prev) => [created, ...prev]);
    setChannelsSubTab('LOBBIES');
    setActiveLobbyId(created.id);
    showToast(`Listening lobby "${created.title}" is now open`);
  };

  const handleSendLobbyMessage = (lobbyId: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const parsed = parseMessageMedia(trimmed);
    const now = new Date();
    const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `lmsg-${Date.now()}`,
      senderHandle: user.handle,
      senderName: user.name,
      senderInitials: user.initials,
      content: trimmed,
      timestamp: hhmm,
      isMe: true,
      media: parsed.media,
    };

    setLobbies((prev) =>
      prev.map((lobby) =>
        lobby.id === lobbyId ? { ...lobby, messages: [...lobby.messages, newMsg] } : lobby
      )
    );
  };

  const handleSendDmMessage = (friendHandle: string, content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const parsed = parseMessageMedia(trimmed);
    const now = new Date();
    const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `dm-${Date.now()}`,
      senderHandle: user.handle,
      senderName: user.name,
      senderInitials: user.initials,
      content: trimmed,
      timestamp: hhmm,
      isMe: true,
      media: parsed.media,
    };

    setDmThreads((prev) => ({
      ...prev,
      [friendHandle]: [...(prev[friendHandle] || []), newMsg],
    }));
  };

  // Explore deep-link helpers
  const handleJoinLobbyFromAnywhere = (lobbyId: string) => {
    setActiveTab('CHANNELS');
    setChannelsSubTab('LOBBIES');
    setActiveLobbyId(lobbyId);
  };

  const handleStartDmFromAnywhere = (friendHandle: string) => {
    setActiveTab('CHANNELS');
    setChannelsSubTab('DMS');
    setActiveDmHandle(friendHandle);
  };

  // Alerts Actions
  const handleAcceptFriendRequest = (requestId: string) => {
    const result = acceptFriendRequestState(friendRequests, friends, user, requestId);
    setFriendRequests(result.requests);
    setFriends(result.friends);
    setUser(result.profile);
    if (result.acceptedUser) {
      setDmThreads((prev) => ({
        ...prev,
        [result.acceptedUser!.handle]: prev[result.acceptedUser!.handle] || [],
      }));
      setNotifications((prev) => [
        {
          id: `notif-acc-${Date.now()}`,
          type: 'friend',
          actorName: result.acceptedUser!.name,
          actorHandle: result.acceptedUser!.handle,
          message: 'is now connected in your encrypted Friends ledger.',
          timestamp: 'Just now',
          read: false,
          targetTab: 'CHANNELS',
        },
        ...prev,
      ]);
      showToast(`Accepted ${result.acceptedUser.name} · +15 Artisan Reputation`);
    }
  };

  const handleDeclineFriendRequest = (requestId: string) => {
    setFriendRequests((prev) => declineFriendRequestState(prev, requestId));
    showToast('Friend request declined');
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleOpenNotification = (notif: NotificationItem) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    if (notif.targetTab === 'CHANNELS' && notif.targetId) {
      handleJoinLobbyFromAnywhere(notif.targetId);
    } else if (notif.targetTab) {
      setActiveTab(notif.targetTab);
    }
  };

  // Profile & Bridge Settings Actions
  const handleSendProfileReferral = () => {
    const refLink = generateShortLink('p2p', `${user.handle}-${user.referralsSent + 1}`, bridgeSettings.customShortDomain);
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(refLink).catch(() => {});
    }
    setUser((prev) => ({
      ...prev,
      referralsSent: prev.referralsSent + 1,
      artisanReputation: prev.artisanReputation + 25,
    }));
    showToast(`Referral link copied (${refLink}) · +25 Artisan Reputation`);
  };

  const handleToggleBridgeSetting = (
    key: 'localP2PMesh' | 'localStreamServer' | 'telegramFailover' | 'zeroStorageCloudRouting'
  ) => {
    setBridgeSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleReSealManuscript = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(UNLOCK_STORAGE_KEY);
    }
    setSettingsOpen(false);
    setUnlocked(false);
  };

  // If still locked, show ONLY the sealed manuscript gate
  if (!unlocked) {
    return <LockedManuscriptGate onUnlock={handleUnlock} />;
  }

  const NAV_ITEMS: Array<{ id: ActiveTab; label: string; icon: typeof BookOpen; badge?: number }> = [
    { id: 'FEED', label: 'FEED', icon: BookOpen },
    { id: 'EXPLORE', label: 'EXPLORE', icon: Compass },
    { id: 'CHANNELS', label: 'CHANNELS', icon: Radio },
    { id: 'ALERTS', label: 'ALERTS', icon: Bell, badge: alertBadgeCount },
  ];

  const liveLobbies = lobbies.filter((l) => l.status === 'LIVE');

  return (
    <div className="min-h-screen parchment-canvas text-[#3D3124] flex flex-col">
      {/* Top Header Bar (compact 56px height to stay well under mobile 15% sticky cap) */}
      <header className="sticky top-0 z-30 h-14 bg-[#FAF4EA]/98 border-b border-[#C6A553]/50 shadow-[0_1px_6px_rgba(61,49,36,0.06)]">
        <div className="max-w-[1440px] mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-3">
          {/* Brand Title */}
          <button
            type="button"
            onClick={() => handleSwitchTab('FEED')}
            className="flex items-center gap-2.5 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A]"
          >
            <NavaNegarEmblem size={34} />
            <span className="font-calligraphy text-xl sm:text-2xl font-bold tracking-[0.12em] text-[#241C14] whitespace-nowrap">
              NAVA-NEGAR
            </span>
          </button>

          {/* Live LOCAL_NODE_STATUS Indicator */}
          <div
            className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#135757] whitespace-nowrap shrink-0"
            aria-label="Local node status"
          >
            <span className="text-[#6E5B47]">LOCAL_NODE_STATUS:</span>
            <span className="font-medium">
              {bridgeSettings.localP2PMesh
                ? `E2E P2P // ONLINE // PING: ${pingMs}ms`
                : 'LOCAL NODE // STANDBY'}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Unmute manuscript sound effects' : 'Mute manuscript sound effects'}
              aria-pressed={muted}
              title={muted ? 'Sound muted — click to unmute' : 'Manuscript audio active'}
              className="tactile-btn min-w-[40px] min-h-[40px] px-2.5 inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#C6A553]/50 bg-[#F5EADD] hover:bg-[#EFE2D0] text-[#3D3124] font-mono text-xs whitespace-nowrap"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-[#8C2D28]" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#135757]" aria-hidden="true" />
              )}
              <span className="hidden xl:inline">{muted ? 'Muted' : 'Audio'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPageTurn();
                setSettingsOpen(true);
              }}
              aria-label="Open Bridge and Local Settings"
              className="tactile-btn min-h-[40px] px-2.5 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-sm border border-[#C6A553]/55 bg-[#F5EADD] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] font-mono text-xs whitespace-nowrap"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Bridge / Local Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPageTurn();
                setProfileOpen(true);
              }}
              aria-label={`Open Scribe Dossier Profile for ${user.name}`}
              className="tactile-btn min-h-[40px] px-2.5 inline-flex items-center gap-2 rounded-sm bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] whitespace-nowrap"
            >
              <span className="font-calligraphy font-bold text-sm text-[#C6A553]">
                {user.initials}
              </span>
              <span className="hidden md:inline font-mono text-[11px] tabular-nums">
                Rep {user.artisanReputation}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Desktop Shell / Single-Column Mobile Shell */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto flex">
        {/* Desktop Left Navigation Rail */}
        <aside
          aria-label="Primary Navigation"
          className="hidden md:flex flex-col w-60 shrink-0 border-r border-[#C6A553]/40 bg-[#FAF4EA]/60 px-4 py-6 sticky top-14 h-[calc(100vh-3.5rem)] justify-between overflow-y-auto"
        >
          <div>
            <nav className="space-y-1.5" aria-label="Main Tabs">
              {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSwitchTab(id)}
                    aria-current={active ? 'page' : undefined}
                    className={`tactile-btn w-full min-h-[44px] px-3.5 py-2.5 flex items-center justify-between gap-3 rounded-sm font-mono text-xs tracking-[0.12em] border transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-[#3D3124] text-[#FAF4EA] border-[#C6A553] shadow-xs'
                        : 'bg-transparent text-[#3D3124] border-transparent hover:bg-[#EFE2D0] hover:border-[#C6A553]/40'
                    }`}
                  >
                    <span className="inline-flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${active ? 'text-[#C6A553]' : 'text-[#6E5B47]'}`}
                        aria-hidden="true"
                      />
                      <span>{label}</span>
                    </span>
                    {badge !== undefined && badge > 0 && (
                      <span
                        className={`tabular-nums text-[11px] font-semibold ${
                          active ? 'text-[#C6A553]' : 'text-[#8C2D28]'
                        }`}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <CalligraphicDivider className="my-6" />

            {/* Compact Scribe Ledger Card */}
            <div className="px-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6E5B47]">
                Active Node Identity
              </p>
              <p className="font-calligraphy text-lg font-bold text-[#241C14] mt-0.5 truncate">
                {user.name}
              </p>
              <p className="font-mono text-[11px] text-[#6E5B47] truncate">{user.handle}</p>
              <p className="font-mono text-[11px] text-[#135757] mt-2 tabular-nums">
                Artisan Rep: {user.artisanReputation}
              </p>
              <p className="font-mono text-[10px] text-[#6E5B47] mt-1">
                {bridgeSettings.localP2PMesh
                  ? `Mesh Online · ${pingMs}ms`
                  : 'Mesh Standby'}
              </p>
            </div>
          </div>

          <p className="px-2 pt-4 border-t border-[#C6A553]/25 font-calligraphy italic text-xs text-[#6E5B47]">
            “Let the reed tell its tale in ink and sound.”
          </p>
        </aside>

        {/* Central Reading & Interaction Column */}
        <main
          className={`flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 ${
            player.hasActiveSession ? 'pb-36 md:pb-28' : 'pb-24 md:pb-10'
          }`}
        >
          {/* Compact mobile node status ribbon (scrollable, not fixed) */}
          <div className="lg:hidden mb-4 pb-2 border-b border-[#C6A553]/30 flex items-center justify-between gap-2 font-mono text-[10px] text-[#135757]">
            <span className="truncate">
              LOCAL_NODE_STATUS:{' '}
              {bridgeSettings.localP2PMesh
                ? `E2E P2P // ONLINE // PING: ${pingMs}ms`
                : 'STANDBY'}
            </span>
          </div>

          {activeTab === 'FEED' && (
            <FeedView
              posts={posts}
              user={user}
              friends={friends}
              lobbies={lobbies}
              customShortDomain={bridgeSettings.customShortDomain}
              onCreatePost={handleCreatePost}
              onToggleLike={handleToggleLike}
              onAddComment={handleAddComment}
              onAddFriend={handleAddFriend}
              onShareToLobby={handleShareToLobby}
              onShareToDm={handleShareToDm}
              onOpenTheater={(media) => player.playTrack(media, true)}
              onToggleInlinePlay={(media) => player.togglePlayTrackCard(media)}
              onAddToQueue={(media) => {
                player.addToQueue(media);
                showToast(`Added "${media.title}" to queue`);
              }}
              activeMediaId={player.currentTrack?.id ?? null}
              isPlayerPlaying={player.isPlaying}
              onNotifyToast={showToast}
            />
          )}

          {activeTab === 'EXPLORE' && (
            <ExploreView
              clubs={EXPLORE_CLUBS}
              lobbies={lobbies}
              trending={TRENDING_COMPOSITIONS}
              discoverScribes={DISCOVER_SCRIBES}
              friends={friends}
              onJoinLobby={handleJoinLobbyFromAnywhere}
              onAddFriend={handleAddFriend}
              onStartDm={handleStartDmFromAnywhere}
              onOpenTheater={(media) => player.playTrack(media, true)}
              onToggleInlinePlay={(media) => player.togglePlayTrackCard(media)}
              onAddToQueue={(media) => {
                player.addToQueue(media);
                showToast(`Added "${media.title}" to queue`);
              }}
              activeMediaId={player.currentTrack?.id ?? null}
              isPlayerPlaying={player.isPlaying}
            />
          )}

          {activeTab === 'CHANNELS' && (
            <ChannelsView
              subTab={channelsSubTab}
              onSubTabChange={setChannelsSubTab}
              lobbies={lobbies}
              activeLobbyId={activeLobbyId}
              onSelectLobby={setActiveLobbyId}
              onHostLobby={handleHostLobby}
              onSendLobbyMessage={handleSendLobbyMessage}
              friends={friends}
              dmThreads={dmThreads}
              activeDmHandle={activeDmHandle}
              onSelectDm={setActiveDmHandle}
              onSendDmMessage={handleSendDmMessage}
              onQuickAddFriendByHandle={handleQuickAddFriendByHandle}
              onOpenTheater={(media) => player.playTrack(media, true)}
              onToggleInlinePlay={(media) => player.togglePlayTrackCard(media)}
              onAddToQueue={(media) => {
                player.addToQueue(media);
                showToast(`Added "${media.title}" to queue`);
              }}
              activeMediaId={player.currentTrack?.id ?? null}
              isPlayerPlaying={player.isPlaying}
            />
          )}

          {activeTab === 'ALERTS' && (
            <AlertsView
              friendRequests={friendRequests}
              notifications={notifications}
              onAcceptRequest={handleAcceptFriendRequest}
              onDeclineRequest={handleDeclineFriendRequest}
              onMarkAllRead={handleMarkAllRead}
              onOpenNotification={handleOpenNotification}
            />
          )}
        </main>

        {/* Desktop Right Anthology Margin Sidebar (xl+ for full 1440px composition) */}
        <aside
          aria-label="Live Salons Margin"
          className="hidden xl:block w-80 shrink-0 border-l border-[#C6A553]/35 px-5 py-6"
        >
          <div className="sticky top-20 space-y-5">
            <TazhibFrame dense className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#8C2D28] font-semibold">
                Live Listening Salons ({liveLobbies.length})
              </p>
              <div className="mt-3 space-y-3 divide-y divide-[#C6A553]/25">
                {liveLobbies.slice(0, 3).map((lobby) => (
                  <div key={lobby.id} className="pt-3 first:pt-0">
                    <p className="font-calligraphy text-lg font-bold text-[#241C14] leading-snug">
                      {lobby.title}
                    </p>
                    <p className="text-xs text-[#6E5B47] mt-0.5 truncate">
                      {lobby.stream.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[#135757] tabular-nums">
                        {lobby.members.length} listening · {lobby.genreTag}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playSealPress();
                          handleJoinLobbyFromAnywhere(lobby.id);
                        }}
                        className="tactile-btn font-mono text-[11px] text-[#3D3124] hover:text-[#135757] underline underline-offset-4 whitespace-nowrap"
                      >
                        Join →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </TazhibFrame>

            <TazhibFrame dense accent="turquoise" className="p-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#135757] font-semibold">
                Friends Online ({friends.filter((f) => f.online).length})
              </p>
              <ul className="mt-3 space-y-2.5">
                {friends.slice(0, 4).map((friend) => (
                  <li key={friend.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#241C14] truncate">{friend.name}</p>
                      <p className="text-[11px] text-[#6E5B47] truncate inline-flex items-center gap-1 max-w-full">
                        <Headphones className="w-3 h-3 text-[#9B7B2F] shrink-0" aria-hidden="true" />
                        <span className="truncate">{friend.listeningTo}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playQuillScratch();
                        handleStartDmFromAnywhere(friend.handle);
                      }}
                      className="tactile-btn px-2 py-1 text-[11px] font-mono text-[#135757] hover:bg-[#EFE2D0] rounded-sm shrink-0"
                    >
                      DM
                    </button>
                  </li>
                ))}
              </ul>
            </TazhibFrame>
          </div>
        </aside>
      </div>

      {/* Mobile Fixed 4-Tab Bottom Navigation Bar (60px height; 56+60=116px < 15% of 844px) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-[60px] bg-[#FAF4EA]/98 border-t border-[#C6A553]/55 grid grid-cols-4"
      >
        {NAV_ITEMS.map(({ id, label, icon: Icon, badge }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSwitchTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`tactile-btn relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] ${
                active ? 'text-[#241C14] bg-[#EFE2D0]/70' : 'text-[#6E5B47]'
              }`}
            >
              <span className="relative">
                <Icon
                  className={`w-5 h-5 ${active ? 'text-[#135757]' : 'text-[#6E5B47]'}`}
                  aria-hidden="true"
                />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-3 font-mono text-[10px] font-bold text-[#8C2D28] tabular-nums">
                    {badge}
                  </span>
                )}
              </span>
              <span className="font-mono text-[10px] tracking-wider whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Docked Spotify-Parity Persistent Playback Bar */}
      <PersistentPlayerBar player={player} />

      {/* Modals & Fullscreen Theater */}
      <FullscreenTheaterModal player={player} />

      <ScribeProfileModal
        open={profileOpen}
        user={user}
        recentPosts={userRecentPosts}
        onClose={() => setProfileOpen(false)}
        onUpdateBio={(bio) => {
          setUser((prev) => ({ ...prev, bio }));
          showToast('Scribe biography updated');
        }}
        onSendReferral={handleSendProfileReferral}
      />

      <BridgeSettingsModal
        open={settingsOpen}
        settings={bridgeSettings}
        userHandle={user.handle}
        onClose={() => setSettingsOpen(false)}
        onToggleSetting={handleToggleBridgeSetting}
        onReSealManuscript={handleReSealManuscript}
        onNotifyToast={showToast}
      />

      {/* Ephemeral Parchment Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed ${
            player.hasActiveSession ? 'bottom-32 md:bottom-24' : 'bottom-20 md:bottom-6'
          } right-4 sm:right-6 z-50 max-w-sm px-4 py-3 bg-[#3D3124] text-[#FAF4EA] border border-[#C6A553] rounded-sm shadow-lg font-mono text-xs animate-ink-reveal`}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
