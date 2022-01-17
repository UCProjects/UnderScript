wrap(function disableEmotes() {
  const baseSetting = {
    key: 'underscript.emotes.disable',
    page: 'Chat',
    category: 'Emotes',
  };
  const originalEmotes = [{
    id: 0,
    image: '',
    name: '',
    ucpCost: 0,
    code: '::',
  }];
  originalEmotes.shift();

  function init() {
    originalEmotes.push(...global('chatEmotes'));
    makeSettings();
    updateEmotes();
  }

  function makeSettings() {
    originalEmotes.forEach((emote) => {
      const setting = {
        ...baseSetting,
        name: `<img height="32px" src="images/emotes/${emote.image}.png"/> Disable ${emote.name}`,
        onChange: updateEmotes,
      };
      setting.key += `.${emote.id}`;
      settings.register(setting);
    });
  }

  function updateEmotes() {
    const filtered = originalEmotes.filter(({ id }) => !settings.value(`${baseSetting.key}.${id}`));
    globalSet('chatEmotes', filtered);
  }

  eventManager.on('Chat:Connected', init);
});
