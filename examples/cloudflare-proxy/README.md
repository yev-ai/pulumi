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

## First Run

When you first run 'pulumi up', you will see output similar to this:

```
     Type                             Name                                Plan
 +   pulumi:pulumi:Stack              yevai-pulumi-demo-example           create
 +   ├─ awsx:ec2:DefaultVpc           defaultVpc                          create
 +   ├─ random:index:RandomPassword   bastionInstanceName-password        create
 +   ├─ aws:iam:Role                  bastionInstanceName-ssm-role        create
 +   ├─ aws:iam:RolePolicyAttachment  bastionInstanceName-ssm-attachment  create
 +   ├─ aws:iam:InstanceProfile       bastionInstanceName-ssm-profile     create
 +   ├─ aws:ec2:SecurityGroup         bastionInstanceName-sg              create
 +   └─ aws:ec2:Instance              bastionInstanceName-bastion         create

Outputs:
    bastionInstances: {
        bastionInstanceName: {
            encodedCommand: output<string>
            runCommand    : "pulumi stack output bastionInstances --stack yai/yevai-pulumi-demo/example --show-secrets | jq -r '.bastionInstanceName.encodedCommand' | base64 --decode | bash"
        }
    }
    defaultVpcId    : "vpc-02bbb35b05e179bed"
```

Your run script and credentials are securely saved as a stack output secret. When you run this command from the output:

```
pulumi stack output bastionInstances --stack yai/yevai-pulumi-demo/example --show-secrets | jq -r '.bastionInstanceName.encodedCommand' | base64 --decode | bash
```

You can share the above command with your teammates. Anyone with access to the stack output and AWS SSM in the proper account can use it! You will see something like:

```
Using port 5901
Instance ID: i-0f015c431b1044000
Connect URL: https://us-east-1.console.aws.amazon.com/ec2/home?region=us-east-1#ConnectToInstance:instanceId=i-0f015c431b1044000
Username: ec2-user
Password: 0b480tF9ohUmkWvBzkCm1IEwOS6dB000

Starting session with SessionId: your-aws-user-l98gpl3xbfaq2aapkqn8pvq000
Port 5901 opened for sessionId your-aws-userl98gpl3xbfaq2aapkqn8pvq000.
Waiting for connections...
```

You can see your bastion setting up via Serial Console if you open the "Connect URL".

Once ready, connect VNC to "localhost:5901" and log in with the password above.

Done! **IMPORTANT**: Run "pulumi destroy" to shut down your EC2 instance.
