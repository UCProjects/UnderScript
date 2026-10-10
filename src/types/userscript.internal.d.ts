declare const GM_info: {
  script: {
    version: string;
    [key: string]: any;
  };
  scriptHandler: string;
  [key: string]: any;
};

declare const unsafeWindow: Window & typeof globalThis;

declare function GM_getResourceText(name: string): string | undefined;
