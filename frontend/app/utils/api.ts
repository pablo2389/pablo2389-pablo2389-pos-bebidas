export const API_URL = "https://pablo2389-pablo2389-pos-bebidas.onrender.com";

export async function api(path: string, options: RequestInit = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // Asegura que el path siempre tenga la barra inicial
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

    let data: any;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (!res.ok) {
      // Manejo detallado de errores de FastAPI
      let message = `Error ${res.status}`;
      if (data?.detail) {
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((e: any) => e.msg).join(", ");
        }
      }
      throw new Error(message);
    }

    return data;
  } catch (error: any) {
    console.error("Error en la conexión con el backend:", error.message);
    throw new Error("No se pudo conectar con el backend");
  }
}