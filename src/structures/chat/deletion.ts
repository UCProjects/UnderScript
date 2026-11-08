import Counter from 'src/utils/Counter';

export default function parseDeletion(frame: unknown): UnderScriptChatDeletion | undefined {
  if (!frame || typeof frame !== 'object') return undefined;
  const { action, idUser } = frame as Record<string, unknown>;
  if (action !== 'deleteMessages') return undefined;
  let userId = idUser;
  if (typeof userId === 'string') {
    try {
      userId = JSON.parse(userId);
    } catch {
      userId = idUser;
    }
  }
  if (typeof userId === 'number' || (typeof userId === 'string' && userId)) return { userId };
  return undefined;
}

const clock = new Counter();
const removed = new Map<string, number>();

export function stamp(): number {
  return clock.next();
}

export function recordDeletion(userId: number | string): void {
  removed.set(`${userId}`, stamp());
}

export function deletedSince(userId: number | string, stampedAt: number): boolean {
  return (removed.get(`${userId}`) ?? 0) > stampedAt;
}
