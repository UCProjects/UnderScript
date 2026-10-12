type UnderScriptChatChannel = {
  readonly type: 'public' | 'private';
  readonly id: string;
  readonly room: string;
  /** The game's name key for a public room, such as `chat-roleplay`, and `undefined` for a private chat */
  readonly name?: string;
  /** Whether this chat's window is open right now */
  readonly open: boolean;
};

type UnderScriptChatGroup = {
  readonly id: number | string;
  readonly name: string;
  readonly priority: number;
  readonly icon?: string;
};

type UnderScriptChatUser = {
  readonly id: number | string;
  readonly name: string;
  readonly avatar?: { readonly image: string; readonly rarity: string };
  readonly shinyAvatar: boolean;
  readonly division: string;
  readonly mainGroup?: UnderScriptChatGroup;
  readonly groups: readonly UnderScriptChatGroup[];
  readonly isStaff: boolean;
  readonly isMod: boolean;
  readonly raw: Readonly<Record<string, unknown>>;
};

type UnderScriptChatMessage = {
  readonly id: number | string;
  readonly channel: UnderScriptChatChannel;
  readonly author: UnderScriptChatUser;
  readonly text: string;
  /** A message that starts with `:me:`, which the game shows as an action line ("* name text") */
  readonly emote: boolean;
  readonly rainbow: boolean;
  readonly deleted: boolean;
  readonly timestamp?: number;
  readonly raw: Readonly<Record<string, unknown>>;
  /** The message's element in its chat window, or `null` while that window is closed */
  readonly element: HTMLElement | null;
  /** Replaces what is shown for this message, as plain text unless `html` is set. Returns `false` when it is not on screen */
  display(text: string, options?: { html?: boolean }): boolean;
  /** Puts back what the game rendered. Returns `false` if nothing was changed */
  restore(): boolean;
};

type UnderScriptChatNotice = {
  /** Where it came from: `info` (a gray line), `auto` (a yellow announcement), `broadcast`, `error` (a red line) or `denied` (an error dialog) */
  readonly kind: 'info' | 'auto' | 'broadcast' | 'error' | 'denied';
  /** The translation key the server sent, when it sent one */
  readonly key?: string;
  /** The arguments that go with `key` */
  readonly args: readonly unknown[];
  /** What the game shows, translated into the player's language */
  readonly text: string;
  /** For `auto`: what happened, such as `legendary-drop` */
  readonly type?: string;
  /** For `auto`: the user it is about */
  readonly userId?: number | string;
  readonly raw: Readonly<Record<string, unknown>>;
};

type UnderScriptChatEvents = {
  /** Before the game handles a message. Set `this.canceled = true` to stop it being shown or stored. `message.element` is `null` here */
  preMessage: [message: UnderScriptChatMessage];
  message: [message: UnderScriptChatMessage];
  history: [history: { channel: UnderScriptChatChannel; messages: UnderScriptChatMessage[] }];
  /** A system line from the server: info, an announcement or a broadcast */
  notice: [notice: UnderScriptChatNotice];
  /** The server refused or failed something you tried. Nothing is sent for every refusal, some are dropped silently */
  rejected: [notice: UnderScriptChatNotice];
  connected: [];
  disconnected: [info: { code: number; reason: string }];
  reconnected: [];
  replaced: [];
};

type UnderScriptChatState = {
  readonly connected: boolean;
  readonly replaced: boolean;
};

type UnderScriptChat = UnderScriptChatState & {
  on<K extends keyof UnderScriptChatEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  once<K extends keyof UnderScriptChatEvents>(event: K, listener: (this: UnderScriptEventMeta, ...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  off<K extends keyof UnderScriptChatEvents>(event: K, listener: (...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  reconnect(): void;
  send(channel: UnderScriptChatChannel | string, text: string): boolean;
};

interface UnderScriptAPI {
  readonly chat: UnderScriptChatState;
}

interface UnderScriptPlugin {
  readonly chat: Readonly<UnderScriptChat>;
}

interface UnderScriptEvents {
  'ChatDetected': [];
  'Chat:Connected': [];
  'Chat:Disconnected': [];
  'Chat:Reconnected': [];
  'Chat:focused': [data: unknown];
  'Chat:unfocused': [data: unknown];
  'Chat:getHistory': [data: unknown];
  'preChat:getHistory': [data: unknown];
  'Chat:send': [data: unknown];
  'Chat:command': [data: unknown];
  'ChatMessage': [data: unknown];
  'preChatMessage': [data: unknown];
  'preChat:getMessageAuto': [data: { message: string }];
}

interface UnderScriptEventFamilies {
  chat: { pattern: `Chat:${string}`; args: [data: unknown] };
  preChat: { pattern: `preChat:${string}`; args: [data: unknown] };
  custom: { pattern: `Custom:${string}`; args: [data: unknown] };
  preCustom: { pattern: `preCustom:${string}`; args: [data: unknown] };
}
