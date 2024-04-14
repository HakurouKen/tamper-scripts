import path from 'node:path';
import fsp from 'node:fs/promises';
import minimist from 'minimist';
import prompts from 'prompts';
import validateNpmPackageName from 'validate-npm-package-name';
import { Eta } from 'eta';

const root = path.join(__dirname, '..');
const templateRoot = path.join(__dirname, 'template');
const packageRoot = path.join(root, 'packages');

const eta = new Eta({
  views: templateRoot,
  autoEscape: false,
  autoTrim: false
});

async function renderFile(
  pkg: string,
  template: string,
  data: Record<string, any> = {}
) {
  const content = eta.render(template, data);
  await fsp.writeFile(path.join(packageRoot, pkg, template), content, 'utf-8');
}

async function renderDir(
  pkg: string,
  dir: string,
  data: Record<string, any> = {}
) {
  const dirents = await fsp.readdir(path.join(templateRoot, dir), {
    withFileTypes: true
  });
  await fsp.mkdir(path.join(packageRoot, pkg, dir));
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      await renderDir(pkg, path.join(dir, dirent.name), data);
    } else {
      await renderFile(pkg, path.join(dir, dirent.name), data);
    }
  }
}

async function render(pkg: string, data: Record<string, any>) {
  await renderDir(pkg, '', data);
}

async function run(commandLineArgs: string[]) {
  const argv = minimist(commandLineArgs);
  const name = argv._[0];

  const result = await prompts([
    {
      type: 'text',
      name: 'name',
      message: 'Project name:',
      initial: name,
      validate: (value) => validateNpmPackageName(value).validForNewPackages
    },
    {
      type: 'text',
      name: 'description',
      message: 'Project description:'
    }
  ]);

  await render(result.name, result);
}

run(process.argv.slice(2));
