import type { PulumiMethod } from '@/.utils';
import * as cloudflare from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';

/**
 * Retrieves a Cloudflare zone by name and adapts it to conform to the Pulumi Resource interface.
 *
 * This function is necessary because the return value of cloudflare.getZone() does not
 * extend pulumi.Resource, but the PulumiMethod type requires resources. The function
 * adds the required Pulumi Resource properties (urn and getProvider) to make the zone
 * compatible with Pulumi's resource model.
 *
 * @param name - The name of the Cloudflare zone to retrieve. Should be a top level domain.
 * @returns An object containing the zone as both finishedOn and result properties,
 *          with the zoneId and zone enhanced to match the pulumi.Resource interface
 */
export const getRootCloudflareZone: PulumiMethod<
  pulumi.Resource,
  pulumi.Resource,
  [string],
  { zoneId: Promise<string> }
> = (name) => {
  const zone = cloudflare.getZone({ name });
  const outputZone = {
    ...zone,
    urn: null as unknown as pulumi.Output<string>,
    getProvider: () => null as unknown as pulumi.ProviderResource,
  };
  return { finishedOn: { ...outputZone }, result: { ...outputZone }, zoneId: zone.then((zone) => zone.zoneId) };
};
