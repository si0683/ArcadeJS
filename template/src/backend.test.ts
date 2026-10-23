import { afterEach, describe, expect, it, vi } from "vitest"

// The game server client with VITE_BACKEND_URL set: the module reads it on import
async function load(fetch: (url: string, init?: RequestInit) => Promise<Response>) {
  vi.resetModules()
  vi.stubEnv("VITE_BACKEND_URL", "http://server.test/")
  vi.stubGlobal("fetch", vi.fn(fetch))
  return import("./backend")
}

const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe("game server client", () => {
  it("is off without an address: the platform storage is used as it is", async () => {
    vi.resetModules()
    const { backendOn, cloudStorage } = await import("./backend")
    const local = { name: "none", loadData: async () => ({}), saveData: async () => {} }
    expect(backendOn).toBe(false)
    expect(cloudStorage(local)).toBe(local)
  })

  it("the newer save wins: server or this browser", async () => {
    const { cloudStorage } = await load(() => json({ data: { best: 9, _savedAt: 2000 } }))
    const older = { name: "none", loadData: async () => ({ best: 3, _savedAt: 1000 }), saveData: async () => {} }
    expect(await cloudStorage(older).loadData()).toEqual({ best: 9, _savedAt: 2000 })
    const newer = { ...older, loadData: async () => ({ best: 4, _savedAt: 3000 }) }
    expect(await cloudStorage(newer).loadData()).toEqual({ best: 4, _savedAt: 3000 })
  })

  it("portal SDKs keep their own cloud saves", async () => {
    const { cloudStorage } = await load(() => json({}))
    const yandex = { name: "yandex", loadData: async () => ({}), saveData: async () => {} }
    expect(cloudStorage(yandex)).toBe(yandex)
  })

  it("a slow or broken server gives an empty leaderboard, not an error", async () => {
    const { leaderboard } = await load(() => Promise.reject(new Error("offline")))
    expect(await leaderboard(1)).toEqual([])
  })

  it("transfer codes are checked before use", async () => {
    const { useTransferCode } = await load(() => json({}))
    expect(useTransferCode("nonsense")).toBe(false)
    expect(useTransferCode("short.key")).toBe(false)
  })
})
