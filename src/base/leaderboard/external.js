import eventManager from 'src/utils/eventManager';
import addMenuButton from 'src/utils/menubuttons';
import addFooterLink from 'src/utils/footerlinks';

const url = 'https://ucprojects.github.io/Leaderboard/';

eventManager.on('jQuery', () => {
  addFooterLink(
    $('a[href$="friendshipLeaderboard.jsp"]').first(),
    `<a href="${url}" target="_blank" rel="noreferrer"><span>Leaderboard+</span></a>`,
  );
});

eventManager.on(':load', () => {
  addMenuButton(`Leaderboard+`, url);
});
