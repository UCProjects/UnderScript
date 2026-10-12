type Frame = Record<string, unknown>;
type Translate = (message: string) => unknown;

const KINDS: Record<string, { event: 'notice' | 'rejected'; kind: UnderScriptChatNotice['kind'] }> = {
  getInfoMessage: { event: 'notice', kind: 'info' },
  getMessageAuto: { event: 'notice', kind: 'auto' },
  getMessageBroadcast: { event: 'notice', kind: 'broadcast' },
  getMessageError: { event: 'rejected', kind: 'error' },
  getMessageDenied: { event: 'rejected', kind: 'denied' },
};

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

export function noticeEvent(action: unknown): 'notice' | 'rejected' | undefined {
  return typeof action === 'string' ? KINDS[action]?.event : undefined;
}

export function parseNotice(frame: unknown, translate?: Translate): UnderScriptChatNotice | undefined {
  if (!isRecord(frame) || typeof frame.action !== 'string') return undefined;
  const info = KINDS[frame.action];
  if (!info) return undefined;
  const { message } = frame;
  const broadcast = info.kind === 'broadcast';
  const [first, ...args] = broadcast ? [] : readArgs(message);
  const key = typeof first === 'string' ? first : undefined;
  const text = broadcast && typeof message === 'string' ?
    message :
    translateSafely(translate, message) ?? key ?? '';
  return {
    kind: info.kind,
    key,
    args,
    text,
    type: typeof frame.type === 'string' ? frame.type : undefined,
    userId: typeof frame.idUser === 'number' || typeof frame.idUser === 'string' ? frame.idUser : undefined,
    raw: frame,
  };
}
