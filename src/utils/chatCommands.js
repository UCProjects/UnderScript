import Translation from 'src/structures/constants/translation';
import eventManager from './eventManager';
import * as settings from './settings/index';

/**
 * @typedef {object} ChatCommand
 * @property {string} command
 * @property {string} [owner]
 * @property {string} [icon]
 * @property {UnderScriptCommandText} [description]
 * @property {UnderScriptCommandText} [usage]
 * @property {() => boolean} [enabled]
 * @property {(this: UnderScriptEventMeta, data: { command: string; text: string; [key: string]: any }) => unknown} [handler]
 */

/**
 * @typedef {object} ChatCommandInfo
 * @property {string} command
 * @property {string} owner
 * @property {string} namespace
 * @property {string} qualified
 * @property {string} [icon]
 * @property {UnderScriptCommandText} description
 * @property {UnderScriptCommandText} [usage]
 * @property {() => boolean} available
 */

const DEFAULT_OWNER = 'UnderScript';

function namespaceOf(owner) {
  return owner.trim().replace(/[\s:]/g, '-');
}

function validate({ command, owner = DEFAULT_OWNER, icon }) {
  if (typeof command !== 'string' || !command.trim()) throw new Error('Command name must be provided');
  if (typeof owner !== 'string' || !owner.trim()) throw new Error('Command owner must be a name');
  if (icon !== undefined && (typeof icon !== 'string' || !icon.trim())) throw new Error('Command icon must be an image address');
}

/** @type {ChatCommandInfo[]} */
const commands = [];

/**
 * @param {ChatCommand} command
 * @returns {UnderScriptCommandHandle}
 */
export function register({
  command,
  owner = DEFAULT_OWNER,
  icon,
  description = Translation.Command(command, ''),
  usage,
  enabled = () => true,
  handler,
}) {
  validate({ command, owner, icon });

  const namespace = namespaceOf(owner);
  const qualified = `${namespace}:${command}`;

  function typedAs(data) {
    return data.command === command || data.command === qualified;
  }

  function available() {
    return enabled() !== false;
  }

  const info = {
    command,
    owner,
    icon,
    namespace,
    qualified,
    description,
    usage,
    available,
  };
  commands.push(info);

  const listener = typeof handler === 'function' ?
    function run(data) {
      if (this.canceled || !typedAs(data) || !available()) return;
      handler.call(this, data);
    } :
    function unqualify(data) {
      if (this.canceled || data.command !== qualified || !available()) return;
      data.output = `/${command}${data.text ? ` ${data.text}` : ''}`;
    };
  eventManager.on('Chat:command', listener);

  return Object.freeze({
    remove() {
      const index = commands.indexOf(info);
      if (index === -1) return false;
      commands.splice(index, 1);
      eventManager.off('Chat:command', listener);
      return true;
    },
  });
}

/**
 * @param {string} command
 * @param {Pick<import('./settings/index').SettingOptions, 'note' | 'page' | 'category'>} [options]
 * @returns {ReturnType<typeof settings.register>}
 */
export function commandSetting(command, {
  note = () => `/${command}`,
  page = 'Chat',
  category = Translation.CATEGORY_CHAT_COMMAND,
} = {}) {
  return settings.register({
    name: Translation.DISABLE_COMMAND_SETTING.withArgs(command),
    key: `underscript.command.${command}`,
    note,
    page,
    category,
  });
}

/** @returns {ChatCommandInfo[]} */
export function list() {
  return commands.filter(({ available }) => available());
}
