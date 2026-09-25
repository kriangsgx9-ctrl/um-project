"use client";

// V1 §14 PRODUCE pillar trend line (FYP actual vs target, last 3 months).
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface KpiTrendPoint {
  month: string;
  actual: number;
  target: number;
}

export function KpiTrendChart({ data }: { data: KpiTrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid stroke="#e5e5e5" strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="actual" name="ทำได้จริง" stroke="#ff6b00" strokeWidth={2} />
        <Line type="monotone" dataKey="target" name="เป้าหมาย" stroke="#b8c2cc" strokeDasharray="4 4" />
      </LineChart>
    </ResponsiveContainer>
  );
}
