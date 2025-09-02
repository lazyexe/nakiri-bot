import consola from 'consola';
import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';
import { pathToFileURL } from 'url';

const commands = new Map();
const commandIndex = new Map();
const tags = new Map();
const dirCommands = path.join(import.meta.dirname, '../bot/commands/');

export const Command = (options) => {
  let { name, run, alias, ...opt } = options;

  name = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').trim();
  run = run || async function () { console.log(`[COMMANDS] No run function for command ${name}`); };

  if (commands.has(name)) return consola.warn(`[COMMANDS] Duplicate command name ${name} is already registered!`);
  if (!Array.isArray(alias)) return consola.warn(`[COMMANDS] Command ${name} must define an alias array (e.g., alias: ['menu', 'help']).`);
  if (typeof run !== 'function') return consola.warn(`[COMMANDS] Command ${name} must have a valid 'run' function.`);

  for (const as of alias) {
    if (commandIndex.has(as)) {
      commandIndex.set(as, [...commandIndex.get(as), name]);
    } else {
      commandIndex.set(as, [name]);
    }
  }

  if (opt?.tags) {
    const { label, example } = opt.tags;
    if (!tags.has(label)) {
      tags.set(label, []);
    }

    tags.get(label).push({
      alias,
      example,
    });
  }

  commands.set(name, {
    name: name,
    alias: alias,
    options: { ...opt, alias },
    run: run,
    // filepath: import.meta.url,
  });
};

export const initCommands = async () => {
  let totalFiles = 0;

  // Gunakan Map untuk mengelola cache modul di ESM
  const moduleCache = new Map();

  const loadFile = async (file) => {
    totalFiles++;
    try {
      // Untuk ESM, gunakan pathToFileURL dan import()
      const modulePath = pathToFileURL(file).href;

      // Hapus dari cache untuk hot reload
      if (moduleCache.has(modulePath)) {
        moduleCache.delete(modulePath);
      }
      // Tambahkan timestamp untuk mem-bypass cache
      const importedModule = await import(`${modulePath}?update=${Date.now()}`);
      moduleCache.set(modulePath, importedModule);

    } catch (e) {
      consola.error(`[COMMANDS] Failed to load ${path.basename(file)}:`, e.message);
    }
  };

  const loadDirectory = async (dirPath) => {
    const files = fs.readdirSync(dirPath);
    for (const dirOrFile of files) {
      const dirOrFilePath = path.join(dirPath, dirOrFile);
      try {
        const stat = fs.lstatSync(dirOrFilePath);
        if (stat.isSymbolicLink()) continue;

        if (stat.isDirectory()) {
          await loadDirectory(dirOrFilePath);
        } else if (dirOrFile.endsWith('.js')) {
          await loadFile(dirOrFilePath);
        }
      } catch (err) {
        consola.error(`[COMMANDS] Failed to read ${dirOrFilePath}:`,err.message);
      }
    };
  };

  const refreshCommands = async () => {
    commands.clear();
    commandIndex.clear();
    tags.clear();
    moduleCache.clear();

    await loadDirectory(dirCommands);
  };

  await loadDirectory(dirCommands);
  consola.info(`[COMMANDS] Loaded ${commands.size} commands.`);

  const watcher = chokidar.watch(dirCommands, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  watcher.on('add', filePath => {
    if (filePath.endsWith('.js')) {
      consola.info(`[COMMANDS] New file detected: ${filePath}`);
      loadFile(filePath);
    }
  });

  watcher.on('change', filePath => {
    if (filePath.endsWith('.js')) {
      consola.info(`[COMMANDS] File changed: ${filePath}`);
      refreshCommands();
    }
  });

  watcher.on('unlink', filePath => {
    if (filePath.endsWith('.js')) {
      consola.info(`[COMMANDS] File deleted: ${filePath}`);
      refreshCommands();
    }
  });
};

export const getAliases = (name) => {
  let cmds = [];
  const alias = commandIndex.get(name);
  if (!alias) return [];
  for (const name of alias) {
    const a = commands.get(name);
    if (!a) continue;
    cmds = [...cmds, a];
  }
  return cmds;
};

export {
  tags,
  commands,
  commandIndex
};