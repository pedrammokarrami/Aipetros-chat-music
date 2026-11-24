import React from 'react';
import { Bell, Check, CheckCheck, Heart, Radio, Sparkles, UserPlus, X } from 'lucide-react';
import type { FriendRequest, NotificationItem } from '../types';
import { soundEngine } from '../utils/soundEngine';
import { CalligraphicDivider, TazhibFrame } from './TazhibOrnament';

interface AlertsViewProps {
  friendRequests: FriendRequest[];
  notifications: NotificationItem[];
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
  onMarkAllRead: () => void;
  onOpenNotification: (notification: NotificationItem) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  friendRequests,
  notifications,
  onAcceptRequest,
  onDeclineRequest,
  onMarkAllRead,
  onOpenNotification,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <section className="animate-unroll" aria-label="Alerts and Friend Requests">
      {/* Header */}
      <div className="pb-5 border-b border-[#C6A553]/40 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs tracking-[0.14em] text-[#135757] uppercase">
            Correspondence Ledger · Connections &amp; Mentions
          </p>
          <h2 className="font-calligraphy text-3xl sm:text-4xl font-bold text-[#241C14] mt-1">
            Alerts &amp; Friend Requests
          </h2>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playInkClick();
              onMarkAllRead();
            }}
            className="tactile-btn min-h-[40px] px-3.5 inline-flex items-center gap-1.5 bg-[#FAF4EA] hover:bg-[#3D3124] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/60 rounded-sm font-mono text-xs whitespace-nowrap"
          >
            <CheckCheck className="w-4 h-4" aria-hidden="true" />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {/* Dedicated FRIEND REQUESTS Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono text-xs tracking-[0.14em] font-semibold text-[#8C2D28] uppercase">
            FRIEND REQUESTS ({friendRequests.length})
          </h3>
          <span className="font-mono text-xs text-[#6E5B47]">
            Accepting grants +15 Artisan Reputation
          </span>
        </div>

        {friendRequests.length === 0 ? (
          <TazhibFrame dense className="p-6 text-center">
            <p className="font-calligraphy italic text-xl text-[#6E5B47]">
              All pending scribe invitations have been answered.
            </p>
          </TazhibFrame>
        ) : (
          <div className="space-y-3.5">
            {friendRequests.map((req) => (
              <TazhibFrame
                key={req.id}
                accent="turquoise"
                dense
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-sm bg-[#3D3124] text-[#C6A553] border border-[#C6A553]/70 flex items-center justify-center font-calligraphy font-bold text-lg shrink-0">
                    {req.fromInitials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-calligraphy text-xl font-bold text-[#241C14]">
                        {req.fromName}
                      </span>
                      <span className="font-mono text-xs text-[#6E5B47]">{req.fromHandle}</span>
                      <span className="font-mono text-[11px] text-[#6E5B47]">
                        · {req.timestamp}
                      </span>
                    </div>
                    <p className="text-sm text-[#3D3124] mt-1 leading-relaxed">“{req.note}”</p>
                    <p className="font-mono text-[11px] text-[#135757] mt-1.5">
                      {req.mutualClubs} shared clubs · Listening to {req.listeningTo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSealPress();
                      onAcceptRequest(req.id);
                    }}
                    aria-label={`Accept friend request from ${req.fromName}`}
                    className="tactile-btn wax-seal-btn min-h-[42px] px-4 inline-flex items-center gap-1.5 bg-[#1D7A7A] hover:bg-[#135757] text-[#FAF4EA] border border-[#135757] rounded-sm font-mono text-xs whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>ACCEPT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playInkClick();
                      onDeclineRequest(req.id);
                    }}
                    aria-label={`Decline friend request from ${req.fromName}`}
                    className="tactile-btn min-h-[42px] px-3.5 inline-flex items-center gap-1.5 bg-[#F5EADD] hover:bg-[#8C2D28] hover:text-[#FAF4EA] text-[#3D3124] border border-[#C6A553]/60 rounded-sm font-mono text-xs whitespace-nowrap"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>DECLINE</span>
                  </button>
                </div>
              </TazhibFrame>
            ))}
          </div>
        )}
      </div>

      <CalligraphicDivider className="my-7" />

      {/* Notifications Ledger */}
      <div>
        <h3 className="font-mono text-xs tracking-[0.14em] font-semibold text-[#6E5B47] uppercase mb-3">
          RECENT NOTIFICATIONS
        </h3>

        <TazhibFrame dense className="divide-y divide-[#C6A553]/30">
          {notifications.length === 0 ? (
            <p className="p-6 text-center font-calligraphy italic text-xl text-[#6E5B47]">
              No correspondence recorded yet.
            </p>
          ) : (
            notifications.map((notif) => {
              const Icon =
                notif.type === 'like'
                  ? Heart
                  : notif.type === 'lobby'
                    ? Radio
                    : notif.type === 'friend'
                      ? UserPlus
                      : notif.type === 'referral'
                        ? Sparkles
                        : Bell;

              return (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playQuillScratch();
                    onOpenNotification(notif);
                  }}
                  className={`w-full text-left p-4 flex items-start gap-3.5 transition-colors hover:bg-[#EFE2D0]/65 ${
                    notif.read ? 'opacity-80' : 'bg-[#FAF4EA]'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 border ${
                      notif.read
                        ? 'bg-[#EFE2D0] text-[#6E5B47] border-[#C6A553]/35'
                        : 'bg-[#3D3124] text-[#C6A553] border-[#C6A553]'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#241C14] leading-snug">
                      <span className="font-semibold">{notif.actorName}</span>{' '}
                      <span className="font-mono text-xs text-[#6E5B47]">{notif.actorHandle}</span>{' '}
                      {notif.message}
                    </p>
                    <p className="font-mono text-[11px] text-[#6E5B47] mt-1">
                      {notif.timestamp} {!notif.read && '· Unread'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </TazhibFrame>
      </div>
    </section>
  );
};
