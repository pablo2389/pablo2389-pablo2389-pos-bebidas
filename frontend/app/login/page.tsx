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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      if (!email || !password) {
        throw new Error("Email y password son obligatorios");
      }

      if (password.length > 72) {
        throw new Error("La contraseña no puede tener más de 72 caracteres");
      }

      let res: any;

      if (esRegistro) {
        if (!nombre) {
          throw new Error("El nombre es obligatorio");
        }

        res = await api("/auth/registrar", {
          method: "POST",
          body: JSON.stringify({
            email,
            nombre,
            password: password.trim(),
          }),
        });
      } else {
        res = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email,
            password: password.trim(),
          }),
        });
      }

      const { token, nombre: nombreUser } = res;

      if (!token) {
        throw new Error("No se recibió token del servidor");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("usuario_email", email);
      localStorage.setItem("usuario_nombre", nombreUser || nombre);

      router.replace("/");
    } catch (err: any) {
      setError(
        err.message ||
          err.response?.data?.detail ||
          "Error en login"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          {esRegistro ? "Crear cuenta" : "Iniciar sesión"}
        </h1>

        <form onSubmit={manejarSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {esRegistro && (
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input
                type="text"
                placeholder="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Contraseña</label>
            <input
              type="password"
              placeholder="password (máx 72 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={72}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {cargando ? "Cargando..." : esRegistro ? "Registrarse" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => setEsRegistro(!esRegistro)}
            className="w-full text-sm text-blue-600 mt-2"
          >
            {esRegistro ? "Ir a login" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}