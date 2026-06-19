import axios from 'axios';

const enrichmentClient = axios.create({
  baseURL: import.meta.env.VITE_ENRICHMENT_URL || 'http://localhost:8080',
});

export default enrichmentClient;
