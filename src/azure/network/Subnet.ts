import type { SubnetArgs } from '@pulumi/azure/network';
import { Subnet } from '@pulumi/azure/network';

export const createSubnet = (resourcePrefix: string, args: SubnetArgs) => new Subnet(`${resourcePrefix}-subnet`, args);
