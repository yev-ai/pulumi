import { getCallerIdentity, getRegion } from '@pulumi/aws';

/**
 * The AWS region name obtained asynchronously from the current AWS configuration.
 * @returns {Promise<string>} A promise that resolves to the name of the AWS region.
 */
export const region = getRegion().then((r) => r.name);

/**
 * Retrieves the identity of the AWS IAM caller using AWS STS GetCallerIdentity.
 * Returns information about the IAM user or role whose credentials are used to call the operation.
 * @type {GetCallerIdentityResult}
 */
export const identity = getCallerIdentity({});

export * from './ec2';
export * from './ec2.userData';
