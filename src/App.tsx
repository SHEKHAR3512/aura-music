import React, { useState, useEffect } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Shell } from './components/layout/Shell';
import { HomeFeed } from './features/discovery/HomeFeed';
import { ArtistView } from './features/discovery/ArtistView';
import { PlaylistView } from './features/discovery/PlaylistView';
import { PodcastsView } from './features/podcasts/PodcastsView';
import { LibraryView } from './features/library/LibraryView';
import { MiniPlayer } from './features/player/MiniPlayer';
import { ExpandedPlayer } from './features/player/ExpandedPlayer';
import { StudioEQModal } from './features/audio/StudioEQModal';
import { QueueDrawer } from './features/queue/QueueDrawer';
import { SearchModal } from './features/search/SearchModal';
import { AuthModal } from './features/auth/AuthModal';
import { OfflineToast } from './components/ui/OfflineToast';
import { MoreLikeThisModal } from './features/recommendations/MoreLikeThisModal';
import { GroupPlayModal } from './features/jam/GroupPlayModal';
import { useJamPlayerSync } from './lib/jam/useJamPlayerSync';
import { usePlayerStore } from './stores/playerStore';
import { useLibraryStore } from './lib/storage/libraryStore';
import { initFirestoreSync } from './lib/storage/firestoreSync';
import { Artist, Album, Playlist } from './lib/music/types';
import { offlineMetadataCache } from './lib/storage/offlineMetadataCache';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days persistence for offline browsing
      staleTime: 1000 * 60 * 15,
      retry: 1,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'AURA_OFFLINE_REACT_QUERY_CACHE',
});

export function App() {
  useJamPlayerSync();
  const [currentTab, setCurrentTab] = useState<string>('explore');
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const { updateProfile, setPlaylistsFromRemote, setStatsFromRemote } = useLibraryStore();

  // Restore Firebase auth session on page load & initialize Firestore real-time sync
  useEffect(() => {
    let cleanupSync: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (cleanupSync) {
        cleanupSync();
        cleanupSync = null;
      }

      if (user) {
        const providerIds = user.providerData.map((p) => p.providerId);
        const provider = providerIds.includes('google.com') ? 'google' : 'email';
        const profileData = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Aura Listener',
          email: user.email || '',
          isAnonymous: false,
          provider: provider as 'guest' | 'google' | 'email',
          avatar:
            user.photoURL ||
            `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        };

        updateProfile(profileData);

        // Start real-time Firestore sync for playlists & stats
        cleanupSync = initFirestoreSync(user.uid, {
          onPlaylistsLoaded: (playlists) => {
            setPlaylistsFromRemote(playlists);
          },
          onStatsLoaded: (stats) => {
            setStatsFromRemote(stats);
          },
          getCurrentPlaylists: () => useLibraryStore.getState().playlists,
        });
      }
    });

    return () => {
      if (cleanupSync) cleanupSync();
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Auto-open Jam session dialog if navigated from scanned QR code (?jam=JAM-XXXX)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('jam')) {
      usePlayerStore.getState().setJamModalOpen(true);
    }
  }, []);

  const handleSelectArtist = (artist: Artist) => {
    offlineMetadataCache.recordArtistVisit(artist);
    setSelectedArtist(artist);
    setSelectedAlbum(null);
    setSelectedPlaylist(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setSelectedArtist(null);
    setSelectedPlaylist(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlaylist = (playlist: Playlist) => {
    offlineMetadataCache.recordPlaylistVisit(playlist);
    setSelectedPlaylist(playlist);
    setSelectedArtist(null);
    setSelectedAlbum(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToMain = () => {
    setSelectedArtist(null);
    setSelectedAlbum(null);
    setSelectedPlaylist(null);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    handleBackToMain();
  };

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <Shell currentTab={currentTab} onTabChange={handleTabChange}>
        
        {/* Detail Views if Active */}
        {selectedArtist ? (
          <ArtistView
            artist={selectedArtist}
            onBack={handleBackToMain}
            onSelectAlbum={handleSelectAlbum}
          />
        ) : selectedAlbum ? (
          <PlaylistView
            album={selectedAlbum}
            onBack={handleBackToMain}
          />
        ) : selectedPlaylist ? (
          <PlaylistView
            playlist={selectedPlaylist}
            onBack={handleBackToMain}
          />
        ) : (
          /* Primary Navigation Tab Views */
          <>
            {currentTab === 'explore' && (
              <HomeFeed
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
              />
            )}

            {currentTab === 'charts' && (
              <HomeFeed
                onSelectArtist={handleSelectArtist}
                onSelectAlbum={handleSelectAlbum}
                onSelectPlaylist={handleSelectPlaylist}
              />
            )}

            {currentTab === 'podcasts' && <PodcastsView />}

            {currentTab === 'library' && (
              <LibraryView
                onSelectPlaylist={handleSelectPlaylist}
                onSelectArtist={handleSelectArtist}
              />
            )}
          </>
        )}

      </Shell>

      {/* Persistent Mini Player */}
      <MiniPlayer />

      {/* Fullscreen Expanded Now Playing */}
      <ExpandedPlayer />

      {/* Studio EQ Console Modal */}
      <StudioEQModal />

      {/* Slide-in Queue Drawer */}
      <QueueDrawer />

      {/* Instant Search Overlay */}
      <SearchModal
        onSelectArtist={handleSelectArtist}
        onSelectAlbum={handleSelectAlbum}
        onSelectPlaylist={handleSelectPlaylist}
      />

      {/* Persistent Offline Mode Toast Notification */}
      <OfflineToast
        onOpenOfflineLibrary={() => {
          setCurrentTab('library');
          handleBackToMain();
        }}
      />

      {/* Member Authentication Modal */}
      <AuthModal />

      {/* More Like This (Related Tracks & Genre Recommendations) */}
      <MoreLikeThisModal />

      {/* Car Group Play / Multi-Device Jam Session Modal */}
      <GroupPlayModal />
    </PersistQueryClientProvider>
  );
}

export default App;
