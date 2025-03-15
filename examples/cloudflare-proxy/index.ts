import * as cloudflare from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';
import { createAzureVpc, createTunnelWithRoute } from '@yevai/pulumi';

const config = new pulumi.Config();

/**
 * The root DNS zone name for the Cloudflare setup.
 *
 * @remarks
 * This value is required and must be specified in your Pulumi configuration.
 * In ESC (Environment Setup Configuration), this will be set in the
 * values.pulumiConfig object as `project_name:cloudflareRootTldZone`.
 *
 * @example
 * For a domain like "example.com", you would set:
 * values.pulumiConfig["cloudflare-proxy:rootDnsZone"] = "example.com"
 */
const ROOT_DNS_ZONE = config.requireObject<string>('cloudflareRootTldZone');
const CF_ACCOUNT_ID = config.requireObject<string>('cloudflareAccountId');

/**
 * Defines the supported cloud providers as a readonly tuple.
 * These values ('aws', 'gcp', 'azu') will also be subdomains.
 *
 * - 'aws': Amazon Web Services
 * - 'gcp': Google Cloud Platform
 * - 'azu': Microsoft Azure
 *
 * @type {readonly ['aws', 'gcp', 'azu']}
 */
const CLOUD_PROVIDERS = ['aws', 'gcp', 'azu'] as const;

/**
 * Cloudflare CIDR range allocations for different cloud providers.
 *
 * These CIDR blocks define private IP address ranges used for Cloudflare connectivity
 * in different cloud environments. The /20 subnet mask provides 4,096 IP addresses per range
 * (2^(32-20) = 2^12 = 4,096).
 *
 * These specific ranges were chosen because:
 * 1. They're within the private 10.0.0.0/8 address space (RFC1918)
 * 2. They're non-overlapping to prevent routing conflicts
 * 3. They're sequentially allocated for easier management (AWS: 0-15, GCP: 16-31, Azure: 32-47)
 *
 * @type {Record<CloudProvider, string>} Mapping of cloud provider to its assigned CIDR range
 */
const CF_CIDR_RANGES = {
  aws: '10.10.0.0/20',
  gcp: '10.10.16.0/20',
  azu: '10.10.32.0/20',
} satisfies Record<CloudProvider, string>;

type CloudProvider = (typeof CLOUD_PROVIDERS)[number];

const rootCfZone = cloudflare.getZone({ name: ROOT_DNS_ZONE });
const cloudflareZoneId = rootCfZone.then((zone) => zone.zoneId);
const getIngressRules = (subdomain: string) => [
  {
    hostname: `${subdomain}.${ROOT_DNS_ZONE}`,
    path: '/api/proxy-healthcheck',
    service: 'http://localhost',
  },
  { service: 'http_status:404' },
];

/**
 * A mapping of cloud providers to their corresponding Cloudflare tunnels.
 *
 * This object takes our list of cloud providers (like AWS, Azure, GCP) and
 * creates a Cloudflare tunnel for each one. A tunnel is a secure way to connect
 * your cloud resources to Cloudflare without exposing them directly to the internet.
 *
 * For each provider, we:
 * - Create a new tunnel using the `createTunnelWithRoute` function
 * - Configure it with the Cloudflare account ID
 * - Set up the proper CIDR ranges (IP address ranges) for that provider
 * - Apply specific ingress rules (which control what traffic is allowed)
 *
 * The result is an object where each key is a cloud provider name and each value
 * is a configured Cloudflare tunnel for that provider.
 */
const cloudflareTunnels = CLOUD_PROVIDERS.reduce(
  (tunnels, provider) => ({
    ...tunnels,
    [provider]: createTunnelWithRoute(provider, CF_ACCOUNT_ID, CF_CIDR_RANGES[provider], {
      ingressRules: getIngressRules(provider),
    }),
  }),
  {} as Record<CloudProvider, ReturnType<typeof createTunnelWithRoute>>,
);

/**
 * Creates Cloudflare DNS records for each cloud provider to enable tunneling through Cloudflare.
 *
 * This code takes each provider name from the CLOUD_PROVIDERS array and creates a CNAME record for it.
 * For example, if one provider is "aws", it creates a subdomain like "aws.example.com"
 * that points to a Cloudflare Tunnel. The "proxied: true" setting means that traffic will
 * flow through Cloudflare's network for added security and performance benefits.
 *
 * @returns An object where each key is a cloud provider name and each
 *          value is the corresponding Cloudflare DNS record resource
 */
const dnsRecords = CLOUD_PROVIDERS.reduce(
  (records, provider) => ({
    ...records,
    [provider]: new cloudflare.Record(`${provider}-${ROOT_DNS_ZONE}-dns`, {
      zoneId: cloudflareZoneId,
      name: provider,
      type: 'CNAME',
      content: cloudflareTunnels[provider].result.cname,
      proxied: true,
    }),
  }),
  {} as Record<CloudProvider, cloudflare.Record>,
);

/**
 * Creates an Azure Virtual Private Cloud (VPC) for the Cloudflare proxy example
 *
 * Uses 10.0.0.0/16 CIDR for the VPC, which provides 65,536 IP addresses - this is
 * a standard private IP range that offers plenty of addresses for a tutorial environment
 * without being excessive. This creates simple but secure (in the sense that our instance
 * can't be directly accessed via its external IP) "enough" defaults. Least access is later.
 *
 * The subnet uses 10.0.1.0/24, providing 256 IP addresses within the VPC, which is
 * sufficient for our purposes and maintains an easily understandable network layout.
 */
const azureVpc = createAzureVpc('azu-vpc', 'eastus', ['10.0.0.0/16'], ['10.0.1.0/24'], false);

// TODO

// infra
// - Azure done. AWS wip. todo gcp

// instances
// find the same AMI and reuse the same user data for all 3 cloud providers
// that's probably going to be ubuntu server lts since its ami-optimized
// skip the pain of building per-cloud from alpine scratch for a demo
// mm we probably just want unzip nginx cflare htop for deps? i think.
// skip the pain of AWS PS, GCP SM and Azure key vault for demo; userdata ezbake
// i should be able to get the cf tunnel token digests out of somewhere here
// tldr cant use any of my internal code or libraries. rip, bak 2 basics
// i think this gon be a sysctl, systemd and nginx kinda rodeo. lmaooooo
