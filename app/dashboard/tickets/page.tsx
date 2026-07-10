"use client";

import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  createdAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [titulo, setTitulo] = useState("");
  const [prioridad, setPrioridad] = useState("MEDIA");
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargarBitacora = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/tickets/1", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setTickets(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarBitacora();
  }, []);

  const handleCrearTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !descripcion) return alert("Completa los campos necesarios.");

    setCargando(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/tickets/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          condominioId: "1",
          unidadId: "depto 101",
          titulo,
          descripcion,
          prioridad
        })
      });

      if (res.ok) {
        alert("🎉 Reporte técnico levantado correctamente.");
        setTitulo("");
        setDescripcion("");
        cargarBitacora();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-950 text-white min-h-screen">
      <div>
        <h1 className="text-3xl font-bold">Bitácora de Mantenimiento</h1>
        <p className="text-slate-400 text-sm">Levanta reportes por fallas estructurales o administra órdenes de trabajo técnico.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4 h-fit">
          <h2 className="text-base font-semibold text-amber-400">🚨 Levantar Reporte de Incidencia</h2>
          <form onSubmit={handleCrearTicket} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Título de la Falla</label>
              <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={titulo} onChange={(e)=>setTitulo(e.target.value)} placeholder="Ej. Fuga de agua en pasillo" required />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Nivel de Prioridad</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none cursor-pointer" value={prioridad} onChange={(e)=>setPrioridad(e.target.value)}>
                <option value="BAJA">Baja - Ajuste Menor</option>
                <option value="MEDIA">Media - Reparación Regular</option>
                <option value="ALTA">Alta - Urgente</option>
                <option value="CRITICA">Crítica - Peligro Inmediato</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Descripción Detallada</label>
              <textarea rows={4} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={descripcion} onChange={(e)=>setDescripcion(e.target.value)} placeholder="Describe a detalle lo ocurrido..." required />
            </div>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg transition" disabled={cargando}>
              {cargando ? "Registrando..." : "Enviar Reporte Técnico"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <h2 className="text-base font-semibold text-slate-200">📋 Historial de Órdenes en Proceso</h2>
          <div className="space-y-2.5 max-h-[450px] overflow-y-auto text-xs pr-1">
            {tickets.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No hay incidencias reportadas en el complejo actualmente.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-200 text-sm">{t.titulo}</h4>
                    <p className="text-slate-400 leading-relaxed">{t.descripcion}</p>
                    <span className="block text-[10px] text-slate-500">{new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 border border-slate-700">{t.prioridad}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">{t.estado}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}