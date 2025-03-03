import { ec2, iam } from '@pulumi/aws';
import { Output } from '@pulumi/pulumi';
import type { PulumiMethod } from '@utils';
import { createPassword, optionalDep } from '@utils';
import { getAl2UserData, getAmiId, getConnectionScript, getRunCommand, getUbuntuUserData } from '@utils-aws';
import { createBastionSsmProfile } from '../iam/InstanceProfile';
import { createBastionSecurityGroup } from './SecurityGroup';

/**
 * Creates an EC2 bastion instance with specified configurations.
 *
 * @param resourcePrefix - Unique prefix for naming resources
 * @param subnetId - ID of the subnet where the bastion instance will be launched
 * @param options - Configuration options for the bastion instance
 * @param options.exportObject - Object to export the instance details (default: {})
 * @param options.instanceArgs - Additional EC2 instance arguments
 * @param options.instanceProfile - IAM instance profile for the bastion
 * @param options.securityGroupIds - Array of security group IDs
 * @param options.ssmPathOverride - Override path for SSM parameter
 * @param options.osDistribution - 'ubuntu' or 'al2'. Defaults to 'al2'
 * @param waitFor - Optional dependency to wait for before creating the instance
 *
 * @returns Object containing:
 * - finishedOn: The created EC2 instance
 * - result: The created EC2 instance
 * - encodedCommand: Base64 encoded connection script
 * - runCommand: Command to run for connecting to the instance
 *
 * @remarks
 * The function creates a bastion host with either Ubuntu or Amazon Linux 2 AMI.
 * It sets up necessary security groups, IAM profiles, and generates connection scripts.
 * The instance is configured with metadata v2, gp3 root volume, and monitoring enabled.
 */
export const createBastionInstance: PulumiMethod<
  ec2.Instance,
  ec2.Instance,
  [
    string,
    string | Output<string>,
    {
      exportObject?: typeof module.exports;
      instanceArgs?: ec2.InstanceArgs;
      instanceProfile?: iam.InstanceProfile;
      securityGroupIds?: string[] | Output<string>[];
      ssmPathOverride?: string;
      osDistribution?: 'ubuntu' | 'al2';
    },
  ],
  {
    encodedCommand: Output<string>;
    runCommand: Output<string>;
  }
> = (
  resourcePrefix,
  subnetId,
  { exportObject = {}, instanceArgs, instanceProfile, securityGroupIds, osDistribution, ssmPathOverride },
  waitFor,
) => {
  const password = createPassword(`${resourcePrefix}-password`);

  const isUbuntu = osDistribution && osDistribution === 'ubuntu';

  const instanceProfileActual =
    instanceProfile || instanceArgs?.iamInstanceProfile || createBastionSsmProfile(resourcePrefix, waitFor).result;
  const securityGroupIdsActual = securityGroupIds ||
    instanceArgs?.vpcSecurityGroupIds || [
      ec2.Subnet.get(`${resourcePrefix}-subnet`, subnetId).vpcId.apply(
        (vpcId) => createBastionSecurityGroup(resourcePrefix, vpcId, waitFor).result.id,
      ),
    ];

  const bastionInstance = new ec2.Instance(
    `${resourcePrefix}-bastion`,
    {
      instanceType: 't3.medium',
      ami: getAmiId(osDistribution, ssmPathOverride),
      associatePublicIpAddress: true,
      userData: isUbuntu ? getUbuntuUserData(password) : getAl2UserData(password),
      iamInstanceProfile: instanceProfileActual,
      vpcSecurityGroupIds: securityGroupIdsActual,
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required',
      },
      subnetId: subnetId,
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 8,
        encrypted: true,
      },
      monitoring: true,
      disableApiTermination: false,
      tags: {
        Name: resourcePrefix,
      },
      ...instanceArgs,
    },
    optionalDep(waitFor),
  );

  const encodedCommand = getConnectionScript(bastionInstance.id, password, isUbuntu ? 'ubuntu' : 'ec2-user').apply(
    (script) => Buffer.from(script).toString('base64'),
  );

  const runCommand = getRunCommand(resourcePrefix);

  exportObject.bastionInstances = exportObject.bastionInstances || {};
  exportObject.bastionInstances[resourcePrefix] = {
    encodedCommand,
    runCommand,
  };

  return {
    finishedOn: bastionInstance,
    result: bastionInstance,
    encodedCommand,
    runCommand,
  };
};
