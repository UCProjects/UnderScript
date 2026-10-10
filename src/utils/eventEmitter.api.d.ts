type UnderScriptEventEmitter<F extends UnderScriptEmitFlags = {}> = {
  on(event: string, listener: (this: UnderScriptEventMeta, ...args: any[]) => unknown): UnderScriptEventEmitter;
  once(event: string, listener: (this: UnderScriptEventMeta, ...args: any[]) => unknown): UnderScriptEventEmitter;
  one(event: string, listener: (this: UnderScriptEventMeta, ...args: any[]) => unknown): UnderScriptEventEmitter;
  until(event: string, listener: (this: UnderScriptEventMeta, ...args: any[]) => unknown): UnderScriptEventEmitter;
  off(event: string, listener: (...args: any[]) => unknown): UnderScriptEventEmitter;
  emit(event: string, ...data: unknown[]): F extends { async: true }
    ? Promise<UnderScriptEmitResult>
    : UnderScriptEmitResult;
  emit<O extends UnderScriptEmitOptions>(options: O, event: string, ...data: unknown[]): F extends { async: true }
    ? Promise<UnderScriptEmitResult>
    : UnderScriptEmitReturn<O>;
  /** @deprecated Pass `{ cancelable: true }` as the first argument of `emit` instead */
  readonly cancelable: UnderScriptEventEmitter<F & { cancelable: true }>;
  /** @deprecated Pass `{ canceled: true }` as the first argument of `emit` instead */
  readonly canceled: UnderScriptEventEmitter<F & { canceled: true }>;
  /** @deprecated Pass `{ singleton: true }` as the first argument of `emit` instead */
  readonly singleton: UnderScriptEventEmitter<F & { singleton: true }>;
  /** @deprecated Pass `{ async: true }` as the first argument of `emit` instead */
  readonly async: UnderScriptEventEmitter<F & { async: true }>;
};

interface UnderScriptUtils {
  eventEmitter(): UnderScriptEventEmitter;
}
