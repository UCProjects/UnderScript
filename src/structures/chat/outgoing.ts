import { emitCancelable } from './chat';
import { channelFromRoom } from './message';

type TextInput = { value: string };
type CommandData = { command: string; text: string; output: string | undefined };

export function emitSend(room: unknown, input: TextInput): boolean {
  const channel = channelFromRoom(room);
  if (!channel || !input.value.trim()) return false;
  const outgoing: UnderScriptChatOutgoing = { channel, text: input.value };
  const canceled = emitCancelable('send', false, outgoing);
  if (!canceled && typeof outgoing.text === 'string') input.value = outgoing.text;
  return canceled;
}

export function emitCommand(room: unknown, data: CommandData, canceled: boolean): boolean {
  const channel = channelFromRoom(room);
  if (!channel) return canceled;
  const command: UnderScriptChatCommand = {
    channel,
    command: data.command,
    text: data.text,
    get output() {
      return data.output;
    },
    set output(value) {
      data.output = value;
    },
  };
  return emitCancelable('command', canceled, command);
}
