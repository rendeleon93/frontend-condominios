"use client";

import { useState, useEffect } from "react";

interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
  createdAt: string;
}

export default function CrearCondominiosPage() {
  const [idManual, setIdManual] = useState("");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [cargando, setCargando] = useState(true);

  // Obtener los condominios registrados
  const obtenerCondominios = async () => {
    setCargando(true);
    try {
      const res = await fetch("http://localhost:3000/api/admin/condominios", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setCondominios(data);
      }
    } catch (error) {
      console.error("Error al traer condominios:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerCondominios();
  }, []);

  // Enviar formulario al backend
  const handleCrearCondominio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3000/api/admin/condominios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: idManual || undefined, // Si va vacío, el backend crea un UUID
          nombre,
          direccion,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("🎉 ¡Condominio registrado correctamente en el sistema!");
        setIdManual("");
        setNombre("");
        setDireccion("");
        obtenerCondominios(); // Recarga la lista
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error en la petición:", error);
      alert("Error de conexión con el backend.");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-slate-950 text-white min-h-screen">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Alta de Complejos Habitacionales</h1>
        <p className="text-slate-400 text-sm">Registra nuevos condominios, desarrollos residenciales o torres de departamentos.</p>
      </header>

      <hr className="border-slate-800" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* FORMULARIO */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 text-sm h-fit">
          <h2 className="text-lg font-semibold text-blue-400">🏢 Registrar Condominio</h2>
          <form onSubmit={handleCrearCondominio} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">ID Manual / Clave (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. condo-prueba o dejas vacío"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={idManual}
                onChange={(e) => setIdManual(e.target.value)}
              />
              <p className="text-slate-500 text-[11px] mt-1">Si lo dejas en blanco, el sistema autogenerará una clave única.</p>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nombre Comercial</label>
              <input
                type="text"
                placeholder="Ej. Residencial Las Palomas"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Dirección Completa</label>
              <textarea
                placeholder="Ej. Av. Lomas del Valle #120, Monterrey, NL"
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-slate-950 font-bold py-2.5 rounded-lg transition">
              Guardar Propiedad
            </button>
          </form>
        </div>

        {/* LISTADO DE COMPLEJOS EXISTENTES */}
        <div className="md:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h2 className="text-xl font-semibold">Catálogo Global de Complejos</h2>
          </div>

          {cargando ? (
            <div className="p-10 text-center text-slate-500 text-sm">⏳ Obteniendo base de datos de Render...</div>
          ) : condominios.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-sm">📭 No hay ningún condominio registrado en el SaaS.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="p-4">Identificador (ID)</th>
                    <th className="p-4">Nombre de la Propiedad</th>
                    <th className="p-4">Dirección</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {condominios.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-mono text-xs text-blue-400">{c.id}</td>
                      <td className="p-4 font-semibold text-white">{c.nombre}</td>
                      <td className="p-4 text-slate-400 text-xs">{c.direccion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}