import redis
import json
from app.config import settings

class RedisClient:
    def __init__(self):
        # Decode responses to get strings instead of bytes
        self.client = redis.from_url(settings.REDIS_URL, decode_responses=True)

    def set_job(self, job_id: str, job_data: dict, expire: int = 3600):
        """Caches job data in Redis for 1 hour by default."""
        self.client.set(f"job:{job_id}", json.dumps(job_data), ex=expire)

    def get_job(self, job_id: str) -> dict | None:
        """Retrieves cached job data from Redis."""
        data = self.client.get(f"job:{job_id}")
        if data:
            return json.loads(data)
        return None

# Singleton instance
redis_client = RedisClient()
