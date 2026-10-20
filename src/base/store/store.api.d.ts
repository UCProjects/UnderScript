type UnderScriptBuyPackType = '' | 'DR' | 'UTY';

type UnderScriptOpenPackType = UnderScriptBuyPackType | 'Shiny' | 'Super' | 'Final';

type UnderScriptBuyPackOptions = {
  type?: UnderScriptBuyPackType;
  gold?: boolean;
};

interface UnderScriptAPI {
  /** @deprecated Use `plugin.packs.buy` instead */
  buyPacks?(count: number, options?: UnderScriptBuyPackOptions): void;
  /** @deprecated Use `plugin.packs.open` instead */
  openPacks?(count: number, type?: UnderScriptOpenPackType | UnderScriptItem): void;
  /** @deprecated Use `plugin.packs.opening` instead */
  openingPacks?(): boolean;
}
