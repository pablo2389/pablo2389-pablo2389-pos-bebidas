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

      // con tu api.ts, res YA es el JSON parseado, no res.data
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
    <div className="p-10">
      <form onSubmit={manejarSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {esRegistro && (
          <input
            type="text"
            placeholder="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        )}

        <input
          type="password"
          placeholder="password (máx 72 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          maxLength={72}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? "Cargando..." : esRegistro ? "Registrarse" : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => setEsRegistro(!esRegistro)}
        >
          {esRegistro ? "Ir a login" : "Crear cuenta"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}