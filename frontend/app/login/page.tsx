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
          throw new Error("El nombre es obligatorio para el registro");
        }

        // REGISTRO: Enviando datos en el cuerpo (Body)
        res = await api("/auth/registrar", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            nombre: nombre.trim(),
            password: cleanPassword,
          }),
        });
      } else {
        // LOGIN CORREGIDO: Ahora enviamos JSON en el body en lugar de URL params
        // Esto elimina el error 422 (Unprocessable Content)
        res = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({
            email: cleanEmail,
            password: cleanPassword,
          }),
        });
      }

      // Verificación de respuesta y token
      if (!res || !res.token) {
        throw new Error(res?.detail || res?.message || "Credenciales incorrectas o error de servidor");
      }

      // Guardado de sesión
      localStorage.setItem("token", res.token);
      localStorage.setItem("usuario_nombre", res.nombre || "");

      // Redirección al inicio
      router.replace("/");
      
    } catch (err: any) {
      console.error("Error en la autenticación:", err);
      setError(err.message || "Ocurrió un error inesperado");
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
        <h1 className="text-2xl font-bold text-center text-slate-800">
          {esRegistro ? "Crear Cuenta" : "Iniciar Sesión"}
        </h1>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Email</label>
          <input
            type="email"
            required
            className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {esRegistro && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Nombre completo</label>
            <input
              type="text"
              required
              className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">Contraseña</label>
          <input
            type="password"
            required
            className="w-full border border-slate-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="bg-red-50 text-red-500 text-xs p-2 rounded border border-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded-lg transition-colors disabled:bg-blue-300"
        >
          {loading ? "Procesando..." : esRegistro ? "Registrarse" : "Ingresar"}
        </button>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setEsRegistro(!esRegistro);
              setError("");
            }}
            className="text-sm text-blue-600 hover:underline w-full text-center"
          >
            {esRegistro 
              ? "¿Ya tienes cuenta? Inicia sesión" 
              : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>
      </form>
    </div>
  );
}