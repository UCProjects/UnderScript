import { channelFromRoom, emitCancelable } from './chat';
import { arm, createPending } from './pending';

type TextInput = { value: string };
type CommandData = { command: string; text: string; output: string | undefined };

type Sending = {
  readonly canceled: boolean;
  finish(canceled: boolean): void;
};

export function emitSend(room: unknown, input: TextInput): Sending {
  const channel = channelFromRoom(room);
  if (!channel || !input.value.trim()) return { canceled: false, finish: () => {} };
  const pending = createPending();
  const outgoing: UnderScriptChatOutgoing = { channel, text: input.value, result: pending.promise };
  const canceled = emitCancelable('send', false, outgoing);
  if (!canceled && typeof outgoing.text === 'string') input.value = outgoing.text;
  return {
    canceled,
    finish(final) {
      if (final) {
        pending.settle({ status: 'canceled' });
      } else {
        arm(channel, pending);
      }
    },
  };
}

export function commandView(
  room: unknown,
  data: CommandData,
  command = data.command,
): UnderScriptChatCommand | undefined {
  const channel = channelFromRoom(room);
  if (!channel) return undefined;
  return {
    channel,
    command,
    text: data.text,
    get output() {
      return data.output;
    },
    set output(value) {
      data.output = value;
    },
  };
}

export function emitCommand(room: unknown, data: CommandData, canceled: boolean): boolean {
  const view = commandView(room, data);
  if (!view) return canceled;
  return emitCancelable('command', canceled, view);
}
