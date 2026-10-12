interface UnderScriptChatChannel {
  readonly type: 'public' | 'private';
  readonly id: string;
  readonly room: string;
}

interface UnderScriptChatGroup {
  readonly id: number | string;
  readonly name: string;
  readonly priority: number;
  readonly icon?: string;
}

interface UnderScriptChatUser {
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
}

interface UnderScriptChatMessage {
  readonly id: number | string;
  readonly channel: UnderScriptChatChannel;
  readonly author: UnderScriptChatUser;
  readonly text: string;
  readonly action: boolean;
  readonly rainbow: boolean;
  readonly deleted: boolean;
  readonly timestamp?: number;
  readonly raw: Readonly<Record<string, unknown>>;
}

interface UnderScriptChatEvents {
  message: [message: UnderScriptChatMessage];
  history: [history: { channel: UnderScriptChatChannel; messages: UnderScriptChatMessage[] }];
  connected: [];
  disconnected: [info: { code: number; reason: string }];
  reconnected: [];
  replaced: [];
}

interface UnderScriptChatState {
  readonly connected: boolean;
  readonly replaced: boolean;
}

interface UnderScriptChat extends UnderScriptChatState {
  on<K extends keyof UnderScriptChatEvents>(event: K, listener: (...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  once<K extends keyof UnderScriptChatEvents>(event: K, listener: (...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  off<K extends keyof UnderScriptChatEvents>(event: K, listener: (...args: UnderScriptChatEvents[K]) => unknown): UnderScriptChat;
  reconnect(): void;
  send(channel: UnderScriptChatChannel | string, text: string): boolean;
}

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
