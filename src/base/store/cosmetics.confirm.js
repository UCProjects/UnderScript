import eventManager from 'src/utils/eventManager';
import * as hover from 'src/utils/hover';
import wrap from 'src/utils/2.pokemon';
import Translation from 'src/structures/constants/translation';

wrap(() => {
  eventManager.on(':preload:CosmeticsShop', () => {
    $('form.cosmetic-purchase button[type="submit"]')
      .hover(hover.show(Translation.General('bypass.shift')), hover.hide)
      .click(function click(e) {
        if (!e.shiftKey) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        $(e.currentTarget).closest('form')[0].submit();
      });
  });
});
