import { WebPlugin } from '@capacitor/core';

import type { VectorSqlitePlugin } from './definitions';

export class VectorSqliteWeb extends WebPlugin implements VectorSqlitePlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }

  async initialize(): Promise<{ result: boolean; }> {
    throw this.unimplemented("Not available for web");
  }

  async insert(_: {
    content: string;
    embedding: any;
  }): Promise<{ result: boolean; }> {
    throw this.unimplemented("Not available for web");
  }

  async query(_: { search: any }): Promise<any> {
    throw this.unimplemented("Not available for web");
  }

  async batchInsert(_: {
    content: string;
    embedding: any;
  }[]): Promise<{ result: boolean; }> {
    throw this.unimplemented("Not available for web");
  }

  async getWithPagination(_: { limit: number; cursor?: number; }): Promise<{ results: any[]; nextCursor: number; hasMore: boolean; }> {
    throw this.unimplemented("Not available for web");
  }

}
