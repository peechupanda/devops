require("dotenv").config();
const express = require("express");
const cors = require("cors");
const https = require("https");

const app = express();
const PORT = 5000;

const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK || "";

const THRESHOLDS = { cpu: 80, memory: 90, disk: 85 };
const alertCooldowns = {};

app.use(cors());
app.use(express.json());

const metricsStore = {};

function sendSlackAlert(agent, metric, value, threshold) {
  const cooldownKey = `${agent}-${metric}`;
  const now = Date.now();
  if (alertCooldowns[cooldownKey] && now - alertCooldowns[cooldownKey] < 5 * 60 * 1000) return;
  alertCooldowns[cooldownKey] = now;
  const emoji = metric === "cpu" ? "🔥" : metric === "memory" ? "🧠" : "💾";
  const message = { text: `${emoji} *ALERT* — Agent: *${agent}*\n*${metric.toUpperCase()}* is at *${value.toFixed(1)}%* (threshold: ${threshold}%)` };
  const body = JSON.stringify(message);
  const url = new URL(SLACK_WEBHOOK);
  const options = { hostname: url.hostname, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } };
  const req = https.request(options, (res) => { console.log(`[SLACK] Alert sent: ${res.statusCode}`); });
  req.on("error", (e) => console.error("[SLACK] Error:", e.message));
  req.write(body);
  req.end();
}

function checkThresholds(data) {
  const { agent, cpu, memory, disk } = data;
  if (cpu > THRESHOLDS.cpu) sendSlackAlert(agent, "cpu", cpu, THRESHOLDS.cpu);
  if (memory.percent > THRESHOLDS.memory) sendSlackAlert(agent, "memory", memory.percent, THRESHOLDS.memory);
  if (disk.percent > THRESHOLDS.disk) sendSlackAlert(agent, "disk", disk.percent, THRESHOLDS.disk);
}

app.post("/api/metrics", (req, res) => {
  const data = req.body;
  const agent = data.agent || "unknown";
  if (!metricsStore[agent]) metricsStore[agent] = [];
  metricsStore[agent].push(data);
  if (metricsStore[agent].length > 50) metricsStore[agent].shift();
  checkThresholds(data);
  console.log(`[${new Date().toLocaleTimeString()}] Received from ${agent} — CPU: ${data.cpu}%`);
  res.json({ status: "ok" });
});

app.get("/api/metrics", (req, res) => { res.json(metricsStore); });
app.get("/", (req, res) => { res.json({ message: "DevOps Monitor Backend running!" }); });

app.listen(PORT, () => { console.log(`Backend running on http://0.0.0.0:${PORT}`); });