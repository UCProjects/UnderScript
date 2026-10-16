type UnderScriptCommandHandler = (this: UnderScriptEventMeta, command: UnderScriptChatCommand) => unknown;

type UnderScriptCommandOptions = {
  command: string;
  description?: string;
  usage?: string;
  icon?: string;
  enabled?(): boolean;
  handler?: UnderScriptCommandHandler;
};

type UnderScriptCommandHandle = {
  remove(): boolean;
};

type UnderScriptCommands = {
  register(options: UnderScriptCommandOptions): UnderScriptCommandHandle;
};

interface UnderScriptPlugin {
  readonly commands: Readonly<UnderScriptCommands>;
}
