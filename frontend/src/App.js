import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API = "http://localhost:5000/api/metrics";

function formatBytes(bytes) {
  return (bytes / (1024 ** 3)).toFixed(1) + " GB";
}

function MetricCard({ title, value, unit, color }) {
  return (
    <div style={{ background: "#1e1e2e", borderRadius: 12, padding: "20px 24px", minWidth: 160 }}>
      <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>{title}</div>
      <div style={{ color: color || "#fff", fontSize: 32, fontWeight: 700 }}>
        {value}<span style={{ fontSize: 16, marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

function AgentDashboard({ name, history }) {
  const latest = history[history.length - 1];
  const chartData = history.map((m) => ({
    time: new Date(m.timestamp * 1000).toLocaleTimeString(),
    CPU: m.cpu,
    Memory: m.memory.percent,
    Disk: m.disk.percent,
  }));

  return (
    <div style={{ background: "#13131f", borderRadius: 16, padding: 24, marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00ff88" }} />
        <h2 style={{ color: "#fff", margin: 0, fontSize: 18 }}>{name}</h2>
        <span style={{ color: "#555", fontSize: 13 }}>— live metrics</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <MetricCard title="CPU Usage" value={latest.cpu.toFixed(1)} unit="%" color="#00bfff" />
        <MetricCard title="Memory" value={latest.memory.percent.toFixed(1)} unit="%" color="#a78bfa" />
        <MetricCard title="Disk" value={latest.disk.percent.toFixed(1)} unit="%" color="#fb923c" />
        <MetricCard title="Mem Used" value={formatBytes(latest.memory.used)} color="#34d399" />
        <MetricCard title="Disk Used" value={formatBytes(latest.disk.used)} color="#f472b6" />
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3f" />
          <XAxis dataKey="time" tick={{ fill: "#555", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis domain={[0, 100]} tick={{ fill: "#555", fontSize: 11 }} unit="%" />
          <Tooltip contentStyle={{ background: "#1e1e2e", border: "1px solid #333", borderRadius: 8 }} />
          <Line type="monotone" dataKey="CPU" stroke="#00bfff" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Memory" stroke="#a78bfa" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="Disk" stroke="#fb923c" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
        {[["CPU", "#00bfff"], ["Memory", "#a78bfa"], ["Disk", "#fb923c"]].map(([label, color]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: color, borderRadius: 2 }} />
            <span style={{ color: "#888", fontSize: 12 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [metricsStore, setMetricsStore] = useState({});

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(API);
        const data = await res.json();
        setMetricsStore(data);
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const agents = Object.keys(metricsStore).filter((k) => metricsStore[k].length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d1a", padding: "32px 40px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: "#fff", margin: 0, fontSize: 26 }}>⚡ DevOps Monitor</h1>
        <p style={{ color: "#555", margin: "6px 0 0" }}>
          {agents.length} agent{agents.length !== 1 ? "s" : ""} connected • updates every 5s
        </p>
      </div>

      {agents.length === 0 ? (
        <div style={{ color: "#555", fontSize: 16 }}>Waiting for agents to connect...</div>
      ) : (
        agents.map((name) => (
          <AgentDashboard key={name} name={name} history={metricsStore[name]} />
        ))
      )}
    </div>
  );
}