interface UnderScriptCraft {
  readonly dust: number | undefined;
  bypassProtection(value: boolean): void;
}

interface UnderScriptAPI {
  readonly craft: UnderScriptCraft;
}
