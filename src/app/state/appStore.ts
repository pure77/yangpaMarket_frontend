import { useSyncExternalStore } from "react";
import type { AppState } from "../domain/types";
import { createInitialAppState } from "./initialState";

type Listener = () => void;

let state: AppState = createInitialAppState();
const listeners = new Set<Listener>();

export function getAppState(): AppState {
  return state;
}

export function setAppState(updater: (prev: AppState) => AppState): void {
  state = updater(state);
  listeners.forEach((listener) => listener());
}

export function subscribeAppState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppSelector<T>(selector: (current: AppState) => T): T {
  return useSyncExternalStore(subscribeAppState, () => selector(getAppState()));
}
