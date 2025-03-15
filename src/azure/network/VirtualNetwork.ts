import type { VirtualNetworkArgs } from '@pulumi/azure/network';
import { VirtualNetwork } from '@pulumi/azure/network';

export const createVpc = (resourcePrefix: string, args: VirtualNetworkArgs) =>
  new VirtualNetwork(`${resourcePrefix}-vpc`, args);
