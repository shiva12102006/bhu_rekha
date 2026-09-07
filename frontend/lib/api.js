/**
 * lib/api.js
 * ----------
 * Thin fetch wrapper around the FastAPI backend. Centralizing the base URL
 * and error handling here keeps page components declarative.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Auth ---
  login: (payload) =>
    request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: (payload) =>
    request("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // --- Analytics ---
  getDashboardStats: () => request("/api/v1/land/analytics"),

  // --- Records ---
  listRecords: ({ status, district } = {}) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (district) params.set("district", district);
    const qs = params.toString();
    return request(`/api/v1/land/records${qs ? `?${qs}` : ""}`);
  },

  getRecord: (id) => request(`/api/v1/land/records/${id}`),

  verifyRecord: (id, payload) =>
    request(`/api/v1/land/verify/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  uploadRecord: (file, language = "hi") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", language);
    return fetch(`${API_BASE_URL}/api/v1/land/upload`, {
      method: "POST",
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    });
  },

  // --- Bhulekh public search ---
  bhulekhSearch: ({ khasra_no, district, tehsil, village } = {}) => {
    const params = new URLSearchParams();
    if (khasra_no) params.set("khasra_no", khasra_no);
    if (district) params.set("district", district);
    if (tehsil) params.set("tehsil", tehsil);
    if (village) params.set("village", village);
    const qs = params.toString();
    return request(`/api/v1/land/bhulekh/search${qs ? `?${qs}` : ""}`);
  },
};

export { API_BASE_URL };
