import * as settings from 'src/utils/settings/index';
import { registeredFlags } from 'src/utils/debugFlags';
import debugMode from './debugMode';

if (debugMode.value()) {
  registeredFlags().forEach(({ key, description }) => {
    settings.register({
      key,
      description,
      page: 'Debug',
      export: false,
      remove: true,
    });
  });
}
