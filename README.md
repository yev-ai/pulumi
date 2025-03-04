![example workflow](https://github.com/yev-ai/pulumi/actions/workflows/main.yaml/badge.svg)&nbsp; [![GitHub issues](https://img.shields.io/github/issues/yev-ai/pulumi.svg)](https://github.com/yev-ai/pulumi/issues)&nbsp; ![npm version](https://img.shields.io/npm/v/@yevai/pulumi.svg)

[![NPM Download Stats](https://nodei.co/npm/@yevai/pulumi.png?downloads=true)](https://www.npmjs.com/package/@yevai/pulumi)

# Pulumi Starter Kit

Hi everyone, we're giving open source a shot! This package will be slowly populated. For now, it's being published for some of my [substack guide blog posts](https://www.yevelations.com/).

# General Information

To keep the package light, we've steered away from hard dependencies. See /examples/ for more. You will need:

- [@pulumi/pulumi](https://www.npmjs.com/package/@pulumi/pulumi) v3.0.0 or higher installed.
- To use the relevant constructs, you'll also need:
  - [@pulumi/random](https://www.npmjs.com/package/@pulumi/random)
  - [@pulumi/aws](https://www.npmjs.com/package/@pulumi/aws)
  - [@pulumi/azure](https://www.npmjs.com/package/@pulumi/azure)
  - [@pulumi/gcp](https://www.npmjs.com/package/@pulumi/gcp)
  - [@pulumi/cloudflare](https://www.npmjs.com/package/@pulumi/cloudflare)

# Requirements

- JQ from their [Official Page](https://jqlang.org/download/) or "brew install jq". We also recommend:

  ```
  # Set JQ for AWS CLI by adding the following to ~/.aws/config:
  cli_pager = jq
  output = json
  ```

- A logged in [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) or "brew install awscli"
- A logged in [Pulumi CLI](https://www.pulumi.com/docs/iac/cli/) or "brew install pulumi"
- An initialized [Pulumi Stack](https://www.pulumi.com/docs/iac/concepts/stacks/), or use "./examples"

# Local Development

You will need [Bun](https://bun.sh/docs/installation)

Create a \*.env file in root and set the repository where you'd like this package used in it, like so:

```
# Single Path Where "/home/YOUR_USERNAME/YOUR_PROJECT/package.json" exists
DEV_TARGET=/home/YOUR_USERNAME/YOUR_PROJECT

# Multiple Paths
DEV_TARGET=/home/YOUR_USERNAME/YOUR_PROJECT,/home/YOUR_USERNAME/YOUR_SECOND_PROJECT
```

Run "npm run dev" to start the watcher. This will copy the package to the target directory on every change and clean up after.

# Extras

You may find the nodemon setup along with ./.devmode.sh + ./devmode.ts a useful pattern.

You may also find ./.vscode/settings.json + ./.github/copilot-instructions.md useful.
