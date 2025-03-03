import { DefaultVpc } from '@pulumi/awsx/ec2';
import { createBastionInstance } from '@yevai/pulumi';

const vpc = new DefaultVpc('defaultVpc', { keepOnDestroy: true });
module.exports.defaultVpcId = vpc.vpcId;

/**
 * Creates a bastion EC2 instance in the specified subnet and exports the connection details to module.exports.
 */
const simpleBastionEc2Instance = createBastionInstance('bastionInstanceName', vpc.privateSubnetIds[0], {
  exportObject: module.exports,
});

// const bastionSg = createBastionSecurityGroup('bastionSg', vpc.vpcId).result;
// const bastionProfile = createBastionSsmProfile('bastionProfile').result;

/**
 * Creates and configures a bastion EC2 instance in a VPC subnet using a custom security group and instance profile
 */
// const bastionWithReusableDependencies = createBastionInstance('psub01', vpc.privateSubnetIds[0], {
//   instanceProfile: bastionProfile,
//   securityGroupIds: [bastionSg.id],
//   exportObject: module.exports,
// });

/**
 * Creates and configures a bastion EC2 instance in a VPC subnet using a custom instance type and OS distribution
 */
// const largeUbuntuBastion = createBastionInstance('psub02', vpc.privateSubnetIds[0], {
//   instanceProfile: bastionProfile,
//   securityGroupIds: [bastionSg.id],
//   exportObject: module.exports,
//   osDistribution: 'ubuntu',
//   instanceArgs: {
//     instanceType: 'm5.large',
//   },
// });
