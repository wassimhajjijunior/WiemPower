const BASE_URL = "http://localhost:5000/api/soil"; // Flask backend base

// --- small helper: fetch with timeout ---
const fetchWithTimeout = async (url, options = {}, timeout = 7000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, ...options });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

/**
 * Get the latest soil data (generic) from backend.
 * Returns parsed JSON. Kept for compatibility with existing code.
 */
export const getSoilData = async () => {
  const res = await fetchWithTimeout(BASE_URL);
  if (!res.ok) throw new Error(`Failed to load soil data: ${res.status}`);
  return res.json();
};

/**
 * Add soil data record (existing helper)
 * data is an object that backend expects.
 */
export const addSoilData = async (data) => {
  const res = await fetchWithTimeout(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to save soil data: ${res.status}`);
  return res.json();
};

// ---------------------- New helpers for water level & pump ----------------------

/**
 * Get the current water level.
 * Assumes backend endpoint: GET /api/soil/water-level -> { waterLevel: number }
 * If your backend uses a different shape, adapt the caller.
 */
export const getWaterLevel = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/water-level`);
  if (!res.ok) throw new Error(`Failed to fetch water level: ${res.status}`);
  const json = await res.json();
  // allow returning either raw number or object { waterLevel }
  if (typeof json === 'number') return json;
  return json.waterLevel ?? json.level ?? json.value ?? json;
};

/**
 * Get current pump status. Assumes endpoint: GET /api/soil/pump -> { on: true }
 */
export const getPumpStatus = async () => {
  const res = await fetchWithTimeout(`${BASE_URL}/pump`);
  if (!res.ok) throw new Error(`Failed to fetch pump status: ${res.status}`);
  const json = await res.json();
  return json.on ?? json.status ?? json;
};

/**
 * Set pump status (on/off). Assumes endpoint: POST /api/soil/pump with JSON { on: true }
 * Returns the updated status object from server.
 */
export const setPumpStatus = async (on) => {
  const res = await fetchWithTimeout(`${BASE_URL}/pump`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ on: !!on }),
  });
  if (!res.ok) throw new Error(`Failed to set pump status: ${res.status}`);
  return res.json();
};

/**
 * Toggle pump and return server response.
 */
export const togglePump = async () => {
  const current = await getPumpStatus();
  const next = !!current ? false : true;
  return setPumpStatus(next);
};

/**
 * Real-time subscription via Server-Sent Events (SSE).
 * Backend should expose: GET /api/soil/stream that sends events with JSON data.
 * onMessage receives parsed JSON payload. Returns the EventSource instance (call .close() to stop).
 */
export const subscribeSoilStream = (onMessage, onError) => {
  if (typeof EventSource === 'undefined') {
    console.warn('EventSource not available in this environment');
    return null;
  }
  const url = `${BASE_URL}/stream`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage && onMessage(data);
    } catch (err) {
      onMessage && onMessage(e.data);
    }
  };
  es.onerror = (err) => {
    onError && onError(err);
  };
  return es;
};

/**
 * Simple polling fallback for environments without SSE.
 * Returns a stop() function that cancels the polling.
 */
export const startPollingWater = (callback, interval = 5000) => {
  let stopped = false;
  const run = async () => {
    if (stopped) return;
    try {
      const level = await getWaterLevel();
      callback && callback(level);
    } catch (e) {
      // swallow or forward errors via callback if desired
      console.error('Polling water level failed', e);
    }
    if (!stopped) setTimeout(run, interval);
  };
  run();
  return { stop: () => { stopped = true; } };
};
