import eventManager from 'src/utils/eventManager';
import addMenuButton from 'src/utils/menubuttons';

eventManager.on(':load', () => {
  addMenuButton(`<img src="images/social/discord.png" style="height: 16px;"> Discord`, 'https://discord.gg/D8DFvrU');
});
