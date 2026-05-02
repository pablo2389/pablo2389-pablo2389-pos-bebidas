export const API_URL =
  "https://pablo2389-pablo2389-pos-bebidas.onrender.com";

export async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  let data: any;

  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;

    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI ValidationError: array de errores
        message = data.detail.map((e: any) => e.msg).join(", ");
      } else if (typeof data.detail === "object") {
        message = data.detail.msg || JSON.stringify(data.detail);
      }
    }

    throw new Error(message);
  }

  return data;
}