settings.register({
  name: 'Disable Ignore Chat',
  key: 'underscript.disable.ignorechat',
  page: 'ignorelist',
});

settings.register({
  name: 'Ignore Behavior',
  key: 'underscript.ignorechat.how',
  type: 'select',
  options: ['remove', 'bulk', 'hide'],
  page: 'ignorelist',
  disabled: true,
  hidden: true,
});

fn.each(localStorage, (name, key) => {
  if (!key.startsWith('underscript.ignore.')) return;
  settings.register({
    key, name,
    type: 'remove',
    page: 'ignorelist',
    category: 'Users',
  });
});

settings.setDisplayName('Ignore List', 'ignorelist');
