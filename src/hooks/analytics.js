// This setting doesn't do anything, nor does the detection work.
settings.register({
  name: 'Send anonymous statistics',
  key: 'underscript.analytics',
  default: window.GoogleAnalyticsObject !== undefined,
  enabled: window.GoogleAnalyticsObject !== undefined,
  hidden: true,
  note: () => {
    if (window.GoogleAnalyticsObject === undefined) {
      return 'Analytics has been disabled by your adblocker.';
    }
  },
});

const analytics = wrap(() => {
  const config = {
    'app_name': 'underscript',
    'app_version': scriptVersion,
    'version': scriptVersion,
    'handler': GM_info.scriptHandler,
    'anonymize_ip': true, // I don't care about IP addresses, don't track this
    'custom_map': {
      'dimension1': 'version',
    },
  };
  if (sessionStorage.getItem('UserID')) {
    // This gives me a truer user count, by joining all hits from the same user together
    config['user_id'] = sessionStorage.getItem('UserID');
  }
  window.dataLayer = window.dataLayer || [];
  gtag('js', new Date());
  gtag('config', 'UA-38424623-4', config);

  function gtag() {
    dataLayer.push(arguments);
  }
  function send(...args) {
    if (!args.length) return;
    gtag('event', ...args);
  }
  function error(description, fatal = false) {
    send('exception', {description, fatal})
  }
  return {
    send, error,
  };
});
