import Translation from 'src/structures/constants/translation.js';
import eventManager from './eventManager.js';
import * as settings from './settings/index.js';

const commands = [];

export function register({
  command,
  description = Translation.Command(command, ''),
  usage,
  note = usage ? `/${command} ${usage}` : `/${command}`,
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

export function list() {
  return commands.filter(({ available }) => available());
}
