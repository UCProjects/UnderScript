type Raw = Record<string, unknown>;
type NameOf = (card: Raw) => string | undefined;

const ACTIONS: ReadonlyArray<UnderScriptCraftAction> = ['craft', 'disenchant', 'auto'];

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function toId(value: unknown): number | string | undefined {
  return typeof value === 'number' || (typeof value === 'string' && value) ? value : undefined;
}

function translateSafely(translate: (message: string) => unknown, message: unknown): string {
  if (typeof message !== 'string') return '';
  try {
    const translated = translate(message);
    return typeof translated === 'string' && translated ? translated : message;
  } catch {
    return message;
  }
}

export function isAction(value: unknown): value is UnderScriptCraftAction {
  return ACTIONS.includes(value as UnderScriptCraftAction);
}

export function parseCard(
  response: unknown,
  data: unknown,
  nameOf: NameOf,
): UnderScriptCraftResult | undefined {
  if (!isRecord(response)) return undefined;
  const parsed = parseJson(response.card);
  const card: Raw = isRecord(parsed) ? parsed : {};
  const id = toId(card.id) ?? toId(response.cardId);
  if (id === undefined) return undefined;
  const asked = isRecord(data) ? data : {};
  const fallback = typeof response.cardName === 'string' ? response.cardName : '';
  return {
    id,
    name: (card.id === undefined ? undefined : nameOf(card)) || fallback,
    dust: Number(response.dust),
    shiny: asked.isShiny === true || response.shiny === true,
  };
}

export function parseAuto(response: unknown): UnderScriptAutoDisenchant | undefined {
  if (!isRecord(response)) return undefined;
  const ids = parseJson(response.cardsId);
  const shinies = parseJson(response.cardsShiny);
  const owned = parseJson(response.cardsQuantity);
  if (!Array.isArray(ids) || !Array.isArray(shinies) || !Array.isArray(owned)) return undefined;
  const cards = ids.flatMap((value: unknown, index) => {
    const id = toId(value);
    return id === undefined ? [] : [{ id, shiny: shinies[index] === true, owned: Number(owned[index]) }];
  });
  return { cards, dust: Number(response.dust) };
}

export function parseRejection(
  action: UnderScriptCraftAction,
  response: unknown,
  translate: (message: string) => unknown,
): UnderScriptCraftRejection {
  const body = isRecord(response) ? response : {};
  const status = typeof body.status === 'string' ? body.status : 'error';
  return { action, message: translateSafely(translate, body.message), status };
}
