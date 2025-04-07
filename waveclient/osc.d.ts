/// <reference types="node" />

import { EventEmitter } from 'events';
import { Socket } from 'dgram';
import { Socket as NetSocket } from 'net';
import WebSocket from 'ws';

// Core OSC Types
export interface TimeTag {
  raw: [number, number];
  native: number;
}

export type OSCArgument =
  | { type: 'i'; value: number } // Int32
  | { type: 'h'; value: { high: number; low: number } } // Int64
  | { type: 'f'; value: number } // Float32
  | { type: 'd'; value: number } // Float64
  | { type: 's'; value: string } // String
  | { type: 'S'; value: string } // Alternate string type
  | { type: 'b'; value: Uint8Array | Buffer } // Blob
  | { type: 't'; value: TimeTag } // TimeTag
  | { type: 'T'; value: true } // True
  | { type: 'F'; value: false } // False
  | { type: 'N'; value: null } // Null
  | { type: 'I'; value: 1.0 } // Impulse
  | { type: 'c'; value: string } // Char (32-bit)
  | { type: 'r'; value: { r: number; g: number; b: number; a: number } } // RGBA color
  | { type: 'm'; value: Uint8Array } // MIDI message (port, status, data1, data2)
  | OSCArgument[]; // Array of arguments

export interface Message {
  address: string;
  args: OSCArgument[] | OSCArgument;
}

export interface Bundle {
  timeTag: TimeTag;
  packets: OSCPacket[];
}

export type OSCPacket = Message | Bundle;

// Port Options
export interface UDPPortOptions {
  localAddress?: string;
  localPort?: number;
  remoteAddress?: string;
  remotePort?: number;
  multicastTTL?: number;
  multicastMembership?: string[] | { address: string; interface: string }[];
  broadcast?: boolean;
  socket?: Socket;
}

export interface TCPSocketPortOptions {
  address?: string;
  port?: number;
  useSLIP?: boolean;
  socket?: NetSocket;
}

export interface WebSocketPortOptions {
  url: string;
  socket?: WebSocket;
}

// Port Declarations
declare class OSCPort extends EventEmitter {
  send(packet: OSCPacket): void;
  sendRaw(encoded: Buffer | Uint8Array): void;
  open(): void;
  close(): void;

  on(event: 'open', listener: (socket: unknown) => void): this;
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'message', listener: (message: Message, timeTag?: TimeTag, packetInfo?: unknown) => void): this;
  on(event: 'bundle', listener: (bundle: Bundle, timeTag?: TimeTag, packetInfo?: unknown) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'raw', listener: (data: Uint8Array, packetInfo?: unknown) => void): this;
  on(event: 'osc', listener: (packet: OSCPacket, packetInfo?: unknown) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

export class UDPPort extends OSCPort {
  constructor(options: UDPPortOptions);
  socket?: Socket;
}

export class TCPSocketPort extends OSCPort {
  constructor(options: TCPSocketPortOptions);
  socket?: NetSocket;
}

export class WebSocketPort extends OSCPort {
  constructor(options: WebSocketPortOptions);
  socket?: WebSocket;
}

// Relay (from osc-transports.js)
export class Relay extends EventEmitter {
  constructor(port1: OSCPort, port2: OSCPort, options?: { raw?: boolean });
  open(): void;
  close(): void;
  listen(): void;

  on(event: 'close', listener: (port1: OSCPort, port2: OSCPort) => void): this;
  on(event: string, listener: (...args: any[]) => void): this;
}

// Utility Types
export interface OSCOptions {
  metadata?: boolean;
  unpackSingleArgs?: boolean;
}

// Extended for internal encoding/decoding if needed
export interface OSC extends EventEmitter {
  writePacket(packet: OSCPacket, options?: OSCOptions): Uint8Array;
  readPacket(data: Uint8Array | Buffer, options?: OSCOptions, offsetState?: { idx: number }): OSCPacket;
}

declare const osc: OSC;
export default osc;