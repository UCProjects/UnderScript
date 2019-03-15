onPage('Decks', function () {
  debug('Deck editor');
  eventManager.on('jQuery', () => {
    $(document).ajaxSuccess((event, xhr, options) => {
      if (options.url !== 'DecksConfig' || !options.data) return;
      const data = JSON.parse(options.data);
      eventManager.emit('Deck:Change', data, options, xhr);
      eventManager.emit(`Deck:${data.action}`, data, options, xhr);
    });
    $(document).ajaxComplete((event, xhr, options) => {
      if (options.url !== 'DecksConfig') return;
      if (options.type === 'GET') {
        eventManager.emit('Deck:Loaded', xhr.responseJSON);
        return;
      }
      const data = JSON.parse(options.data);
      eventManager.emit('Deck:postChange', data, options, xhr);
      eventManager.emit(`Deck:${data.action}`, data, options, xhr);
    });
    // Class change
    $('#selectClasses').change(function () {
      // Sometimes it takes too long, so lets change it now
      classe = $(this).val();
      eventManager.emit('Deck:Soul');
    });
  });
});
