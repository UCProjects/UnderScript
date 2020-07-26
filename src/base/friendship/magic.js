wrap(() => {
  const setting = settings.register({
    name: 'Disable Friendship Notification',
    key: 'underscript.disable.friendship.notification',
    page: 'Library',
    category: 'Friendship',
  });

  const max = 200 / 5; // Limit level 200

  function getFriendship() {
    if (setting.value()) return;
    axios.get('/FriendshipConfig').then((resp) => {
      const items = JSON.parse(resp.data.friendshipItems)
        .filter((item) => {
          const lvl = fn.getLevel(item.xp);
          return lvl > 0 && item.claim < Math.min(Math.floor(lvl / 5), max);
        }).map((item) => $.i18n(`card-name-${item.idCard}`, 1));

      if (!items.length) return;

      fn.toast({
        title: 'Pending Friendship Rewards',
        text: `- ${items.join('\n- ')}`,
        className: 'dismissable',
        buttons: {
          text: 'Go now!',
          className: 'dismiss',
          css: {
            border: '',
            height: '',
            background: '',
            'font-size': '',
            margin: '',
            'border-radius': '',
          },
          onclick: (e) => {
            location.href = '/Friendship';
          },
        },
      });
    });
  }

  eventManager.on('getVictory getDefeat', getFriendship);
});
