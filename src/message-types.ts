import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";

export enum MessageType {
    MessageSync = 0,
    MessageAwareness = 1,
    MessageAuth = 2,
    MessageQueryAwareness = 3,
}

export function createSyncStep1Message(doc: any) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.MessageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    return encoding.toUint8Array(encoder);
}

export function createSyncStep2Message(doc: any) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.MessageSync);
    syncProtocol.writeSyncStep2(encoder, doc);
    return encoding.toUint8Array(encoder);
}

export function createUpdateMessage(update: Uint8Array) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.MessageSync);
    syncProtocol.writeUpdate(encoder, update);
    return encoding.toUint8Array(encoder);
}

export function createAwarenessUpdateMessage(awarenessUpdate: Uint8Array) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MessageType.MessageAwareness);
    encoding.writeVarUint8Array(encoder, awarenessUpdate);
    return encoding.toUint8Array(encoder);
}

export function createAwarenessQueryMessage() {
    const encoderAwarenessQuery = encoding.createEncoder()
    encoding.writeVarUint(encoderAwarenessQuery, MessageType.MessageQueryAwareness)
    return encoding.toUint8Array(encoderAwarenessQuery);
}