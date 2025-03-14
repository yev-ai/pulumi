import type { PulumiMethod } from '@/.utils';
import { createPassword, optionalDep } from '@/.utils';
import * as cloudflare from '@pulumi/cloudflare';
import type { ZeroTrustTunnelCloudflaredConfigConfig } from '@pulumi/cloudflare/types/input';
import type { Output } from '@pulumi/pulumi';

/**
 * Creates a Cloudflare Zero Trust Tunnel with a route configuration.
 *
 * @remarks
 * THIS IS A LIMITED, PRESCRIPTIVE DEFAULT HELPER. This helper follows a specific
 * opinionated pattern for creating tunnels with routes and should not be considered
 * a general-purpose solution. It makes specific assumptions about resource naming,
 * configuration structure, and deployment patterns.
 *
 * @param resourcePrefix - Prefix used to name all created resources
 * @param accountId - Cloudflare account ID
 * @param cidrMask - CIDR notation for the network to be routed through the tunnel
 * @param config - Cloudflare tunnel configuration
 * @param waitFor - Optional dependency to wait for before creating these resources
 *
 * @returns An object containing the created tunnel resource as both result and finishedOn,
 *          the tunnel configuration, and the tunnel route
 *
 * @example
 * ```typescript
 * const result = createTunnelWithRoute(
 *   "my-app",
 *   "cf-account-id",
 *   "192.168.0.0/24",
 *   { ingress: [{ hostname: "example.com", service: "http://localhost:8080" }] }
 * );
 * ```
 */
export const createTunnelWithRoute: PulumiMethod<
  cloudflare.ZeroTrustTunnelCloudflared,
  cloudflare.ZeroTrustTunnelCloudflared,
  [string, string | Output<string>, string, ZeroTrustTunnelCloudflaredConfigConfig],
  {
    config: cloudflare.ZeroTrustTunnelCloudflaredConfig;
    route: cloudflare.ZeroTrustTunnelRoute;
  }
> = (resourcePrefix, accountId, cidrMask, config, waitFor) => {
  const pass = createPassword(`${resourcePrefix}-twr-pass`);

  const tunnel = new cloudflare.ZeroTrustTunnelCloudflared(
    `${resourcePrefix}-twr-tunnel`,
    {
      name: `${resourcePrefix}-tunnel`,
      accountId: accountId,
      secret: pass.apply((pwd) => Buffer.from(pwd).toString('base64')),
    },
    optionalDep(waitFor),
  );

  const cfdConfig = new cloudflare.ZeroTrustTunnelCloudflaredConfig(`${resourcePrefix}-twr-config`, {
    tunnelId: tunnel.id,
    accountId: accountId,
    config: {
      warpRouting: { enabled: true },
      ...config,
    },
  });

  const route = new cloudflare.ZeroTrustTunnelRoute(`${resourcePrefix}-twr-route`, {
    accountId: accountId,
    tunnelId: tunnel.id,
    network: cidrMask,
  });

  return {
    result: tunnel,
    finishedOn: tunnel,
    config: cfdConfig,
    route,
  };
};
