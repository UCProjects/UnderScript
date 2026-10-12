import type { Nullish } from 'src/types/utility';
import charCount from './charCount';
import eventManager from './eventManager';
import last from './last';

type StyleInput = string | ReadonlyArray<string>;

type StyleHandle = {
  remove(): StyleHandle;
  replace(...styles: StyleInput[]): StyleHandle;
  append(...styles: StyleInput[]): StyleHandle;
};

type StyleOwner = {
  name: string;
  logger?: { error(...args: unknown[]): unknown };
};

// Custom CSS classes are great.
export function newStyle(plugin: Nullish<StyleOwner> | false = false) {
  let loaded = false;
  const el = document.createElement('style');
  function appendStyle() {
    if (el.parentElement) return;
    if (plugin) el.dataset.underscriptPlugin = plugin.name;
    else el.dataset.underscript = '';
    document.head.append(el);
  }
  eventManager.on(':preload', () => {
    loaded = true;
  });

  function add(...styles: StyleInput[]): StyleHandle {
    const hasChildren = styles.length + el.children.length;
    if (hasChildren) {
      if (loaded) appendStyle();
      else eventManager.once(':preload', () => appendStyle());
    }
    return wrapper(append(styles));
  }

  function append(styles: StyleInput[] = [], nodes: ChildNode[] = []): ChildNode[] {
    styles.flat().forEach((s) => {
      if (charCount(s, '{') !== charCount(s, '}')) {
        const logger = (plugin ? plugin.logger : undefined) ?? console;
        logger.error('Malformed CSS (missing { or }):\n', s);
        return;
      }
      el.append(s);
      nodes.push(last(el.childNodes) as ChildNode);
    });
    return nodes;
  }

  function wrapper(nodes: ChildNode[] = []): StyleHandle {
    return {
      remove() {
        nodes.splice(0)
          .forEach((node) => node.remove());
        return this;
      },
      replace(...styles) {
        return this.remove().append(...styles);
      },
      append(...styles) {
        append(styles, nodes);
        return this;
      },
    };
  }

  return {
    add,
  };
}

export default newStyle();
