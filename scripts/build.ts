import rollup from 'rollup';

import fs from 'node:fs/promises';
import path from 'node:path';
import typescript from '@rollup/plugin-typescript';
import replace from '@rollup/plugin-replace';

const REPO_URL = `https://github.com/hakurouken/tamper-scripts`;

function readJson(file: string) {
  return fs.readFile(file, 'utf-8').then(JSON.parse);
}

async function createReplacement(pkg: string) {
  const [packageJson, rootPackageJson] = await Promise.all([
    readJson(path.join('packages', pkg, 'package.json')),
    readJson('package.json')
  ]);

  const name = packageJson.name || pkg;
  const homepage = packageJson.homepage || `${REPO_URL}/packages/${pkg}`;
  const dist = `https://cdn.jsdelivr.net/gh/hakurouken/tamper-scripts/dist/${pkg}.js`;

  return {
    __NAME__: name,
    __NAMESPACE__: `hakurouken/tamper-scripts/${name}`,
    __VERSION__: packageJson.version,
    __DESCRIPTION__: packageJson.description,
    __AUTHOR__: packageJson.author || rootPackageJson.author,
    __HOMEPAGE__: homepage,
    __UPDATE_URL__: dist,
    __DOWNLOAD_URL__: dist,
    __SUPPORT_URL__: `${REPO_URL}/issues`
  };
}

const USERSCRIPT_RE =
  /\/\/\s?==UserScript==(?:[\s\S]*?)\/\/\s*==\/UserScript==(?:\s*?)\n/m;

function createUserScriptPlugin(): rollup.Plugin {
  return {
    name: 'rollup-plugin-userscript',
    renderChunk(code) {
      const matched = code.match(USERSCRIPT_RE);
      if (!matched) {
        return code;
      }
      return `${matched[0]}\n${code.replace(USERSCRIPT_RE, '')}`;
    }
  };
}

async function createInputOptions(pkg: string): Promise<rollup.InputOptions> {
  const replaceValues = await createReplacement(pkg);

  return {
    input: [path.join(__dirname, '..', 'packages', pkg, 'src/index.user.ts')],
    plugins: [
      createUserScriptPlugin(),
      replace({ preventAssignment: true, values: replaceValues }),
      typescript()
    ]
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
    watch: {}
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
