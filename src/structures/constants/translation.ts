import { translateText } from 'src/utils/translate.js';
import Constant from './constant.js';

export type Tuple<T, N extends number, A extends any[] = []> = A extends { length: N } ? A : Tuple<T, N, [T, ...A]>;

export type TranslationWithArgsOptions<N extends number> = TranslationOptions & {
  args: Tuple<string, N>;
};

export type TranslationOptions = {
  args?: string[];
  fallback?: string;
  prefix?: string | null;
};

export interface TranslationBase {
  readonly key: string;
  toString(): string;
  translate(...args: string[]): string;
  withArgs<N extends number>(...args: string[]): TranslationWithArgs<N>;
}

export interface TranslationNamespace {
  (key: string, fallback?: string): Translation;
  <N extends number>(key: string, args: N): TranslationWithArgs<N>;
}

export interface TranslationWithArgs<N extends number> extends TranslationBase {
  translate(...arg: Tuple<string, N>): string;
  withArgs(...arg: Tuple<String, N>): TranslationWithArgs<N>;
  withArgs<T extends number = N>(...arg: Tuple<String, T>): TranslationWithArgs<T>;
}

export default class Translation extends Constant implements TranslationBase {
  private static namespace(prefix: string, options?: TranslationOptions, transform?: (key: string) => string): TranslationNamespace {
    return ((key: string, text?: string | number) => new Translation(
      transform ? transform(key) : `${prefix}${key}`,
      { ...options, fallback: typeof text === 'string' ? text : undefined },
    )) as TranslationNamespace;
  }

  static General = this.namespace('general.');

  static Command = this.namespace('command.');

  static Menu = this.namespace('menu.');

  static Setting = this.namespace('settings.');

  static Toast = this.namespace('toast.');

  static Vanilla = this.namespace('', { prefix: null }, (key) => key.toLowerCase());

  static DISMISS = this.General('dismiss', 'Dismiss');
  static ERROR = this.General('error', 'Error');
  static OPEN = this.General('open', 'Open');
  static PURCHASE = this.General('purchase.item');
  static UNDO = this.General('undo', 'Undo');
  static UNKNOWN = this.General('unknown', 'Unknown');
  static UPDATE = this.General('update', 'Update');

  static CATEGORY_AUTO_DECLINE = this.Setting('category.autodecline');
  static CATEGORY_BOARD_BACKGROUND = this.Setting('category.board.background');
  static CATEGORY_CARD_SKINS = this.Setting('category.card.skins');
  static CATEGORY_CHAT_COMMAND = this.Setting('category.chat.commands');
  static CATEGORY_CHAT_IGNORED = this.Setting('category.chat.ignored');
  static CATEGORY_CHAT_IMPORT = this.Setting('category.chat.import');
  static CATEGORY_CUSTOM = this.Setting('category.custom');
  static CATEGORY_FRIENDSHIP = this.Setting('category.friendship');
  static CATEGORY_GAME_EMOTES = this.Setting('category.game.emotes');
  static CATEGORY_HOME = this.Setting('category.home');
  static CATEGORY_HOTKEYS = this.Setting('category.hotkeys');
  static CATEGORY_LIBRARY_CRAFTING = this.Setting('category.library.crafting');
  static CATEGORY_MINIGAMES = this.Setting('category.minigames');
  static CATEGORY_NOTIFICATIONS = this.Setting('category.notifications');
  static CATEGORY_OUTLINE = this.Setting('category.outline');
  static CATEGORY_PLUGINS = this.Setting('category.plugins');
  static CATEGORY_STREAMER = this.Setting('category.streamer');
  static CATEGORY_UPDATES = this.Setting('category.updates');

  static DISABLE_COMMAND_SETTING = this.Setting('command', 1);

  static IGNORED = this.Toast('ignore', 1);
  static INFO = this.Toast('info', 'Did you know?');

  static CANCEL = this.Vanilla('dialog-cancel', 'Cancel');
  static CLOSE = this.Vanilla('dialog-close', 'Close');
  static CONTINUE = this.Vanilla('dialog-continue', 'Continue');

  private args: string[];
  private fallback?: string;

  constructor(key: string, {
    args = [],
    fallback,
    prefix = 'underscript',
  }: TranslationOptions = {}) {
    if (prefix) {
      super(`${prefix}.${key}`);
    } else {
      super(key);
    }
    this.args = args;
    this.fallback = fallback;
  }

  get key(): string {
    return this.valueOf();
  }

  translate(...args: string[]): string {
    return translateText(this.key, {
      args: args.length ? args : this.args,
      fallback: this.fallback,
    });
  }

  withArgs<N extends number>(...args: Tuple<string, N>): TranslationWithArgs<N> {
    return new Translation(this.key, {
      args,
      prefix: null,
    });
  }

  toString() {
    return this.translate();
  }
}
