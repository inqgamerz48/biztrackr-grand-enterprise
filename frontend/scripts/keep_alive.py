import httpx
import asyncio
import time
import logging
from datetime import datetime

# Configuration
# Replace with your actual frontend URL (e.g., Vercel/Render)
FRONTEND_URL = "https://biztrackr-grand-enterprise.onrender.com" 
PING_INTERVAL_SECONDS = 300 # 5 minutes

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

async def ping_frontend():
    """Pings the frontend URL to prevent spinning down."""
    async with httpx.AsyncClient() as client:
        while True:
            try:
                start_time = time.time()
                # Use a lightweight check if possible, or just the root
                response = await client.get(FRONTEND_URL)
                duration = time.time() - start_time
                
                if response.status_code == 200:
                    logging.info(f"✅ Frontend Ping Successful! Status: 200 | Latency: {duration:.2f}s")
                else:
                    logging.warning(f"⚠️ Frontend Received Status {response.status_code}")
                    
            except Exception as e:
                logging.error(f"❌ Frontend Ping Failed: {str(e)}")
            
            # Wait for the next interval
            await asyncio.sleep(PING_INTERVAL_SECONDS)

if __name__ == "__main__":
    logging.info(f"🚀 Starting Frontend Keep-Alive script for {FRONTEND_URL}...")
    try:
        asyncio.run(ping_frontend())
    except KeyboardInterrupt:
        logging.info("🛑 Keep-Alive script stopped.")
