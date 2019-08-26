settings.register({
  name: 'Disable Quick Opening Packs',
  key: 'underscript.disable.packOpening',
  refresh: () => onPage('Packs'),
});

onPage('Packs', function quickOpenPack() {
  if (settings.value('underscript.disable.packOpening')) return;
  eventManager.on('jQuery', () => {
    const rarity = [ 'DETERMINATION', 'LEGENDARY', 'EPIC', 'RARE', 'COMMON' ];
    const results = {};
    function clearResults() {
      results.packs = 0;
      results.shiny = 0;
      rarity.forEach((key) => results[key] = {});
    }
    function showCards() {
      $('.slot .cardBack').each((i, e) => { show(e, i); });
    }
    clearResults(); // Build once
    let autoOpen = false, openAll = false;
    $(document).ajaxComplete((event, xhr, settings) => {
      if (settings.url !== 'PacksConfig' || !settings.data) return;
      const data = JSON.parse(settings.data);
      if (data.status || xhr.responseJSON.action !== 'getCards') return;
      if (openAll !== false) {
        results.packs += 1;
        JSON.parse(xhr.responseJSON.cards).forEach((card) => {
          const result = results[card.rarity] = results[card.rarity] || {};
          const c = result[card.name] = result[card.name] || { total:0, shiny:0 }
          c.total += 1;
          if (card.shiny) {
            if (data.action !== 'openShinyPack') {
              results.shiny += 1;
            }
            c.shiny += 1;
          }
        });
        openAll -= 1;
        if (openAll === 0) {
          openAll = false;
          let text = '';
          let total = 0;
          // Magic numbers, yep. Have between 6...26 cards showing
          let limit = Math.min(Math.max(Math.floor(window.innerHeight / 38), 6), 26);
          // Increase the limit if we don't have a specific rarity
          rarity.forEach((key) => {
            if (!Object.keys(results[key]).length) {
              limit += 1;
            }
          });

          // Display results
          rarity.forEach((key) => {
            const keys = Object.keys(results[key]);
            if (!keys.length) return;
            const buffer = [];
            let count = 0;
            let shiny = 0;
            keys.forEach((name) => {
              const card = results[key][name];
              count += card.total;
              shiny += card.shiny;
              if (limit) {
                limit -= 1;
                buffer.push(`${card.shiny?'<span class="yellow">S</span> ':''}${name}${card.total > 1 ? ` (${card.total}${card.shiny?'':''})` : ''}${limit ? '' : '...'}`);
              }
            });
            total += count;
            text += `${key} (${count}${shiny?`, ${shiny} shiny`:''}):${buffer.length ? `\n- ${buffer.join('\n- ')}` : ' ...'}\n`;
          });
          fn.toast({
            text,
            title: `Results: ${results.packs} Packs${results.shiny?` (${total%4?`${total}, `:''}${results.shiny} shiny)`:total%4?` (${total})`:''}`,
            css: {'font-family': 'inherit'},
          });
          showCards();
        }
      } else if (autoOpen) {
        showCards();
      }
    });
    $('[id^="btnOpen"]').on('click.script', (event) => {
      autoOpen = event.ctrlKey;
      openAll = false;
      const type = $(event.target).prop('id').substring(7);
      const count = parseInt($(`#nb${type}Packs`).text());
      if (event.shiftKey) {
        clearResults();
        openAll = count;
        for (let i = 1; i < count; i++) { // Start at 1, we've "opened" a pack already
          canOpen = true;
          openPack(`open${type}Pack`);
        }
        hover.hide();
      } else if (count === 1) { // Last pack?
        hover.hide();
      }
    }).on('mouseenter.script', hover.show(`<span style="font-style: italic;">
        * CTRL Click to auto reveal one pack<br />
        * Shift Click to auto open ALL packs
      </span>`)).on('mouseleave.script', hover.hide);
  });
});
