/// <reference types="jquery" />

interface UnderScriptAPI {
  readonly version: string;
}

interface UnderScriptPlugin {
  readonly name: string;
  readonly version?: string | number;
}

declare const underscript: Readonly<UnderScriptAPI>;

interface Window {
  underscript: Readonly<UnderScriptAPI>;
}
