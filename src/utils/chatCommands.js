import Translation from 'src/structures/constants/translation';
import eventManager from './eventManager';
import * as settings from './settings/index';

/**
 * @typedef {object} ChatCommand
 * @property {string} command
 * @property {string | Translation} [description]
 * @property {string} [usage]
 * @property {string | Translation | (() => string | Translation | undefined)} [note]
 * @property {string} [page]
 * @property {Translation} [category]
 * @property {() => boolean} [enabled]
 * @property {(this: UnderScriptEventMeta, data: { command: string; text: string; [key: string]: any }) => unknown} [handler]
 * @property {boolean} [setting]
 */

/**
 * @typedef {object} ChatCommandInfo
 * @property {string} command
 * @property {string | Translation} description
 * @property {string} [usage]
 * @property {() => boolean} available
 */

/** @type {ChatCommandInfo[]} */
const commands = [];

/**
 * @param {ChatCommand} command
 * @returns {ReturnType<typeof settings.register> | undefined}
 */
export function register({
  command,
  description = Translation.Command(command, ''),
  usage,
  note = () => `/${command}${usage ? ` ${usage}` : ''}`,
  page = 'Chat',
  category = Translation.CATEGORY_CHAT_COMMAND,
  enabled = () => true,
  handler,
  setting: hasSetting = typeof handler === 'function',
}) {
  if (typeof command !== 'string' || !command.trim()) throw new Error('Command name must be provided');

  const setting = hasSetting ? settings.register({
    name: Translation.DISABLE_COMMAND_SETTING.withArgs(command),
    key: `underscript.command.${command}`,
    note,
    page,
    category,
  }) : undefined;

  function available() {
    if (setting?.value()) return false;
    return enabled() !== false;
  }

  commands.push({
    command,
    description,
    usage,
    available,
  });

  if (typeof handler === 'function') {
    eventManager.on('Chat:command', function run(data) {
      if (this.canceled || data.command !== command || !available()) return;
      handler.call(this, data);
    });
  }

  return setting;
}

/** @returns {ChatCommandInfo[]} */
export function list() {
  return commands.filter(({ available }) => available());
}
