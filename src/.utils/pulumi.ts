import { getOrganization, getProject, getStack } from '@pulumi/pulumi';
import { RandomPassword } from '@pulumi/random';

/**
 * Gets the current Pulumi stack for the application.
 *
 * This stack represents the deployment environment (e.g., dev, staging, prod)
 * and contains the state and configuration for infrastructure resources.
 *
 * @returns {string} The name of the current Pulumi stack
 */
export const stack = getStack();

/**
 * Exports the current Pulumi project configuration.
 * This constant holds the result of getProject() function call,
 * which retrieves the project settings and configuration.
 *
 * @returns The Pulumi project configuration object
 */
export const project = getProject();

/**
 * Organization value obtained from Pulumi configuration.
 * @remarks
 * This constant is initialized using the `getOrganization()` function.
 */
export const organization = getOrganization();

/**
 * Generates a random password using Pulumi's RandomPassword resource
 * @param pulumiResourceName - The name of the Pulumi resource to be used as a keeper
 * @returns A pulumi.Output<string> containing the generated password
 *
 * The generated password will:
 * - Be 32 characters long
 * - Contain no special characters
 * - Have at least 8 lowercase letters
 * - Have at least 8 uppercase letters
 * - Have at least 8 numbers
 * - Remain consistent based on the pulumiResourceName keeper
 */
export const createPassword = (pulumiResourceName: string) =>
  new RandomPassword(pulumiResourceName, {
    length: 32,
    keepers: {
      string: pulumiResourceName,
    },
    special: false,
    upper: true,
    lower: true,
    numeric: true,
    minLower: 8,
    minUpper: 8,
    minNumeric: 8,
  }).result;
