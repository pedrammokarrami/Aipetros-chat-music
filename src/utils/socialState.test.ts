import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptFriendRequestState,
  addCommentToPost,
  createDossierPost,
  createFriendFromHandle,
  createListeningLobby,
  declineFriendRequestState,
  togglePostLike,
  validateNewDossier,
  validateNewLobby,
} from './socialState';
import type { FriendRequest, FriendUser, UserProfile } from '../types';

const sampleUser: UserProfile = {
  handle: '@darius_khattat',
  name: 'Darius Khattat',
  initials: 'DK',
  title: 'Master Scribe',
  bio: 'Collector of analog tapes and poetry.',
  artisanReputation: 840,
  referralsSent: 4,
  badges: ['Founding Scribe'],
  joinedDate: 'Autumn 2025',
};

test('validateNewDossier rejects empty required fields', () => {
  assert.ok(
    validateNewDossier({
      title: '',
      body: 'Notes',
      workTitle: 'Track',
      artistName: 'Artist',
      tags: [],
    })
  );
  assert.equal(
    validateNewDossier({
      title: 'Midnight Santur',
      body: 'Warm acoustic overtones on vinyl.',
      workTitle: 'Dastgah-e Nava',
      artistName: 'Parviz Meshkatian',
      tags: ['#RumiPoetry'],
    }),
    null
  );
});

test('createDossierPost, togglePostLike, and addCommentToPost update state cleanly', () => {
  const post = createDossierPost(
    {
      title: 'Echoes of Shiraz',
      body: 'Spinning https://bandcamp.com/shiraz-ensemble/night-reed-flute.mp3',
      workTitle: 'Night Reed Flute',
      artistName: 'Shiraz Ensemble',
      tags: ['RumiPoetry', '#PersianClassical'],
    },
    sampleUser
  );
  assert.equal(post.tags[0], '#RumiPoetry');
  assert.ok(post.media);
  assert.equal(post.likes, 1);

  const unliked = togglePostLike([post], post.id);
  assert.equal(unliked[0].likedByMe, false);
  assert.equal(unliked[0].likes, 0);

  const commented = addCommentToPost(
    unliked,
    post.id,
    'Pair it with https://soundcloud.com/rumi-readings/masnavi-excerpt',
    sampleUser
  );
  assert.equal(commented[0].comments.length, 1);
  assert.ok(commented[0].comments[0].media);
});

test('acceptFriendRequestState adds friend, removes request, and boosts Artisan Reputation', () => {
  const requests: FriendRequest[] = [
    {
      id: 'req-1',
      fromHandle: '@soraya_ney',
      fromName: 'Soraya Bahrami',
      fromInitials: 'SB',
      note: 'Loved your notes on late-night jazz.',
      mutualClubs: 2,
      timestamp: '10m ago',
      listeningTo: 'Chet Baker — Almost Blue',
      reputation: 690,
    },
  ];
  const friends: FriendUser[] = [];
  const next = acceptFriendRequestState(requests, friends, sampleUser, 'req-1');
  assert.equal(next.requests.length, 0);
  assert.equal(next.friends.length, 1);
  assert.equal(next.friends[0].handle, '@soraya_ney');
  assert.equal(next.profile.artisanReputation, 855);

  const afterDecline = declineFriendRequestState(requests, 'req-1');
  assert.equal(afterDecline.length, 0);
});

test('validateNewLobby and createListeningLobby build a synced room', () => {
  assert.ok(
    validateNewLobby({
      title: 'Vinyl Hour',
      clubName: 'Jazz',
      genreTag: '#JazzSession',
      streamUrl: 'not-a-url',
      status: 'LIVE',
    })
  );
  const lobby = createListeningLobby(
    {
      title: 'Midnight Analog Room',
      clubName: 'Vinyl & Brass Salon',
      genreTag: 'JazzSession',
      streamUrl: 'https://nava.scribe/stream/midnight-vinyl-jazz',
      status: 'LIVE',
    },
    sampleUser
  );
  assert.equal(lobby.genreTag, '#JazzSession');
  assert.equal(lobby.members.length, 1);
  assert.equal(lobby.messages.length, 1);
});

test('createFriendFromHandle normalizes user handle input', () => {
  const friend = createFriendFromHandle('  Kaveh_Vinyl ');
  assert.ok(friend);
  assert.equal(friend.handle, '@kaveh_vinyl');
  assert.equal(friend.name, 'Kaveh Vinyl');
  assert.equal(friend.initials, 'KV');
});
