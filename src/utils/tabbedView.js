import style from './style.js';
import styles from './tabbedView.css';

style.add(styles);

let groupID = 0;

export default function TabManager() {
  const group = groupID;
  groupID += 1;
  const tabs = [];
  const tabSettings = {
    left: false,
    right: false,
  };

  const view = document.createElement('div');
  view.classList.add('tabbedView');

  function addTab(name = '', content = '', { fold = false } = {}) {
    const id = tabs.length ? tabs[tabs.length - 1].id + 1 : 0;
    const elements = newTab(`${group}-${id}`, group);
    const [button, label, container] = elements;

    const tab = {
      id,
      elements,
      content,
      fold,
      // Set first tab as active by default
      active: tabs.length === 0,
      dirty: true,
    };

    tabs.push(tab);

    function setName(value = name) {
      label.textContent = value;
    }

    function setContent(value = content) {
      tab.content = value;
      refresh();
      if (typeof value === 'string') {
        container.innerHTML = value;
      }
    }

    function setEnd(value = false) {
      label.classList.toggle('end', value === true);
    }

    function setActive() {
      if (tab.active) return;
      tabs.forEach((t) => t.active = false);
      tab.active = true;
      refresh();
      button.checked = true;
    }

    function refresh() {
      tab.dirty = true;
    }

    // Initialize
    setName();
    setContent();
    setEnd();

    const wrapper = {
      id,
      setName,
      setContent,
      setEnd,
      setActive,
      refresh,
    };

    Object.defineProperty(wrapper, 'active', {
      get() {
        return tab.active;
      },
      enumerable: true,
    });

    return wrapper;
  }

  function rowCount() {
    return tabs.reduce((count, { content }) => {
      const sub = typeof content?.render === 'function' ? content.tabCount : 0;
      return count + 1 + sub;
    }, 0);
  }

  function render(raw = false) {
    view.classList.toggle('left', tabSettings.left);
    view.classList.toggle('right', tabSettings.right);
    view.style.setProperty('--tab-count', rowCount());

    // Update content of tabs
    tabs.forEach((tab) => {
      const {
        elements: [button, label, content],
        active = false,
      } = tab;

      button.checked = active;

      if (!tab.dirty) return;
      tab.dirty = false;

      let value = tab.content;
      let nested = false;
      if (typeof value === 'function') {
        value = value();
      } else if (typeof value?.render === 'function') {
        nested = true;
        value = value.render(true);
      }
      content.classList.toggle('nested', nested && tab.fold);

      if (typeof value === 'string' && value) {
        content.innerHTML = value;
      } else if (value instanceof HTMLElement) {
        content.innerHTML = '';
        content.appendChild(value);
      } else {
        if (button.parentNode === view) {
          view.removeChild(button);
          view.removeChild(label);
          view.removeChild(content);
        }
        return;
      }

      view.appendChild(button);
      view.appendChild(label);
      view.appendChild(content);
    });

    const attached = tabs.filter(({ elements: [button] }) => button.parentNode === view);
    attached.forEach(({ elements: [button, label, content] }) => {
      view.append(button, label, content);
    });
    view.classList.toggle('single', attached.length === 1);

    if (attached.length && !attached.some((tab) => tab.active)) {
      tabs.forEach((tab) => { tab.active = false; });
      const [first] = attached;
      first.active = true;
      first.elements[0].checked = true;
    }

    if (raw) return view;
    return view.outerHTML;
  }

  function settings({
    left = false,
    right = false,
  }) {
    tabSettings.left = left;
    tabSettings.right = right;
  }

  function refreshAll() {
    tabs.forEach((tab) => {
      tab.dirty = true;
      if (typeof tab.content?.refresh === 'function') {
        tab.content.refresh();
      }
    });
  }

  return {
    addTab,
    render,
    settings,
    refresh: refreshAll,
    get tabCount() {
      return tabs.length;
    },
  };
}

function newTab(id = 0, group = 0) {
  const name = `tab${id}`;

  const button = document.createElement('input');
  button.id = name;
  button.type = 'radio';
  button.name = `view${group}`;
  button.classList.add('tabButton');

  const label = document.createElement('label');
  label.classList.add('tabLabel');
  label.htmlFor = name;

  const content = document.createElement('div');
  content.classList.add('tabContent');

  return [button, label, content];
}
