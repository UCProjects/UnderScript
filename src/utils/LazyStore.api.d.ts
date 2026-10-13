type UnderScriptLazyStore<T> = {
  readonly value: T;
  get(): T;
  isLoaded(): boolean;
  reset(): void;
};

interface UnderScriptUtils {
  readonly LazyStore: new <T>(factory: () => T) => UnderScriptLazyStore<T>;
}
