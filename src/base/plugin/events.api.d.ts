type UnderScriptEmitResult = {
  ran: boolean;
  canceled: boolean;
};

type UnderScriptEmitFlags = {
  cancelable?: true;
  canceled?: true;
  singleton?: true;
  async?: true;
};

type UnderScriptEmitOptions = {
  cancelable?: boolean;
  canceled?: boolean;
  singleton?: boolean;
  async?: boolean;
};

type UnderScriptEmitReturn<O extends UnderScriptEmitOptions> = O extends { async?: infer A }
  ? A extends true ? Promise<UnderScriptEmitResult> : UnderScriptEmitResult
  : UnderScriptEmitResult;

type UnderScriptEmit<F extends UnderScriptEmitFlags = {}> = {
  <E extends string>(event: E, ...args: UnderScriptEventArgs<E>): F extends { async: true }
    ? Promise<UnderScriptEmitResult>
    : UnderScriptEmitResult;
  <O extends UnderScriptEmitOptions, E extends string>(
    options: O,
    event: E,
    ...args: UnderScriptEventArgs<E>
  ): F extends { async: true } ? Promise<UnderScriptEmitResult> : UnderScriptEmitReturn<O>;
  /** @deprecated Pass `{ cancelable: true }` as the first argument instead */
  readonly cancelable: UnderScriptEmit<F & { cancelable: true }>;
  /** @deprecated Pass `{ canceled: true }` as the first argument instead */
  readonly canceled: UnderScriptEmit<F & { canceled: true }>;
  /** @deprecated Pass `{ singleton: true }` as the first argument instead */
  readonly singleton: UnderScriptEmit<F & { singleton: true }>;
  /** @deprecated Pass `{ async: true }` as the first argument instead */
  readonly async: UnderScriptEmit<F & { async: true }>;
};

type UnderScriptPluginEvents = {
  on<E extends string>(event: E, listener: UnderScriptListener<E>): UnderScriptPluginEvents;
  once<E extends string>(event: E, listener: UnderScriptListener<E>): UnderScriptPluginEvents;
  one<E extends string>(event: E, listener: UnderScriptListener<E>): UnderScriptPluginEvents;
  until<E extends string>(event: E, listener: UnderScriptListener<E>): UnderScriptPluginEvents;
  off(event: string, listener: (...args: any[]) => unknown): UnderScriptPluginEvents;
  compound(...args: [...events: [string, string, ...string[]], listener: (...args: any[]) => unknown]): void;
  readonly emit: UnderScriptEmit;
};

interface UnderScriptPlugin {
  readonly events: Readonly<UnderScriptPluginEvents>;
}
