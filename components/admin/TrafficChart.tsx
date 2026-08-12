"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsPoint } from "@/types/database";

export function TrafficChart({ data }: { data: AnalyticsPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border theme-border theme-text-muted">
        Analytics will appear after visitors begin using the website.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
          <XAxis dataKey="label" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="views"
            stroke="var(--accent)"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
