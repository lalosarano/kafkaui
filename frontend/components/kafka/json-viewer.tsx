"use client";

import { JsonView, defaultStyles, darkStyles } from "react-json-view-lite";
import "react-json-view-lite/dist/index.css";
import { useTheme } from "next-themes";

export function JsonViewer({ data }: { data: unknown }) {
  const { theme } = useTheme();
  return (
    <div className="jsonv">
      <JsonView data={data as object} style={theme === "dark" ? darkStyles : defaultStyles} shouldExpandNode={() => true} />
    </div>
  );
}
