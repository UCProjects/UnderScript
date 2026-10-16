type UnderScriptEmitterHandler<A extends any[] = any[]> = (...args: A) => unknown;

type UnderScriptEmitterListener<A extends any[] = any[]> = (this: UnderScriptEventMeta, ...args: A) => unknown;

type UnderScriptUnmappedEvent<M, S extends string> = S extends keyof M ? never : S;

type UnderScriptEventEmitter<
  F extends UnderScriptEmitFlags = {},
  M extends Record<keyof M, any[]> = Record<string, any[]>,
> = {
  on<S extends string>(event: UnderScriptUnmappedEvent<M, S>, listener: UnderScriptEmitterListener): UnderScriptEventEmitter<{}, M>;
  on<K extends keyof M & string>(event: K, listener: UnderScriptEmitterListener<M[K]>): UnderScriptEventEmitter<{}, M>;
  once<S extends string>(event: UnderScriptUnmappedEvent<M, S>, listener: UnderScriptEmitterListener): UnderScriptEventEmitter<{}, M>;
  once<K extends keyof M & string>(event: K, listener: UnderScriptEmitterListener<M[K]>): UnderScriptEventEmitter<{}, M>;
  one<S extends string>(event: UnderScriptUnmappedEvent<M, S>, listener: UnderScriptEmitterListener): UnderScriptEventEmitter<{}, M>;
  one<K extends keyof M & string>(event: K, listener: UnderScriptEmitterListener<M[K]>): UnderScriptEventEmitter<{}, M>;
  until<S extends string>(event: UnderScriptUnmappedEvent<M, S>, listener: UnderScriptEmitterListener): UnderScriptEventEmitter<{}, M>;
  until<K extends keyof M & string>(event: K, listener: UnderScriptEmitterListener<M[K]>): UnderScriptEventEmitter<{}, M>;
  off<S extends string>(event: UnderScriptUnmappedEvent<M, S>, listener: UnderScriptEmitterHandler): UnderScriptEventEmitter<{}, M>;
  off<K extends keyof M & string>(event: K, listener: UnderScriptEmitterHandler<M[K]>): UnderScriptEventEmitter<{}, M>;
  emit<K extends keyof M & string>(event: K, ...data: M[K]): F extends { async: true }
    ? Promise<UnderScriptEmitResult>
    : UnderScriptEmitResult;
  emit<O extends UnderScriptEmitOptions, K extends keyof M & string>(options: O, event: K, ...data: M[K]): F extends { async: true }
    ? Promise<UnderScriptEmitResult>
    : UnderScriptEmitReturn<O>;
  /** @deprecated Pass `{ cancelable: true }` as the first argument of `emit` instead */
  readonly cancelable: UnderScriptEventEmitter<F & { cancelable: true }, M>;
  /** @deprecated Pass `{ canceled: true }` as the first argument of `emit` instead */
  readonly canceled: UnderScriptEventEmitter<F & { canceled: true }, M>;
  /** @deprecated Pass `{ singleton: true }` as the first argument of `emit` instead */
  readonly singleton: UnderScriptEventEmitter<F & { singleton: true }, M>;
  /** @deprecated Pass `{ async: true }` as the first argument of `emit` instead */
  readonly async: UnderScriptEventEmitter<F & { async: true }, M>;
};

interface UnderScriptUtils {
  eventEmitter<M extends Record<keyof M, any[]> = Record<string, any[]>>(): UnderScriptEventEmitter<{}, M>;
}
