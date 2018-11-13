const settings = (() => {
  $('head').append(`<style type="text/css">.mono .modal-body { font-family: monospace; }</style>`);
  const settingReg = {
    // key: setting
  };
  const configs = {};
  let dialog = null;

  function init(page) {
    if (!configs.hasOwnProperty(page)) {
      configs[page] = {
        name: page === 'main' ? 'UnderScript' : page,
        settings: {},
      };
    }
    return configs[page];
  }

  function createSetting(setting) {
    if (setting.hidden) return;
    const ret = $('<div>');
    const key = setting.key;
    const current = localStorage.getItem(key) || getDefault(setting);
    let el;
    if (setting.type === 'boolean') {
      el = $(`<input type="checkbox" >`)
        .prop('checked', !!current);
    } else if (setting.type === 'select') {
      el = $(`<select>`);
      setting.options.forEach((v) => {
        el.append(`<option value="${v}"${current === v ? ' selected' : ''}>${v}</option>`);
      });
    } else if (setting.type === 'remove') {
      el = $(`<input type="checkbox">`)
        .prop('checked', true);
    } else { // How to handle.
      return null;
    }
    el.attr({
      id: key,
    });
    el.on('change.script', (e) => {
      setting.onChange($(e.target));
    });
    const label = $(`<label for="${key}">`).html(setting.name);
    const disabled = (typeof setting.disabled === 'function' ? setting.disabled() : setting.disabled) === true;
    if (disabled) {
      el.prop('disabled', true);
      label.css({
        color: '#666',
        cursor: 'not-allowed',
      });
    }
    ret.append(el, ' ', label);
    if (!disabled && setting.note) {
      const note = typeof setting.note === 'function' ? setting.note() : setting.note;
      if (note) { // Functions can return null
        ret.hover(hover.show(note));
      }
    }
    return ret;
  }

  function getMessage(d) {
    const page = d.getData('page');
    const container = $('<div>');
    const pageSettings = configs[page].settings;
    fn.each(pageSettings, (data) => {
      container.append(createSetting(data));
    });
    return container;
  }

  function add(data) {
    if (!data) return false;
    const page = data.page || 'main';
    const setting = {
      page,
      key: data.key || data,
      name: data.name || setting.key,
      type: data.type || 'boolean',
      category: data.category, // TODO
      note: data.note,
      disabled: data.disabled,
      default: data.default,
      options: data.options,
      hidden: !!data.hidden,
    };
    const conf = init(page);
    if (conf.hasOwnProperty(setting.key)) {
      debug(`settings.add: ${setting.name} already registered`);
      return false;
    }
    setting.onChange = (el) => {
      let val = '';
      if (setting.type === 'boolean') {
        if (el.is(':checked')) val = '1';
        else val = false;
      } else if (setting.type === 'select') {
        val = el.val();
      } else if (setting.type === 'remove') {
        val = false;
        removeSetting(setting, el);
      } else {
        debug(`Unknown Setting Type: ${setting.type}`);
        return;
      }
      if (typeof data.onChange === 'function') {
        data.onChange(val, localStorage.getItem(setting.key));
      }
      if (val === false) {
        localStorage.removeItem(setting.key);
      } else {
        localStorage.setItem(setting.key, val);
      }
    };
    conf.settings[setting.key] = setting;
    if (!settingReg.hasOwnProperty(setting.key)) {
      settingReg[setting.key] = setting;
    }
    return true;
  }

  function buttons(page) {
    const buttons = [];
    fn.each(configs, ({ name }, key) => {
      if (key === page) return;
      buttons.push({
        label: name,
        action: (dialog) => {
          dialog.close();
          open(key);
        },
      });
    });
    buttons.push({
      label: 'Close',
      action: close,
    });
    return buttons;
  }

  function open(page = 'main') {
    if (typeof page !== 'string') throw new Error(`Attempted to open ${typeof page}`);
    const displayName = configs[page].name;
    BootstrapDialog.show({
      title: `UnderScript Configuration${page !== 'main' ? `: ${displayName}` : ''}`,
      message: getMessage,
      cssClass: 'mono',
      data: { page },
      buttons: buttons(page),
      onshown: (diag) => {
        dialog = diag;
      },
      onhidden: () => {
        dialog = null;
      },
    });
  }

  function setDisplayName(name, page = 'main') {
    if (name) {
      init(page).name = name;
      return true;
    }
    return false;
  }

  function close() {
    if (dialog) {
      dialog.close();
      dialog = null;
    }
  }

  function isOpen() {
    return dialog !== null;
  }

  function value(key) {
    const setting = settingReg[key];
    const val = localStorage.getItem(key);
    return val || getDefault(setting);
  }

  function getDefault(setting = {}) {
    if (setting.default) {
      if (setting.type === 'boolean') {
        return !!setting.default;
      }
      return setting.default;
    } else if (setting.type === 'select') {
      return setting.options[0];
    }
    return null;
  }

  function remove(key)  {
    const setting = settingReg[key];
    if (!setting) return;
    removeSetting(setting, $(`[id='${key}']`));
  }

  function removeSetting(setting, el) {
    const { key, page } = setting;
    localStorage.removeItem(key);
    // Remove references
    delete configs[page].settings[key];
    delete settingReg[key];
    // If we're on the setting screen, remove the setting
    if (el) {
      el.parent().remove();
    }
  }

  return {
    open, close, setDisplayName, isOpen, value, remove,
    register: add,
  };
})();
