# CDN Infrastructure

This document describes the private infrastructure powering the @studiometa/ui browser CDN at `https://cdn.studiometa.dev`.

## Architecture Overview

The CDN consists of:

- **Cloudflare Worker**: Serves assets with canonical redirects and component-aware preloading
- **R2 Object Storage**: Stores versioned release artifacts in a private bucket
- **Domain**: `cdn.studiometa.dev` with Cloudflare DNS and edge caching
- **Build System**: Generates immutable artifacts with integrity verification

## R2 Bucket Layout

### Bucket Configuration

- **Name**: `studiometa-ui-cdn-assets`
- **Binding**: `ASSETS` (configured in `wrangler.jsonc`)
- **Access**: Private bucket, Worker-only access via scoped credentials
- **Region**: Auto (Cloudflare-managed)

### Object Structure

The Worker reads a single `versions.json` index at the bucket root and serves each release from an immutable, per-version prefix. Releases are namespaced by package: `@studiometa/ui` under `releases/ui/<version>/` and the shared `@studiometa/js-toolkit` runtime under `releases/js-toolkit/<version>/`. Preview builds live under `channels/<channel>/` (channel names have the form `main-<commit>`; only `ui` has channels). The URL maps directly onto the prefix: `/ui@<v>/<asset>` → `releases/ui/<v>/<asset>` and `/js-toolkit@<v>/<asset>` → `releases/js-toolkit/<v>/<asset>`.

```
versions.json                          # Version index (bucket root)
releases/
├── ui/
│   └── 1.9.0/                         # Exact stable ui release (releases/ui/<version>)
│       ├── autoload.js                # Runtime entry point
│       ├── autoload.js.map            # Source map
│       ├── loader.js                  # Standalone loader entry
│       ├── manifest.js                # Component manifest entry
│       ├── index.js                   # Full @studiometa/ui barrel (manual import)
│       ├── chunks/                    # Code-split component chunks
│       │   ├── Action-[hash].js
│       │   ├── Accordion-[hash].js
│       │   └── ...
│       ├── licenses/                  # Bundled third-party notices
│       │   └── THIRD_PARTY_LICENSES.txt
│       ├── build.json                 # Build metadata (schemaVersion 1; records the js-toolkit version)
│       └── integrity.json             # SHA-384 digests (schemaVersion 1)
└── js-toolkit/
    └── 3.8.0/                         # Exact js-toolkit artifact (releases/js-toolkit/<version>)
        ├── index.js                   # @studiometa/js-toolkit
        ├── utils/index.js             # @studiometa/js-toolkit/utils
        ├── chunks/                    # js-toolkit's own shared chunks
        ├── licenses/THIRD_PARTY_LICENSES.txt
        ├── build.json
        └── integrity.json
channels/
└── main-abcd123/                      # Exact ui preview channel (channels/<channel>)
    └── ...                            # Same layout as a ui release prefix
```

Every `@studiometa/ui` output — `autoload.js`, each component chunk and the `index.js` barrel — imports js-toolkit by the absolute, origin-relative URL `/js-toolkit@<version>/index.js` (and `/js-toolkit@<version>/utils/index.js`). Because browser module identity is keyed by URL, this guarantees exactly one js-toolkit instance and one component registry shared across the autoload runtime, every component, the ui barrel, and any manual `import '/js-toolkit@<version>/index.js'`.

The Worker resolves an incoming version to an exact prefix, then reads `build.json` and `integrity.json` from that prefix and validates them before serving any asset. The prefix name is the exact version (for example `releases/ui/1.9.0`); the commit hash and source-tree digest are recorded inside `build.json`, not in the prefix name.

### Version Index

`versions.json` uses `schemaVersion: 2` and is namespaced per package. `ui` lists its published stable releases, published preview channels, and mutable distribution tags; `js-toolkit` is exact-version only and carries just a release inventory:

```json
{
  "schemaVersion": 2,
  "packages": {
    "ui": {
      "releases": ["1.8.0", "1.9.0"],
      "channels": ["main-abcd123"],
      "distTags": {
        "latest": "1.9.0",
        "next": "main-abcd123",
        "main": "main-abcd123"
      }
    },
    "js-toolkit": {
      "releases": ["3.8.0"]
    }
  }
}
```

The Worker enforces several invariants when parsing the index. For `ui`: `releases` entries must be valid, unique semantic versions; `channels` entries must match `main-<commit>` and be unique; `latest` must name a published stable release with no pre-release identifier; and `next` and `main` must name the same published channel. A `ui@latest` alias resolves to `packages.ui.distTags.latest`; `ui@next` and `ui@main` both resolve to `packages.ui.distTags.next` (equivalently `.main`); a bare major (`ui@1`) or major.minor (`ui@1.9`) alias resolves to the highest matching stable release; and a versionless `/ui/...` resolves to `latest`. For `js-toolkit`: only an exact semantic version present in `packages["js-toolkit"].releases` resolves — there are no channels, distribution tags, aliases, or versionless default, so `/js-toolkit/...`, `/js-toolkit@latest/...`, and `/js-toolkit@3/...` all `404`.

### Versioning Strategy

- **Immutable objects**: Each exact version or channel is written to a new prefix and never overwritten.
- **Version index**: `versions.json` maps semantic aliases and distribution tags to exact prefixes.
- **Append-only**: Old versions remain available; releasing only adds prefixes and updates the index.
- **Reproducible identity**: The build identifier embeds the source-tree digest for reproducibility (see `build.json`).

### Security Model

- **Private bucket**: No public read access
- **Scoped credentials**: Worker has minimal R2 permissions for read-only access
- **Origin authentication**: Only the configured Worker can access bucket contents
- **No write access**: Worker cannot modify bucket contents (upload handled separately)

## Cloudflare Worker

### Worker Configuration

- **Name**: `studiometa-ui-cdn`
- **Runtime**: Cloudflare Workers (V8 isolate)
- **Memory**: Default allocation
- **Routes**: `cdn.studiometa.dev/*`
- **Environment**: Production only (no staging worker deployed)

### Environment Variables

The Worker requires these environment bindings:

| Binding  | Type      | Value                      | Purpose                                 |
| -------- | --------- | -------------------------- | --------------------------------------- |
| `ASSETS` | R2 Bucket | `studiometa-ui-cdn-assets` | Read-only access to versioned artifacts |

No additional environment variables or secrets are required.

### CORS and Caching Behavior

**CORS / CORP Headers** (set on every response):

- `Access-Control-Allow-Origin: *` (public CDN)
- `Access-Control-Allow-Methods: GET, HEAD, OPTIONS`
- `Access-Control-Allow-Headers: If-None-Match`
- `Access-Control-Max-Age: 86400`
- `Cross-Origin-Resource-Policy: cross-origin`

`OPTIONS` preflight returns `204`. Only `GET`, `HEAD`, and `OPTIONS` are allowed; any other method returns `405` with an `Allow` header.

**Cache Control:**

- **Immutable assets** (exact release or exact channel): `Cache-Control: public, max-age=31536000, immutable` (1 year).
- **Mutable redirects** (alias and distribution-tag lookups, served as `307`): `Cache-Control: public, max-age=300, s-maxage=3600` — 5 minutes in the browser, 1 hour at the shared edge cache.
- **Error responses**: `Cache-Control: no-store`.
- **Conditional requests**: the Worker sets an `ETag` and returns `304 Not Modified` for a matching `If-None-Match`.

Because aliases redirect to immutable URLs, the only cache entries that need to expire on a new release are the short-lived `307` redirects. The immutable asset URLs never change and are safe to cache for a year.

## Domain Configuration

### DNS Setup

- **Domain**: `cdn.studiometa.dev`
- **DNS Provider**: Cloudflare
- **Record Type**: CNAME to Cloudflare Workers domain
- **SSL**: Full (strict) encryption with Cloudflare certificate

### Worker Routing

- **Route Pattern**: `cdn.studiometa.dev/*`
- **Worker**: `studiometa-ui-cdn`
- **Fallback**: None (Worker handles all traffic)

## Deployment Requirements

### Deployment Status

No deployment has been performed. This document describes the intended topology and the contract the Worker and build system implement, not a provisioned environment. The Cloudflare account, the R2 bucket, and the DNS records for `cdn.studiometa.dev` are all still to be established; treat the identifiers below as the intended configuration to create, not as confirmed live resources.

### Mapbox (external, not redistributed)

The CDN does **not** bundle or serve Mapbox GL JS or the Mapbox geocoder — neither their JavaScript, their stylesheets nor their license notices. The Mapbox components import `mapbox-gl` and `@mapbox/mapbox-gl-geocoder` as bare specifiers, which the consuming page resolves through an import map (or an injected instance via `provideMapboxGl`). See the consumer-facing [Mapbox integration](https://ui.studiometa.dev/guide/browser-cdn/#mapbox-integration) guide.

Two consequences follow:

- **No redistribution question.** Because the CDN never serves the proprietary Mapbox GL build, there is nothing to redistribute and no redistribution-review release gate. The earlier `releaseGates.publicMapboxRedistributionReview` gate was dropped as moot.
- **Strict CSP is a consumer choice.** The consumer owns the `mapbox-gl` module, so its GL Web Worker is same-origin with their page (or wherever they host `mapbox-gl`). A strict CSP that forbids `blob:` workers is fully supported by self-hosting `mapbox-gl`; the CDN no longer dictates the worker's origin.

### Build and Publish Gates

The build script (`packages/cdn/scripts/build.ts`) does not read a `CDN_ENABLED` flag. Its guard is the working tree itself: it refuses a release-style build when any tracked build source is modified, unless `--allow-dirty` is passed, in which case the output is explicitly marked non-publishable. The build records `build.publishable` and `identifiers.immutable.publishable` (both `true` only for a clean commit) and writes an empty `releaseGates` object. The publish tooling still refuses a build that reintroduces a blocking, unapproved gate, but the build no longer records any such gate.

`CDN_ENABLED=true` is a separate publish-time guard for the release tooling (the publish/rollback scripts described in [Release procedure](./release.md) and [Rollback procedure](./rollback.md)), so that a build cannot be pushed to the public bucket before the account, bucket, and DNS are in place. That guard lives in the release track rather than in the build script in this package.

### Required Credentials

The following scoped credentials must be configured for deployment:

1. **Cloudflare API Token**: Worker deployment, zone management
2. **R2 Access Credentials**: Bucket write access for artifact upload
3. **DNS Management**: Domain configuration and routing updates

Credentials are stored in the deployment environment and not exposed in source code.

## Monitoring and Observability

### Worker Analytics

Cloudflare provides built-in analytics for:

- Request volume and geographic distribution
- Response status codes and error rates
- Edge cache hit ratios
- Bandwidth usage

### Application Metrics

The Worker logs structured data for:

- Version resolution patterns
- Component preload effectiveness
- Error conditions and validation failures
- Performance characteristics

### Alerting

Configure alerts for:

- Worker exception rates above baseline
- R2 bucket access failures
- Legal approval gate violations
- Unusual traffic patterns

## Capacity and Scaling

### Performance Characteristics

- **Cold start**: < 10ms (V8 isolate)
- **Response time**: < 50ms for cached assets
- **Throughput**: Limited by R2 egress (typically 10k+ RPS)
- **Geographic distribution**: Global edge presence

### Scaling Considerations

- **Worker limits**: 128MB memory, 50ms CPU time per request
- **R2 limits**: Class A operations (list/write) have rate limits
- **Bandwidth**: No hard limits but may incur charges
- **Storage**: No practical limit for CDN use case

The CDN architecture scales automatically with Cloudflare's edge network and requires no manual capacity planning.

## Backup and Recovery

### Data Durability

- **R2 bucket**: 99.999999999% (11 9's) durability guarantee
- **Multi-region**: Automatic replication within Cloudflare infrastructure
- **Version history**: Append-only model preserves all historical releases

### Disaster Recovery

- **Worker code**: Version controlled and reproducibly deployable
- **Configuration**: Infrastructure as code via `wrangler.jsonc`
- **DNS**: Cloudflare managed with backup NS records
- **Rollback**: Immediate via version index updates (no re-upload required)

### Backup Strategy

Regular backups are not required due to:

- Immutable object storage with built-in durability
- Source-controlled Worker configuration
- Reproducible build artifacts from git history
- Append-only versioning model
