import { describe, expect, it, vi } from "vitest";
import express from "express";
import { publicMusic, resolvePublicRecording } from "../server/publicMusic";
const song = {
  id: "abc123",
  name: "Recording",
  duration: 123,
  language: "hindi",
  url: "https://www.jiosaavn.com/song/recording/abc",
  copyright: "Copyright Artist",
  album: { id: "album", name: "Album" },
  artists: { primary: [{ id: "artist", name: "Artist" }] },
  image: [{ quality: "500x500", url: "https://c.saavncdn.com/cover.jpg" }],
  downloadUrl: [
    { quality: "160kbps", url: "https://aac.saavncdn.com/song.mp4" },
  ],
};
const transport = (recording = song) =>
  vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [recording] }), {
        headers: { "content-type": "application/json" },
      }),
    );
describe("Public API recording adapter", () => {
  it("resolves a playable URL through the production route", async () => {
    const originalEnv = process.env.NODE_ENV;
    const fetcher = transport();
    const originalFetch = globalThis.fetch;
    const app = express();
    app.use("/api/experimental", publicMusic);
    const server = app.listen(0, "127.0.0.1");
    try {
      await new Promise<void>((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
      });
      process.env.NODE_ENV = "production";
      globalThis.fetch = fetcher;
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("No test port");
      const response = await originalFetch(
        `http://127.0.0.1:${address.port}/api/experimental/songs/${song.id}/playback`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(await response.json()).toMatchObject({
        id: song.id,
        streamUrl: song.downloadUrl[0].url,
        playbackSource: "public-api",
      });
    } finally {
      process.env.NODE_ENV = originalEnv;
      globalThis.fetch = originalFetch;
      server.close();
    }
  });
  it("uses returned audio URLs unchanged and preserves identity, copyright and artwork without claiming a license", async () => {
    const fetcher = transport();
    const track = await resolvePublicRecording(song.id, fetcher);
    expect(track).toMatchObject({
      id: song.id,
      artist: "Artist",
      durationMs: 123000,
      streamUrl: song.downloadUrl[0].url,
      playbackSource: "public-api",
      permitsStreaming: false,
      permitsOffline: false,
      attribution: "Copyright Artist",
      artwork: { high: song.image[0].url },
    });
    expect(fetcher.mock.calls[0][0]).toContain("/api/songs/abc123");
  });
  it("rejects missing, insecure and unexpected-host streams", async () => {
    for (const url of [
      "http://aac.saavncdn.com/a.mp4",
      "https://saavncdn.com.evil.test/a.mp4",
      "https://localhost/a.mp4",
    ]) {
      await expect(
        resolvePublicRecording(
          song.id,
          transport({ ...song, downloadUrl: [{ quality: "160kbps", url }] }),
        ),
      ).rejects.toThrow("no playable stream");
    }
    await expect(
      resolvePublicRecording(song.id, transport({ ...song, downloadUrl: [] })),
    ).rejects.toThrow("no playable stream");
  });
  it("rejects malformed provider responses and request IDs", async () => {
    await expect(
      resolvePublicRecording("../secrets", transport()),
    ).rejects.toThrow("Invalid");
    await expect(
      resolvePublicRecording(
        song.id,
        vi.fn().mockResolvedValue(new Response("{}")),
      ),
    ).rejects.toThrow("unsupported");
  });
});
