interface UnderScriptI18nInstance {
  locale: string;
}

interface UnderScriptI18n {
  (): UnderScriptI18nInstance;
  (key: string, ...args: string[]): string;
  messageStore: {
    messages: Record<string, Record<string, string>>;
  };
  parser: {
    emitter: Record<string, (nodes: any[]) => unknown>;
  };
}

interface JQueryStatic {
  i18n: UnderScriptI18n;
}
