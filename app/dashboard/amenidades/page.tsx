"use client";

import { useState, useEffect } from "react";

interface Amenidad {
  id: string;
  nombre: string;
  descripcion: string;
  montoRenta: number;
  capacidadMax: number;
}

export default function AmenidadesPage() {
  const [amenidades, setAmenidades] = useState<Amenidad[]>([]);
  const [amenidadId, setAmenidadId] = useState("");
  const [fechaUso, setFechaUso] = useState("");
  const [horaInicio, setHoraInicio] = useState("12:00");
  const [horaFin, setHoraFin] = useState("16:00");
  const [notas, setNotas] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const cargarAmenidades = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/amenidades/1", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAmenidades(data);
          if (data.length > 0) setAmenidadId(data[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    cargarAmenidades();
  }, []);

  const handleAgendarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaUso) return alert("Selecciona una fecha.");

    setCargando(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:3000/api/reservas/crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ amenidadId, fechaUso, horaInicio, horaFin, notas })
      });

      if (res.ok) {
        alert("🎉 Reservación agendada con éxito.");
        setFechaUso("");
        setNotas("");
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
        <h1 className="text-3xl font-bold">Amenidades y Reservaciones</h1>
        <p className="text-slate-400 text-sm">Gestiona y aparta el uso de las áreas comunes del complejo residencial.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4 h-fit">
          <h2 className="text-base font-semibold text-emerald-400">📅 Agendar Espacio</h2>
          <form onSubmit={handleAgendarReserva} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Selecciona Área Común</label>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={amenidadId} onChange={(e)=>setAmenidadId(e.target.value)}>
                {amenidades.map(a => <option key={a.id} value={a.id}>{a.nombre} (${a.montoRenta} MXN)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Fecha del Evento</label>
              <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={fechaUso} onChange={(e)=>setFechaUso(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Hora Inicio</label>
                <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={horaInicio} onChange={(e)=>setHoraInicio(e.target.value)} required />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Hora Fin</label>
                <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={horaFin} onChange={(e)=>setHoraFin(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Notas u Observaciones</label>
              <textarea rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={notas} onChange={(e)=>setNotas(e.target.value)} placeholder="Ej. Cumpleaños infantil, viene mobiliario externo..." />
            </div>
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg transition" disabled={cargando}>
              {cargando ? "Agendando..." : "Confirmar Apartado"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-slate-200">🏊 Áreas de Convivencia Disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {amenidades.map((a) => (
              <div key={a.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-sm flex items-center gap-2">🔹 {a.nombre}</h4>
                  <p className="text-slate-400 leading-relaxed">{a.descripcion}</p>
                </div>
                <div className="pt-2 border-t border-slate-900 flex justify-between text-[11px] text-slate-400">
                  <span>Capacidad: <b className="text-white">{a.capacidadMax} personas</b></span>
                  <span>Costo: <b className="text-emerald-400">${a.montoRenta} MXN</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}