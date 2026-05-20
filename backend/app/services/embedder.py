from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Union

class Embedder:
    def __init__(self):
        # all-MiniLM-L6-v2 produces 384-dimensional embeddings
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def get_embedding(self, text: str) -> List[float]:
        """Generates a vector embedding for a single string."""
        if not text:
            return [0.0] * 384
        embedding = self.model.encode(text)
        return embedding.tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of strings."""
        if not texts:
            return []
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculates cosine similarity between two vectors."""
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(dot_product / (norm_v1 * norm_v2))

# Singleton instance
embedder = Embedder()
