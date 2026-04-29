"use client";

import { Client, type StompSubscription } from "@stomp/stompjs";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

let singleton: Client | null = null;
let connectPromise: Promise<Client> | null = null;

export function getStompClient(): Promise<Client> {
  if (singleton?.connected) return Promise.resolve(singleton);
  if (connectPromise) return connectPromise;

  const client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 5000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: () => {},
  });

  connectPromise = new Promise((resolve, reject) => {
    client.onConnect = () => {
      singleton = client;
      resolve(client);
    };
    client.onStompError = (frame) => {
      reject(new Error(frame.headers["message"] ?? "STOMP error"));
    };
    client.activate();
  });
  return connectPromise;
}

export function disconnectStompClient() {
  if (singleton) {
    singleton.deactivate();
    singleton = null;
    connectPromise = null;
  }
}

export type Subscription = StompSubscription;
