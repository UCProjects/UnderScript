export type GameCommands = {
  attack: {
    idMonster: string;
    idTarget: string;
  };
  effectTarget: {
    idTarget: string;
  };
  endTurn: Record<never, never>;
  mulligan: {
    ids: string[];
  };
  playMonster: {
    id: string;
    x: string;
  };
  playSpell: {
    id: string;
  };
  surrender: Record<never, never>;
};

export type GameCommand = {
  [A in keyof GameCommands]: { action: A } & GameCommands[A];
}[keyof GameCommands];
