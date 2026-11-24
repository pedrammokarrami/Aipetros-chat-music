import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Feather,
  Heart,
  Link2,
  MessageCircle,
  Music,
  Radio,
  Send,
  Share2,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { SUGGESTED_TAGS } from '../data/seedData';
import type {
  DossierPost,
  FriendUser,
  ListeningLobby,
  MediaAttachment,
  UserProfile,
} from '../types';
import {
  classifyMediaUrl,
  generateShortLink,
  resolveRemoteMediaMetadata,
} from '../utils/mediaParser';
import { validateNewDossier, type NewDossierInput } from '../utils/socialState';
import { soundEngine } from '../utils/soundEngine';
import { MediaPreviewCard } from './MediaPreviewCard';
import { ArchivalImage, CalligraphicDivider, TazhibFrame } from './TazhibOrnament';

interface FeedViewProps {
  posts: DossierPost[];
  user: UserProfile;
  friends: FriendUser[];
  lobbies: ListeningLobby[];
  customShortDomain: string;
  activeMediaId?: string | null;
  isPlayerPlaying?: boolean;
  onCreatePost: (input: NewDossierInput) => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onAddFriend: (handle: string, name: string, initials: string) => void;
  onShareToLobby: (lobbyId: string, post: DossierPost) => void;
  onShareToDm: (friendHandle: string, post: DossierPost) => void;
  onOpenTheater: (media: MediaAttachment) => void;
  onToggleInlinePlay: (media: MediaAttachment) => void;
  onAddToQueue: (media: MediaAttachment) => void;
  onNotifyToast: (message: string) => void;
}

const FILTER_TAGS = [
  'All Dossiers',
  '#RumiPoetry',
  '#JazzSession',
  '#ClassicRock',
  '#TechPodcast',
  '#PersianClassical',
];

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  user,
  friends,
  lobbies,
  customShortDomain,
  activeMediaId = null,
  isPlayerPlaying = false,
  onCreatePost,
  onToggleLike,
  onAddComment,
  onAddFriend,
  onShareToLobby,
  onShareToDm,
  onOpenTheater,
  onToggleInlinePlay,
  onAddToQueue,
  onNotifyToast,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('All Dossiers');
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [sharePost, setSharePost] = useState<DossierPost | null>(null);

  // Composer form state
  const [title, setTitle] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [detectedArtwork, setDetectedArtwork] = useState<string | null>(null);
  const [resolvingLink, setResolvingLink] = useState(false);
  const [chosenTags, setChosenTags] = useState<string[]>(['#RumiPoetry']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Comment input state
  const [commentDraft, setCommentDraft] = useState('');

  // Share modal state
  const [copiedLink, setCopiedLink] = useState(false);

  // Auto-resolve real cover artwork & metadata whenever user pastes a media link
  useEffect(() => {
    const trimmed = mediaUrl.trim();
    if (!trimmed) {
      setDetectedArtwork(null);
      setResolvingLink(false);
      return;
    }
    const immediate = classifyMediaUrl(trimmed);
    if (immediate?.artwork) {
      setDetectedArtwork(immediate.artwork);
    }
    let cancelled = false;
    setResolvingLink(true);
    const timer = window.setTimeout(() => {
      void resolveRemoteMediaMetadata(trimmed).then((meta) => {
        if (cancelled) return;
        setResolvingLink(false);
        if (!meta) return;
        if (meta.artwork) setDetectedArtwork(meta.artwork);
        if (meta.title) setWorkTitle((prev) => prev || meta.title || '');
        if (meta.artistOrHost) setArtistName((prev) => prev || meta.artistOrHost || '');
      });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mediaUrl]);

  const filteredPosts =
    selectedTag === 'All Dossiers'
      ? posts
      : posts.filter((p) => p.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase()));

  const activeCommentPost = posts.find((p) => p.id === activeCommentPostId) || null;

  const isFriend = (handle: string) =>
    friends.some((f) => f.handle.toLowerCase() === handle.toLowerCase());

  const handleOpenComposer = () => {
    soundEngine.playPageTurn();
    setFormError(null);
    setComposerOpen(true);
  };

  const handleToggleTagChoice = (tag: string) => {
    soundEngine.playInkClick();
    setChosenTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitDossier = (e: React.FormEvent) => {
    e.preventDefault();
    const extraTags = customTagInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: NewDossierInput = {
      title,
      body,
      workTitle,
      artistName,
      mediaUrl,
      coverImageUrl: coverImageUrl.trim() || detectedArtwork || undefined,
      tags: [...chosenTags, ...extraTags],
    };
    const error = validateNewDossier(payload);
    if (error) {
      soundEngine.playInkClick();
      setFormError(error);
      return;
    }
    soundEngine.playSealPress();
    onCreatePost(payload);
    setTitle('');
    setWorkTitle('');
    setArtistName('');
    setBody('');
    setMediaUrl('');
    setCoverImageUrl('');
    setDetectedArtwork(null);
    setChosenTags(['#RumiPoetry']);
    setCustomTagInput('');
    setFormError(null);
    setComposerOpen(false);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPost || !commentDraft.trim()) return;
    soundEngine.playInkClick();
    onAddComment(activeCommentPost.id, commentDraft);
    setCommentDraft('');
  };

  const handleCopyManuscriptLink = (post: DossierPost) => {
    soundEngine.playInkClick();
    const link = generateShortLink('dossier', post.id, customShortDomain);
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(link).catch(() => {});
    }
    setCopiedLink(true);
    onNotifyToast(`Copied manuscript link: ${link}`);
    window.setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <section className="animate-unroll" aria-label="Public Dossier Feed">
      {/* Section Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#C6A553]/40">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-[#135757] uppercase">
            Public Folio · Music &amp; Podcast Anthology
          </p>
          <h2 className="font-calligraphy text-3xl sm:text-4xl font-bold text-[#241C14] mt-1">
            Inscribed Listening Dossiers
          </h2>
        </div>

        <button
          type="button"
          onClick={handleOpenComposer}
          className="tactile-btn quill-hover wax-seal-btn min-h-[44px] px-5 py-2.5 inline-flex items-center justify-center gap-2 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs tracking-wider whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A]"
        >
          <Feather className="w-4 h-4 text-[#C6A553] quill-icon" aria-hidden="true" />
          <span>+ NEW DOSSIER</span>
        </button>
      </div>

      {/* Interactive Tag Filter Controls */}
      <div
        className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Filter dossiers by genre tag"
      >
        {FILTER_TAGS.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                soundEngine.playQuillScratch();
                setSelectedTag(tag);
              }}
              className={`tactile-btn min-h-[38px] px-3.5 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap shrink-0 border transition-colors ${
                active
                  ? 'bg-[#3D3124] text-[#FAF4EA] border-[#C6A553]'
                  : 'bg-[#FAF4EA]/80 text-[#3D3124] border-[#C6A553]/35 hover:border-[#1D7A7A] hover:text-[#135757]'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Dossier Feed List */}
      <div className="mt-5 space-y-6">
        {filteredPosts.length === 0 ? (
          <TazhibFrame className="p-8 text-center">
            <p className="font-calligraphy italic text-2xl text-[#3D3124]">
              No dossiers inscribed under {selectedTag} yet.
            </p>
            <p className="mt-2 text-sm text-[#6E5B47]">
              Be the first scribe to share a recording, poem, or podcast note in this margin.
            </p>
            <button
              type="button"
              onClick={() => setSelectedTag('All Dossiers')}
              className="tactile-btn mt-4 px-4 py-2 text-xs font-mono border border-[#C6A553] bg-[#EFE2D0] hover:bg-[#3D3124] hover:text-[#FAF4EA] rounded-sm"
            >
              View All Dossiers
            </button>
          </TazhibFrame>
        ) : (
          filteredPosts.map((post) => {
            const isOwnPost = post.authorHandle.toLowerCase() === user.handle.toLowerCase();
            const alreadyConnected = isFriend(post.authorHandle);

            return (
              <article key={post.id}>
                <TazhibFrame className="p-5 sm:p-7">
                  {/* Author Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-sm bg-[#3D3124] text-[#C6A553] border border-[#C6A553]/70 flex items-center justify-center font-calligraphy font-bold text-lg shrink-0">
                        {post.authorInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="font-calligraphy text-lg font-bold text-[#241C14] leading-tight">
                            {post.authorName}
                          </span>
                          <span className="font-mono text-xs text-[#6E5B47]">
                            {post.authorHandle}
                          </span>
                          {!isOwnPost && (
                            <button
                              type="button"
                              disabled={alreadyConnected}
                              onClick={() => {
                                soundEngine.playInkClick();
                                onAddFriend(post.authorHandle, post.authorName, post.authorInitials);
                              }}
                              aria-label={
                                alreadyConnected
                                  ? `${post.authorName} is already a friend`
                                  : `Add Friend ${post.authorName}`
                              }
                              className={`tactile-btn inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-sm border whitespace-nowrap ${
                                alreadyConnected
                                  ? 'border-[#1D7A7A]/35 text-[#135757] bg-[#1D7A7A]/8 cursor-default'
                                  : 'border-[#C6A553]/65 text-[#3D3124] bg-[#F5EADD] hover:bg-[#1D7A7A] hover:text-[#FAF4EA] hover:border-[#1D7A7A]'
                              }`}
                            >
                              {alreadyConnected ? (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Friends</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Add Friend</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-[#6E5B47] mt-0.5">
                          <span>{post.authorRole}</span>
                          <span className="mx-1.5" aria-hidden="true">
                            ·
                          </span>
                          <span className="font-mono">{post.timestamp}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dossier Title & Work Attribution */}
                  <div className="mt-4">
                    <h3 className="font-calligraphy text-2xl sm:text-[26px] font-bold text-[#241C14] leading-snug">
                      {post.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#135757]">
                      <Music className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      <span className="font-semibold">{post.workTitle}</span>
                      <span aria-hidden="true">—</span>
                      <span className="italic text-[#6E5B47]">{post.artistName}</span>
                    </div>

                    <p className="mt-3 text-[15px] leading-[1.7] text-[#3D3124] max-w-prose">
                      {post.body}
                    </p>

                    {/* Clean unboxed genre tags with typographic separators */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-mono text-[#6E5B47]">
                      {post.tags.map((tag, idx) => (
                        <React.Fragment key={tag}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playQuillScratch();
                              setSelectedTag(tag);
                            }}
                            className="hover:text-[#135757] underline-offset-2 hover:underline"
                          >
                            {tag}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Automatic Inline Audio/Media Preview */}
                    {post.media && (
                      <MediaPreviewCard
                        media={post.media}
                        onOpenTheater={onOpenTheater}
                        onToggleInlinePlay={onToggleInlinePlay}
                        onAddToQueue={onAddToQueue}
                        isActiveTrack={activeMediaId === post.media.id}
                        isPlaying={isPlayerPlaying && activeMediaId === post.media.id}
                      />
                    )}
                  </div>

                  {/* Interactive Action Bar */}
                  <div className="mt-5 pt-3.5 border-t border-[#C6A553]/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playInkClick();
                          onToggleLike(post.id);
                        }}
                        aria-pressed={post.likedByMe}
                        aria-label={`Like "${post.title}" (${post.likes} likes)`}
                        className={`tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-sm text-xs font-mono border whitespace-nowrap ${
                          post.likedByMe
                            ? 'bg-[#8C2D28]/12 border-[#8C2D28]/50 text-[#8C2D28]'
                            : 'bg-transparent border-transparent text-[#3D3124] hover:bg-[#EFE2D0]'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="tabular-nums">{post.likes}</span>
                        <span className="hidden sm:inline">Heart</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playPageTurn();
                          setActiveCommentPostId(post.id);
                        }}
                        aria-label={`Open comments for "${post.title}" (${post.comments.length})`}
                        className="tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-sm text-xs font-mono text-[#3D3124] hover:bg-[#EFE2D0] whitespace-nowrap"
                      >
                        <MessageCircle className="w-4 h-4 text-[#135757]" aria-hidden="true" />
                        <span className="tabular-nums">{post.comments.length}</span>
                        <span>Comments</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playInkClick();
                        setCopiedLink(false);
                        setSharePost(post);
                      }}
                      aria-label={`Share "${post.title}"`}
                      className="tactile-btn min-h-[40px] px-3 inline-flex items-center gap-1.5 rounded-sm text-xs font-mono text-[#3D3124] hover:bg-[#EFE2D0] hover:text-[#135757] whitespace-nowrap"
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                      <span>Share</span>
                    </button>
                  </div>
                </TazhibFrame>
              </article>
            );
          })
        )}
      </div>

      {/* + NEW DOSSIER Composer Modal */}
      {composerOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#241C14]/75 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-dossier-heading"
        >
          <TazhibFrame className="w-full max-w-xl p-6 sm:p-7 animate-ink-reveal my-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#C6A553]/35 pb-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
                  Inscribe to Public Feed
                </p>
                <h2
                  id="new-dossier-heading"
                  className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14] mt-0.5"
                >
                  New Listening Dossier
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playInkClick();
                  setComposerOpen(false);
                }}
                aria-label="Close new dossier composer"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDossier} className="mt-4 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 text-xs font-mono text-[#8C2D28] bg-[#8C2D28]/10 border border-[#8C2D28]/40 rounded-sm"
                >
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="dossier-title" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Dossier Headline *
                </label>
                <input
                  id="dossier-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Sunset Setar Improvisation on Warm Vinyl"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dossier-work" className="block text-xs font-mono text-[#6E5B47] mb-1">
                    Music / Podcast Title *
                  </label>
                  <input
                    id="dossier-work"
                    type="text"
                    value={workTitle}
                    onChange={(e) => setWorkTitle(e.target.value)}
                    placeholder="e.g., Dastgah-e Esfahan"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                  />
                </div>
                <div>
                  <label htmlFor="dossier-artist" className="block text-xs font-mono text-[#6E5B47] mb-1">
                    Artist / Host *
                  </label>
                  <input
                    id="dossier-artist"
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g., Hossein Alizadeh"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dossier-body" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Manuscript Notes &amp; Reflections *
                </label>
                <textarea
                  id="dossier-body"
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share why this recording or episode resonated with you..."
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div>
                <label htmlFor="dossier-media-url" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Spotify / YouTube / SoundCloud / Audio Stream URL (auto-reads cover art)
                </label>
                <input
                  id="dossier-media-url"
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://open.spotify.com/track/... or https://youtube.com/watch?v=..."
                  className="w-full px-3.5 py-2.5 text-sm font-mono bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
                {(detectedArtwork || coverImageUrl.trim()) && (
                  <div className="mt-2.5 p-2.5 vellum-inset rounded-sm flex items-center gap-3">
                    <div className="w-12 h-12 rounded-sm overflow-hidden border border-[#C6A553]/60 shrink-0">
                      <ArchivalImage
                        src={coverImageUrl.trim() || detectedArtwork || undefined}
                        alt="Detected cover artwork preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-[#135757]">
                        {resolvingLink ? 'Reading cover art from link…' : 'Cover artwork detected from link'}
                      </p>
                      <p className="text-xs text-[#6E5B47] truncate">
                        {workTitle || 'Ready to attach to dossier player'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="dossier-cover-url" className="block text-xs font-mono text-[#6E5B47] mb-1">
                  Custom Cover Image URL (optional override)
                </label>
                <input
                  id="dossier-cover-url"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://... (leave blank to use artwork read from link)"
                  className="w-full px-3 py-2 text-xs font-mono bg-[#F5EADD] border border-[#C6A553]/45 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div>
                <span className="block text-xs font-mono text-[#6E5B47] mb-1.5">
                  Genre &amp; Anthology Tags
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_TAGS.map((tag) => {
                    const active = chosenTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTagChoice(tag)}
                        className={`tactile-btn px-2.5 py-1 text-xs font-mono rounded-sm border ${
                          active
                            ? 'bg-[#1D7A7A] text-[#FAF4EA] border-[#1D7A7A]'
                            : 'bg-[#F5EADD] text-[#3D3124] border-[#C6A553]/45 hover:border-[#1D7A7A]'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  aria-label="Additional custom hashtags"
                  placeholder="Optional extra tags (e.g. #FolkTape #Vinyl)"
                  className="mt-2 w-full px-3 py-2 text-xs font-mono bg-[#F5EADD] border border-[#C6A553]/45 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#C6A553]/30">
                <button
                  type="button"
                  onClick={() => setComposerOpen(false)}
                  className="tactile-btn min-h-[42px] px-4 py-2 text-xs font-mono text-[#6E5B47] hover:text-[#241C14]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tactile-btn wax-seal-btn min-h-[42px] px-5 py-2 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-xs tracking-wider"
                >
                  Publish Dossier
                </button>
              </div>
            </form>
          </TazhibFrame>
        </div>
      )}

      {/* Comments Thread Drawer */}
      {activeCommentPost && (
        <div
          className="fixed inset-0 z-50 bg-[#241C14]/72 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="thread-drawer-title"
        >
          <div className="w-full max-w-md h-full parchment-canvas border-l-2 border-[#C6A553]/65 flex flex-col animate-drawer-slide shadow-2xl">
            <div className="p-5 border-b border-[#C6A553]/40 flex items-start justify-between gap-3 bg-[#FAF4EA]">
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-[0.12em] text-[#135757] uppercase">
                  Margin Notes Thread
                </p>
                <h2
                  id="thread-drawer-title"
                  className="font-calligraphy text-xl font-bold text-[#241C14] truncate mt-0.5"
                >
                  {activeCommentPost.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPageTurn();
                  setActiveCommentPostId(null);
                }}
                aria-label="Close comments drawer"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {activeCommentPost.comments.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="font-calligraphy italic text-xl text-[#6E5B47]">
                    The margins are uninscribed.
                  </p>
                  <p className="text-xs text-[#6E5B47] mt-1">
                    Leave a note or paste a stream link below to start the conversation.
                  </p>
                </div>
              ) : (
                activeCommentPost.comments.map((cmt) => (
                  <div
                    key={cmt.id}
                    className="p-3.5 vellum-sheet rounded-sm"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-calligraphy font-bold text-base text-[#241C14]">
                        {cmt.authorName}{' '}
                        <span className="font-mono font-normal text-[11px] text-[#6E5B47]">
                          {cmt.authorHandle}
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-[#6E5B47]">{cmt.timestamp}</span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#3D3124] leading-relaxed">{cmt.content}</p>
                    {cmt.media && (
                      <MediaPreviewCard
                        media={cmt.media}
                        onOpenTheater={onOpenTheater}
                        onToggleInlinePlay={onToggleInlinePlay}
                        onAddToQueue={onAddToQueue}
                        isActiveTrack={activeMediaId === cmt.media.id}
                        isPlaying={isPlayerPlaying && activeMediaId === cmt.media.id}
                        compact
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmitComment}
              className="p-4 border-t border-[#C6A553]/40 bg-[#FAF4EA]"
            >
              <label htmlFor="comment-input" className="sr-only">
                Add a margin comment
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="comment-input"
                  type="text"
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Write a reply or paste a stream URL..."
                  className="flex-1 min-h-[44px] px-3.5 py-2 text-sm bg-[#F5EADD] border border-[#C6A553]/55 rounded-sm text-[#241C14] placeholder:text-[#6E5B47]/70 focus:outline-none focus:border-[#1D7A7A]"
                />
                <button
                  type="submit"
                  aria-label="Post comment"
                  className="tactile-btn min-w-[44px] min-h-[44px] px-3.5 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm inline-flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Manuscript Modal */}
      {sharePost && (
        <div
          className="fixed inset-0 z-50 bg-[#241C14]/75 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <TazhibFrame accent="turquoise" className="w-full max-w-md p-6 animate-ink-reveal">
            <div className="flex items-start justify-between gap-3 border-b border-[#C6A553]/35 pb-3.5">
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
                  Relay Dossier
                </p>
                <h2
                  id="share-modal-title"
                  className="font-calligraphy text-2xl font-bold text-[#241C14]"
                >
                  Share Manuscript
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSharePost(null)}
                aria-label="Close share modal"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 font-calligraphy italic text-base text-[#3D3124] line-clamp-2">
              “{sharePost.title}”
            </p>

            {/* 1. Copy Manuscript Link */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => handleCopyManuscriptLink(sharePost)}
                className="tactile-btn w-full min-h-[44px] px-4 py-2.5 flex items-center justify-between gap-2 vellum-inset hover:bg-[#FAF4EA] hover:border-[#1D7A7A] rounded-sm text-xs font-mono text-[#241C14]"
              >
                <span className="inline-flex items-center gap-2 truncate">
                  <Link2 className="w-4 h-4 text-[#135757] shrink-0" />
                  <span className="truncate">
                    {generateShortLink('dossier', sharePost.id, customShortDomain)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 text-[#135757] shrink-0">
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                </span>
              </button>
            </div>

            <CalligraphicDivider className="my-4" />

            {/* 2. Send to Listening Lobby */}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6E5B47] mb-2">
                Send to Listening Lobby
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {lobbies.map((lobby) => (
                  <button
                    key={lobby.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onShareToLobby(lobby.id, sharePost);
                      setSharePost(null);
                    }}
                    className="tactile-btn w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 bg-[#F5EADD] hover:bg-[#EFE2D0] border border-[#C6A553]/35 rounded-sm text-xs"
                  >
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <Radio className="w-3.5 h-3.5 text-[#135757] shrink-0" />
                      <span className="truncate font-medium text-[#241C14]">{lobby.title}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#135757] shrink-0">Send</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Send via Direct Message */}
            <div className="mt-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-[#6E5B47] mb-2">
                Send via Encrypted DM
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onShareToDm(friend.handle, sharePost);
                      setSharePost(null);
                    }}
                    className="tactile-btn w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 bg-[#F5EADD] hover:bg-[#EFE2D0] border border-[#C6A553]/35 rounded-sm text-xs"
                  >
                    <span className="truncate text-[#241C14]">
                      <span className="font-medium">{friend.name}</span>{' '}
                      <span className="font-mono text-[#6E5B47]">{friend.handle}</span>
                    </span>
                    <span className="font-mono text-[11px] text-[#135757] shrink-0">Dispatch</span>
                  </button>
                ))}
              </div>
            </div>
          </TazhibFrame>
        </div>
      )}
    </section>
  );
};
