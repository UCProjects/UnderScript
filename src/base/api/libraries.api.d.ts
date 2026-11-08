type UnderScriptLib = {
  readonly tippy: unknown;
  /** @deprecated Use `fetch` */
  readonly axios: unknown;
  readonly luxon: unknown;
  readonly showdown: unknown;
};

interface UnderScriptAPI {
  readonly lib: UnderScriptLib;
}
