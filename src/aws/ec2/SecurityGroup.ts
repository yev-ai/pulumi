import { ec2 } from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';
import type { PulumiMethod } from '@utils';
import { optionalDep } from '@utils';

/**
 * Creates a security group for a bastion host in AWS EC2.
 *
 * @param resourcePrefix - A string prefix used to identify the security group resource
 * @param vpcId - The ID of the VPC where the security group will be created (can be a string or Pulumi Output)
 * @param waitFor - Optional dependency to wait for before creating the security group
 *
 * @returns An object containing:
 *  - finishedOn: The created security group (for dependency management)
 *  - result: The created security group
 *
 * @remarks
 * The security group is created with:
 * - No inbound rules (empty ingress)
 * - All outbound traffic allowed (full egress to 0.0.0.0/0)
 */
export const createBastionSecurityGroup: PulumiMethod<
  ec2.SecurityGroup,
  ec2.SecurityGroup,
  [string, string | Output<string>]
> = (resourcePrefix, vpcId, waitFor) => {
  const securityGroup = new ec2.SecurityGroup(
    `${resourcePrefix}-sg`,
    {
      vpcId,
      ingress: [],
      egress: [{ protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] }],
    },
    optionalDep(waitFor),
  );
  return {
    finishedOn: securityGroup,
    result: securityGroup,
  };
};
