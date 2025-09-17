# vector-sqlite-plugin

sqlite vector extension

## Install

```bash
npm install vector-sqlite-plugin
npx cap sync
```

## API

<docgen-index>

* [`echo(...)`](#echo)
* [`initialize()`](#initialize)
* [`insert(...)`](#insert)
* [`query(...)`](#query)
* [`batchInsert(...)`](#batchinsert)
* [`getWithPagination(...)`](#getwithpagination)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### echo(...)

```typescript
echo(options: { value: string; }) => Promise<{ value: string; }>
```

| Param         | Type                            |
| ------------- | ------------------------------- |
| **`options`** | <code>{ value: string; }</code> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### initialize()

```typescript
initialize() => Promise<{ result: boolean; }>
```

**Returns:** <code>Promise&lt;{ result: boolean; }&gt;</code>

--------------------


### insert(...)

```typescript
insert(options: { content: string; embedding: any; }) => Promise<{ result: boolean; }>
```

| Param         | Type                                              |
| ------------- | ------------------------------------------------- |
| **`options`** | <code>{ content: string; embedding: any; }</code> |

**Returns:** <code>Promise&lt;{ result: boolean; }&gt;</code>

--------------------


### query(...)

```typescript
query(options: { search: any; }) => Promise<any>
```

| Param         | Type                          |
| ------------- | ----------------------------- |
| **`options`** | <code>{ search: any; }</code> |

**Returns:** <code>Promise&lt;any&gt;</code>

--------------------


### batchInsert(...)

```typescript
batchInsert(options: { content: string; embedding: any; }[]) => Promise<{ result: boolean; }>
```

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code>{ content: string; embedding: any; }[]</code> |

**Returns:** <code>Promise&lt;{ result: boolean; }&gt;</code>

--------------------


### getWithPagination(...)

```typescript
getWithPagination(options: { limit: number; cursor?: number; }) => Promise<{ results: any[]; nextCursor: number; hasMore: boolean; }>
```

| Param         | Type                                             |
| ------------- | ------------------------------------------------ |
| **`options`** | <code>{ limit: number; cursor?: number; }</code> |

**Returns:** <code>Promise&lt;{ results: any[]; nextCursor: number; hasMore: boolean; }&gt;</code>

--------------------

</docgen-api>
