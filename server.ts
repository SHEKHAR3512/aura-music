import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { musicProvider } from './src/lib/music/provider';
import { jioSaavnProvider } from './src/lib/music/jiosaavn';
import { fetchLyrics } from './src/lib/music/lyrics';
import { CURATED_FEATURED_SONGS, CURATED_FEATURED_PLAYLISTS, CURATED_POPULAR_ARTISTS } from './src/lib/music/cache';
import { jamManager } from './src/server/jamManager';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -------------------------------------------------------------
// MUSIC API ABSTRACTION ROUTES (Section 3 of Specification)
// -------------------------------------------------------------

// Universal Search
app.get('/api/music/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({
      query: '',
      songs: CURATED_FEATURED_SONGS,
      albums: [],
      artists: CURATED_POPULAR_ARTISTS,
      playlists: CURATED_FEATURED_PLAYLISTS,
      podcasts: [],
    });
  }

  try {
    const results = await musicProvider.search(query);
    res.json(results);
  } catch (err: any) {
    console.error('API /search error:', err);
    res.status(500).json({ error: 'Search temporarily degraded', songs: CURATED_FEATURED_SONGS });
  }
});

// Song Details by ID
app.get('/api/music/song/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const song = await musicProvider.getSong(id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    res.json(song);
  } catch (err: any) {
    console.error(`API /song/${id} error:`, err);
    res.status(500).json({ error: 'Unable to retrieve track' });
  }
});

// Album Details by ID
app.get('/api/music/album/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const album = await musicProvider.getAlbum(id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (err: any) {
    console.error(`API /album/${id} error:`, err);
    res.status(500).json({ error: 'Unable to retrieve album' });
  }
});

// Artist Details by ID
app.get('/api/music/artist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const artist = await musicProvider.getArtist(id);
    if (!artist) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    res.json(artist);
  } catch (err: any) {
    console.error(`API /artist/${id} error:`, err);
    res.status(500).json({ error: 'Unable to retrieve artist profile' });
  }
});

// Playlist Details by ID
app.get('/api/music/playlist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const playlist = await musicProvider.getPlaylist(id);
    if (!playlist) {
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (err: any) {
    console.error(`API /playlist/${id} error:`, err);
    res.status(500).json({ error: 'Unable to retrieve playlist' });
  }
});

// Lyrics (JioSaavn + LRCLIB synchronized hierarchy)
app.get('/api/music/lyrics/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const title = (req.query.title as string) || '';
  const artist = (req.query.artist as string) || '';
  const album = (req.query.album as string) || '';
  const duration = req.query.duration ? parseFloat(req.query.duration as string) : undefined;

  try {
    const lyrics = await fetchLyrics(id, title, artist, album, duration);
    res.json(lyrics);
  } catch (err: any) {
    console.error(`API /lyrics/${id} error:`, err);
    res.status(500).json({ type: 'unavailable', lines: [] });
  }
});

// Top Charts
app.get('/api/music/charts', async (_req: Request, res: Response) => {
  try {
    const charts = await musicProvider.getCharts();
    res.json(charts);
  } catch (err: any) {
    console.error('API /charts error:', err);
    res.json(CURATED_FEATURED_PLAYLISTS);
  }
});

// New Releases
app.get('/api/music/new-releases', async (req: Request, res: Response) => {
  const lang = (req.query.language as string) || 'hindi';
  try {
    const releases = await musicProvider.getNewReleases(lang);
    res.json(releases);
  } catch (err: any) {
    console.error('API /new-releases error:', err);
    res.json(CURATED_FEATURED_SONGS);
  }
});

// Trending Hits
app.get('/api/music/trending', async (req: Request, res: Response) => {
  const lang = (req.query.language as string) || 'hindi';
  try {
    const trending = await musicProvider.getTrending(lang);
    res.json(trending);
  } catch (err: any) {
    console.error('API /trending error:', err);
    res.json(CURATED_FEATURED_SONGS);
  }
});

// Podcasts / Audio Episodes
app.get('/api/music/podcasts', async (_req: Request, res: Response) => {
  try {
    const podcasts = await musicProvider.getPodcasts();
    res.json(podcasts);
  } catch (err: any) {
    console.error('API /podcasts error:', err);
    res.json([]);
  }
});

// Song Radio / Continuation
app.get('/api/music/radio/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const song = await musicProvider.getSong(id);
    if (!song) {
      return res.json(CURATED_FEATURED_SONGS);
    }
    const radio = await musicProvider.getRadio(song);
    res.json(radio);
  } catch (err: any) {
    console.error(`API /radio/${id} error:`, err);
    res.json(CURATED_FEATURED_SONGS);
  }
});

// More Like This / Related Tracks with Sonic Breakdown
app.get('/api/music/related/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const song = await musicProvider.getSong(id);
    if (!song) {
      return res.status(404).json({ error: 'Seed song not found' });
    }

    // 1. Fetch tracks by the same primary artist
    let sameArtistTracks: any[] = [];
    try {
      const artistQuery = await jioSaavnProvider.searchSongs(song.primaryArtist, 1, 10);
      sameArtistTracks = artistQuery.filter((s: any) => s.id !== song.id);
    } catch (e) {
      sameArtistTracks = [];
    }

    // 2. Fetch tracks in similar genre / mood / language
    let sameGenreTracks: any[] = [];
    try {
      const genreKeyword = song.language ? `${song.language} romantic acoustic hits` : 'pop viral acoustic';
      const genreQuery = await jioSaavnProvider.searchSongs(genreKeyword, 1, 15);
      sameGenreTracks = genreQuery.filter((s: any) => s.id !== song.id && !sameArtistTracks.some(a => a.id === s.id));
    } catch (e) {
      sameGenreTracks = [];
    }

    // Fallback if results are low
    const fallback = CURATED_FEATURED_SONGS.filter(s => s.id !== song.id);
    if (sameArtistTracks.length === 0) {
      sameArtistTracks = fallback.slice(0, 3);
    }
    if (sameGenreTracks.length === 0) {
      sameGenreTracks = fallback.slice(3, 8);
    }

    const allRecommendations = [...sameArtistTracks, ...sameGenreTracks];

    res.json({
      seedTrack: song,
      sonicProfile: {
        genre: song.language ? `${song.language.toUpperCase()} POP / ACOUSTIC` : 'CONTEMPORARY ACOUSTIC',
        mood: 'Harmonic & Melodic',
        tempo: '105-128 BPM',
        vibeMatch: 98,
      },
      sameArtist: sameArtistTracks.slice(0, 6),
      sameGenre: sameGenreTracks.slice(0, 8),
      all: allRecommendations.slice(0, 14),
    });
  } catch (err: any) {
    console.error(`API /related/${id} error:`, err);
    res.json({
      seedTrack: null,
      sonicProfile: { genre: 'Global Acoustic', mood: 'Vibrant', tempo: '110 BPM', vibeMatch: 95 },
      sameArtist: CURATED_FEATURED_SONGS.slice(0, 4),
      sameGenre: CURATED_FEATURED_SONGS.slice(4, 9),
      all: CURATED_FEATURED_SONGS,
    });
  }
});

// -------------------------------------------------------------
// JAM / GROUP PLAY REST API ENDPOINTS
// -------------------------------------------------------------

app.post('/api/jam/create', (req: Request, res: Response) => {
  const { name, deviceId, userName, avatar, currentTrack, queue } = req.body;
  const session = jamManager.createSession(
    name || 'Car Roadtrip Jam',
    deviceId,
    userName || 'Shekhar',
    avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    currentTrack,
    queue
  );
  res.json({ session: jamManager.serializeSession(session) });
});

app.get('/api/jam/:code', (req: Request, res: Response) => {
  const session = jamManager.getSession(req.params.code);
  if (!session) {
    return res.status(404).json({ error: 'Jam session not found' });
  }
  res.json({ session: jamManager.serializeSession(session) });
});

app.post('/api/jam/:code/action', (req: Request, res: Response) => {
  const session = jamManager.getSession(req.params.code);
  if (!session) {
    return res.status(404).json({ error: 'Jam session not found' });
  }
  const { action, deviceId, payload } = req.body;
  const member = session.members.get(deviceId || '');
  const userName = member?.name || 'Someone';
  const userAvatar = member?.avatar;

  if (action === 'play') {
    session.currentTrack = payload.track || session.currentTrack;
    session.isPlaying = true;
    session.currentTime = 0;
    if (payload.queue) session.queue = payload.queue;
    jamManager.logActivity(
      session,
      userName,
      'started playing',
      payload.track?.title,
      'play',
      userAvatar,
      payload.track?.primaryArtist,
      payload.track?.artwork?.low || payload.track?.artwork?.medium
    );
  } else if (action === 'pause') {
    session.isPlaying = false;
    jamManager.logActivity(session, userName, 'paused car playback', undefined, 'pause', userAvatar);
  } else if (action === 'resume') {
    session.isPlaying = true;
    jamManager.logActivity(session, userName, 'resumed car playback', undefined, 'play', userAvatar);
  } else if (action === 'seek') {
    session.currentTime = payload.currentTime || 0;
  } else if (action === 'next') {
    if (session.queue.length > 0) {
      const nextTrack = session.queue[0];
      session.currentTrack = nextTrack;
      session.queue = session.queue.slice(1);
      session.currentTime = 0;
      session.isPlaying = true;
      jamManager.logActivity(
        session,
        userName,
        'skipped to next track',
        nextTrack.title,
        'skip',
        userAvatar,
        nextTrack.primaryArtist,
        nextTrack.artwork?.low || nextTrack.artwork?.medium
      );
    }
  } else if (action === 'add_queue' && payload.track) {
    session.queue.push(payload.track);
    jamManager.logActivity(
      session,
      userName,
      'added to car queue',
      payload.track.title,
      'add',
      userAvatar,
      payload.track.primaryArtist,
      payload.track.artwork?.low || payload.track.artwork?.medium
    );
  } else if (action === 'set_audio_output') {
    session.playbackDeviceId = payload.targetDeviceId;
    session.members.forEach((m) => {
      m.isAudioOutput = m.id === payload.targetDeviceId;
    });
    jamManager.logActivity(session, userName, 'changed car audio speaker output', undefined, 'play', userAvatar);
  } else if (action === 'set_crossfade') {
    const seconds = Math.max(0, Math.min(12, Number(payload.crossfadeSeconds) || 0));
    session.crossfadeSeconds = seconds;
    jamManager.logActivity(session, userName, `set transition crossfade to ${seconds}s`, undefined, 'play', userAvatar);
  }

  session.updatedAt = Date.now();
  jamManager.broadcastToSession(session.id, 'jam:sync_state', {
    session: jamManager.serializeSession(session),
  });

  res.json({ success: true, session: jamManager.serializeSession(session) });
});

// -------------------------------------------------------------
// EMAIL OTP AUTHENTICATION ROUTES
// -------------------------------------------------------------

interface EmailOtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const emailOtpStore = new Map<string, EmailOtpEntry>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of emailOtpStore.entries()) {
    if (entry.expiresAt < now) {
      emailOtpStore.delete(email);
    }
  }
}, 60000);

function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

app.post('/api/auth/send-email-otp', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  // Rate limit: prevent spamming within 30 seconds
  const existing = emailOtpStore.get(normalizedEmail);
  if (existing && existing.expiresAt - Date.now() > 9.5 * 60 * 1000) {
    return res.status(429).json({ error: 'Please wait 30 seconds before requesting another code.' });
  }

  // Generate 6-digit OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  emailOtpStore.set(normalizedEmail, {
    code,
    expiresAt,
    attempts: 0,
  });

  console.log(`\n======================================================`);
  console.log(`[AURA AUTH] ✉️ Email Verification Code for: ${normalizedEmail}`);
  console.log(`[AURA AUTH] 🔑 CODE: ${code} (Valid for 10 minutes)`);
  console.log(`======================================================\n`);

  const transporter = getEmailTransporter();
  let emailSentReal = false;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"Aura Sound Lab" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: `Your Aura Music Verification Code: ${code}`,
        html: `
          <div style="background-color: #0c0f17; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; text-align: center;">
            <div style="max-width: 480px; margin: 0 auto; background: #141724; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
              <div style="display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: #6366f1; margin-bottom: 12px;"></div>
              <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 6px 0; letter-spacing: -0.5px;">AURA SOUND LAB</h1>
              <p style="color: #94a3b8; font-size: 13px; margin: 0 0 24px 0;">Unlock Your Private Acoustic Sanctuary</p>
              
              <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
                Use the 6-digit verification code below to confirm your email and complete your registration:
              </p>

              <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.4); border-radius: 14px; padding: 18px 24px; margin: 16px 0; display: inline-block;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #ffffff; font-family: monospace;">${code}</span>
              </div>

              <p style="color: #64748b; font-size: 12px; margin-top: 24px; line-height: 1.5;">
                This code will expire in 10 minutes.<br/>
                If you did not request this registration code, you can safely ignore this email.
              </p>
            </div>
          </div>
        `,
      });
      emailSentReal = true;
      console.log(`[AURA AUTH] ✅ Real email successfully sent to ${normalizedEmail}`);
    } catch (mailErr: any) {
      console.error(`[AURA AUTH] ❌ Failed to dispatch email via SMTP:`, mailErr?.message || mailErr);
    }
  } else {
    console.log(`[AURA AUTH] ⚠️ SMTP is not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASS).`);
  }

  res.json({
    success: true,
    message: emailSentReal 
      ? `Verification code sent to ${normalizedEmail}` 
      : `Verification code generated for ${normalizedEmail}`,
    emailSent: emailSentReal,
  });
});


app.post('/api/auth/verify-email-otp', async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const entry = emailOtpStore.get(normalizedEmail);

  if (!entry) {
    return res.status(400).json({ error: 'Verification code expired or not found. Please request a new code.' });
  }

  if (Date.now() > entry.expiresAt) {
    emailOtpStore.delete(normalizedEmail);
    return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
  }

  if (entry.attempts >= 5) {
    emailOtpStore.delete(normalizedEmail);
    return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new code.' });
  }

  if (entry.code !== otp.trim()) {
    entry.attempts += 1;
    return res.status(400).json({ error: 'Incorrect verification code. Please check and try again.' });
  }

  // OTP verified successfully
  emailOtpStore.delete(normalizedEmail);
  res.json({
    success: true,
    verified: true,
    message: 'Email successfully verified.',
  });
});


// -------------------------------------------------------------
// VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PRODUCTION)
// -------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  // Initialize WebSocket server on the same HTTP instance
  jamManager.init(server);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`AURA Sound Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
    console.log(`Car Jam Real-Time WebSocket active on ws://0.0.0.0:${PORT}/ws/jam`);
  });
}

startServer().catch(err => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});
