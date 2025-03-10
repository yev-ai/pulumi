# Measuring Cross-Cloud AZ Latency

Here, we'll find the lowest latency AZ combination between AWS, Azure, and GCP.

# Requirements

- On top of the requirements in the top-level README.md:
  - An authenticated Google Clooud CLI
  - An authenticated Azure CLI
  - An authenticated AWS CLI
  - Python 3.11 - use this exact version.

# Preparation

### Find partially featured AZ in our AWS account

Set up all the requirements mentioned in examples/aws-ec2-bastion/README.md and modify "examples/Pulumi.yaml" to have this line:

```
main: ./mc-latency-measure/index.ts
```

In "examples/", run:

```
npm install
pulumi up
```

You will see something like this:

```
 +   pulumi:pulumi:Stack              yevai-pulumi-demo-example      **creating failed (33s)**     1 error
 +   ├─ awsx:ec2:DefaultVpc           defaultVpc                     created (0.86s)
 +   ├─ aws:iam:Role                  bastionProfile-ssm-role        created (0.74s)
 +   ├─ aws:iam:RolePolicyAttachment  bastionProfile-ssm-attachment  created (0.41s)
 +   ├─ aws:iam:InstanceProfile       bastionProfile-ssm-profile     created (6s)
 +   ├─ aws:ec2:SecurityGroup         bastionSg-sg                   created (2s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1e-password    created (1s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1d-password    created (0.22s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1f-password    created (0.37s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1c-password    created (1s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1a-password    created (2s)
 +   ├─ random:index:RandomPassword   bastion-us-east-1b-password    created (3s)
 +   ├─ aws:ec2:Instance              bastion-us-east-1a-bastion     created (15s)
 +   ├─ aws:ec2:Instance              bastion-us-east-1f-bastion     created (14s)
 +   ├─ aws:ec2:Instance              bastion-us-east-1e-bastion     **creating failed**           1 error
 +   ├─ aws:ec2:Instance              bastion-us-east-1d-bastion     created (14s)
 +   ├─ aws:ec2:Instance              bastion-us-east-1b-bastion     created (15s)
 +   ├─ aws:ec2:Instance              bastion-us-east-1c-bastion     created (16s)
```

Note the AZ in which creation failed. We'll exclude it from our PerfKitBenchmarker tests.

In the above case, it's "us-east-1e". Remember to clean up the stack and resources:

```
pulumi destroy
pulumi stack rm [YOUR_TEST_STACK_NAME]
```

### Set up PerfKitBenchmarker

We'll be using [PerfKitBenchmarker](https://github.com/GoogleCloudPlatform/PerfKitBenchmarker). If you have compatibility issues, use [the version of it from this commit](https://github.com/GoogleCloudPlatform/PerfKitBenchmarker/commit/335b1933f2e995c7a99d218e2c75566c1107e669). In this directory, run:

```
git clone https://github.com/GoogleCloudPlatform/PerfKitBenchmarker
cd PerfKitBenchmarker
brew install python@3.11
sudo apt-get install python3-venv -y
/home/linuxbrew/.linuxbrew/opt/python@3.11/bin/python3.11 -m venv ~/pkb_env
source $HOME/pkb_env/bin/activate

# Make sure that "python --version" returns 3.11.x

export CLOUDSDK_PYTHON=$HOME/pkb_env/bin/python
pip3 install -r requirements.txt
pip3 install -r requirements-testing.txt
pip install -r ./PerfKitBenchmarker/perfkitbenchmarker/providers/aws/requirements.txt

cp ./latency_measure.yml ./PerfKitBenchmarker/latency_measure.yml
cp ./mesh_network_benchmark.py ./PerfKitBenchmarker/perfkitbenchmarker/linux_benchmarks/mesh_network_benchmark.py
cd PerfKitBenchmarker
git status
```

You should see this line in "git status"

```
modified:   perfkitbenchmarker/linux_benchmarks/mesh_network_benchmark.py
```

**If you don't, DO NOT EXECUTE THE TEST or it could easily cost hundreds of dollars for bandwidth.**

[Their official setup docs can be found here](https://github.com/GoogleCloudPlatform/PerfKitBenchmarker/tree/master/tutorials/beginner_walkthrough) if you run into issues.

Edit "examples/mc-latency-measure/PerfKitBenchmarker/latency_measure.yml" to remove the failed AWS AZ.

In our case, we need to remove:

```
  aws_1e:
    cloud: AWS
    vm_count: 1
    vm_spec:
      AWS:
        assign_external_ip: true
        machine_type: m5.large
        zone: us-east-1e
```

# Execution

This performance test will create and destroy resources in all 3 cloud providers. This costs money, but should be under $10 total. It may take up to 15 minutes.

In "examples/mc-latency-measure/PerfKitBenchmarker", run:

```
./pkb.py --accept_licenses --benchmark_config_file=./latency_measure.yml --benchmarks=mesh_network --ip_addresses=EXTERNAL
```

Note: the "ip_addresses=EXTERNAL" flag is intentionally in both the YML and the arguments above.

# Interpretation

After the test runs, you'll see something like this in the end:

```
2025-03-10 01:23:27,193 5f8819b0 MainThread INFO     Benchmark run statuses:
--------------------------------------------------------
Name          UID            Status     Failed Substatus
--------------------------------------------------------
mesh_network  mesh_network0  SUCCEEDED
--------------------------------------------------------
Success rate: 100.00% (1/1)
2025-03-10 01:23:27,193 5f8819b0 MainThread INFO     Complete logs can be found at: /tmp/perfkitbenchmarker/runs/5f8819b0/pkb.log
2025-03-10 01:23:27,193 5f8819b0 MainThread INFO     Completion statuses can be found at: /tmp/perfkitbenchmarker/runs/5f8819b0/completion_statuses.json
2025-03-10 01:23:27,194 5f8819b0 MainThread INFO     PKB exiting with return_code 0
```

Examine the log file ("/tmp/perfkitbenchmarker/runs/5f8819b0/pkb.log" in the above example) to determine your lowest bandwidth mesh combination. In our case, it was:

- GCP us-east4-a
- Azure eastus-1
- AWS us-east-1a

If more than a few people find the file confusing, message me at yevgen@yev.ai and I'll write a parser / interpreter for it.

# Common Issues

You may have to make sure that your Microsoft.Storage provider is registerred. To double-check:

```
az provider show -n Microsoft.Storage
```

If it shows "NotRegistered", run:

```
az provider register --namespace Microsoft.Storage --subscription YOUR_SUBSCRIPTION_ID
```
