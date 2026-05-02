"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../utils/api";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [esRegistro, setEsRegistro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      let res;

      if (esRegistro) {
        if (!nombre.trim()) {
          throw new Error("Nombre obligatorio");
        }

        // REGISTRO: se mantiene igual, body JSON
        res = await api("/auth/registrar", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            nombre: nombre.trim(),
            password: cleanPassword,
          }),
        });
      } else {
        // LOGIN: enviar email y password como query params
        const params = new URLSearchParams({
          email: cleanEmail,
          password: cleanPassword,
        });

        res = await api(`/auth/login?${params.toString()}`, {
          method: "POST",
        });
      }

      if (!res?.token) {
        throw new Error("No se recibió token");
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("usuario_nombre", res.nombre || "");

      router.replace("/");
    } catch (err: any) {
      setError(err.message || "Error en login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow w-96 space-y-3"
      >
        <h1 className="text-xl font-bold text-center">
          {esRegistro ? "Registro" : "Login"}
        </h1>

        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {esRegistro && (
          <input
            className="w-full border p-2 rounded"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        )}

        <input
          type="password"
          className="w-full border p-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? "Cargando..." : esRegistro ? "Crear cuenta" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => setEsRegistro(!esRegistro)}
          className="text-sm text-blue-600 w-full"
        >
          Cambiar a {esRegistro ? "Login" : "Registro"}
        </button>
      </form>
    </div>
  );
}