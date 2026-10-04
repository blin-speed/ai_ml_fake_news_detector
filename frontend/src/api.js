import { COPY } from "./copy";

const CLIENT_ID_KEY = "second_opinion_client_id";

/**
 * Returns a persistent anonymous UUID for this browser.
 */
export function getClientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

export function resetClientId() {
  localStorage.removeItem(CLIENT_ID_KEY);
  return getClientId();
}

/**
 * Common fetch helper with client ID header and friendly error mapping.
 */
async function request(url, options = {}) {
  const clientId = getClientId();
  const headers = {
    "X-Client-Id": clientId,
    ...options.headers,
  };

  if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err) {
    if (err.name === "AbortError") {
      throw err;
    }
    throw new Error(COPY.error.server);
  }

  if (res.status === 204) {
    return null;
  }

  if (!res.ok) {
    if (res.status === 422) {
      throw new Error(COPY.error.short);
    }
    if (res.status === 429) {
      throw new Error(COPY.error.rate);
    }
    if (res.status >= 500) {
      throw new Error(COPY.error.server);
    }
    let detail = COPY.error.general;
    try {
      const errJson = await res.json();
      if (errJson.detail && typeof errJson.detail === "string") {
        detail = errJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return res.json();
}

export const api = {
  check: (payload, signal) => request("/api/check", { method: "POST", body: payload, signal }),
  getHistory: (limit = 50, before = null) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) params.append("before", before);
    return request(`/api/history?${params.toString()}`);
  },
  deleteItem: (id) => request(`/api/history/${id}`, { method: "DELETE" }),
  deleteAll: () => request("/api/history", { method: "DELETE" }),
  feedback: (payload) => request("/api/feedback", { method: "POST", body: payload }),
  about: () => fetch("/api/about").then((r) => (r.ok ? r.json() : null)).catch(() => null),
};
