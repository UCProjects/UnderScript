import eventManager from 'src/utils/eventManager';
import * as settings from 'src/utils/settings/index';
import onPage from 'src/utils/onPage';
import * as hover from 'src/utils/hover';
import Translation from 'src/structures/constants/translation';

settings.register({
  name: Translation.Setting('friend.decline'),
  key: 'underscript.disable.declineAll',
  refresh: true,
  page: 'Friends',
});

onPage('Friends', function groupButtons() {
  eventManager.on('jQuery', () => {
    if (settings.value('underscript.disable.declineAll')) return;
    const declineAll = $('<span>');
    const container = $('p:contains("Friend requests")').append(' ', declineAll).parent();
    declineAll.text(' ')
      .addClass('glyphicon glyphicon-remove red')
      .css({
        cursor: 'pointer',
      })
      .hover(hover.show(Translation.General('friend.decline')))
      .click(() => {
        container.find('a[href^="Friends?delete="]').each(function declineFriend() {
          eventManager.emit('friendAction', $(this));
        });
      });
  });
});
