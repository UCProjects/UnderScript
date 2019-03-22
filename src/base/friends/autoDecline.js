wrap(function autoDecline() {
  const disabled = settings.register({
    name: 'Disable',
    key: 'userscript.autodecline.disable',
    page: 'Friends',
    category: 'Auto Decline',
  });

  const silent = settings.register({
    name: 'Silent',
    key: 'underscript.autodecline.silent',
    default: true,
    page: 'Friends',
    category: 'Auto Decline',
  });

  const chat = settings.register({
    name: 'Include ignored chat users',
    key: 'underscript.autodecline.ignored',
    default: true,
    page: 'Friends',
    category: 'Auto Decline'
  });

  // Load blocked users
  fn.each(localStorage, (name, key) => {
    if (!key.startsWith('underscript.autodecline.user.')) return;
    register(key, name);
  });

  function register(key, name, set = false) {
    settings.register({
      key, name,
      type: 'remove',
      page: 'Friends',
      category: 'Auto Decline',
    });
    if (set) {
      localStorage.setItem(key, name);
    }
  }

  function post(id, name) {
    axios.get(`/Friends?delete=${id}`).then(() => {
      if (!name) return;
      const message = `Auto declined friend request from: ${name}`;
      debug(message);
      if (!silent.value()) {
        fn.toast(message);
      }
    }).catch(console.error);
  }

  function isBlocked(id) {
    return !!settings.value(`underscript.autodecline.user.${id}`);
  }

  function isIgnored(id) {
    return chat.value() && !!settings.value(`underscript.ignore.${id}`);
  }

  eventManager.on('preFriends:requests', function filter(requests) {
    if (disabled.value()) return;
    fn.each(requests, (name, id) => {
      if (isBlocked(id) || isIgnored(id)) {
        debug(`Blocking ${name}[${id}]`);
        delete requests[id];
        post(id, name);
      }
    });
  });

  // Add a way to block users
  onPage('Friends', function blockRequests() {
    eventManager.on('jQuery', () => {
      const block = $('<span class="material-icons md-light clickable">').css({
        'font-size': '14px',
      }).text('block');
      $('p:contains("Friend requests")').parent().find('li').each(function () {
        const el = $(this);
        const name = el.text().substring(0, el.text().lastIndexOf(' LV '));
        el.append(' ', block.clone().click(function () {
          hover.hide();
          const link = el.find('a:first').attr('href');
          const id = link.substring(link.indexOf('=') + 1);

          register(`underscript.autodecline.user.${id}`, name, true);
          post(id);
          el.find('a[href^="Friends?"]').remove();
          el.addClass('deleted');
          $(this).remove();
        }).hover(hover.show(`Block ${el.text().substring(0, name)}`)));
      });
    });
  })
});
