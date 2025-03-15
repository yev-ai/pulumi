import { Output, ProviderResource, Resource as PulumiResource } from '@pulumi/pulumi';

/**
 * Creates a dependency object for Pulumi resources if dependencies are provided.
 * @param waitFor - Optional array of Pulumi resources to wait for before creating the current resource
 * @returns An object with dependsOn property containing the dependencies array if waitFor is provided,
 *          or an empty object if no dependencies are specified
 */
export const optionalDep = (waitFor?: PulumiResource[]): { dependsOn: Resource[] } | {} =>
  waitFor ? { dependsOn: [...waitFor] } : {};

/**
 * Type for defining a Pulumi method that creates and manages cloud resources.
 * This is designed to work with the Yevai Inc. VSCode plugin.
 *
 * @typeParam Result - The type of Pulumi resource that this method creates
 * @typeParam FinishedOn - The type of Pulumi resource that this method depends on for completion
 * @typeParam Args - Array type of arguments that this method accepts
 * @typeParam Output - Optional type for additional output properties (defaults to empty object)
 *
 * @returns An object containing:
 * - finishedOn: The dependency resource that determines when this operation is complete
 * - result: The created Pulumi resource
 * - Additional properties from Output type if specified
 *
 * @example
 * ```typescript
 * type CreateBucketMethod = PulumiMethod<
 *   aws.s3.Bucket,        // Result
 *   aws.s3.Bucket,        // FinishedOn
 *   [string],             // Args (bucket name)
 *   { url: pulumi.Output<string> }  // Output
 * >;
 * ```
 */
export type PulumiMethod<
  Result extends PulumiResource,
  FinishedOn extends PulumiResource,
  Args extends any[],
  Output = Record<string, never>,
> = (...args: [...Args, Resource[]?]) => {
  finishedOn: FinishedOn;
  result: Result;
} & (Output extends Record<string, never> ? {} : Output);

export type Resource = PulumiResource;

/**
 * Wraps a non-Pulumi resource (like API results) to make it compatible with the Pulumi Resource interface.
 * This utility adds the required Pulumi Resource properties that might be missing from data sources.
 *
 * @param source - Any object that needs to be compatible with Pulumi Resource interface
 * @returns The source object enhanced with Pulumi Resource compatibility
 *
 * @example
 * ```typescript
 * const zone = cloudflare.getZone({ name });
 * const compatibleZone = resourceWrapper(zone);
 * ```
 */
export const asResource = <T>(source: T): T & PulumiResource => ({
  ...source,
  urn: null as unknown as Output<string>,
  getProvider: () => null as unknown as ProviderResource,
});
