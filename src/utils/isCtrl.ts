export default function isCtrl(event: Pick<KeyboardEvent, 'ctrlKey' | 'metaKey'>): boolean {
  return event.ctrlKey || event.metaKey;
}
