import { getSubnet } from '@pulumi/aws/ec2';
import { DefaultVpc } from '@pulumi/awsx/ec2';
import { createBastionInstance, createBastionSecurityGroup, createBastionSsmProfile } from '@yevai/pulumi';

const vpc = new DefaultVpc('defaultVpc', { keepOnDestroy: true });
const subnets = vpc.privateSubnetIds;

const subnetToAZMapping = subnets.apply((subnetIds) =>
  Promise.all(
    subnetIds.map((id) =>
      getSubnet({ id }).then((subnet) => ({
        subnetId: id,
        az: subnet.availabilityZone,
      })),
    ),
  ),
);

const bastionSg = createBastionSecurityGroup('bastionSg', vpc.vpcId).result;
const bastionProfile = createBastionSsmProfile('bastionProfile').result;

subnetToAZMapping.apply((mappings) => {
  mappings.forEach((mapping) => {
    createBastionInstance(`bastion-${mapping.az}`, mapping.subnetId, {
      instanceProfile: bastionProfile,
      securityGroupIds: [bastionSg.id],
      exportObject: module.exports,
    });
  });
});
