wrap(() => {
  const name = 'settings';
  function add(plugin) {
    const prefix = `underscript.plugin.${plugin.name}`;

    return (data = {}) => {
      if (!data.key) throw new Error('Key must be provided');

      const setting = {
        ...data,
        key: `${prefix}.${data.key}`,
        name: data.name || data.key,
        page: 'Plugins',
        category: plugin.name,
      };
      return settings.register(setting);
    };
  }

  function mod(plugin) {
    const obj = {
      add: add(plugin),
      on: (...args) => settings.on(...args),
      isOpen: () => settings.isOpen(),
    };
    return () => obj;
  }

  registerModule(name, mod);
});
