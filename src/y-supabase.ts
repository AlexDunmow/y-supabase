import debug from "debug";
import { EventEmitter } from "events";
import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

import { createSyncStep1Message } from "./message-types";
import { SupabaseClient } from "@supabase/supabase-js";
import { RealtimeChannel } from "@supabase/realtime-js";
import { REALTIME_LISTEN_TYPES } from "@supabase/realtime-js/src/RealtimeChannel";

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
  private awareness: awarenessProtocol.Awareness;
  public connected = false;
  private channel: RealtimeChannel | null = null;

  private _synced: boolean = false;
  private resyncInterval: NodeJS.Timer | undefined;
  protected logger: debug.Debugger;
  public readonly id: number;

  public unsyncedChanges = 0;
  public lastMessageReceived = 0;

  isOnline(online?: boolean): boolean {
    if (!online && online !== false) return this.connected;
    console.log("ONLINE SETTING", online);
    this.connected = online;
    return this.connected;
  }

  onDocumentUpdate(update: Uint8Array, origin: any) {
    console.log(origin, "origin", this, this.isOnline());
    if (origin !== this) {
      this.logger(
        "document updated locally, broadcasting update to peers",
        this.isOnline()
      );
      this.emit("message", update);
      this.save();
    }
  }
  onAwarenessUpdate({ added, updated, removed }: any, origin: any) {
    const changedClients = added.concat(updated).concat(removed);
    const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
      this.awareness,
      changedClients
    );
    this.emit("awareness", awarenessUpdate);
  }

  removeSelfFromAwarenessOnUnload() {
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      [this.doc.clientID],
      "window unload"
    );
  }

  async save() {
    const content = Array.from(Y.encodeStateAsUpdate(this.doc));

    const { error } = await this.supabase
      .from(this.config.tableName)
      .update({ [this.config.columnName]: content })
      .eq(this.config.idName || "id", this.config.id);

    if (error) {
      throw error;
    }
  }

  private async onConnect() {
    this.logger("connected");

    const { data, error, status } = await this.supabase
      .from(this.config.tableName)
      .select<string, { [key: string]: number[] }>(`${this.config.columnName}`)
      .eq(this.config.idName || "id", this.config.id)
      .single();

    this.logger("retrieved data from supabase", status);

    if (data && data[this.config.columnName]) {
      this.logger("applying update to yjs");
      try {
        Y.applyUpdate(this.doc, Uint8Array.from(data[this.config.columnName]));
      } catch (error) {
        this.logger(error);
      }
    }

    this.logger("setting connected flag to true");
    this.isOnline(true);

    this.emit("status", [{ status: "connected" }]);

    if (this.awareness.getLocalState() !== null) {
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        [this.doc.clientID]
      );
      this.emit("awareness", awarenessUpdate);
    }
  }

  private disconnect() {
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  private connect() {
    this.channel = this.supabase.channel(this.config.channel);
    if (this.channel) {
      this.channel
        .on(
          REALTIME_LISTEN_TYPES.BROADCAST,
          { event: "message" },
          ({ payload }) => {
            this.onMessage(Uint8Array.from(payload), this);
          }
        )
        .on(
          REALTIME_LISTEN_TYPES.BROADCAST,
          { event: "awareness" },
          ({ payload }) => {
            this.onAwareness(Uint8Array.from(payload));
          }
        )
        .subscribe((status, err) => {
          console.log("channel", status, err);
          if (status === "SUBSCRIBED") {
            this.emit("connect", this);
          }

          if (status === "CHANNEL_ERROR") {
            console.log(status, this, err);
            console.error(err);
            this.emit("error", this);
          }

          if (status === "TIMED_OUT") {
            this.emit("disconnect", this);
          }

          if (status === "CLOSED") {
            this.emit("disconnect", this);
          }
        });
    }
  }

  constructor(
    private doc: Y.Doc,
    private supabase: SupabaseClient,
    private config: SupabaseProviderConfig
  ) {
    super();

    this.awareness =
      this.config.awareness || new awarenessProtocol.Awareness(doc);

    this.config = config || {};
    //this.doc = doc;
    this.id = doc.clientID;

    console.log("connecting to supabase realtime", doc.guid);
    this.supabase = supabase;
    this.on("connect", this.onConnect);
    this.on("disconnect", this.onDisconnect);

    this.logger = debug("y-" + doc.clientID);
    this.logger.enabled = true;
    this.logger("constructor initializing");

    if (this.config.resyncInterval || typeof this.config.resyncInterval === "undefined") {
      if (this.config.resyncInterval && this.config.resyncInterval < 3000) {
        throw new Error("resync interval of less than 3 seconds")
      }
      this.logger(`setting resync interval to every ${(this.config.resyncInterval || 5000) / 1000} seconds`);
      this.resyncInterval = setInterval(() => {
        this.logger("resyncing (resync interval elapsed)");
        this.emit("message", Y.encodeStateAsUpdate(this.doc));
        if (this.channel)
          this.channel.send({
            type: "broadcast",
            event: "message",
            payload: Array.from(Y.encodeStateAsUpdate(this.doc)),
          });
      }, this.config.resyncInterval || 5000);
    }

    if (typeof window !== "undefined") {
      window.addEventListener(
        "beforeunload",
        this.removeSelfFromAwarenessOnUnload
      );
    } else if (typeof process !== "undefined") {
      process.on("exit", () => this.removeSelfFromAwarenessOnUnload);
    }
    this.on("awareness", (update) => {
      if (this.channel)
        this.channel.send({
          type: "broadcast",
          event: "awareness",
          payload: Array.from(update),
        });
    });
    this.on("message", (update) => {
      if (this.channel)
        this.channel.send({
          type: "broadcast",
          event: "message",
          payload: Array.from(update),
        });
    });

    this.connect();
    this.doc.on("update", this.onDocumentUpdate.bind(this));
    this.awareness.on("update", this.onAwarenessUpdate.bind(this));
  }

  get synced() {
    return this._synced;
  }

  set synced(state) {
    if (this._synced !== state) {
      this.logger("setting sync state to " + state);
      this._synced = state;
      this.emit("synced", [state]);
      this.emit("sync", [state]);
    }
  }

  public onConnecting() {
    if (!this.isOnline()) {
      this.logger("connecting");
      this.emit("status", [{ status: "connecting" }]);
    }
  }

  public onDisconnect() {
    this.logger("disconnected");

    this.synced = false;
    this.isOnline(false);
    this.logger("set connected flag to false");
    if (this.isOnline()) {
      this.emit("status", [{ status: "disconnected" }]);
    }

    // update awareness (keep all users except local)
    // FIXME? compare to broadcast channel behavior
    const states = Array.from(this.awareness.getStates().keys()).filter(
      (client) => client !== this.doc.clientID
    );
    awarenessProtocol.removeAwarenessStates(this.awareness, states, this);
  }

  public onMessage(message: Uint8Array, origin: any) {
    if (!this.isOnline()) return;
    try {
      Y.applyUpdate(this.doc, message, this);
    } catch (err) {
      console.error(err);
    }
  }

  public onAwareness(message: Uint8Array) {
    awarenessProtocol.applyAwarenessUpdate(this.awareness, message, this);
  }

  public onAuth(message: Uint8Array) {
    console.log(`received ${message.byteLength} bytes from peer: ${message}`);

    if (!message) {
      console.warn(`Permission denied to channel`);
    }
    console.log("processed message (type = MessageAuth)");
  }

  public destroy() {
    this.logger("destroying");

    if (this.resyncInterval) {
      clearInterval(this.resyncInterval);
    }

    if (typeof window !== "undefined") {
      window.removeEventListener(
        "beforeunload",
        this.removeSelfFromAwarenessOnUnload
      );
    } else if (typeof process !== "undefined") {
      process.off("exit", () => this.removeSelfFromAwarenessOnUnload);
    }

    this.awareness.off("update", this.onAwarenessUpdate);
    this.doc.off("update", this.onDocumentUpdate);

    if (this.channel) this.supabase.removeChannel(this.channel);
  }
}
