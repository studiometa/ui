export interface CloudflarePurgeConfig {
  apiToken: string;
  zoneId: string;
  publicBaseUrl: string;
}

/**
 * Reads the optional Cloudflare purge configuration. Purging is only possible when an API token, a
 * zone and a public base URL are all provided; otherwise the caller skips it. The token is read
 * here only and never logged.
 */
export function loadCloudflarePurgeConfig(
  environment: NodeJS.ProcessEnv,
): CloudflarePurgeConfig | undefined {
  const apiToken = environment.CDN_CLOUDFLARE_API_TOKEN;
  const zoneId = environment.CDN_CLOUDFLARE_ZONE_ID;
  const publicBaseUrl = environment.CDN_PUBLIC_BASE_URL;
  if (!apiToken || !zoneId || !publicBaseUrl) return undefined;
  return { apiToken, zoneId, publicBaseUrl };
}

/**
 * Purges only the mutable alias and index resources after a metadata update. Immutable
 * `releases/*` and `channels/*` objects are never purged because they can never change. The set of
 * purged URLs is intentionally small and derived from the public base URL, never from secrets.
 */
export async function purgeMutableAliases(
  config: CloudflarePurgeConfig,
  aliases: readonly string[],
): Promise<void> {
  const base = config.publicBaseUrl.replace(/\/$/, '');
  const files = aliases.map((alias) => `${base}/${alias.replace(/^\//, '')}`);
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${config.zoneId}/purge_cache`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    },
  );
  if (!response.ok) {
    throw new Error(`Cloudflare cache purge failed with HTTP ${response.status}.`);
  }
}
