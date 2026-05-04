"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DataProvider } from "../contexts/DataContext";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <DataProvider>{children}</DataProvider>
    </ThemeProvider>
  );
}
