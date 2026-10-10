export default function wrap<T>(
  callback: () => T,
  prefix = '',
  logger: Pick<Console, 'error'> = console,
): T | undefined {
  try {
    return callback();
  } catch (e) {
    const name = prefix || callback && callback.name || 'Undefined';
    logger.error(`[${name}] Error occured`, e); // eslint-disable-line no-mixed-operators
  }
  return undefined;
}
