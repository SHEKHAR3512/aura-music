import { Router } from "express";
import { z } from "zod";
import { TrackSchema } from "../../packages/shared/schema";

const link = z.object({ quality: z.string(), url: z.url() });
const responseSchema = z.object({
  success: z.literal(true),
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      duration: z.number().positive(),
      url: z.url(),
      copyright: z.string().nullish(),
      language: z.string(),
      album: z
        .object({ id: z.string().nullable(), name: z.string().nullable() })
        .nullable(),
      artists: z.object({
        primary: z.array(z.object({ id: z.string(), name: z.string() })),
      }),
      image: z.array(link),
      downloadUrl: z.array(link),
    }),
  ),
});
const allowedAudio = (value: string) => {
  const url = new URL(value);
  return (
    url.protocol === "https:" &&
    url.hostname.endsWith(".saavncdn.com") &&
    !url.username &&
    !url.password
  );
};

// Return the provider's HTTPS audio URL unchanged. No media proxy,
// decryption, URL rewriting, subscription emulation or audio downloading.
export async function resolvePublicRecording(
  id: string,
  transport: typeof fetch = fetch,
) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id))
    throw new Error("Invalid provider recording ID.");
  const base = process.env.JIOSAAVN_API_BASE_URL || "https://saavn.sumit.co";
  if (!base.startsWith("https://"))
    throw new Error("Provider API requires HTTPS.");
  const response = await transport(
    `${base.replace(/\/$/, "")}/api/songs/${encodeURIComponent(id)}`,
    {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Music provider unavailable (${response.status}). Retry shortly.`,
    );
  const parsed = responseSchema.safeParse(await response.json());
  if (!parsed.success)
    throw new Error(
      "Music provider returned an unsupported recording response.",
    );
  const song = parsed.data.data.find((s) => s.id === id);
  if (!song)
    throw new Error("This recording is no longer available from the provider.");
  const audio = ["160kbps", "96kbps", "320kbps", "48kbps", "12kbps"]
    .map((quality) =>
      song.downloadUrl.find(
        (l) => l.quality === quality && allowedAudio(l.url),
      ),
    )
    .find(Boolean);
  if (!audio)
    throw new Error("The provider has no playable stream for this recording.");
  const cover = (quality: string) =>
    song.image.find((i) => i.quality === quality)?.url ||
    song.image.at(-1)?.url ||
    "";
  return TrackSchema.parse({
    id: song.id,
    providerId: "jiosaavn-public",
    playbackSource: "public-api",
    title: song.name,
    artist:
      song.artists.primary.map((a) => a.name).join(", ") || "Unknown artist",
    artistId: song.artists.primary[0]?.id || "",
    album: song.album?.name || "",
    albumId: song.album?.id || "",
    durationMs: song.duration * 1000,
    genre: song.language,
    color: "#6E8C89",
    artwork: {
      low: cover("50x50"),
      medium: cover("150x150"),
      high: cover("500x500"),
    },
    streamUrl: audio.url,
    sourceUrl: song.url,
    licenseId: "Provider copyright",
    licenseUrl: song.url,
    attribution:
      song.copyright || "Copyright belongs to the recording rights holders.",
    permitsStreaming: false,
    permitsOffline: false,
    permitsCommercialUse: false,
    instrumental: song.language === "instrumental",
  });
}

export const publicMusic = Router();
publicMusic.get("/songs/:id/playback", async (req, res) => {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.json(await resolvePublicRecording(req.params.id));
  } catch (error) {
    res
      .status(502)
      .json({
        error:
          error instanceof Error ? error.message : "Provider playback failed.",
      });
  }
});
