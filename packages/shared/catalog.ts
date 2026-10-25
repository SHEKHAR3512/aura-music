import { TrackSchema, type Track } from './schema';
const entries = [
  { id: 'USUAN1300046', title: 'Dream Culture', album: 'Elegant Piano (Lighter Faire)', albumId: 'elegant-piano', durationMs: 214000, color: '#687C91', genre: 'Calming', file: 'Dream%20Culture' },
  { id: 'USUAN1400037', title: 'Carefree', album: 'Light (Lighter Faire)', albumId: 'light', durationMs: 205000, color: '#BD8963', genre: 'Uplifting', file: 'Carefree' },
];
export const catalog: Track[] = entries.map(({ file, ...entry }) => TrackSchema.parse({
  ...entry, providerId: 'incompetech-cc', artist: 'Kevin MacLeod', artistId: 'kevin-macleod',
  streamUrl: `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${file}.mp3`,
  sourceUrl: `https://www.incompetech.com/music/royalty-free/index.html?isrc=${entry.id}`,
  licenseId: 'CC-BY-4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: `${entry.title} — Kevin MacLeod (incompetech.com). CC BY 4.0. Recording unchanged. Aura sleeve artwork is separate.`,
  permitsStreaming: true, permitsOffline: true, permitsCommercialUse: true, instrumental: true,
}));
