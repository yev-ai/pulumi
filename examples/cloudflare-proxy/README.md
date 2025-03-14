# Cloudflare Proxy

As always, the primary design goal for this implementation is beginner-friendliness. As such, it is _highly prescriptive_.

## Requirements

- On top of the requirements in the top-level README.md:

  - Fully set up cloudflare account and API key. I suggest [Pulumi ESC](https://www.pulumi.com/docs/esc/) for storing these kinds of things. Like this:

  ```
  // URL: https://app.pulumi.com/[ORG]/esc/[PROJECT]/[STACK]
  // In the pretty UI configuration, what you want to do is:
  values:
    pulumiConfig:
      cloudflare:email: [YOUR_EMAIL]
      cloudflare:apiKey:
        fn::secret:
          YOUR_API_KEY
  ```

  - "fn::secret:" is an underrated Pulumi ESC feature - it encrypts the value when you hit save.
  - Next, you'll want to link that ESC environment to your stack, like so in Pulumi.yaml:

  ```
  name: [YOUR_NAME]
    description: DESC_HERE
    runtime:
    name: nodejs
    options:
      typescript: true
    environment:
      - ESC_ENV_HERE.

    // Example:
    // URL of "https://app.pulumi.com/[ORG]/esc/[PROJECT]/[STACK]" maps to:
    environment:
    - PROJECT/STACK.

    // If your URL was: https://app.pulumi.com/foo/esc/bar/baz, you'd have:
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

Total cost in this example's configuration: $25/mo.

## Execution

Run "pulumi up" from terminal in "/examples", wait 3-10 minutes, done!
