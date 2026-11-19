// Single source of truth for the backend address.
// Set VITE_API_URL in .env (e.g. http://localhost:5000) to point the app at a local server.
export const API_ORIGIN: string = (
  import.meta.env.VITE_API_URL || 'https://hub-for-skill-exchange-and-collaboration.onrender.com'
).replace(/\/$/, '');

export const API_BASE = `${API_ORIGIN}/api/v1`;
