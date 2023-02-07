/// <reference types="debug" />
/// <reference types="node" />
import { EventEmitter } from 'events';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { SupabaseClient } from '@supabase/supabase-js';

declare module 'y-supabase' {
  export interface SupabaseProviderConfig {
    channel: string;
    tableName: string;
    columnName: string;
    idName?: string;
    id: string | number;
    awareness?: awarenessProtocol.Awareness;
    resyncInterval?: number | false;
  }

  export default class SupabaseProvider extends EventEmitter {
    private doc;
    private supabase;
    private config;
    awareness: awarenessProtocol.Awareness;
    connected: boolean;
    private channel;
    private _synced;
    private resyncInterval;
    protected logger: debug.Debugger;
    readonly id: number;
    version: number;

    isOnline(online?: boolean): boolean;

    onDocumentUpdate(update: Uint8Array, origin: any): void;

    onAwarenessUpdate({ added, updated, removed }: any, origin: any): void;

    removeSelfFromAwarenessOnUnload(): void;

    save(): Promise<void>;

    private onConnect;
    private applyUpdate;
    private disconnect;
    private connect;

    constructor(doc: Y.Doc, supabase: SupabaseClient, config: SupabaseProviderConfig);

    get synced(): boolean;
    set synced(state: boolean);

    onConnecting(): void;

    onDisconnect(): void;

    onMessage(message: Uint8Array, origin: any): void;

    onAwareness(message: Uint8Array): void;

    onAuth(message: Uint8Array): void;

    destroy(): void;
  }
}
