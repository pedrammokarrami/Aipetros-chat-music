import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Shield, Smartphone, X } from 'lucide-react';
import { ARTWORK } from '../data/seedData';
import { soundEngine } from '../utils/soundEngine';
import { ArchivalImage, CalligraphicDivider, NavaNegarEmblem, TazhibFrame } from './TazhibOrnament';

interface LockedManuscriptGateProps {
  onUnlock: (channel: string) => void;
}

const INVITE_CHANNELS = [
  {
    id: 'Email',
    label: 'Email Scroll',
    detail: 'Dispatch sealed folio invitation via email',
    icon: Mail,
  },
  {
    id: 'SMS',
    label: 'SMS Courier',
    detail: 'Send instant mobile text passage',
    icon: Smartphone,
  },
  {
    id: 'WhatsApp',
    label: 'WhatsApp',
    detail: 'Share one-click listening seal on WhatsApp',
    icon: MessageSquare,
  },
  {
    id: 'Telegram',
    label: 'Telegram',
    detail: 'Relay via Nava-Negar Bot & direct invite',
    icon: Send,
  },
] as const;

export const LockedManuscriptGate: React.FC<LockedManuscriptGateProps> = ({ onUnlock }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const handleOpenProtocolModal = () => {
    soundEngine.playSealPress();
    setModalOpen(true);
  };

  const handleDispatchInvite = (channel: string) => {
    if (isRevealing) return;
    soundEngine.playSealPress();
    setSelectedChannel(channel);
    setModalOpen(false);
    setIsRevealing(true);
    window.setTimeout(() => {
      soundEngine.playPageTurn();
    }, 240);
    window.setTimeout(() => {
      onUnlock(channel);
    }, 860);
  };

  return (
    <div
      className="fixed inset-0 z-50 parchment-canvas flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      data-testid="locked-manuscript-gate"
    >
      {/* Parting book leaves during the calligraphy reveal animation */}
      {isRevealing && (
        <div className="fixed inset-0 z-50 pointer-events-none flex" aria-live="polite">
          <div className="w-1/2 h-full parchment-canvas border-r-2 border-[#C6A553]/70 shadow-2xl animate-leaf-left" />
          <div className="w-1/2 h-full parchment-canvas border-l-2 border-[#C6A553]/70 shadow-2xl animate-leaf-right" />
          <div className="fixed inset-0 flex flex-col items-center justify-center">
            <div className="animate-emblem-ascend flex flex-col items-center">
              <NavaNegarEmblem size={136} />
              <p className="mt-4 font-calligraphy italic text-2xl sm:text-3xl tracking-wider text-[#241C14]">
                Unsealing the Anthology…
              </p>
              {selectedChannel && (
                <p className="mt-1 font-mono text-xs text-[#135757]">
                  Invitation dispatched via {selectedChannel}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main sealed manuscript cover */}
      <div
        className={`w-full max-w-2xl transition-opacity duration-300 ${
          isRevealing ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <TazhibFrame className="p-6 sm:p-10 relative overflow-hidden">
          {/* Subtle top archival banner */}
          <div className="flex items-center justify-center gap-2 text-center border-b border-[#C6A553]/40 pb-3.5 mb-6">
            <Shield className="w-4 h-4 text-[#8C2D28] shrink-0" aria-hidden="true" />
            <p className="font-mono text-[11px] sm:text-xs tracking-[0.14em] text-[#8C2D28] font-medium">
              ACCESS RESTRICTED // INVITATION_ONLY PROTOCOL ACTIVE
            </p>
          </div>

          {/* Illuminated Cover Frontispiece */}
          <div className="relative mb-6 rounded-sm overflow-hidden border border-[#C6A553]/50 bg-[#EFE2D0]">
            <ArchivalImage
              src={ARTWORK.cover}
              alt="Illuminated Persian manuscript frontispiece"
              className="w-full h-44 sm:h-52 object-cover scale-110 opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#241C14]/82 via-[#241C14]/35 to-transparent flex flex-col items-center justify-end pb-5 px-4 text-center">
              <div className="mb-2 drop-shadow-md">
                <NavaNegarEmblem size={84} />
              </div>
              <h1 className="font-calligraphy text-3xl sm:text-5xl font-bold tracking-[0.14em] text-[#FAF4EA] drop-shadow">
                NAVA-NEGAR
              </h1>
              <p className="font-calligraphy italic text-base sm:text-lg text-[#F5EADD]/90 mt-0.5">
                Calligraphy Scribe · Music &amp; Podcast Anthology
              </p>
            </div>
          </div>

          {/* Sealed Manifesto Prose */}
          <div className="text-center max-w-lg mx-auto">
            <p className="text-sm sm:text-base leading-relaxed text-[#3D3124]">
              This listening salon is kept intact by fellow scribes. To unseal the anthology and
              enter our peer-to-peer music rooms, podcasts, and private dossiers, dispatch a single
              invitation scroll to one trusted friend.
            </p>
            <CalligraphicDivider className="my-5" />

            {/* Primary Wax-Seal Action Button */}
            <button
              type="button"
              onClick={handleOpenProtocolModal}
              className="tactile-btn wax-seal-btn w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 bg-[#3D3124] hover:bg-[#241C14] text-[#FAF4EA] border border-[#C6A553] rounded-sm shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A]"
            >
              <span className="w-2.5 h-2.5 rotate-45 bg-[#C6A553] shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs sm:text-sm tracking-[0.12em] font-medium whitespace-nowrap">
                NAVA_SCRIBE_INVITE_PROTOCOL
              </span>
              <span className="w-2.5 h-2.5 rotate-45 bg-[#C6A553] shrink-0" aria-hidden="true" />
            </button>

            <p className="mt-4 text-xs text-[#6E5B47]">
              Zero-storage local mesh · One-click invitation immediately unseals your copy
            </p>
          </div>
        </TazhibFrame>
      </div>

      {/* Calligraphic Invitation Dispatch Modal */}
      {modalOpen && !isRevealing && (
        <div
          className="fixed inset-0 z-50 bg-[#241C14]/72 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-protocol-title"
        >
          <TazhibFrame accent="turquoise" className="w-full max-w-lg p-6 sm:p-7 animate-ink-reveal">
            <div className="flex items-start justify-between gap-4 border-b border-[#C6A553]/35 pb-4">
              <div>
                <p className="font-mono text-[11px] tracking-[0.14em] text-[#135757]">
                  NAVA_SCRIBE_INVITE_PROTOCOL
                </p>
                <h2
                  id="invite-protocol-title"
                  className="font-calligraphy text-2xl sm:text-3xl font-bold text-[#241C14] mt-1"
                >
                  Dispatch an Invitation Scroll
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playInkClick();
                  setModalOpen(false);
                }}
                aria-label="Close invitation protocol modal"
                className="tactile-btn min-w-[40px] min-h-[40px] flex items-center justify-center text-[#6E5B47] hover:text-[#241C14] hover:bg-[#EFE2D0] rounded-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-4 text-sm text-[#3D3124] leading-relaxed">
              Choose any channel below to invite at least one friend to NAVA-NEGAR. Selecting a
              channel immediately breaks the wax seal and opens the anthology.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INVITE_CHANNELS.map(({ id, label, detail, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleDispatchInvite(id)}
                  className="tactile-btn group text-left p-4 vellum-inset hover:bg-[#FAF4EA] hover:border-[#1D7A7A] rounded-sm flex items-start gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D7A7A]"
                >
                  <span className="w-10 h-10 shrink-0 rounded-sm bg-[#3D3124] text-[#C6A553] group-hover:bg-[#1D7A7A] group-hover:text-[#FAF4EA] flex items-center justify-center transition-colors">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-calligraphy text-lg font-bold text-[#241C14] leading-tight">
                      {label}
                    </span>
                    <span className="block text-xs text-[#6E5B47] mt-0.5 leading-snug">
                      {detail}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-5 pt-3 border-t border-[#C6A553]/30 text-xs text-[#6E5B47] text-center font-mono">
              Referral bonus: +25 Artisan Reputation upon unsealing
            </p>
          </TazhibFrame>
        </div>
      )}
    </div>
  );
};
