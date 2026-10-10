import type { DebugFlag } from './debugFlags';
import { toast } from './2.toasts';
import addToastClass from './toastClass';
import { enabled } from './debug';
import { general } from './debugFlags';

type DebugToastOptions = {
  className?: Parameters<typeof addToastClass>[0];
} & Record<string, unknown>;

export default function debugToast(arg: string | DebugToastOptions, flag: DebugFlag = general) {
  if (!enabled(flag)) return false;
  const options = typeof arg === 'string' ? { text: arg } as DebugToastOptions : arg;
  return toast({ ...options, className: addToastClass(options.className, 'underscript-toast-inherit') });
}
