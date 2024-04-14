import fs from 'node:fs/promises';
import path from 'node:path';
import rollup from 'rollup';

const REPO_URL = `https://github.com/hakurouken/tamper-scripts`;

async function readJson(file: string) {
  const text = await fs.readFile(file, 'utf-8');
  return JSON.parse(text);
}

interface HeaderLine {
  key: string;
  value: string;
}

interface RequiredMeta {
  name: string;
  namespace: string;
  version: string;
  description: string;
  author: string;
  homepage: string;
  supportURL: string;
  license: string;
}

async function createPackageMetadata(pkg: string): Promise<RequiredMeta> {
  const [packageJson, rootPackageJson] = await Promise.all([
    readJson(path.join('packages', pkg, 'package.json')),
    readJson('package.json')
  ]);

  const name = packageJson.name || pkg;
  const homepage = packageJson.homepage || `${REPO_URL}/packages/${pkg}`;

  return {
    name,
    namespace: `hakurouken/tamper-scripts/${name}`,
    version: packageJson.version,
    description: packageJson.description,
    author: packageJson.author || rootPackageJson.author,
    homepage,
    supportURL: `${REPO_URL}/issues`,
    license: packageJson.license || rootPackageJson.license || 'ISC'
  };
}

const USERSCRIPT_RE =
  /\/\/\s?==UserScript==(?:[\s\S]*?)\/\/\s*==\/UserScript==(?:\s*?)\n/m;

function parse(code: string) {
  const lines = code.split('\n');

  let userScriptStart = false;
  const metadata: Array<HeaderLine> = [];
  for (const line of lines) {
    if (!line.startsWith('//')) {
      continue;
    }
    const content = line.slice(2).trim();

    if (content === '==UserScript==') {
      userScriptStart = true;
      continue;
    }
    if (!userScriptStart) {
      continue;
    }
    if (content === '==/UserScript==') {
      return metadata;
    }

    if (!content.startsWith('@')) {
      continue;
    }
    const [prefix, key] = content.match(/^\s*@(.*?)(\s+|$)/) || [];
    const value = content.slice(prefix.length);

    metadata.push({ key, value });
  }

  throw new Error(`UserScript must ends with ==/UserScript==`);
}

async function generateHeader(pkg: string, originalHeader: string) {
  const parsed = originalHeader ? parse(originalHeader) : [];

  const metadata = await createPackageMetadata(pkg);

  const requiredMetadataKey = [
    'name',
    'namespace',
    'version',
    'description',
    'author',
    'homepage',
    'supportURL',
    'license'
  ] as const;

  function generateRequiredMetaLine(key: keyof RequiredMeta) {
    const value =
      parsed.find((line) => line.key === key)?.value || metadata[key] || '';
    return `// @${key} ${value}\n`;
  }

  let generated = `// ==UserScript==\n`;
  for (const key of requiredMetadataKey) {
    generated += generateRequiredMetaLine(key);
  }

  for (const { key, value } of parsed) {
    if (requiredMetadataKey.includes(key as any)) {
      continue;
    }
    generated += `// @${key} ${value}\n`;
  }

  generated += `// ==/UserScript==\n`;

  return generated;
}

export function createUserScriptPlugin(pkg: string): rollup.Plugin {
  return {
    name: 'rollup-plugin-userscript',
    async renderChunk(code) {
      const originalHeader = code.match(USERSCRIPT_RE)?.[0];
      const header = await generateHeader(pkg, originalHeader);

      return `${header}\n${code.replace(USERSCRIPT_RE, '')}`;
    }
  };
}
