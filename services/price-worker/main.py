"""
Reference price / index worker (scaffold).

For production: sign feeds, handle outages, store ticks in your time-series DB,
and publish to Redis/WebSocket gateway — never trust a single public endpoint
for settlement without controls.
"""

from __future__ import annotations

import os
import sys
import time

import httpx


def main() -> None:
    interval = int(os.environ.get("WORKER_INTERVAL_SEC", "30"))
    url = os.environ.get(
        "REFERENCE_URL",
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
    )
    print(f"price-worker: fetching {url!r} every {interval}s (Ctrl+C to stop)")

    while True:
        try:
            with httpx.Client(timeout=10.0) as client:
                r = client.get(url)
                r.raise_for_status()
                print(r.json())
        except (httpx.HTTPError, ValueError) as e:
            print(f"error: {e}", file=sys.stderr)
        time.sleep(interval)


if __name__ == "__main__":
    main()
