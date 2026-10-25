type UnderScriptCardStatus = {
  name: string;
  counter: number;
  displayCounter: boolean;
  statusType: string;
  statusBehavior: string;
};

type UnderScriptStatusCard = {
  id: number;
  statuses: UnderScriptCardStatus[];
  [key: string]: unknown;
};

type UnderScriptStatusChanges = {
  added: UnderScriptCardStatus[];
  removed: UnderScriptCardStatus[];
  changed: Array<{ status: UnderScriptCardStatus; previous: UnderScriptCardStatus }>;
};

interface UnderScriptEvents {
  'GameStart': [];
  'PlayingGame': [];
  'GameEvent': [data: unknown];
  'PreGameEvent': [data: unknown];
  'Play:Message': [data: unknown];
  'Card:Statuses': [card: UnderScriptStatusCard, element: JQuery, changes: UnderScriptStatusChanges];
  'player:endTurn': [];
  'enterCustom': [];
  'closeQueues': [message: string];
  'Rankings:init': [];
  'Rankings:selectPage': [value: unknown];
}

interface UnderScriptEventFamilies {
  log: { pattern: `Log:${string}`; args: [log: unknown] };
  pre: { pattern: `pre:${string}`; args: [data: unknown] };
  func: { pattern: `func:${string}`; args: any[] };
  preFunc: { pattern: `pre:func:${string}`; args: any[] };
  before: { pattern: `${string}:before`; args: [data: unknown] };
}
