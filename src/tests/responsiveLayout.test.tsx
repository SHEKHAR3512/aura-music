import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MiniPlayer } from '../features/player/MiniPlayer';
import { ExpandedPlayer } from '../features/player/ExpandedPlayer';
import { Shell } from '../components/layout/Shell';
import { SearchModal } from '../features/search/SearchModal';
import { JamPlayer } from '../features/jam/components/JamPlayer';
import { JamQueue } from '../features/jam/components/JamQueue';
import { JamRoom } from '../features/jam/components/JamRoom';
import { usePlayerStore } from '../stores/playerStore';
import { useJamStore } from '../features/jam/store/useJamStore';
import { Song } from '../lib/music/types';

const mockSong: Song = {
  id: 'song-test-1',
  title: 'Cinematic Odyssey',
  primaryArtist: 'Aura Symphony',
  artists: [{ id: 'art-1', name: 'Aura Symphony' }],
  album: { id: 'album-1', title: 'Cosmic Horizons' },
  duration: 215,
  year: 2026,
  language: 'English',
  audioUrl: 'https://example.com/audio.mp3',
  artwork: {
    low: 'https://example.com/art-low.jpg',
    medium: 'https://example.com/art-med.jpg',
    high: 'https://example.com/art-high.jpg',
  },
  explicit: false,
  hasLyrics: true,
  source: 'curated',
  sourceId: 'src-1',
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

// Helper to set window viewport
const setViewport = (width: number, height: number) => {
  window.innerWidth = width;
  window.innerHeight = height;
  window.dispatchEvent(new Event('resize'));
};

describe('Responsive UI & Viewport Layout Tests', () => {
  beforeEach(() => {
    // Reset Zustand stores
    usePlayerStore.setState({
      currentTrack: mockSong,
      isPlaying: false,
      isLoading: false,
      isExpandedPlayer: false,
      searchModalOpen: false,
      jamModalOpen: false,
      moreLikeThisOpen: false,
      eqModalOpen: false,
      queueOpen: false,
    });

    useJamStore.setState({
      room: null,
      userId: 'user-guest-1',
      userName: 'Mobile Tester',
      isAudioOutput: true,
    });
  });

  describe('1. Viewport: Mobile Phone (iPhone SE 375px & iPhone 15/16 390px)', () => {
    it('MiniPlayer: Gemini Sparkles icon is hidden on mobile to prevent overlapping controls', () => {
      setViewport(375, 667);
      renderWithProviders(<MiniPlayer />);

      // Verify Track Info is rendered
      expect(screen.getByText('Cinematic Odyssey')).toBeInTheDocument();
      expect(screen.getByText('Aura Symphony')).toBeInTheDocument();

      // Play button exists in Zone 2
      const playButton = screen.getByLabelText('Play');
      expect(playButton).toBeInTheDocument();

      // More Like This (Gemini Sparkles) button MUST have hidden md:flex
      const moreLikeThisBtn = screen.getByTitle('More Like This (Related Songs & Same Genre)');
      expect(moreLikeThisBtn.className).toContain('hidden');
      expect(moreLikeThisBtn.className).toContain('md:flex');

      // Studio EQ and Canvas Visualizer also hidden on mobile
      const eqBtn = screen.getByTitle('Studio Equalizer (10-Band EQ)');
      expect(eqBtn.className).toContain('hidden');
      expect(eqBtn.className).toContain('lg:flex');

      // Mobile like button is present
      const likeButtons = screen.getAllByLabelText(/Like song/i);
      expect(likeButtons.length).toBeGreaterThan(0);

      // MiniPlayer footer is docked above mobile nav bar
      const footer = screen.getByRole('region', { name: 'Audio Player' });
      expect(footer.className).toContain('bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))]');
      expect(footer.className).toContain('md:bottom-0');
    });

    it('Shell: Mobile bottom navigation bar is docked at bottom-0 with pb-safe without floating gaps', () => {
      setViewport(390, 844);
      renderWithProviders(
        <Shell currentTab="explore" onTabChange={() => {}}>
          <div>Content</div>
        </Shell>
      );

      const navBar = screen.getByLabelText('Mobile Navigation');
      expect(navBar).toBeInTheDocument();
      expect(navBar.className).toContain('bottom-0');
      expect(navBar.className).toContain('pb-safe');
      expect(navBar.className).toContain('h-14');

      // All 4 tabs present in mobile nav bar
      expect(navBar.textContent).toContain('Explore');
      expect(navBar.textContent).toContain('Charts');
      expect(navBar.textContent).toContain('Podcasts');
      expect(navBar.textContent).toContain('Library');
    });
  });

  describe('2. Viewport: Tablet & Desktop (768px & 1024px+)', () => {
    it('MiniPlayer: Gemini Sparkles icon and studio controls become visible on desktop', () => {
      setViewport(1280, 800);
      renderWithProviders(<MiniPlayer />);

      // Sparkles button has md:flex
      const moreLikeThisBtn = screen.getByTitle('More Like This (Related Songs & Same Genre)');
      expect(moreLikeThisBtn.className).toContain('md:flex');

      // Studio EQ has lg:flex
      const eqBtn = screen.getByTitle('Studio Equalizer (10-Band EQ)');
      expect(eqBtn.className).toContain('lg:flex');

      // Desktop footer sits at bottom-0
      const footer = screen.getByRole('region', { name: 'Audio Player' });
      expect(footer.className).toContain('md:bottom-0');
    });
  });

  describe('3. Jam Feature Song Adding on Mobile', () => {
    it('JamPlayer: Displays actionable Add Songs button in empty room state', () => {
      setViewport(375, 667);
      useJamStore.setState({
        room: {
          metadata: {
            id: 'JAM-1234',
            name: 'Roadtrip Jam',
            hostId: 'host-1',
            mode: 'chill',
            visibility: 'public',
            createdAt: Date.now(),
          },
          playback: {
            track: null,
            isPlaying: false,
            currentTime: 0,
            timestamp: Date.now(),
          },
          queue: [],
          participants: {
            'user-guest-1': {
              id: 'user-guest-1',
              displayName: 'Mobile Tester',
              avatar: 'https://example.com/avatar.jpg',
              role: 'guest',
              isOnline: true,
              lastHeartbeat: Date.now(),
            },
          },
          settings: {
            allowGuestQueue: true,
            allowGuestControl: false,
            allowGuestReorder: true,
            syncMode: 'strict',
          },
        } as any,
      });

      renderWithProviders(<JamPlayer />);

      expect(screen.getByText('No Song Playing Yet')).toBeInTheDocument();
      const addSongsBtn = screen.getByRole('button', { name: /Add Songs to Jam/i });
      expect(addSongsBtn).toBeInTheDocument();

      fireEvent.click(addSongsBtn);
      expect(usePlayerStore.getState().searchModalOpen).toBe(true);
    });

    it('JamPlayer: Displays Add Song to Jam button when a song is playing', () => {
      setViewport(390, 844);
      useJamStore.setState({
        room: {
          metadata: {
            id: 'JAM-1234',
            name: 'Roadtrip Jam',
            hostId: 'host-1',
            mode: 'party',
            visibility: 'public',
            createdAt: Date.now(),
          },
          playback: {
            track: mockSong,
            isPlaying: true,
            currentTime: 45,
            timestamp: Date.now(),
          },
          queue: [],
          participants: {
            'user-guest-1': {
              id: 'user-guest-1',
              displayName: 'Mobile Tester',
              avatar: 'https://example.com/avatar.jpg',
              role: 'guest',
              isOnline: true,
              lastHeartbeat: Date.now(),
            },
          },
          settings: {
            allowGuestQueue: true,
            allowGuestControl: false,
            allowGuestReorder: true,
            syncMode: 'strict',
          },
        } as any,
      });

      renderWithProviders(<JamPlayer />);

      const addBtn = screen.getByRole('button', { name: /Add Song to Jam/i });
      expect(addBtn).toBeInTheDocument();

      fireEvent.click(addBtn);
      expect(usePlayerStore.getState().searchModalOpen).toBe(true);
    });

    it('JamQueue: allows guests to queue songs by default even if settings are partially undefined', () => {
      const openSearchMock = vi.fn();
      useJamStore.setState({
        userId: 'guest-99',
        room: {
          metadata: {
            id: 'JAM-9999',
            name: 'Indie Vibes',
            hostId: 'host-different',
            mode: 'chill',
            visibility: 'public',
            createdAt: Date.now(),
          },
          playback: { track: mockSong, isPlaying: true, currentTime: 10, timestamp: Date.now() },
          queue: [],
          participants: {},
          settings: {} as any,
        } as any,
      });

      renderWithProviders(<JamQueue onOpenSearch={openSearchMock} />);

      const addSongBtns = screen.getAllByRole('button', { name: /Add Song/i });
      expect(addSongBtns.length).toBeGreaterThan(0);

      fireEvent.click(addSongBtns[0]);
      expect(openSearchMock).toHaveBeenCalled();
    });

    it('SearchModal: renders with z-[80] so it overlays Jam room modal cleanly', () => {
      usePlayerStore.setState({ searchModalOpen: true });
      useJamStore.setState({
        room: {
          metadata: { id: 'JAM-1111', name: 'Chill Room', hostId: 'host-1', mode: 'chill', visibility: 'public', createdAt: Date.now() },
          playback: { track: mockSong, isPlaying: true, currentTime: 0, timestamp: Date.now() },
          queue: [],
          participants: {},
          settings: { allowGuestQueue: true, allowGuestControl: true, allowGuestReorder: true, syncMode: 'strict' },
        } as any,
      });

      renderWithProviders(<SearchModal />);

      const dialog = screen.getByRole('dialog', { name: 'Universal Music Search' });
      expect(dialog).toBeInTheDocument();
      expect(dialog.className).toContain('z-[80]');
    });

    it('JamRoom: Displays mobile quick Add Song button that triggers search modal', () => {
      setViewport(375, 667);
      useJamStore.setState({
        room: {
          metadata: { id: 'JAM-1111', name: 'Chill Room', hostId: 'host-1', mode: 'chill', visibility: 'public', createdAt: Date.now() },
          playback: { track: mockSong, isPlaying: true, currentTime: 0, timestamp: Date.now() },
          queue: [],
          participants: {},
          settings: { allowGuestQueue: true, allowGuestControl: true, allowGuestReorder: true, syncMode: 'strict' },
        } as any,
      });

      renderWithProviders(<JamRoom />);

      const addBtns = screen.getAllByTitle('Search and add songs to Jam');
      expect(addBtns.length).toBeGreaterThanOrEqual(2);

      fireEvent.click(addBtns[1]);
      expect(usePlayerStore.getState().searchModalOpen).toBe(true);
    });
  });

  describe('4. ExpandedPlayer Responsive Layout', () => {
    it('ExpandedPlayer: renders responsive tabs, artwork, and controls without clipping', () => {
      setViewport(375, 667);
      usePlayerStore.setState({ isExpandedPlayer: true, currentTrack: mockSong });

      renderWithProviders(<ExpandedPlayer />);

      const expandedDialog = screen.getByRole('dialog', { name: 'Expanded Now Playing Experience' });
      expect(expandedDialog).toBeInTheDocument();

      // Check Artwork, Lyrics, Visualizer tabs
      expect(screen.getByText('Artwork')).toBeInTheDocument();
      expect(screen.getByText('Lyrics')).toBeInTheDocument();
      expect(screen.getByText('Visualizer')).toBeInTheDocument();

      // Check Song details
      expect(screen.getByText('Cinematic Odyssey')).toBeInTheDocument();
      expect(screen.getByText(/Aura Symphony/)).toBeInTheDocument();
    });
  });
});
