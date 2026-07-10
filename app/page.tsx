'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const manejarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      // 1. Usar la variable de entorno de Vercel (Render) o usar localhost de respaldo si estás en tu PC
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // 2. La petición ahora es dinámica usando la baseURL correcta
      const respuesta = await fetch(`${baseURL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.error || 'Credenciales incorrectas');
      }

      // Guardar el Token JWT en el navegador para usarlo en rutas protegidas
      localStorage.setItem('token', datos.token);
      localStorage.setItem('usuario', JSON.stringify(datos.usuario));

      // Redirigir al Dashboard principal del Administrador
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800 p-8 shadow-xl border border-slate-700">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-white">
            Sigmato Condominios
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Ingresa al panel administrativo
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={manejarLogin}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md">
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@sigmato.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {cargando ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}