import type { PulumiMethod } from '@/.utils';
import { asResource } from '@/.utils';
import * as azure from '@pulumi/azure';
import { Resource } from '@pulumi/pulumi';
import { createResourceGroup } from '../core/ResourceGroup';
import { createNic } from './/NetworkInterface';
import { createSubnet } from './Subnet';
import { createVpc } from './VirtualNetwork';

export * from './NetworkInterface';
export * from './Subnet';
export * from './VirtualNetwork';

/**
 * Creates a foundational Azure networking stack with prescriptive defaults.
 *
 * This function serves as a tutorial enabler by setting up a complete networking foundation
 * with minimal configuration. It creates a resource group, virtual network, subnet, and
 * network interface with sensible defaults to quickly establish a working Azure network.
 *
 * @param resourcePrefix - Prefix used for naming all created resources
 * @param region - Azure region where resources will be deployed
 * @param vpcCidr - Array of CIDR blocks for the virtual network address space
 * @param subnetCidr - Array of CIDR blocks for subnet address prefixes
 * @param acceleratedNetworkingEnabled - Flag to enable/disable accelerated networking on the NIC
 *
 * @returns An object containing:
 *   - result: The network interface as a Pulumi resource
 *   - finishedOn: The network interface
 *   - resourceGroup: The created resource group
 *   - vpc: The created virtual network
 *   - subnet: The created subnet
 */
export const createAzureVpc: PulumiMethod<
  Resource,
  azure.network.NetworkInterface,
  [string, string, string[], string[], boolean],
  {
    resourceGroup: azure.core.ResourceGroup;
    vpc: azure.network.VirtualNetwork;
    subnet: azure.network.Subnet;
  }
> = (resourcePrefix, region, vpcCidr, subnetCidr, acceleratedNetworkingEnabled) => {
  const resourceGroup = createResourceGroup(resourcePrefix, region);
  const vpc = createVpc(resourcePrefix, {
    resourceGroupName: resourceGroup.name,
    location: resourceGroup.location,
    addressSpaces: vpcCidr,
  });
  const subnet = createSubnet(resourcePrefix, {
    resourceGroupName: resourceGroup.name,
    virtualNetworkName: vpc.name,
    addressPrefixes: subnetCidr,
  });
  const nic = createNic(
    resourcePrefix,
    {
      resourceGroupName: resourceGroup.name,
      ipConfigurations: [
        {
          name: 'internal',
          subnetId: subnet.id,
          privateIpAddressAllocation: 'Dynamic',
        },
      ],
    },
    acceleratedNetworkingEnabled,
  );

  return {
    result: asResource(nic.id),
    finishedOn: nic,
    resourceGroup,
    vpc,
    subnet,
  };
};
