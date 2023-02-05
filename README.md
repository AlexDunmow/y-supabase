# y-supabase

A Supabase Realtime provider for [Yjs](https://yjs.dev), a high-performance CRDT for building collaborative applications that sync automatically.

![](https://i.imgur.com/FgENXUU.gif)

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

## Events

The `SupabaseProvider` class emits the following events:

- `message`: Emitted when a real-time update is received from Supabase. The update is passed as an argument.
- `awareness`: Emitted when an awareness update is received. The update is passed as an argument.
- `save`: Emitted after the local changes are saved to the database. The current version (local to the provider) is passed as an argument.
- `status`: Emitted to update the connection status of Realtime. An array with an object containing the status is passed as an argument. Possible statuses are:
  - `connected`
  - `connecting`
  - `disconnected`
- `connect`: Emitted when a connection is established. The `SupabaseProvider` instance is passed as an argument.
- `error`: Emitted when an error occurs. The `SupabaseProvider` instance is passed as an argument.
- `disconnect`: Emitted when the connection is lost. The `SupabaseProvider` instance is passed as an argument.
- `synced`: Emitted when the document is synced with the state from Supabase. The state is passed as an argument.
- `sync`: Emitted when a sync event occurs. The state is passed as an argument.

```typescript
provider.on('message', (update) => {
  console.log('Received real-time update:', update);
});

provider.on('awareness', (awarenessUpdate) => {
  console.log('Received awareness update:', awarenessUpdate);
});

// version is local to the provider only, not a true version number
provider.on('save', (version) => {
  console.log('Document saved to database with version:', version);
});

provider.on('status', (status) => {
  console.log('Connection status update:', status);
});

provider.on('connect', (providerInstance) => {
  console.log('Connected:', providerInstance);
});

provider.on('error', (providerInstance) => {
  console.error('Error:', providerInstance);
});

provider.on('disconnect', (providerInstance) => {
  console.log('Disconnected:', providerInstance);
});

provider.on('synced', (state) => {
  console.log('Synced with state:', state);
});

provider.on('sync', (state) => {
  console.log('Sync event with state:', state);
});
```


## License

License

y-supabase is released under the MIT License. See LICENSE for more information.

## Author

y-supabase is developed and maintained by Alex Dunmow.

Feel free to reach out with any questions or feedback via [email](mailto:alex@413x.tech) or [GitHub issues](https://github.com/AlexDunmow/y-supabase/issues)

## Contributing

We welcome contributions to y-supabase! If you're interested in contributing, please check out our [contributing guidelines]("./CONTRIBUTIONS.md").

