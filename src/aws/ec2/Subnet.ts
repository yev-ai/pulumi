import type { PulumiMethod } from '@/.utils';
import { asResource } from '@/.utils';
import * as aws from '@pulumi/aws';
import type { DefaultVpc } from '@pulumi/awsx/ec2';
import * as pulumi from '@pulumi/pulumi';

/**
 * Retrieves a subnet ID from a VPC based on the specified availability zone.
 *
 * This function queries AWS EC2 to find a subnet that matches both the given VPC and
 * availability zone, then returns the subnet ID as a Pulumi resource.
 *
 * @param vpc - The VPC to search within for the subnet
 * @param availabilityZone - The AWS availability zone to filter by
 * @returns An object containing the subnet ID as both `finishedOn` and `result` properties,
 *          both wrapped as Pulumi resources
 */
export const getSubnetIdByAvailabilityZone: PulumiMethod<pulumi.Resource, pulumi.Resource, [DefaultVpc, string], {}> = (
  vpc,
  availabilityZone,
) => {
  const subnetId = vpc.vpcId.apply((vpcId) =>
    aws.ec2
      .getSubnet({
        availabilityZone,
        filters: [{ name: 'vpc-id', values: [vpcId] }],
      })
      .then((subnet) => subnet.id),
  );
  return {
    finishedOn: asResource(subnetId),
    result: asResource(subnetId),
  };
};
