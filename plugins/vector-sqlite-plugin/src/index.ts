import { registerPlugin } from '@capacitor/core';

import type { VectorSqlitePlugin } from './definitions';

const VectorSqlite = registerPlugin<VectorSqlitePlugin>('VectorSqlite', {
  web: () => import('./web').then((m) => new m.VectorSqliteWeb()),
});

export * from './definitions';
export { VectorSqlite };
