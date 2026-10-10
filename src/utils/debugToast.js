import { toast } from './2.toasts';
import addToastClass from './toastClass';
import { enabled } from './debug';
import { general } from './debugFlags';

/**
 * @param {string | object} arg
 * @param {import('./debugFlags').DebugFlag} [flag]
 */
export default function debugToast(arg, flag = general) {
  if (!enabled(flag)) return false;
  if (typeof arg === 'string') {
    arg = {
      text: arg,
    };
  }
  return toast({ ...arg, className: addToastClass(arg.className, 'underscript-toast-inherit') });
}
