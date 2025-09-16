/// <reference types="@capacitor-community/safe-area" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.embeddings.vector',
  appName: 'vectorEmbeddingsOffline',
  webDir: 'dist/vector-embeddings-app/browser',
  plugins: {
    Keyboard: {
      resizeOnFullScreen: false
    },
    VectorSqlite: {

    }
  }
};

export default config;
