type Items<T> = ArrayLike<T> & { forEach(callback: (item: T) => unknown): void };

type SearchOptions = {
  mutex?: (el: any) => any;
  single?: boolean;
};

function removeClass(el: Items<Element>, className: string): void {
  el.forEach((e) => e.classList.remove(className));
}

function containsText(el: Element, text: string): boolean;
function containsText(el: Items<any>, text: string, options?: SearchOptions): any;
function containsText(el: any, text: string, { mutex, single }: SearchOptions = {}): any {
  if (el.forEach) {
    const ret = [];
    for (let i = 0; i < el.length; i++) {
      const element = mutex ? mutex(el[i]) : el[i];
      if (~getText(element).indexOf(text)) {
        ret.push(element);
      }
    }
    return single ? ret[0] : ret;
  }
  return !!~(el.textContent || el.innerText).indexOf(text);
}
function getText(el: any): string {
  return el.value || el.textContent || el.innerText;
}
function setText<T extends Element>(el: T, text: string): T {
  const set = Object.getOwnPropertyDescriptor(el, 'textContent') ? 'textContent' : 'innerText';
  (el as any)[set] = text;
  return el;
}
function containsHTML(el: Element, text: string): boolean;
function containsHTML(el: Items<any>, text: string, options?: SearchOptions): any;
function containsHTML(el: any, text: string, { mutex, single }: SearchOptions = {}): any {
  if (el.forEach) {
    const ret = [];
    for (let i = 0; i < el.length; i++) {
      const element = mutex ? mutex(el[i]) : el[i];
      if (~element.innerHTML.indexOf(text)) {
        ret.push(element);
      }
    }
    return single ? ret[0] : ret;
  }
  return !!~el.innerHTML.indexOf(text);
}
function setHTML<T extends Element>(el: T, text: string): T {
  el.innerHTML = text;
  return el;
}
function getHTML(el: Element): string {
  return el.innerHTML;
}

export const text = {
  contains: containsText,
  set: setText,
  get: getText,
};

export const html = {
  contains: containsHTML,
  set: setHTML,
  get: getHTML,
};

export default {
  removeClass,
  text,
  html,
};
