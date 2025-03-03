import { iam } from '@pulumi/aws';
import { Output, Resource } from '@pulumi/pulumi';
import type { PulumiMethod } from '@utils';
import { optionalDep } from '@utils';

/**
 * Creates an IAM role for SSM (Systems Manager) that can be assumed by EC2 instances
 * @param resourcePrefix - Prefix to be used in the name of the IAM role
 * @param waitFor - Optional array of resources that this role should wait for before being created
 * @returns An AWS IAM role resource that can be assumed by EC2 instances for SSM purposes
 */
const _createBastionSsmRole = (resourcePrefix: string, waitFor?: Resource[]) =>
  new iam.Role(
    `${resourcePrefix}-ssm-role`,
    {
      assumeRolePolicy: iam.assumeRolePolicyForPrincipal({
        Service: 'ec2.amazonaws.com',
      }),
    },
    optionalDep(waitFor),
  );

/**
 * Creates an IAM role policy attachment for SSM managed instance core policy.
 * This allows the instance to be managed by AWS Systems Manager.
 *
 * @param resourcePrefix - Prefix to be used in the resource name
 * @param roleName - The name of the IAM role to attach the policy to
 * @returns An AWS IAM role policy attachment resource
 */
const _createBastionSsmPolicyAttachment = (resourcePrefix: string, roleName: Output<string>) =>
  new iam.RolePolicyAttachment(`${resourcePrefix}-ssm-attachment`, {
    role: roleName,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  });

/**
 * Creates an IAM Instance Profile for EC2 instances to enable AWS Systems Manager (SSM) access
 *
 * @param resourcePrefix - Prefix to be used for naming AWS resources
 * @param waitFor - Optional dependency to wait for before creating the resources
 * @returns An object containing:
 *          - finishedOn: The created instance profile
 *          - result: The created instance profile
 *
 * This function:
 * 1. Creates an IAM role that can be assumed by EC2 instances
 * 2. Attaches the AmazonSSMManagedInstanceCore policy to the role
 * 3. Creates an instance profile and associates it with the role
 *
 * The resulting instance profile can be attached to EC2 instances to enable SSM access
 */
export const createBastionSsmProfile: PulumiMethod<iam.InstanceProfile, iam.InstanceProfile, [string]> = (
  resourcePrefix,
  waitFor,
) => {
  const ssmRole = _createBastionSsmRole(resourcePrefix, waitFor);
  const ssmPolicyAttachment = _createBastionSsmPolicyAttachment(resourcePrefix, ssmRole.name);

  const instanceProfile = new iam.InstanceProfile(
    `${resourcePrefix}-ssm-profile`,
    {
      role: ssmRole.name,
    },
    { dependsOn: [ssmPolicyAttachment] },
  );

  return {
    finishedOn: instanceProfile,
    result: instanceProfile,
  };
};
