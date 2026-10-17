type Frame = Record<string, unknown>;
type Translate = (message: string) => unknown;

const KINDS: Record<string, UnderScriptChatNotice['kind']> = {
  getInfoMessage: 'info',
  getMessageAuto: 'auto',
  getMessageBroadcast: 'broadcast',
  getMessageError: 'error',
  getMessageDenied: 'denied',
};

const REFUSALS = new Set([
  'chat-spam-protection',
  'chat-restricted',
  'chat-banned',
  'chat-link',
  'chat-permission',
  'chat-bad-usage',
  'chat-power',
  'chat-not-connected',
]);

function isRecord(value: unknown): value is Frame {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function translateSafely(translate: Translate | undefined, message: unknown): string | undefined {
  if (!translate || typeof message !== 'string') return undefined;
  try {
    const translated = translate(message);
    return typeof translated === 'string' && translated ? translated : undefined;
  } catch {
    return undefined;
  }
}

function readArgs(message: unknown): unknown[] {
  if (typeof message !== 'string') return [];
  try {
    const outer: unknown = JSON.parse(message);
    if (!isRecord(outer) || typeof outer.args !== 'string') return [];
    const args: unknown = JSON.parse(outer.args);
    return Array.isArray(args) ? args : [];
  } catch {
    return [];
  }
}

export function eventOf(notice: UnderScriptChatNotice): 'notice' | 'rejected' {
  if (notice.kind === 'error' || notice.kind === 'denied') return 'rejected';
  return notice.kind === 'info' && notice.key !== undefined && REFUSALS.has(notice.key) ? 'rejected' : 'notice';
}

export function parseNotice(frame: unknown, translate?: Translate): UnderScriptChatNotice | undefined {
  if (!isRecord(frame) || typeof frame.action !== 'string') return undefined;
  const kind = KINDS[frame.action];
  if (!kind) return undefined;
  const { message } = frame;
  const broadcast = kind === 'broadcast';
  const [first, ...args] = broadcast ? [] : readArgs(message);
  const key = typeof first === 'string' ? first : undefined;
  const text = broadcast && typeof message === 'string' ?
    message :
    translateSafely(translate, message) ?? key ?? '';
  return {
    kind,
    key,
    args,
    text,
    type: typeof frame.type === 'string' ? frame.type : undefined,
    userId: typeof frame.idUser === 'number' || typeof frame.idUser === 'string' ? frame.idUser : undefined,
    raw: frame,
  };
}
