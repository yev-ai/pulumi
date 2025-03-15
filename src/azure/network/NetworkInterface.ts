import type { NetworkInterfaceArgs } from '@pulumi/azure/network';
import { NetworkInterface } from '@pulumi/azure/network';

export const createNic = (resourcePrefix: string, args: NetworkInterfaceArgs, anEnabled: boolean = false) =>
  new NetworkInterface(`${resourcePrefix}-nic`, { ...args, acceleratedNetworkingEnabled: anEnabled });
