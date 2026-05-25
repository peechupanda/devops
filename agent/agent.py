import psutil
import requests
import time
import socket
import os


BACKEND_URL = os.environ.get("BACKEND_URL", "http://3.110.212.48:5000/api/metrics")
AGENT_NAME = socket.gethostname()
INTERVAL = 5  # seconds between each report

def collect_metrics():
    cpu = psutil.cpu_percent(interval=1)

    mem = psutil.virtual_memory()
    memory = {
        "total": mem.total,
        "used": mem.used,
        "percent": mem.percent
    }

    disk = psutil.disk_usage("/")
    disk_info = {
        "total": disk.total,
        "used": disk.used,
        "percent": disk.percent
    }

    net = psutil.net_io_counters()
    network = {
        "bytes_sent": net.bytes_sent,
        "bytes_recv": net.bytes_recv
    }

    return {
        "agent": AGENT_NAME,
        "cpu": cpu,
        "memory": memory,
        "disk": disk_info,
        "network": network,
        "timestamp": time.time()
    }

def send_metrics(metrics):
    try:
        response = requests.post(BACKEND_URL, json=metrics, timeout=5)
        print(f"[{time.strftime('%H:%M:%S')}] Sent metrics — status: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"[{time.strftime('%H:%M:%S')}] Backend not reachable, retrying...")

if __name__ == "__main__":
    print(f"Agent started on: {AGENT_NAME}")
    print(f"Sending to: {BACKEND_URL}")
    while True:
        metrics = collect_metrics()
        send_metrics(metrics)
        time.sleep(INTERVAL)