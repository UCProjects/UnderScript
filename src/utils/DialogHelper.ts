import Translation from 'src/structures/constants/translation';
import eventEmitter from './eventEmitter';
import style from './style';
import styles from './dialog.css';

style.add(styles);

type Listener = (this: UnderScriptEventMeta, ...args: any[]) => unknown;

export default class DialogHelper {
  #instance: UnderScriptRealizedDialog | null | undefined;

  #events = eventEmitter();

  isOpen(): boolean {
    return !!this.#instance;
  }

  open({
    buttons = [],
    cssClass = 'underscript-dialog',
    message,
    title,
    ...options
  }: UnderScriptDialogOptions = BootstrapDialog.defaultOptions): void {
    if (this.isOpen() || !message || !title) return;
    BootstrapDialog.show({
      ...options,
      title,
      message,
      buttons: [
        ...buttons,
        {
          cssClass: 'btn-primary',
          label: `${Translation.CLOSE}`,
          action: () => this.close(),
        },
      ],
      cssClass: `mono ${cssClass}`,
      onshown: (diag) => {
        this.#instance = diag;
        this.#events.emit('open', diag);
      },
      onhidden: () => {
        this.#instance = null;
        this.#events.emit('close');
      },
    });
  }

  close(): void {
    this.#instance?.close();
  }

  onClose(callback: Listener): void {
    this.#events.on('close', callback);
  }

  onceClose(callback: Listener): void {
    this.#events.once('close', callback);
  }

  onOpen(callback: Listener): void {
    this.#events.on('open', callback);
  }

  onceOpen(callback: Listener): void {
    this.#events.once('open', callback);
  }

  appendButton(...buttons: UnderScriptDialogButton[]): void {
    const diag = this.#instance;
    if (!diag) return;

    diag.options.buttons!.push(...buttons);
    diag.updateButtons();
  }

  prependButton(...buttons: UnderScriptDialogButton[]): void {
    const diag = this.#instance;
    if (!diag) return;

    diag.options.buttons!.unshift(...buttons);
    diag.updateButtons();
  }
}
