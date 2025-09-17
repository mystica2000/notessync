export interface VectorSqlitePlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
  initialize(): Promise<{ result: boolean }>;
  insert(options: {
    content: string;
    embedding: any;
  }): Promise<{
    result: boolean;
  }>;
  query(options: { search: any }): Promise<any>;
  batchInsert(options: {
    content: string;
    embedding: any;
  }[]): Promise<{ result: boolean }>;
  getWithPagination(options: {
    limit: number;
    cursor?: number;
  }): Promise<{
    results: any[]
    nextCursor: number;
    hasMore: boolean
  }>;
}
