import eventManager from 'src/utils/eventManager';

// Attempt to detect jQuery
eventManager.on(':preload', () => {
  if (typeof jQuery === 'undefined') return;
  eventManager.emit({ singleton: true }, 'jQuery', jQuery);
});
