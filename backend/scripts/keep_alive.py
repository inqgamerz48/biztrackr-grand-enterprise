import httpx
import asyncio
import time
import logging
from datetime import datetime

# Configuration
# Replace with your actual backend URL once deployed
BACKEND_URL = "https://biztrackr-grand-enterprise.onboarding.app" 
PING_INTERVAL_SECONDS = 300 # 5 minutes

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def ping_backend():
    """Pings the backend root to prevent spinning down."""
    async with httpx.AsyncClient() as client:
        while True:
            try:
                start_time = time.time()
                response = await client.get(BACKEND_URL)
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    logging.info(f"✅ Ping Successful! Status: 200 | Latency: {duration:.2f}s")
                else:
                    logging.warning(f"⚠️ Ping Received Status {response.status_code}")
                    
            except Exception as e:
                logging.error(f"❌ Ping Failed: {str(e)}")
            
            # Wait for the next interval
            await asyncio.sleep(PING_INTERVAL_SECONDS)

if __name__ == "__main__":
    logging.info(f"🚀 Starting Keep-Alive script for {BACKEND_URL}...")
    try:
        asyncio.run(ping_backend())
    except KeyboardInterrupt:
        logging.info("🛑 Keep-Alive script stopped.")
