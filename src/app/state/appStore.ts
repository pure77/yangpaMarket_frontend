import { useSyncExternalStore } from "react";
import type { AppState } from "../domain/types";
import { createInitialAppState } from "./initialState";

type Listener = () => void;

// 앱 전역 상태는 단일 메모리 객체로 유지됩니다.
let state: AppState = createInitialAppState();
const listeners = new Set<Listener>();

export function getAppState(): AppState {
  return state;
}

export function setAppState(updater: (prev: AppState) => AppState): void {
  // 모든 상태 변경은 updater 함수로만 수행해 변경 경로를 단일화합니다.
  state = updater(state);
  // 상태가 바뀌면 구독 중인 컴포넌트에게 즉시 알립니다.
  listeners.forEach((listener) => listener());
}

export function subscribeAppState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppSelector<T>(selector: (current: AppState) => T): T {
  // React 18 권장 패턴(useSyncExternalStore)으로 외부 스토어를 안전하게 구독합니다.
  return useSyncExternalStore(subscribeAppState, () => selector(getAppState()));
}
