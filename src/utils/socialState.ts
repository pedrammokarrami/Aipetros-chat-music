import type {
  DossierComment,
  DossierPost,
  ExploreClub,
  FriendRequest,
  FriendUser,
  ListeningLobby,
  TrendingComposition,
  UserProfile,
} from '../types';
import { classifyMediaUrl, parseMessageMedia } from './mediaParser';

export interface NewDossierInput {
  title: string;
  body: string;
  workTitle: string;
  artistName: string;
  mediaUrl?: string;
  coverImageUrl?: string;
  tags: string[];
}

export interface NewLobbyInput {
  title: string;
  clubName: string;
  genreTag: string;
  streamUrl: string;
  coverImageUrl?: string;
  status: 'LIVE' | 'WAITING ROOM';
  description?: string;
}

export function validateNewDossier(input: NewDossierInput): string | null {
  if (!input.title.trim()) return 'Please inscribe a headline for this dossier.';
  if (!input.body.trim()) return 'Please write your reflection or listening notes.';
  if (!input.workTitle.trim()) return 'Please enter the music or podcast title.';
  if (!input.artistName.trim()) return 'Please enter the artist, composer, or host name.';
  return null;
}

export function validateNewLobby(input: NewLobbyInput): string | null {
  if (!input.title.trim()) return 'Please name your listening lobby.';
  if (!input.streamUrl.trim()) return 'Please attach a music or podcast stream URL.';
  if (!/^https?:\/\/|^nava\.scribe\//i.test(input.streamUrl.trim())) {
    return 'Stream link should begin with https:// or nava.scribe/.';
  }
  return null;
}

export function createDossierPost(input: NewDossierInput, author: UserProfile): DossierPost {
  const normalizedTags = Array.from(
    new Set(
      input.tags
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`))
    )
  );
  const mediaFromField = input.mediaUrl?.trim()
    ? classifyMediaUrl(input.mediaUrl.trim(), {
        title: input.workTitle.trim(),
        artistOrHost: input.artistName.trim(),
        artwork: input.coverImageUrl?.trim() || undefined,
      })
    : undefined;
  const mediaFromBody = !mediaFromField
    ? parseMessageMedia(input.body, {
        title: input.workTitle.trim(),
        artistOrHost: input.artistName.trim(),
        artwork: input.coverImageUrl?.trim() || undefined,
      }).media
    : undefined;

  return {
    id: `post-${Date.now()}`,
    authorHandle: author.handle,
    authorName: author.name,
    authorInitials: author.initials,
    authorRole: author.title,
    timestamp: 'Just now',
    title: input.title.trim(),
    body: input.body.trim(),
    workTitle: input.workTitle.trim(),
    artistName: input.artistName.trim(),
    tags: normalizedTags.length > 0 ? normalizedTags : ['#Anthology'],
    likes: 1,
    likedByMe: true,
    comments: [],
    media: mediaFromField || mediaFromBody || undefined,
  };
}

export function togglePostLike(posts: DossierPost[], postId: string): DossierPost[] {
  return posts.map((post) => {
    if (post.id !== postId) return post;
    const nextLiked = !post.likedByMe;
    return {
      ...post,
      likedByMe: nextLiked,
      likes: Math.max(0, post.likes + (nextLiked ? 1 : -1)),
    };
  });
}

export function addCommentToPost(
  posts: DossierPost[],
  postId: string,
  content: string,
  author: UserProfile
): DossierPost[] {
  const trimmed = content.trim();
  if (!trimmed) return posts;
  const parsed = parseMessageMedia(trimmed);
  const newComment: DossierComment = {
    id: `cmt-${Date.now()}`,
    authorHandle: author.handle,
    authorName: author.name,
    authorInitials: author.initials,
    content: trimmed,
    timestamp: 'Just now',
    media: parsed.media,
  };
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          comments: [...post.comments, newComment],
        }
      : post
  );
}

export function acceptFriendRequestState(
  requests: FriendRequest[],
  friends: FriendUser[],
  profile: UserProfile,
  requestId: string
): {
  requests: FriendRequest[];
  friends: FriendUser[];
  profile: UserProfile;
  acceptedUser: FriendUser | null;
} {
  const target = requests.find((r) => r.id === requestId);
  if (!target) {
    return { requests, friends, profile, acceptedUser: null };
  }

  const alreadyFriend = friends.some(
    (f) => f.handle.toLowerCase() === target.fromHandle.toLowerCase()
  );

  const newFriend: FriendUser = {
    id: `fr-${Date.now()}`,
    handle: target.fromHandle,
    name: target.fromName,
    initials: target.fromInitials,
    online: true,
    listeningTo: target.listeningTo,
    reputation: target.reputation,
    bio: target.note,
  };

  return {
    requests: requests.filter((r) => r.id !== requestId),
    friends: alreadyFriend ? friends : [newFriend, ...friends],
    profile: {
      ...profile,
      artisanReputation: profile.artisanReputation + 15,
    },
    acceptedUser: newFriend,
  };
}

export function declineFriendRequestState(
  requests: FriendRequest[],
  requestId: string
): FriendRequest[] {
  return requests.filter((r) => r.id !== requestId);
}

export function normalizeHandle(raw: string): string {
  const cleaned = raw.trim().replace(/^@+/, '').replace(/\s+/g, '_').toLowerCase();
  return cleaned ? `@${cleaned}` : '';
}

export function createFriendFromHandle(rawHandle: string): FriendUser | null {
  const handle = normalizeHandle(rawHandle);
  if (!handle || handle.length < 3) return null;
  const base = handle.slice(1);
  const name = base
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return {
    id: `fr-${Date.now()}`,
    handle,
    name: name || 'Fellow Scribe',
    initials: initials || 'FS',
    online: true,
    listeningTo: 'Browsing the Folio',
    reputation: 410,
    bio: 'Connected via direct handle inscription.',
  };
}

export function createListeningLobby(input: NewLobbyInput, host: UserProfile): ListeningLobby {
  const stream =
    classifyMediaUrl(input.streamUrl.trim(), {
      title: input.title.trim(),
      artistOrHost: host.name,
      artwork: input.coverImageUrl?.trim() || undefined,
    }) ?? {
      id: `stream-${Date.now()}`,
      url: input.streamUrl.trim(),
      title: input.title.trim(),
      artistOrHost: host.name,
      kind: 'stream' as const,
      durationSec: 320,
      artwork: input.coverImageUrl?.trim() || '/src/assets/images/album_rumi_santur_1795530694474.jpg',
      preset: 'santur' as const,
      sourceLabel: 'Synced Stream Relay',
    };

  const tag = input.genreTag.trim().startsWith('#')
    ? input.genreTag.trim()
    : `#${input.genreTag.trim() || 'ListeningRoom'}`;

  return {
    id: `lobby-${Date.now()}`,
    title: input.title.trim(),
    clubName: input.clubName.trim() || 'Independent Salon',
    genreTag: tag,
    status: input.status,
    hostHandle: host.handle,
    hostName: host.name,
    description:
      input.description?.trim() ||
      'A freshly opened manuscript salon synchronized for shared listening and live commentary.',
    stream,
    members: [
      {
        handle: host.handle,
        name: host.name,
        initials: host.initials,
        role: 'Host',
        status: 'Hosting synced stream',
      },
    ],
    messages: [
      {
        id: `msg-${Date.now()}`,
        senderHandle: host.handle,
        senderName: host.name,
        senderInitials: host.initials,
        content: `Opened the salon with ${input.streamUrl.trim()} — settle in and share your notes.`,
        timestamp: 'Just now',
        isMe: true,
        media: stream,
      },
    ],
  };
}

export function filterExploreContent(
  query: string,
  clubs: ExploreClub[],
  lobbies: ListeningLobby[],
  trending: TrendingComposition[],
  scribes: FriendUser[]
) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { clubs, lobbies, trending, scribes };
  }
  return {
    clubs: clubs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.genreTag.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    ),
    lobbies: lobbies.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.clubName.toLowerCase().includes(q) ||
        l.genreTag.toLowerCase().includes(q)
    ),
    trending: trending.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
    ),
    scribes: scribes.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.handle.toLowerCase().includes(q) ||
        s.listeningTo.toLowerCase().includes(q)
    ),
  };
}
