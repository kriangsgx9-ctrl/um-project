"use client";

// Recharts needs the browser, so this small wrapper is the only client piece
// of the Character Sheet (V1 §12 / V2 §3.7) — the page itself stays a Server
// Component that computes the data via lib/domain/readiness's readiness().
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";

export function ReadinessRadar({ data }: { data: { dimension: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="#e5e5e5" />
        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Radar dataKey="value" stroke="#ff6b00" fill="#ff6b00" fillOpacity={0.35} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
