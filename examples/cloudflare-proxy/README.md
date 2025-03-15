# Cloudflare Proxy

As always, the primary design goal for this implementation is beginner-friendliness. As such, it is _highly prescriptive_.

## Requirements

- On top of the requirements in the top-level README.md:

  - Fully set up GCP account - [guide here](https://www.pulumi.com/docs/iac/get-started/gcp/)
  - Fully set up AWS account - [guide here](https://www.pulumi.com/docs/iac/get-started/aws/)
  - Fully set up Azure account - [guide here](https://www.pulumi.com/docs/iac/get-started/azure/)
    - Set "values.pulumiConfig['gcp:project:] to your GCP project in [ESC](https://www.pulumi.com/product/secrets-management/). See example below!
  - Fully set up cloudflare account and API key. I suggest [Pulumi ESC](https://www.pulumi.com/docs/esc/) for storing these kinds of things. See below.
    - The TLD we're doing this needs to be on the $20/mo Pro plan. This is the cost of one ALB in one cloud.

  ```
  // URL: https://app.pulumi.com/[ORG]/esc/[PROJECT]/[STACK]

  values:
    pulumiConfig:
      gcp:project: [YOUR_GCP_PROJECT]
      [YOUR_PULUMI_PROJECT]:cloudflareAccountId: [CF_ACCOUNT_ID] //Important!
      [YOUR_PULUMI_PROJECT]:cloudflareRootTldZone: [NON_FQDN_ZONE]
      cloudflare:email: [YOUR_EMAIL]
      cloudflare:apiKey:
        fn::secret:
          YOUR_API_KEY
  ```

  - "fn::secret:" is an underrated Pulumi ESC feature - it encrypts the value when you hit save.
  - Next, you'll want to link that ESC environment to your stack, like so in Pulumi.yaml:

  ```
  name: [PROJECT_NAME]
    description: DESC_HERE
    runtime:
    name: nodejs
    options:
      typescript: true
    environment:
      - [ESC_ENV_HERE]

    // A URL of "https://app.pulumi.com/[ORG]/esc/[PROJECT]/[STACK]" maps to:

    environment:
    - [PROJECT]/[STACK].

    // If your ESC URL was: https://app.pulumi.com/foo/esc/bar/baz, you'd set:

    environment:
    - bar/baz
  ```

  - Once that's done, your cloudflare provider automagically pulls it from ESC! No insecure local key storage :)

## Setup

Set the following line in "examples/Pulumi.yaml" :

```
main: ./cloudflare-proxy/index.ts
```

TODO - meat n taters here

## Background

This is a minimally viable infra example. You'll get 3-10ms latency, 1000+RPS, and 300-700Mbps burst.

It is also designed to not make you blow your 401K if you forget to turn an EC2 instance off.

Total cost in our example configuration: $25/mo for AWS, GCP and Azure + $20/mo for Cloudflare Pro.

So don't be afraid to leave it up and play around with it!

## Execution

Run "pulumi up" from terminal in "/examples", wait 3-10 minutes, done!
