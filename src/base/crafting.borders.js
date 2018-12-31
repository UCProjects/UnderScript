onPage('Crafting', function craftableCards() {
  style.add(
    '.craftable { box-shadow: 0 0 10px 2px #008000; transform: translate3d(0,0,0); }',
    '.craftable td { border-color: #00cc00; }',
  );

  function highlight(el) {
    const rarity = cardHelper.rarity(el);
    const set = rarity !== 'DETERMINATION' &&
        cardHelper.craft.quantity(el) < cardHelper.craft.max(rarity) &&
        cardHelper.craft.cost(el) <= cardHelper.craft.totalDust();
    el.classList.toggle('craftable', set);
  }

  function highlightCards() {
    document.querySelectorAll('table.cardBoard').forEach(highlight);
  }

  /* This works, but... need to check if we can still afford the other cards
  eventManager.on('craftcard', ({id, shiny}) => {
    highlight(cardHelper.find(id, shiny));
  });
  // */
  eventManager.on('load craftcard', highlightCards);
});