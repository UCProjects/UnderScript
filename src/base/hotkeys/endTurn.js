settings.register({
  name: 'Disable End Turn Hotkey',
  key: 'underscript.disable.endTurn',
  page: 'Game',
});
settings.register({
  name: 'Disable End Turn with Space',
  key: 'underscript.disable.endTurn.space',
  disabled: () => settings.value('underscript.disable.endTurn'),
  refresh: () => typeof gameId !== 'undefined',
  page: 'Game',
});
settings.register({
  name: 'Disable End Turn with Middle Click',
  key: 'underscript.disable.endTurn.middleClick',
  disabled: () => settings.value('underscript.disable.endTurn'),
  refresh: () => typeof gameId !== 'undefined',
  page: 'Game',
});

eventManager.on('PlayingGame', function bindHotkeys() {
  // Binds to Space, Middle Click
  const hotkey = new Hotkey('End turn').run((e) => {
    if (settings.value('underscript.disable.endTurn')) return;
    if (!$(e.target).is('#endTurnBtn') && global('userTurn') === global('userId')) global('endTurn')();
  });
  if (!settings.value('underscript.disable.endTurn.space')) {
    hotkey.bindKey(32);
  }
  if (!settings.value('underscript.disable.endTurn.middleClick')) {
    hotkey.bindClick(2);
  }
  hotkeys.push(hotkey);
});
