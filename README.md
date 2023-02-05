# y-supabase

A Supabase Realtime provider for Yjs, a high-performance CRDT for building collaborative applications that sync automatically.

## Disclaimer
Please note that this package is currently in its early stages of development and ~~may~~ does have rough edges. Reliability is still being worked out. API will likely change dramatically. It is not recommended to use this in a production environment.

Contributions and feedback are greatly appreciated!

## Getting started

To get started, you will need to install y-supabase as a dependency.

`npm install --save y-supabase`

Next, you can create a new Y.Doc and a SupabaseProvider with a Supabase connection.

```typescript
const yDoc = new Y.Doc()
const provider = new SupabaseProvider(yDoc, supabase, {
    channel: note.id,
    id: note.id,
    tableName: "notes",
    columnName: "document",
})
```

## API

The `SupabaseProvider` class takes in the following arguments:

- `yDoc`: An instance of `Y.Doc` (required).
- `supabase`: An instance of Supabase (required).
- `options`: An object with the following properties:
    - `channel` (required): The channel to use for real-time updates.
    - `id` (optional, defaults to "id"): The ID of the document to sync with Supabase.
    - `tableName` (required): The name of the Supabase table to use.
    - `columnName` (required): The name of the column in the Supabase table to sync with.
    - `resyncInterval` (optional, defaults to 5s): the frequency that the provider will do a complete resync. Set as 0 or false to disable.

```typescript
const provider = new SupabaseProvider(yDoc, supabase, {
    channel: note.id,
    id: note.id,
    tableName: "notes",
    columnName: "document",
    resyncInterval?: number | false; // Default: 5000 (5 seconds)
})
```

## License

License

y-supabase is released under the MIT License. See LICENSE for more information.

## Contributing

We welcome contributions to y-supabase! If you're interested in contributing, please check out our [contributing guidelines]("./CONTRIBUTIONS.md").

