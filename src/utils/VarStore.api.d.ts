type UnderScriptVarStore<T> = {
  value: T;
  get(): T;
  set(value: T): T;
  consume(): T;
  isSet(): boolean;
  reset(): void;
};

interface UnderScriptUtils {
  readonly VarStore: new <T = undefined>(
    ...args: undefined extends T ? [defaultValue?: T] : [defaultValue: T]
  ) => UnderScriptVarStore<T>;
}
