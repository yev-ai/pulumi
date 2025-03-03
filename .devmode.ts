import { spawn } from 'child_process';
import { access, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';

const PACKAGE_NAME = '@yevai/pulumi',
  TARGETS = process.env.DEV_TARGETS?.split(',').map((s) => s.trim());

if (!TARGETS?.length) {
  console.error('DEV_TARGETS not set or empty');
  process.exit(1);
}

const exec = (command: string, cwd = process.cwd()) =>
  new Promise<void>((resolve, reject) => {
    spawn(command, { stdio: 'inherit', shell: true, cwd })
      .once('close', (code) => (code ? reject(new Error(`${command} exited ${code}`)) : resolve()))
      .once('error', reject);
  });

const exists = (filepath: string) =>
  access(filepath).then(
    () => true,
    () => false,
  );

const updatePackageJson = async (target: string) => {
  const packageJsonPath = path.join(target, 'package.json');
  if (!(await exists(packageJsonPath))) return;

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
  ['dependencies', 'devDependencies'].forEach((depType) => {
    if (packageJson[depType]?.[PACKAGE_NAME]) packageJson[depType][PACKAGE_NAME] = 'latest';
  });
  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
};

const cleanTarget = async (target: string) => {
  const paths = ['bun.lock', 'yalc.lock', 'package-lock.json', '.yalc', 'node_modules'].map((file) =>
    path.join(target, file),
  );

  await Promise.all(paths.map((p) => rm(p, { recursive: true, force: true })));
  await updatePackageJson(target);
  console.log(`Cleaned up ${target}`);
};

const installDependencies = async (target: string) => {
  const [hasNodeModules, hasNpmLock] = await Promise.all([
    exists(path.join(target, 'node_modules')),
    exists(path.join(target, 'package-lock.json')),
  ]);
  if (!hasNodeModules) await exec(hasNpmLock ? 'npm install' : 'bun install', target);
};

const cleanup = async () => {
  await Promise.all(TARGETS.map(cleanTarget));
  process.exit(0);
};

const run = async () => {
  await exec('yalc publish');
  await Promise.all(
    TARGETS.map(async (target) => {
      await installDependencies(target);
      await exec(`yalc add ${PACKAGE_NAME}`, target);
    }),
  );
};
(async () => (process.env.DEV_CLEANUP ? cleanup() : run()).catch(console.error))();
