import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Playlist, Song } from '../music/types';
import { UserProfile, ListeningStats } from './libraryStore';

/**
 * Saves or updates user profile metadata in Firestore under users/{uid}
 */
export async function saveUserProfileToFirestore(
  uid: string,
  profile: Partial<UserProfile>
): Promise<void> {
  if (!uid || uid.startsWith('user_local_')) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...profile,
        lastActive: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Failed to save user profile:', error);
  }
}

/**
 * Saves a single playlist to users/{uid}/playlists/{playlistId}
 */
export async function savePlaylistToFirestore(
  uid: string,
  playlist: Playlist
): Promise<void> {
  if (!uid || uid.startsWith('user_local_')) return;
  try {
    const playlistRef = doc(db, 'users', uid, 'playlists', playlist.id);
    await setDoc(
      playlistRef,
      {
        ...playlist,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Failed to save playlist:', error);
  }
}

/**
 * Removes a playlist from users/{uid}/playlists/{playlistId}
 */
export async function deletePlaylistFromFirestore(
  uid: string,
  playlistId: string
): Promise<void> {
  if (!uid || uid.startsWith('user_local_')) return;
  try {
    const playlistRef = doc(db, 'users', uid, 'playlists', playlistId);
    await deleteDoc(playlistRef);
  } catch (error) {
    console.warn('[Firestore] Failed to delete playlist:', error);
  }
}

/**
 * Saves listening statistics to users/{uid}/data/stats
 */
export async function saveStatsToFirestore(
  uid: string,
  stats: ListeningStats
): Promise<void> {
  if (!uid || uid.startsWith('user_local_')) return;
  try {
    const statsRef = doc(db, 'users', uid, 'data', 'stats');
    await setDoc(statsRef, { ...stats, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Failed to save listening stats:', error);
  }
}

/**
 * Saves recently played songs to users/{uid}/data/recentlyPlayed
 */
export async function saveRecentlyPlayedToFirestore(
  uid: string,
  recentlyPlayed: Song[]
): Promise<void> {
  if (!uid || uid.startsWith('user_local_')) return;
  try {
    const ref = doc(db, 'users', uid, 'data', 'recentlyPlayed');
    await setDoc(ref, { songs: recentlyPlayed, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Failed to save recently played:', error);
  }
}

/**
 * Subscribes to real-time updates for playlists & stats for an authenticated user.
 * If Firestore has no playlists yet, uploads current local playlists.
 */
export function initFirestoreSync(
  uid: string,
  callbacks: {
    onPlaylistsLoaded: (playlists: Playlist[]) => void;
    onStatsLoaded?: (stats: ListeningStats) => void;
    getCurrentPlaylists: () => Playlist[];
  }
): Unsubscribe {
  if (!uid || uid.startsWith('user_local_')) {
    return () => {};
  }

  const unsubs: Unsubscribe[] = [];

  try {
    const playlistsCol = collection(db, 'users', uid, 'playlists');

    // 1. Initial check: If remote is empty, sync local playlists to cloud
    getDocs(playlistsCol)
      .then((snapshot) => {
        if (snapshot.empty) {
          const current = callbacks.getCurrentPlaylists();
          current.forEach((pl) => {
            savePlaylistToFirestore(uid, pl);
          });
        }
      })
      .catch((err) => {
        console.warn('[Firestore] Could not fetch initial playlists:', err);
      });

    // 2. Real-time playlist listener
    const unsubPlaylists = onSnapshot(
      playlistsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const remotePlaylists: Playlist[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            remotePlaylists.push({
              id: data.id || d.id,
              title: data.title || 'Untitled Playlist',
              description: data.description || '',
              artwork: data.artwork || {
                low: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
                medium: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
                high: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
              },
              songCount: data.songs?.length || data.songCount || 0,
              songs: data.songs || [],
              isCustom: true,
              createdAt: data.createdAt || new Date().toISOString().split('T')[0],
            });
          });
          callbacks.onPlaylistsLoaded(remotePlaylists);
        }
      },
      (err) => {
        console.warn('[Firestore] Playlists snapshot error:', err);
      }
    );
    unsubs.push(unsubPlaylists);

    // 3. Real-time stats listener
    if (callbacks.onStatsLoaded) {
      const statsDocRef = doc(db, 'users', uid, 'data', 'stats');
      const unsubStats = onSnapshot(
        statsDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as ListeningStats;
            callbacks.onStatsLoaded!(data);
          }
        },
        (err) => {
          console.warn('[Firestore] Stats snapshot error:', err);
        }
      );
      unsubs.push(unsubStats);
    }
  } catch (error) {
    console.warn('[Firestore] Sync initialization failed:', error);
  }

  return () => {
    unsubs.forEach((unsub) => {
      try {
        unsub();
      } catch (_) {}
    });
  };
}

/**
 * Returns current authenticated user ID if logged in, or null
 */
export function getCurrentUid(): string | null {
  return auth.currentUser?.uid || null;
}
