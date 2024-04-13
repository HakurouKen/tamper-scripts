import fs from 'node:fs/promises';
import path from 'node:path';
import rollup from 'rollup';

import colors from 'picocolors';
import dateTime from 'date-time';
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

  const resolveFilePath = (p: string) => path.relative(process.cwd(), p);

  // @see: https://github.com/rollup/rollup/blob/2fdfe1c3b70c66781ea62a48ae1aaa94ee29f9b7/cli/run/watch-cli.ts#L78
  watcher.on('event', (event) => {
    if (event.code === 'START') {
      console.log(`\u001Bc [${colors.underline(colors.bold(pkg))}]\n`);
    }

    const outputFile = resolveFilePath(outputOptions.file);
    if (event.code === 'BUNDLE_START') {
      let { input } = event;
      if (typeof input !== 'string') {
        input = Array.isArray(input)
          ? input.map(resolveFilePath).join(', ')
          : Object.values(input as Record<string, string>)
              .map(resolveFilePath)
              .join(', ');
      }

      console.log(
        colors.cyan(
          `bundle ${colors.bold(input)} → ${colors.bold(outputFile)}...`
        )
      );
    }

    if (event.code === 'BUNDLE_END') {
      console.log(
        colors.green(
          `created ${colors.bold(outputFile)} in ${colors.bold(event.duration + 'ms')}`
        )
      );
    }

    if (event.code === 'END') {
      console.log();
      console.log(`[${dateTime()}]`, 'waiting for changes...');
    }

    (event as any).result?.close();
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
