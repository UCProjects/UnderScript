import compound from 'src/utils/compoundEvent';
import eventManager from 'src/utils/eventManager';

// Call "ready" when all critical assets are loaded
compound(
  // translation:underscript is triggered after `:preload` and `translation:loaded`
  'translation:underscript',
  () => eventManager.emit({ singleton: true }, 'underscript:ready'),
);
