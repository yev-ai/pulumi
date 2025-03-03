import { ec2, ssm } from '@pulumi/aws';
import { all, interpolate, Output, output } from '@pulumi/pulumi';
import { identity, region } from '.';
import { organization, project, stack } from '../pulumi';

/**
 * Generates a bash script for establishing a secure connection to an AWS EC2 instance through AWS Systems Manager.
 *
 * The script performs the following:
 * 1. Verifies the current AWS account ID matches the expected one
 * 2. Finds an available local port starting from 5901
 * 3. Displays connection information
 * 4. Initiates a port forwarding session using AWS SSM
 *
 * @param accountId - The AWS account ID where the instance is located
 * @param instanceId - The ID of the EC2 instance to connect to
 * @param instancePassword - The password for accessing the instance
 * @param connectUrl - The connection URL for the instance
 * @returns A bash script as a string that can be executed to establish the connection
 *
 * @example
 * ```typescript
 * const script = getConnectionScript(
 *   '123456789012',
 *   'i-1234567890abcdef0',
 *   'myPassword123',
 *   'https://my-connect-url.com'
 * );
 * ```
 */
const _getConnectionScript = (
  accountId: string,
  instanceId: string,
  defaultUser: string,
  instancePassword: string,
  connectUrl: string,
) => `#!/bin/bash
  CURRENT_ID=$(aws sts get-caller-identity --query 'Account' --output text)  
  if [ "$CURRENT_ID" != "${accountId}" ]; then
    echo "Error: AWS account ID mismatch! Expected ${accountId} but got $CURRENT_ID"
    exit 1
  fi
  
  PORT=5901
  while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT + 1)); done
  
  echo "Using port $PORT"
  echo "Instance ID: ${instanceId}"
  echo "Connect URL: ${connectUrl}"
  echo "Username: ${defaultUser}"
  echo "Password: ${instancePassword}"
  aws ssm start-session \
    --target ${instanceId} \
    --document-name AWS-StartPortForwardingSession \
    --parameters "{\\"portNumber\\":[\\"5901\\"],\\"localPortNumber\\":[\\"$PORT\\"]}"
  `;

/**
 * Generates a URL for connecting to an AWS EC2 instance through the AWS Console.
 *
 * @param region - The AWS region where the EC2 instance is located
 * @param instanceId - The ID of the EC2 instance to connect to
 * @returns A URL string that opens the EC2 instance connection page in the AWS Console
 *
 * @example
 * const url = _getConnectionUrl('us-east-1', 'i-1234567890abcdef0');
 * // Returns: https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#ConnectToInstance:instanceId=i-1234567890abcdef0
 */
const _getConnectionUrl = (region: string, instanceId: string) =>
  `https://${region}.console.aws.amazon.com/ec2/home?region=${region}#ConnectToInstance:instanceId=${instanceId}`;

/**
 * Generates a connection script for an EC2 instance using provided credentials.
 *
 * @param instanceId - The EC2 instance ID as a Pulumi Output string
 * @param password - The password as a Pulumi Output string
 * @returns A Pulumi Output containing the connection script
 *
 * @remarks
 * This function combines the identity, instance ID and password to create
 * a connection script using internal helper functions _getConnectionScript
 * and _getConnectionUrl
 */
export const getConnectionScript = (instanceId: Output<string>, password: Output<string>, defaultUser: string) =>
  all([identity, region, instanceId, password]).apply(([identity, awsRegion, instanceId, password]) =>
    _getConnectionScript(
      identity.accountId,
      instanceId,
      defaultUser,
      password,
      _getConnectionUrl(awsRegion, instanceId),
    ),
  );

/**
 * Generates a Pulumi command to execute a remote command on a bastion instance.
 * The command retrieves an encoded command from the stack outputs, decodes it from base64, and executes it using bash.
 *
 * @param resourcePrefix - The prefix used to identify the specific resource in the stack outputs
 * @returns A Pulumi interpolated string containing the full command to execute
 *
 * @example
 * ```typescript
 * const command = getRunCommand('myBastion');
 * // Will generate a command like:
 * // pulumi stack output bastionInstances --stack org/project/stack --show-secrets | jq -r '.myBastion.encodedCommand' | base64 --decode | bash
 * ```
 */
export const getRunCommand = (resourcePrefix: string) =>
  interpolate`pulumi stack output bastionInstances --stack ${organization}/${project}/${stack} --show-secrets | jq -r '.${resourcePrefix}.encodedCommand' | base64 --decode | bash`;

export const getAmiId = (osDistribution: 'ubuntu' | 'al2' = 'al2', ssmPathOverride?: string) =>
  osDistribution && osDistribution === 'ubuntu'
    ? ssm
        .getParameter({
          name:
            ssmPathOverride ||
            '/aws/service/canonical/ubuntu/server-minimal/noble/stable/current/amd64/hvm/ebs-gp3/ami-id',
        })
        .then((param) => param.value)
    : output(
        ec2.getAmi({
          mostRecent: true,
          owners: ['amazon'],
          filters: [
            {
              name: 'name',
              values: ['amzn2-ami-hvm-*-x86_64-gp2'],
            },
          ],
        }),
      ).apply((ami) => ami.id);
