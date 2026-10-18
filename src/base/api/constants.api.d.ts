type UnderScriptDeprecatedItems = {
  /** @deprecated Use `underscript.constants.item.GOLD` */
  readonly GOLD: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.UCP` */
  readonly UCP: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.DUST` */
  readonly DUST: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.EXP` */
  readonly EXP: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.ELO` */
  readonly ELO: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.DT_FRAGMENT` */
  readonly DT_FRAGMENT: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.UT_PACK` */
  readonly UT_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.DR_PACK` */
  readonly DR_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.UTY_PACK` */
  readonly UTY_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.SHINY_PACK` */
  readonly SHINY_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.SUPER_PACK` */
  readonly SUPER_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.FINAL_PACK` */
  readonly FINAL_PACK: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.CARD` */
  readonly CARD: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.SKIN` */
  readonly SKIN: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.AVATAR` */
  readonly AVATAR: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.EMOTE` */
  readonly EMOTE: UnderScriptItem;
  /** @deprecated Use `underscript.constants.item.PROFILE` */
  readonly PROFILE: UnderScriptItem;
};

type UnderScriptConstants = UnderScriptDeprecatedItems & {
  readonly item: UnderScriptItems;
  readonly priority: UnderScriptPriorities;
  readonly rarity: UnderScriptRarities;
  readonly soul: UnderScriptSouls;
  getItem(value: unknown): UnderScriptItem | undefined;
  isItem(other: unknown): boolean;
  getPriority(value: unknown): UnderScriptPriority | undefined;
  isPriority(other: unknown): boolean;
  getRarity(value: unknown): UnderScriptRarityConstant | undefined;
  isRarity(other: unknown): boolean;
  getSoul(value: unknown): UnderScriptSoul | undefined;
  isSoul(other: unknown): boolean;
};

interface UnderScriptAPI {
  readonly constants: UnderScriptConstants;
}
