# silly-dashboard

A personal homelab dashboard for a Tailscale-connected fleet (Mac mini, PC, VPS, Raspberry Pi, mobile). Live system metrics, service health pings, and a tile catalog for all the self-hosted stuff. Installable as a PWA so it sits on your phone home screen like a native app.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes mode), **TypeScript**
- **Tailwind CSS 4**
- **lucide-svelte** for icons
- **@vite-pwa/sveltekit** for PWA / service worker
- **Server-Sent Events** for live metrics (one-way server→client, simpler than WebSockets and works through reverse proxies)
- **adapter-node** — runs as a long-lived Node server (intended target: Mac mini)

## Project layout

```
src/
├── app.html                       # PWA-aware shell
├── lib/
│   ├── types.ts                   # Node, Service, Metrics, Health types
│   ├── utils.ts                   # cn(), formatBytes(), color helpers
│   ├── config/
│   │   ├── nodes.ts               # ⬅ list your Tailscale nodes here
│   │   └── services.ts            # ⬅ list your self-hosted services here
│   ├── components/
│   │   ├── NodeCard.svelte        # CPU/RAM/disk/net per node
│   │   ├── ServiceTile.svelte     # Service tile w/ health dot
│   │   ├── Bar.svelte             # Animated progress bar
│   │   └── StatusDot.svelte       # online/offline pulsing dot
│   ├── stores/
│   │   ├── metrics.svelte.ts      # SSE-backed metrics store ($state map)
│   │   └── health.svelte.ts       # Polling health store
│   └── server/
│       └── metrics-source.ts      # Mock metrics — swap for Glances later
└── routes/
    ├── +layout.svelte             # bootstraps the stores
    ├── +page.svelte               # dashboard
    └── api/
        ├── metrics/+server.ts     # SSE feed of all node metrics
        └── health/+server.ts      # JSON service-health probe results
```

## Develop

```bash
npm install
npm run dev
# open http://localhost:5173
```

The PWA service worker is enabled in dev so you can test installability locally.

## Build

```bash
npm run build
node build      # adapter-node output, listens on $PORT (default 3000)
```

## Deploy plan (Mac mini)

Not done yet — placeholder:

1. Install Node 22+ on Mac mini.
2. `git clone` this repo somewhere (e.g. `~/apps/silly-dashboard`).
3. `npm ci && npm run build`.
4. Run as a `launchd` user agent on a fixed port (e.g. `:3030`), restart on crash.
5. Bind to the Tailscale interface only (`HOST=<tailscale-ip> PORT=3030 node build`).
6. Add a Tailscale ACL rule if you want only specific tagged devices to reach it.

Optional: put behind Caddy for TLS via Tailscale's MagicDNS certs.

## Configuring your fleet

Edit `src/lib/config/nodes.ts` and `src/lib/config/services.ts`. Both are simple typed arrays — no migrations, no DB, no admin UI for now.

## Metrics: mock → real

`src/lib/server/metrics-source.ts` currently returns plausible random data so the UI is testable without any agents installed. To wire in real metrics, the planned approach is:

- Install **Glances** in API mode on each node (`glances -w --enable-plugin all`) bound to the Tailscale interface.
- Replace `getMetrics()` with a fetch to `http://<node>:61208/api/4/all` and map the response into the `NodeMetrics` shape.

## Health pings

`/api/health` does a `GET` against each service's `url` (or `healthUrl`) on the server side and reports status code + latency. Self-hosted services that 401 without auth still count as "up". Polled every 30s from the client.

## PWA

`@vite-pwa/sveltekit` generates the manifest and service worker on build. On iOS, "Add to Home Screen" gives you a standalone app icon. Push notifications work on iOS 16.4+ but are not yet wired up.

## Roadmap (not committed yet)

- Real Glances adapter
- Per-service detail pages (Jellyfin now-playing, qBittorrent torrents, etc.)
- Wake-on-LAN for the PC
- History graphs (24h CPU/RAM via tiny SQLite store)
- Push notifications for service-down / disk-full alerts
- Auth layer (or Tailscale-only access via ACL)
