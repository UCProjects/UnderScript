import glob from 'fast-glob';
import { assign, isMain, readJSON, sortKeys, writeFile } from './utils.js';

export default async function main(filePath = 'lang/underscript.json') {
  // Load base "en" first
  const data = await bundle(
    await glob('lang/en/*.json'),
  );

  // Now load other languages (if any)
  Object.entries(await bundle(
    await glob([
      'lang/*/*.json',
      '!lang/en',
    ]),
  )).forEach(
    ([lang, obj]) => Object.entries(obj).forEach(
      ([key, value]) => {
        // Check if key exists in "en"
        if (!Object.hasOwn(data.en, key)) {
          console.warn(`${lang} has unknown key "${key}"`);
          // assign(data, lang, `???${key}`, value);
          // return;
        }
        assign(data, lang, key, value);
      },
    ),
  );

  const file = JSON.stringify(sortKeys(data), null, 2);
  if (!file) return;

  await writeFile(filePath, file);
}

/**
 * Bundle all files into a single object
 * @returns {Promise<Record<string, Record<string, string>>>}
 */
async function bundle(files = []) {
  const ret = {};
  await Promise.all(files.map(async (file) => {
    const [lang, name] = getFileParts(file);

    Object.entries(await readJSON(file)).forEach(
      ([key, value]) => {
        if (key.startsWith('//')) return;
        const fullKey = name === 'vanilla' ? key : `underscript.${name}.${key}`;
        assign(ret, lang, fullKey, value);
      },
    );
  }));
  return ret;
}

// Split file path into [lang, name]
function getFileParts(file = '') {
  const [/* dir */, lang, name] = file.split('/');
  return [lang, name.substring(0, name.lastIndexOf('.'))];
}

// Only automatically run if main script...
if (isMain(import.meta)) {
  main();
}
