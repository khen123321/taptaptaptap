"use client";

import { useLayoutEffect } from "react";
import { applyStoredTheme } from "@/components/theme/theme-store";

export function ThemeInitializer() {
  useLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  return null;
}
