/**
 * @param {KeyboardEvent} event
 */
export default function isCtrl(event) {
  return event.ctrlKey || event.metaKey;
}
