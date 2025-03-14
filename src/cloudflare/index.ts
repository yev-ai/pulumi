import * as cloudflare from '@pulumi/cloudflare';

/**
 * Retrieves a top-level domain (TLD) Cloudflare Zone by name.
 *
 * @param name - The name of the Cloudflare Zone to retrieve
 * @returns A Cloudflare Zone resource
 */
export const getRootCloudflareZone = (name: string) => cloudflare.getZone({ name });
