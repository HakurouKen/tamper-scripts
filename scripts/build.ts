import fs from 'node:fs/promises';
import path from 'node:path';
import rollup from 'rollup';

import typescript from '@rollup/plugin-typescript';
import { createUserScriptPlugin } from './user-script-plugin';

async function createInputOptions(pkg: string): Promise<rollup.InputOptions> {
  return {
    input: [path.join(__dirname, '..', 'packages', pkg, 'src/index.user.ts')],
    plugins: [createUserScriptPlugin(pkg), typescript()]
  };
}

function createOutputOptions(pkg: string): rollup.OutputOptions {
  return {
    file: path.join(`dist/${pkg}.user.js`),
    format: 'cjs',
    strict: false
  };
}

async function build(pkg: string) {
  const inputOptions = await createInputOptions(pkg);
  const outputOptions = createOutputOptions(pkg);
  const bundle = await rollup.rollup(inputOptions);

  await bundle.write(outputOptions);
  await bundle.close();
}

async function watch(pkg: string) {
  const inputOptions = await createInputOptions(pkg);
  const outputOptions = await createOutputOptions(pkg);

  const watcher = rollup.watch({
    ...inputOptions,
    output: [outputOptions],
    watch: {
      clearScreen: true
    }
  });

  watcher.on('event', (e: any) => {
    e.result?.close();
  });
}

async function run(args: string[]) {
  const [cmd, pkg] = args;

  if (cmd !== 'watch' && cmd !== 'build') {
    console.error(`Unsupported command "${cmd}" found.`);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  const pkgs = (
    await fs.readdir(path.join(__dirname, '..', 'packages'), {
      withFileTypes: true
    })
  )
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  if (!pkgs.includes(pkg)) {
    console.error(
      `Package "${pkg}" is invalid, must be one of ${pkgs.join(', ')}`
    );
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }

  if (cmd === 'watch') {
    await watch(pkg);
  }

  if (cmd === 'build') {
    await build(pkg);
  }
}

run(process.argv.slice(2));
