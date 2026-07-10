"use client";

import { useState, useEffect } from "react";

interface Unidad {
  id: string;
  unidad: string;
}

export default function PortalResidentesPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [unidadSeleccionadaId, setUnidadSeleccionadaId] = useState("");
  const [nombreVisita, setNombreVisita] = useState("");
  const [placas, setPlacas] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // 1. Cargar las unidades del condominio "1" para amarrar la llave foránea real
  useEffect(() => {
    const cargarUnidadesCatálogo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/admin/unidades/1", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnidades(data);
          if (data.length > 0) {
            setUnidadSeleccionadaId(data[0].id); // Captura el ID real de Render (UUID o numérico)
          }
        }
      } catch (err) {
        console.error("Error al cargar unidades en residentes:", err);
      }
    };

    cargarUnidadesCatálogo();
  }, []);

  const handleExtraerInvitacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadSeleccionadaId) return alert("No hay unidades disponibles para asociar la visita.");

    setCargando(true);
    setCodigoGenerado(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/residentes/crear-invitacion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          condominioId: "1",
          unidadId: unidadSeleccionadaId, // 🔥 Aquí mandamos el ID real de la base de datos
          nombreVisita,
          placas: placas || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCodigoGenerado(data.codigoQR);
        setNombreVisita("");
        setPlacas("");
      } else {
        alert(`Error al generar código: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error crítico de conexión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-950 text-white min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Portal de Residentes</h1>
        <p className="text-slate-400 text-sm">Genera accesos express para tus familiares, amigos o personal de servicios técnicos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* FORMULARIO */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-purple-400 flex items-center gap-2">🎟️ Crear Invitación Prevista</h2>
          <form onSubmit={handleExtraerInvitacion} className="space-y-4 text-sm">
            
            {/* SELECTOR ASOCIADO A RELACIONES REALES */}
            <div>
              <label className="block text-slate-400 mb-1">🏢 Tu Departamento / Unidad</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500 cursor-pointer font-sans"
                value={unidadSeleccionadaId}
                onChange={(e) => setUnidadSeleccionadaId(e.target.value)}
              >
                {unidades.length === 0 ? (
                  <option value="">Cargando propiedades físicas...</option>
                ) : (
                  unidades.map((u) => (
                    <option key={u.id} value={u.id}>Depto {u.unidad} (ID: {u.id})</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Nombre del Invitado</label>
              <input 
                type="text" 
                placeholder="Ej. René de León" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                value={nombreVisita}
                onChange={(e) => setNombreVisita(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Placas del Auto (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. SAG320B" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                value={placas}
                onChange={(e) => setPlacas(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-lg transition"
              disabled={cargando || !unidadSeleccionadaId}
            >
              {cargando ? "Generando..." : "Generar Código de Acceso"}
            </button>
          </form>
        </div>

        {/* CONTENEDOR DERECHO */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          {codigoGenerado ? (
            <div className="space-y-4 animate-fade-in">
              <div className="text-emerald-400 text-5xl">✅</div>
              <h3 className="text-lg font-bold text-slate-200">¡Acceso Autorizado Creado!</h3>
              <p className="text-xs text-slate-400 max-w-xs">Comparte este código con tu visitante para presentarlo en la caseta:</p>
              <div className="bg-slate-950 border border-slate-800 px-6 py-4 rounded-xl font-mono text-2xl font-bold tracking-widest text-purple-400 border-dashed">
                {codigoGenerado}
              </div>
              <button 
                onClick={() => navigator.clipboard.writeText(codigoGenerado)}
                className="text-xs text-slate-400 hover:text-white underline transition cursor-pointer"
              >
                Copiar Código al Portapapeles
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-slate-500 max-w-xs">
              <div className="text-4xl">📲</div>
              <p className="text-sm">Los accesos generados aparecerán en este cuadro listos para compartir por WhatsApp.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}