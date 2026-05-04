export const API_URL = "https://pablo2389-pablo2389-pos-bebidas.onrender.com";

export async function api(path: string, options: RequestInit = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_URL}${cleanPath}`, {
      ...options,
      headers,
    });

    let data: any = null;

    try {
      data = await res.json();
    } catch {
      // puede venir vacío (204, etc)
    }

    if (!res.ok) {
      let message = `Error ${res.status}`;

      if (data?.detail) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((e: any) => e.msg).join(", ");
        }
      }

      console.error("❌ Backend error:", {
        url: `${API_URL}${cleanPath}`,
        status: res.status,
        data,
      });

      throw new Error(message);
    }

    return data;
  } catch (error: any) {
    console.error("❌ Error REAL:", error);
    throw error; // 🔥 CLAVE: no pisamos el error
  }
}