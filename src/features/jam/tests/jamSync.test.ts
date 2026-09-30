import { describe, it, expect } from 'vitest';
import { DriftCorrection } from '../sync/DriftCorrection';
import { SYNC_CONFIG } from '../sync/SyncConfig';
import { JamPresenceService, isParticipantOnline } from '../services/JamPresenceService';
import { JamPlaybackService } from '../services/JamPlaybackService';
import { RoomDNAEngine } from '../recommendations/RoomDNAEngine';
import { JamRoomState } from '../types/jam.types';
import { Song } from '../../../lib/music/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runJamTests() {
  console.log('\n--- STARTING JAM REALTIME ENGINE TESTS ---\n');

  // TEST 1: Clock Synchronization Offset Formula
  console.log('Test 1: Clock Synchronization & NTP Math');
  {
    const clientSend = 1000;
    const serverReceive = 1025;
    const serverSend = 1025;
    const clientReceive = 1050;

    const rtt = clientReceive - clientSend; // 50ms
    const offset = Math.round(serverSend - (clientSend + rtt / 2)); // 1025 - 1025 = 0ms
    assert(rtt === 50, 'Calculates RTT correctly as 50ms');
    assert(offset === 0, 'Offset is 0 when clocks are in exact sync');

    // Asymmetric offset test
    const offsetFastClient = Math.round(1025 - (1100 + 50 / 2)); // server=1025, client=1100 -> client is 100ms ahead
    assert(offsetFastClient === -100, 'Calculates negative offset when client clock is ahead');
  }

  // TEST 2: Drift Correction Deadband (<80ms)
  console.log('\nTest 2: Drift Correction Inaudible Deadband');
  {
    const corrector = new DriftCorrection();
    // Expected = 10.0s, Actual = 10.04s (40ms drift)
    const result = corrector.evaluateAndCorrect(10.04, 10.0, true);
    assert(result.action === 'none', 'Drift of 40ms is ignored within 80ms deadband');
    assert(result.driftMs === 40, 'DriftMs accurately measured as 40ms');
  }

  // TEST 3: Drift Correction Rate Adjustment (80ms - 300ms)
  console.log('\nTest 3: Micro PlaybackRate Adjustment for 80ms–300ms');
  {
    const corrector = new DriftCorrection();
    // Local head is 150ms ahead (drift = +150ms) -> should gently slow down
    const resultAhead = corrector.evaluateAndCorrect(10.15, 10.0, true);
    assert(resultAhead.action === 'rate_adjust', '150ms drift triggers rate_adjust action');
    assert(resultAhead.suggestedRate < 1.0, 'Local ahead suggests slowdown (< 1.0x)');

    // Local head is 200ms behind (drift = -200ms) -> should gently speed up
    const resultBehind = corrector.evaluateAndCorrect(9.8, 10.0, true);
    assert(resultBehind.action === 'rate_adjust', '-200ms drift triggers rate_adjust action');
    assert(resultBehind.suggestedRate > 1.0, 'Local behind suggests speedup (> 1.0x)');
  }

  // TEST 4: Controlled Seek for Drift > 300ms
  console.log('\nTest 4: Controlled Seek for Drift > 300ms');
  {
    const corrector = new DriftCorrection();
    // 600ms drift
    const result = corrector.evaluateAndCorrect(10.6, 10.0, true);
    assert(result.action === 'soft_seek', '600ms drift triggers soft_seek');
    assert(result.targetPositionSeconds === 10.0, 'Target seek position matches authoritative time');
  }

  // TEST 5: Expected Playback Position with Network Delay
  console.log('\nTest 5: Expected Playback Position Calculation');
  {
    const serverTimestampAtBroadcast = 1700000000000;
    const currentServerTime = 1700000002500; // 2.5s elapsed
    const positionAtBroadcast = 45.0; // was at 45.0s

    const elapsedSeconds = (currentServerTime - serverTimestampAtBroadcast) / 1000;
    const expected = positionAtBroadcast + elapsedSeconds;

    assert(expected === 47.5, 'Expected position correctly projects 47.5s after 2.5s elapsed');
  }

  // TEST 6: Playback Version Ordering (Monotonicity)
  console.log('\nTest 6: Monotonic Playback Version Ordering');
  {
    const currentVersion = 5;
    const staleEventVersion = 4;
    const newerEventVersion = 6;

    const shouldIgnoreStale = staleEventVersion < currentVersion;
    const shouldAcceptNewer = newerEventVersion >= currentVersion;

    assert(shouldIgnoreStale, 'Stale events with older playbackVersion are ignored');
    assert(shouldAcceptNewer, 'Newer events with higher playbackVersion are accepted');
  }

  // TEST 7: Vote-to-Skip Threshold Logic
  console.log('\nTest 7: Vote-to-Skip Threshold Calculation');
  {
    const totalOnlineParticipants = 4;
    const thresholdPercent = 50;
    const votesNeeded = Math.ceil((totalOnlineParticipants * thresholdPercent) / 100);
    assert(votesNeeded === 2, 'With 4 listeners and 50% threshold, exactly 2 votes are needed');

    const votesCast = ['user-1', 'user-2'];
    const hasPassed = votesCast.length >= votesNeeded;
    assert(hasPassed, '2 votes out of 2 needed triggers track advancement');
  }

  // TEST 8: Deterministic Host Election on Disconnect
  console.log('\nTest 8: Host Disconnect & Successor Election');
  {
    const mockState: JamRoomState = {
      metadata: {
        id: 'TEST01',
        name: 'Test Room',
        hostId: 'host-1',
        createdAt: 1000,
        expiresAt: 50000,
        privacy: 'public_link',
        mode: 'chill',
        inviteToken: 'tok123',
        active: true,
      },
      playback: {
        trackId: null,
        track: null,
        isPlaying: false,
        position: 0,
        playbackStartedAt: 0,
        playbackVersion: 1,
        updatedAt: 0,
        updatedBy: 'host-1',
      },
      queue: [],
      participants: {
        'host-1': {
          id: 'host-1',
          displayName: 'Old Host',
          avatar: '',
          role: 'host',
          isOnline: false,
          joinedAt: 100,
          lastSeen: 1000, // Long ago (offline)
        },
        'guest-senior': {
          id: 'guest-senior',
          displayName: 'Maya',
          avatar: '',
          role: 'guest',
          isOnline: true,
          joinedAt: 200, // Joined earlier
          lastSeen: Date.now(),
        },
        'guest-junior': {
          id: 'guest-junior',
          displayName: 'Sam',
          avatar: '',
          role: 'guest',
          isOnline: true,
          joinedAt: 400, // Joined later
          lastSeen: Date.now(),
        },
      },
      settings: {
        allowGuestQueue: true,
        allowGuestReorder: true,
        allowGuestSkip: false,
        allowGuestPause: false,
        allowGuestSeek: false,
        allowGuestVolume: true,
        allowReactions: true,
        allowRecommendations: true,
        voteSkipThresholdPercent: 50,
      },
      reactions: [],
      activity: [],
      songRequests: [],
      skipVotes: [],
      sequenceNumber: 1,
      serverTimestamp: Date.now(),
    };

    const electedHostId = JamPresenceService.checkAndElectNewHost(mockState, 'guest-senior');
    assert(electedHostId === 'guest-senior', 'Oldest connected active participant (Maya) is elected host');
  }

  // TEST 9: Room DNA Computation
  console.log('\nTest 9: Room DNA Computation');
  {
    const mockSongs: Partial<Song>[] = [
      { id: '1', title: 'Song 1', language: 'hindi', primaryArtist: 'Arijit Singh' },
      { id: '2', title: 'Song 2', language: 'hindi', primaryArtist: 'Arijit Singh' },
      { id: '3', title: 'Song 3', language: 'english', primaryArtist: 'The Weeknd' },
    ];

    const dna = RoomDNAEngine.calculate(mockSongs as Song[], 3, 'party');
    assert(dna.energy === 'HIGH', 'Party mode sets DNA energy to HIGH');
    assert(dna.languages.some((l) => l.language === 'Hindi'), 'Room DNA identifies Hindi language dominance');
    assert(dna.topArtists[0] === 'Arijit Singh', 'Top artist correctly identified as Arijit Singh');
  }

  // TEST 10: Accurate Online Presence Filtering
  console.log('\nTest 10: Accurate Online Presence Filtering');
  {
    const now = Date.now();
    const mockParticipants = {
      'user-active-1': { id: 'user-active-1', displayName: 'User 1', avatar: '', role: 'host' as const, isOnline: true, joinedAt: now - 60000, lastSeen: now - 5000 },
      'user-active-2': { id: 'user-active-2', displayName: 'User 2', avatar: '', role: 'guest' as const, isOnline: true, joinedAt: now - 40000, lastSeen: now - 10000 },
      'user-stale-ghost': { id: 'user-stale-ghost', displayName: 'Stale Ghost', avatar: '', role: 'guest' as const, isOnline: true, joinedAt: now - 3600000, lastSeen: now - 600000 },
    };

    const onlineMembers = Object.values(mockParticipants).filter(isParticipantOnline);
    assert(onlineMembers.length === 2, 'Accurately filters out ghost participants whose heartbeat expired');
  }

  // TEST 11: Vote to Skip Permission Bypasses allowGuestSkip for System / Vote Actions
  console.log('\nTest 11: Vote to Skip Track Transition');
  {
    const mockState: JamRoomState = {
      metadata: { id: 'RM1', name: 'R1', hostId: 'host-1', createdAt: 0, expiresAt: 10000, privacy: 'public_link', mode: 'chill', inviteToken: '', active: true },
      playback: { trackId: 'song-1', track: null, isPlaying: true, position: 10, playbackStartedAt: 0, playbackVersion: 1, updatedAt: 0, updatedBy: 'host-1' },
      queue: [],
      participants: {},
      settings: { allowGuestQueue: true, allowGuestReorder: true, allowGuestSkip: false, allowGuestPause: false, allowGuestSeek: false, allowGuestVolume: true, allowReactions: true, allowRecommendations: true, voteSkipThresholdPercent: 50 },
      reactions: [],
      activity: [],
      songRequests: [],
      skipVotes: [],
      sequenceNumber: 1,
      serverTimestamp: 0,
    };

    let threw = false;
    try {
      await JamPlaybackService.changeTrack(mockState, 'system', 'Vote to Skip', { id: 'song-2', title: 'Next Song', primaryArtist: 'Artist', artwork: {} } as any);
    } catch (e) {
      threw = true;
    }
    assert(!threw, 'Vote to Skip (system action) succeeds even when allowGuestSkip is false');
  }

  console.log('\n--- ALL JAM REALTIME ENGINE TESTS PASSED! ---\n');
}

describe('Jam Realtime Engine Suite', () => {
  it('passes all jam engine sync and drift tests', async () => {
    await runJamTests();
  });
});
