"use client";

import { useState } from "react";

interface VisitaInfo {
  id: string;
  nombreVisita: string;
  codigoQR: string;
  fechaIngreso: string;
  placas: string | null;
  observaciones: string | null;
}

export default function CasetaControlPage() {
  const [codigoQR, setCodigoQR] = useState("");
  const [placas, setPlacas] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  const [resultadoVisita, setResultadoVisita] = useState<VisitaInfo | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const handleValidarAcceso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoQR) return alert("Por favor, introduce un código de invitación.");

    setCargando(true);
    setResultadoVisita(null);
    setMensajeError(null);

    try {
      const token = localStorage.getItem("token");
      // 🔥 Corregido: Apuntando al puerto local 3000 de desarrollo
      const res = await fetch("http://localhost:3000/api/seguridad/validar-qr", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          codigoQR: codigoQR.trim(),
          placas: placas || undefined,
          observaciones: observaciones || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setResultadoVisita(data.visita);
        setCodigoQR("");
        setPlacas("");
        setObservaciones("");
      } else {
        setMensajeError(data.error || "Código inválido o ya utilizado.");
      }
    } catch (err) {
      console.error(err);
      setMensajeError("Error de comunicación con el servidor central.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-slate-950 text-white min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Caseta de Control de Accesos</h1>
        <p className="text-slate-400 text-sm">Validación de códigos QR de invitados y registro de ingresos vehiculares.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        {/* FORMULARIO DEL GUARDIA */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-cyan-400 flex items-center gap-2">🔍 Escanear / Validar Invitación</h2>
          <form onSubmit={handleValidarAcceso} className="space-y-4 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Código QR (Token de Texto)</label>
              <input 
                type="text" 
                placeholder="PEGA O ESCRIBE EL CÓDIGO DEL INVITADO" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono uppercase tracking-wider focus:outline-none focus:border-cyan-500"
                value={codigoQR}
                onChange={(e) => setCodigoQR(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Placas Vehiculares (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. RV-432-A" 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                value={placas}
                onChange={(e) => setPlacas(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Observaciones del Guardia</label>
              <textarea 
                placeholder="Ej. Entrega paquete de Amazon o viene con acompañantes" 
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold py-2.5 rounded-lg transition"
              disabled={cargando}
            >
              {cargando ? "Verificando..." : "Verificar e Ingresar"}
            </button>
          </form>
        </div>

        {/* MONITOR DE RESULTADO DERECHO */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
          {resultadoVisita ? (
            <div className="space-y-4 w-full max-w-sm p-4 bg-slate-950/50 rounded-xl border border-emerald-500/20 animate-fade-in">
              <div className="text-emerald-400 text-5xl">🟢</div>
              <h3 className="text-xl font-bold text-emerald-400 tracking-wide">INGRESO PERMITIDO</h3>
              <div className="text-left space-y-2 pt-2 border-t border-slate-800 text-xs">
                <p><span className="text-slate-400">Invitado:</span> <span className="text-white font-bold text-sm">{resultadoVisita.nombreVisita}</span></p>
                <p><span className="text-slate-400">Pase Código:</span> <span className="font-mono text-purple-400 font-bold">{resultadoVisita.codigoQR}</span></p>
                <p><span className="text-slate-400">Ubicación Destino:</span> <span className="text-white font-semibold">Depto 101 (Torre foresta)</span></p>
                <p><span className="text-slate-400">Placas Registradas:</span> <span className="text-white font-mono">{resultadoVisita.placas || "No especificadas"}</span></p>
                <p><span className="text-slate-400">Hora de Entrada:</span> <span className="text-amber-400 font-mono">{new Date(resultadoVisita.fechaIngreso).toLocaleTimeString()}</span></p>
              </div>
            </div>
          ) : mensajeError ? (
            <div className="space-y-3 w-full max-w-sm p-6 bg-slate-950/50 rounded-xl border border-rose-500/20 animate-fade-in">
              <div className="text-rose-500 text-5xl">🔴</div>
              <h3 className="text-xl font-bold text-rose-500 tracking-wide">ACCESO DENEGADO</h3>
              <p className="text-xs text-slate-400">{mensajeError}</p>
            </div>
          ) : (
            <div className="space-y-3 text-slate-500 max-w-xs">
              <div className="text-4xl">📋</div>
              <p className="text-sm">Esperando lectura de código en los accesos vehiculares/peatonales.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}