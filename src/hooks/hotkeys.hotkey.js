eventManager.on(':loaded', function always() {
  // Bind hotkey listeners
  document.addEventListener('mouseup', (event) => {
    // if (false) return; // TODO: Check for clicking in chat
    hotkeys.forEach((v) => {
      if (v.clickbound(event.which)) {
        v.run(event);
      }
    });
  });
  document.addEventListener('keyup', (event) => {
    // TODO: possibly doesn't work in firefox
    if (event.target.tagName === 'INPUT') return; // We don't want to listen while typing in chat (maybe listen for F-keys?)
    hotkeys.forEach((v) => {
      if (v.keybound(event.which)) {
        v.run(event);
      }
    });
  });
});
