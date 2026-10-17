const TIMEOUT = 5000;
const CLAIM_TIMEOUT = 30000;
const LATE_WINDOW = 60000;

type Settle = (result: UnderScriptChatSendResult) => void;

type Pending = {
  readonly promise: Promise<UnderScriptChatSendResult>;
  readonly settle: Settle;
};

type Armed = {
  readonly channel: UnderScriptChatChannel;
  readonly pending: Pending;
};

type Entry = Armed & {
  readonly text: string;
  timer: ReturnType<typeof setTimeout>;
};

type Late = {
  readonly channel: UnderScriptChatChannel;
  readonly text: string;
  readonly until: number;
};

const queue: Entry[] = [];
const late: Late[] = [];
const unsubmitted = new Map<Pending, ReturnType<typeof setTimeout>>();
let armed: Armed | undefined;

function sameChannel(first: UnderScriptChatChannel, second: UnderScriptChatChannel): boolean {
  return first.type === second.type && first.id === second.id;
}

function finish(entry: Entry, result: UnderScriptChatSendResult): void {
  clearTimeout(entry.timer);
  const index = queue.indexOf(entry);
  if (index !== -1) queue.splice(index, 1);
  entry.pending.settle(result);
}

function expire(entry: Entry): void {
  late.push({ channel: entry.channel, text: entry.text, until: Date.now() + LATE_WINDOW });
  finish(entry, { status: 'unconfirmed' });
}

function takeLate(channel: UnderScriptChatChannel, text: string): boolean {
  const now = Date.now();
  const current = late.filter(({ until }) => until >= now);
  late.splice(0, late.length, ...current);
  const index = late.findIndex((entry) => sameChannel(entry.channel, channel) && entry.text === text);
  if (index === -1) return false;
  late.splice(index, 1);
  return true;
}

export function createPending(): Pending {
  let done = false;
  let resolve: Settle = () => {};
  const promise = new Promise<UnderScriptChatSendResult>((resolver) => {
    resolve = resolver;
  });
  return {
    promise,
    settle(result) {
      if (done) return;
      done = true;
      resolve(result);
    },
  };
}

export function arm(channel: UnderScriptChatChannel, pending: Pending): void {
  armed?.pending.settle({ status: 'canceled' });
  const mine = { channel, pending };
  armed = mine;
  setTimeout(() => {
    if (armed !== mine) return;
    armed = undefined;
    pending.settle({ status: 'canceled' });
  }, 0);
}

export function claim(channel: UnderScriptChatChannel): Pending {
  const taken = armed && sameChannel(armed.channel, channel) ? armed : undefined;
  if (taken) armed = undefined;
  const pending = taken?.pending ?? createPending();
  unsubmitted.set(pending, setTimeout(() => {
    unsubmitted.delete(pending);
    pending.settle({ status: 'unconfirmed' });
  }, CLAIM_TIMEOUT));
  return pending;
}

export function submitted(channel: UnderScriptChatChannel, pending: Pending, text = ''): void {
  clearTimeout(unsubmitted.get(pending));
  unsubmitted.delete(pending);
  const entry: Entry = {
    channel,
    pending,
    text,
    timer: setTimeout(() => expire(entry), TIMEOUT),
  };
  queue.push(entry);
}

export function echoed(message: UnderScriptChatMessage, selfId: unknown): void {
  if (`${message.author.id}` !== `${selfId}`) return;
  const here = ({ channel }: Armed) => sameChannel(channel, message.channel);
  const same = queue.find((waiting) => here(waiting) && waiting.text === message.text);
  if (same) {
    finish(same, { status: 'sent', message });
    return;
  }
  if (takeLate(message.channel, message.text)) return;
  const oldest = queue.find(here);
  if (oldest) finish(oldest, { status: 'sent', message });
}

export function refused(notice: UnderScriptChatNotice): void {
  const [entry] = queue;
  if (entry) finish(entry, { status: 'rejected', notice });
}

export function forgetAll(): void {
  late.length = 0;
  [...queue].forEach((entry) => finish(entry, { status: 'unconfirmed' }));
}
