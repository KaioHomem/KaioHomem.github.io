"use client";

import { useSyncExternalStore } from "react";

// A tiny shared store: a few flags several components react to.
// Small enough that a state library would be more code than it saves.

type State = {
  introDone: boolean;
  sound: boolean;
  navHidden: boolean;
  cursorLabel: string;
};

let state: State = { introDone: false, sound: false, navHidden: false, cursorLabel: "" };
const listeners = new Set<() => void>();

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const serverState = state;

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(serverState),
  );
}
