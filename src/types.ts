export type ActiveTab = 'FEED' | 'EXPLORE' | 'CHANNELS' | 'ALERTS';
export type ChannelsSubTab = 'LOBBIES' | 'DMS';

export type AudioSynthPreset = 'santur' | 'jazz' | 'podcast' | 'guitar';
export type RepeatMode = 'off' | 'all' | 'one';
export type MediaProvider =
  | 'spotify'
  | 'youtube'
  | 'soundcloud'
  | 'bandcamp'
  | 'podcast'
  | 'direct'
  | 'stream';

export interface MediaAttachment {
  id: string;
  url: string;
  title: string;
  artistOrHost: string;
  kind: 'audio' | 'podcast' | 'video' | 'stream';
  durationSec: number;
  artwork?: string;
  preset: AudioSynthPreset;
  sourceLabel: string;
  provider?: MediaProvider;
  embedUrl?: string;
  isDirectAudio?: boolean;
  lyricsOrNotes?: string[];
}

export interface DossierComment {
  id: string;
  authorHandle: string;
  authorName: string;
  authorInitials: string;
  content: string;
  timestamp: string;
  media?: MediaAttachment;
}

export interface DossierPost {
  id: string;
  authorHandle: string;
  authorName: string;
  authorInitials: string;
  authorRole: string;
  timestamp: string;
  title: string;
  body: string;
  workTitle: string;
  artistName: string;
  tags: string[];
  likes: number;
  likedByMe: boolean;
  comments: DossierComment[];
  media?: MediaAttachment;
}

export interface LobbyMember {
  handle: string;
  name: string;
  initials: string;
  role: 'Host' | 'Scribe' | 'Listener';
  status: string;
}

export interface ChatMessage {
  id: string;
  senderHandle: string;
  senderName: string;
  senderInitials: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
  media?: MediaAttachment;
}

export interface ListeningLobby {
  id: string;
  title: string;
  clubName: string;
  genreTag: string;
  status: 'LIVE' | 'WAITING ROOM';
  hostHandle: string;
  hostName: string;
  description: string;
  stream: MediaAttachment;
  members: LobbyMember[];
  messages: ChatMessage[];
}

export interface FriendUser {
  id: string;
  handle: string;
  name: string;
  initials: string;
  online: boolean;
  listeningTo: string;
  reputation: number;
  bio: string;
}

export interface FriendRequest {
  id: string;
  fromHandle: string;
  fromName: string;
  fromInitials: string;
  note: string;
  mutualClubs: number;
  timestamp: string;
  listeningTo: string;
  reputation: number;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'lobby' | 'referral' | 'friend';
  actorName: string;
  actorHandle: string;
  message: string;
  timestamp: string;
  read: boolean;
  targetTab?: ActiveTab;
  targetId?: string;
}

export interface UserProfile {
  handle: string;
  name: string;
  initials: string;
  title: string;
  bio: string;
  artisanReputation: number;
  referralsSent: number;
  badges: string[];
  joinedDate: string;
}

export interface BridgeSettings {
  localP2PMesh: boolean;
  localStreamServer: boolean;
  telegramFailover: boolean;
  zeroStorageCloudRouting: boolean;
  customShortDomain: string;
}

export interface ExploreClub {
  id: string;
  name: string;
  curator: string;
  memberCount: number;
  genreTag: string;
  description: string;
  artwork: string;
  linkedLobbyId: string;
}

export interface TrendingComposition {
  id: string;
  rank: string;
  title: string;
  artist: string;
  tag: string;
  plays: number;
  media: MediaAttachment;
}
