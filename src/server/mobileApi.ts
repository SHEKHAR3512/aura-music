import { Router, type Request } from 'express';
import { z } from 'zod';
import { catalog } from '../../packages/shared/catalog';
export async function verifyMobileToken(token: string): Promise<string> {
  const key = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!key) throw new Error('Cloud authentication is not configured');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(key)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: token }), signal: AbortSignal.timeout(8000),
  });
  const data = await response.json() as { users?: { localId: string }[] };
  if (!response.ok || !data.users?.[0]?.localId) throw new Error('Sign in again to continue');
  return data.users[0].localId;
}
export const mobileApi = Router();
const clients = new Map<string, { count: number; expires: number }>();
mobileApi.use((req, res, next) => {
  const key = req.ip || 'unknown'; const now = Date.now();
  for (const [id, item] of clients) if (item.expires < now) clients.delete(id);
  const item = clients.get(key) || { count: 0, expires: now + 60000 };
  if (clients.size > 10000 || ++item.count > 120) return res.status(429).json({ error: { code: 'RATE_LIMIT', message: 'Please wait a minute and try again.' } });
  clients.set(key, item); next();
});
mobileApi.get('/health', (_req, res) => res.json({ status: 'ok', catalog: catalog.length, version: 1 }));
const querySchema = z.object({ q: z.string().max(120).default(''), limit: z.coerce.number().int().min(1).max(50).default(20), cursor: z.coerce.number().int().min(0).default(0) });
mobileApi.get(['/music/home','/music/search'], (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'Invalid search query.' } });
  const { q, limit, cursor } = parsed.data;
  const matches = catalog.filter(t => t.permitsStreaming && `${t.title} ${t.artist} ${t.album} ${t.genre}`.toLowerCase().includes(q.toLowerCase()));
  res.setHeader('Cache-Control', 'public, max-age=300');
  return res.json({ tracks: matches.slice(cursor, cursor + limit), nextCursor: cursor + limit < matches.length ? String(cursor + limit) : null });
});
const find = (req: Request) => catalog.find(t => t.id === req.params.id && t.permitsStreaming);
mobileApi.get('/tracks/:id', (req, res) => { const t = find(req); return t ? res.json(t) : res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track unavailable.' } }); });
mobileApi.post('/tracks/:id/playback-url', (req, res) => { const t = find(req); return t ? res.json({ url: t.streamUrl, expiresAt: null, attribution: t.attribution }) : res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Track unavailable.' } }); });
mobileApi.get('/tracks/:id/lyrics', (req, res) => { const t = find(req); return t ? res.json({ type: 'instrumental', lines: [], attribution: t.attribution }) : res.sendStatus(404); });
mobileApi.get('/albums/:id', (req, res) => { const tracks = catalog.filter(t => t.albumId === req.params.id); return tracks.length ? res.json({ id: req.params.id, title: tracks[0].album, tracks }) : res.sendStatus(404); });
mobileApi.get('/artists/:id', (req, res) => { const tracks = catalog.filter(t => t.artistId === req.params.id); return tracks.length ? res.json({ id: req.params.id, name: tracks[0].artist, tracks }) : res.sendStatus(404); });
