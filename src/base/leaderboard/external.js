import eventManager from 'src/utils/eventManager';
import addMenuButton from 'src/utils/menubuttons';

eventManager.on(':load', () => {
  addMenuButton(`Leaderboard+`, 'https://ucprojects.github.io/Leaderboard/');
});
