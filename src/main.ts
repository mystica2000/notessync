import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { SafeArea } from '@capacitor-community/safe-area';

SafeArea.enable({
  config: {
    customColorsForSystemBars: true,
    statusBarColor: '#00000000', // transparent
    statusBarContent: 'dark',
    navigationBarColor: '#00000000', // transparent
    navigationBarContent: 'dark',
  },
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
