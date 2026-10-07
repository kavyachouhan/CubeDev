"use client";

import { createContext, useContext, type ReactNode } from "react";
import type {
  TimerPageActions,
  TimerPageData,
} from "./hooks/useTimerPageController";

/**
 * Timer page state, split in two on purpose.
 *
 * Data changes on every solve; actions never change identity. Keeping them
 * apart means a panel that only dispatches (a sheet body, a toolbar button)
 * is not re-rendered when a time is recorded.
 */
const TimerDataContext = createContext<TimerPageData | null>(null);
const TimerActionsContext = createContext<TimerPageActions | null>(null);

export function TimerPageProvider({
  data,
  actions,
  children,
}: {
  data: TimerPageData;
  actions: TimerPageActions;
  children: ReactNode;
}) {
  return (
    <TimerActionsContext.Provider value={actions}>
      <TimerDataContext.Provider value={data}>
        {children}
      </TimerDataContext.Provider>
    </TimerActionsContext.Provider>
  );
}

export function useTimerData(): TimerPageData {
  const data = useContext(TimerDataContext);
  if (!data) {
    throw new Error("useTimerData must be used within TimerPageProvider");
  }
  return data;
}

export function useTimerActions(): TimerPageActions {
  const actions = useContext(TimerActionsContext);
  if (!actions) {
    throw new Error("useTimerActions must be used within TimerPageProvider");
  }
  return actions;
}
