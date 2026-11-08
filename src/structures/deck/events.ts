import eventEmitter from 'src/utils/eventEmitter';

type Id = number | string;

export type DeckChange = {
  readonly soul: string | undefined;
  readonly action: string;
  readonly id?: Id;
  readonly shiny?: boolean;
};

export type DecksEvents = {
  changed: [change: DeckChange];
};

export default eventEmitter<DecksEvents>();
