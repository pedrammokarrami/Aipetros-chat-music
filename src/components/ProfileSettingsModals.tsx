import React, { useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Globe,
  Link2,
  Lock,
  Radio,
  RefreshCw,
  Send,
  Server,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ARTWORK } from '../data/seedData';
import type { BridgeSettings, DossierPost, UserProfile } from '../types';
import { generateShortLink } from '../utils/mediaParser';
import { soundEngine } from '../utils/soundEngine';
import { ArchivalImage, CalligraphicDivider, TazhibFrame } from './TazhibOrnament';

interface ProfileModalProps {
  open: boolean;
  user: UserProfile;
  recentPosts: DossierPost[];
  onClose: () => void;
  onUpdateBio: (bio: string) => void;
  onSendReferral: () => void;
}

export const ScribeProfileModal: React.FC<ProfileModalProps> = ({
  open,
  user,
  recentPosts,
  onClose,
  onUpdateBio,
  onSendReferral,
}) => {
  const [editingBio, setEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState(user.bio);

  if (!open) return null;

  const handleSaveBio = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playInkClick();
    onUpdateBio(bioDraft.trim() || user.bio);
    setEditingBio(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241C14]/76 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scribe-profile-heading"
    >
      <TazhibFrame className="w-full max-w-2xl p-6 sm:p-7 animate-ink-reveal my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#C6A553]/35 pb-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
              Scribe Dossier Profile
            </p>
            <h2
              id="scribe-profile-heading"
              className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14]"
            >
              {user.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playPageTurn();
              onClose();
            }}
            aria-label="Close scribe profile"
            className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Archival Banner */}
        <div className="mt-4 relative rounded-sm overflow-hidden border border-[#C6A553]/50 h-28">
          <ArchivalImage
            src={ARTWORK.cover}
            alt="Illuminated scribe banner"
            className="w-full h-full object-cover scale-110 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#241C14]/80 via-[#241C14]/45 to-transparent flex items-center px-5 gap-4">
            <div className="w-16 h-16 rounded-sm bg-[#3D3124] border-2 border-[#C6A553] text-[#C6A553] font-calligraphy font-bold text-2xl flex items-center justify-center shrink-0">
              {user.initials}
            </div>
            <div className="text-[#FAF4EA] min-w-0">
              <p className="font-mono text-xs text-[#C6A553]">{user.handle}</p>
              <p className="font-calligraphy italic text-lg truncate">{user.title}</p>
              <p className="font-mono text-[11px] text-[#F5EADD]/80">Member since {user.joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Artisan Reputation & Referral Boost */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 vellum-inset rounded-sm">
            <p className="font-mono text-[11px] text-[#6E5B47] uppercase">Artisan Reputation</p>
            <p className="font-calligraphy text-3xl font-bold text-[#241C14] tabular-nums mt-0.5">
              {user.artisanReputation}
            </p>
          </div>
          <div className="p-3.5 vellum-inset rounded-sm">
            <p className="font-mono text-[11px] text-[#6E5B47] uppercase">Referrals Dispatched</p>
            <p className="font-calligraphy text-3xl font-bold text-[#135757] tabular-nums mt-0.5">
              {user.referralsSent}
            </p>
          </div>
          <div className="p-3.5 vellum-inset rounded-sm flex flex-col justify-between">
            <p className="font-mono text-[11px] text-[#6E5B47] uppercase">Boost Standing</p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSealPress();
                onSendReferral();
              }}
              className="tactile-btn wax-seal-btn mt-1.5 min-h-[38px] px-3 bg-[#3D3124] hover:bg-[#1D7A7A] text-[#FAF4EA] border border-[#C6A553] rounded-sm font-mono text-[11px] inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Send Referral (+25)</span>
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#6E5B47]">
              Scribe Biography
            </h3>
            {!editingBio && (
              <button
                type="button"
                onClick={() => {
                  setBioDraft(user.bio);
                  setEditingBio(true);
                }}
                className="text-xs font-mono text-[#135757] hover:underline"
              >
                Edit Bio
              </button>
            )}
          </div>
          {editingBio ? (
            <form onSubmit={handleSaveBio} className="mt-2 space-y-2">
              <textarea
                rows={2}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                aria-label="Edit scribe biography"
                className="w-full p-2.5 text-sm bg-[#F5EADD] border border-[#C6A553]/60 rounded-sm text-[#241C14] focus:outline-none focus:border-[#1D7A7A]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBio(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[#6E5B47]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-mono bg-[#3D3124] text-[#FAF4EA] rounded-sm"
                >
                  Save Bio
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-1.5 text-sm text-[#3D3124] leading-relaxed">{user.bio}</p>
          )}
        </div>

        {/* Verified Accolades (clean editorial text with gold icons, no pill clutter) */}
        <div className="mt-4 pt-3 border-t border-[#C6A553]/30">
          <p className="font-mono text-xs uppercase tracking-wider text-[#6E5B47] mb-2">
            Verified Manuscript Seals
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#241C14]">
            {user.badges.map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1.5 font-medium">
                <Award className="w-3.5 h-3.5 text-[#9B7B2F]" aria-hidden="true" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>

        <CalligraphicDivider className="my-4" />

        {/* Recent Inscribed Posts */}
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#6E5B47] mb-2">
            Recent Dossiers ({recentPosts.length})
          </p>
          {recentPosts.length === 0 ? (
            <p className="text-sm italic text-[#6E5B47]">
              You have not inscribed a public dossier yet. Use “+ NEW DOSSIER” in the Feed.
            </p>
          ) : (
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {recentPosts.map((p) => (
                <li
                  key={p.id}
                  className="p-3 vellum-inset rounded-sm flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-calligraphy font-bold text-base text-[#241C14] truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-[#6E5B47] truncate">
                      {p.workTitle} · {p.timestamp}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-[#135757] tabular-nums shrink-0">
                    {p.likes} hearts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TazhibFrame>
    </div>
  );
};

interface BridgeSettingsModalProps {
  open: boolean;
  settings: BridgeSettings;
  userHandle: string;
  onClose: () => void;
  onToggleSetting: (
    key: 'localP2PMesh' | 'localStreamServer' | 'telegramFailover' | 'zeroStorageCloudRouting'
  ) => void;
  onReSealManuscript: () => void;
  onNotifyToast: (msg: string) => void;
}

export const BridgeSettingsModal: React.FC<BridgeSettingsModalProps> = ({
  open,
  settings,
  userHandle,
  onClose,
  onToggleSetting,
  onReSealManuscript,
  onNotifyToast,
}) => {
  const [linkSeed, setLinkSeed] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const telegramLink = generateShortLink('telegram', `${userHandle}-${linkSeed}`);
  const cloudShortLink = generateShortLink(
    'p2p',
    `${userHandle}-${linkSeed}`,
    settings.customShortDomain
  );

  const handleCopy = (label: string, text: string) => {
    soundEngine.playInkClick();
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(label);
    onNotifyToast(`Copied ${label} link`);
    window.setTimeout(() => setCopiedKey(null), 1800);
  };

  const TOGGLES: Array<{
    key: 'localP2PMesh' | 'localStreamServer' | 'telegramFailover' | 'zeroStorageCloudRouting';
    label: string;
    detail: string;
    icon: typeof Radio;
  }> = [
    {
      key: 'localP2PMesh',
      label: 'Local P2P Mesh',
      detail: 'Direct peer-to-peer WebRTC audio sync and encrypted DM transport across nearby nodes.',
      icon: Radio,
    },
    {
      key: 'localStreamServer',
      label: 'Local Stream Server',
      detail: 'Host lossless LAN audio relays on http://127.0.0.1:8742/stream with zero cloud hops.',
      icon: Server,
    },
    {
      key: 'telegramFailover',
      label: 'Telegram Bot Auto-Failover & Link Generator',
      detail: 'Automatically route lobby invites via Telegram relay bot if direct mesh peers sleep.',
      icon: Send,
    },
    {
      key: 'zeroStorageCloudRouting',
      label: 'Zero-Storage Free Cloud Auto-Routing',
      detail: 'Stateless ephemeral edge signaling with custom server-branded short links.',
      icon: Globe,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#241C14]/76 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bridge-settings-heading"
    >
      <TazhibFrame accent="turquoise" className="w-full max-w-xl p-6 sm:p-7 animate-ink-reveal my-auto">
        <div className="flex items-start justify-between gap-4 border-b border-[#C6A553]/35 pb-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757] uppercase">
              Local Node &amp; Telegram Bridge
            </p>
            <h2
              id="bridge-settings-heading"
              className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14]"
            >
              Bridge &amp; Local Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playPageTurn();
              onClose();
            }}
            aria-label="Close bridge settings"
            className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* One-Click Feature Toggles */}
        <div className="mt-4 space-y-3">
          {TOGGLES.map(({ key, label, detail, icon: Icon }) => {
            const enabled = settings[key];
            return (
              <div
                key={key}
                className="p-3.5 vellum-inset rounded-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-sm bg-[#3D3124] text-[#C6A553] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-calligraphy text-lg font-bold text-[#241C14] leading-tight">
                      {label}
                    </p>
                    <p className="text-xs text-[#6E5B47] mt-0.5 leading-snug">{detail}</p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={`Toggle ${label}`}
                  onClick={() => {
                    soundEngine.playInkClick();
                    onToggleSetting(key);
                  }}
                  className={`tactile-btn min-w-[68px] min-h-[36px] px-3 rounded-sm font-mono text-xs border whitespace-nowrap shrink-0 ${
                    enabled
                      ? 'bg-[#1D7A7A] text-[#FAF4EA] border-[#135757]'
                      : 'bg-[#FAF4EA] text-[#6E5B47] border-[#C6A553]/55'
                  }`}
                >
                  {enabled ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
            );
          })}
        </div>

        <CalligraphicDivider className="my-5" />

        {/* Server-Branded Short Link & Telegram Failover Generator */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <p className="font-mono text-xs uppercase tracking-wider text-[#241C14] inline-flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#135757]" aria-hidden="true" />
              <span>Custom Short Links &amp; Failover Relay</span>
            </p>
            <button
              type="button"
              onClick={() => {
                soundEngine.playQuillScratch();
                setLinkSeed((n) => n + 1);
              }}
              className="tactile-btn inline-flex items-center gap-1 text-xs font-mono text-[#135757] hover:text-[#241C14]"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Mint Fresh Links</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-[#F5EADD] border border-[#C6A553]/45 rounded-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block font-mono text-[10px] uppercase text-[#6E5B47]">
                  Zero-Storage Branded Short Link ({settings.zeroStorageCloudRouting ? 'Active' : 'Standby'})
                </span>
                <span className="block font-mono text-xs text-[#241C14] truncate">
                  {cloudShortLink}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('short relay', cloudShortLink)}
                className="tactile-btn min-h-[36px] px-2.5 bg-[#FAF4EA] hover:bg-[#3D3124] hover:text-[#FAF4EA] border border-[#C6A553]/55 rounded-sm font-mono text-xs inline-flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'short relay' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'short relay' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-2.5 bg-[#F5EADD] border border-[#C6A553]/45 rounded-sm flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="block font-mono text-[10px] uppercase text-[#6E5B47]">
                  Telegram Bot Auto-Failover Link ({settings.telegramFailover ? 'Active' : 'Standby'})
                </span>
                <span className="block font-mono text-xs text-[#241C14] truncate">
                  {telegramLink}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('Telegram failover', telegramLink)}
                className="tactile-btn min-h-[36px] px-2.5 bg-[#FAF4EA] hover:bg-[#3D3124] hover:text-[#FAF4EA] border border-[#C6A553]/55 rounded-sm font-mono text-xs inline-flex items-center gap-1 shrink-0"
              >
                {copiedKey === 'Telegram failover' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'Telegram failover' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Note & Re-Seal Option */}
        <div className="mt-5 pt-3.5 border-t border-[#C6A553]/30 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#135757]">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Zero central message storage enabled</span>
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSealPress();
              onReSealManuscript();
            }}
            className="tactile-btn inline-flex items-center gap-1.5 text-xs font-mono text-[#8C2D28] hover:underline"
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Re-Seal Cover Gate</span>
          </button>
        </div>
      </TazhibFrame>
    </div>
  );
};
