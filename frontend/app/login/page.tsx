"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../utils/api";

export default function Page() {
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

      if (!cleanEmail || !cleanPassword) {
        throw new Error("Email y contraseña son obligatorios");
      }

      let res;

      if (esRegistro) {
        if (!nombre.trim()) {
          throw new Error("El nombre es obligatorio");
        }

        res = await api("/auth/registrar", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            nombre: nombre.trim(),
            password: cleanPassword,
          }),
        });
      } else {
        res = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
          }),
        });
      }

      if (!res?.token) {
        throw new Error(
          res?.detail ||
          res?.message ||
          "Respuesta inválida del servidor"
        );
      }

      localStorage.setItem("token", res.token);
      localStorage.setItem("usuario_nombre", res.nombre || "");

      router.replace("/");
    } catch (err: any) {
      console.error("❌ Error en login:", err);
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-96 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">
          {esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {esRegistro && (
          <input
            type="text"
            placeholder="Nombre"
            className="w-full border p-2 rounded"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        )}

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button className="w-full bg-blue-600 text-white p-2 rounded">
          {loading ? "Procesando..." : "Continuar"}
        </button>

        <button
          type="button"
          onClick={() => {
            setEsRegistro(!esRegistro);
            setError("");
          }}
          className="text-sm text-blue-600 w-full"
        >
          {esRegistro ? "Ya tengo cuenta" : "Crear cuenta"}
        </button>
      </form>
    </div>
  );
}