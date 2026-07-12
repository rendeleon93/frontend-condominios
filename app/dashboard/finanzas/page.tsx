"use client";

import { useState, useEffect } from "react";

interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
}

interface CuotaCatalogo {
  id: string;
  nombre: string;
  monto: number;
  tipo: string;
}

interface UnidadFinanciera {
  id: string;
  unidad: string;
  estatus: "PENDIENTE" | "PAGADO" | "PARCIAL" | "VENCIDO";
  monto: number;
  cargoId: string | null;
}

interface ResumenFinanciero {
  totalRecaudado: number;
  porCobrar: number;
  morosidad: number;
}

export default function FinanzasDashboardPage() {
  const API_BASE_URL = "https://backend-condominios.onrender.com";

  // 🚨 SOLUCIÓN PARA HYDRATION: Estado para verificar el montaje en el cliente
  const [mounted, setMounted] = useState(false);

  // Catálogos globales
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cargandoCondos, setCargandoCondos] = useState(true);
  const [cuotasDisponibles, setCuotasDisponibles] = useState<CuotaCatalogo[]>([]);

  // Estados financieros protegidos
  const [resumen, setResumen] = useState<ResumenFinanciero>({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });

  // Estados de formularios (Paso 1)
  const [nombreCuota, setNombreCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("10");
  const [tipoCuota, setTipoCuota] = useState("MANTENIMIENTO_ORDINARIO");

  // Estados de cargos masivos (Paso 2)
  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("7");
  const [anioSeleccionado, setAnioSeleccionado] = useState("2026");

  // Estados de la tabla y filtros
  const [unidades, setUnidades] = useState<UnidadFinanciera[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");

  // Activar montaje seguro
  useEffect(() => {
    setMounted(true);
  }, []);

  const obtenerEstiloEstatus = (estatus: UnidadFinanciera["estatus"]) => {
    const estilos = {
      PAGADO: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      PENDIENTE: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      VENCIDO: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
      PARCIAL: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    };
    return estilos[estatus] || "bg-slate-800 text-slate-400";
  };

  // 1. Cargar condominios al inicializar
  useEffect(() => {
    if (!mounted) return;
    const cargarCatalogoCondominios = async () => {
      setCargandoCondos(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/admin/condominios`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCondominios(data);
            setCondominioSeleccionadoId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Error cargando condominios:", error);
      } finally {
        setCargandoCondos(false);
      }
    };
    cargarCatalogoCondominios();
  }, [mounted]);

  // 2. Extraer información financiera completa del condominio seleccionado
  const cargarDatosDelCondominio = async () => {
    if (!condominioSeleccionadoId) {
      setUnidades([]);
      setResumen({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
      return;
    }
    setCargandoUnidades(true);
    const token = localStorage.getItem("token");

    try {
      const resUnidades = await fetch(`${API_BASE_URL}/api/admin/unidades/${condominioSeleccionadoId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (resUnidades.ok) {
        const payload = await resUnidades.json();
        
        if (payload && payload.unidades) {
          setUnidades(Array.isArray(payload.unidades) ? payload.unidades : []);
        } else {
          setUnidades(Array.isArray(payload) ? payload : []);
        }

        if (payload && payload.resumen) {
          setResumen({
            totalRecaudado: payload.resumen.totalRecaudado || 0,
            porCobrar: payload.resumen.porCobrar || 0,
            morosidad: payload.resumen.morosidad || 0
          });
        }
      }

      const resCuotas = await fetch(`${API_BASE_URL}/api/admin/cuotas?condominioId=${condominioSeleccionadoId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (resCuotas.ok) {
        const dataCuotas = await resCuotas.json();
        if (Array.isArray(dataCuotas)) {
          setCuotasDisponibles(dataCuotas);
          if (dataCuotas.length > 0) setCuotaSeleccionadaId(dataCuotas[0].id);
          else setCuotaSeleccionadaId("");
        }
      }
    } catch (error) {
      console.error("Error al cargar datos del condominio:", error);
    } finally {
      setCargandoUnidades(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      cargarDatosDelCondominio();
    }
  }, [condominioSeleccionadoId, mounted]);

  // 3. Crear Concepto
  const handleCrearCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominioSeleccionadoId) return alert("Selecciona un condominio primero.");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cuotas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          condominioId: condominioSeleccionadoId,
          nombre: nombreCuota,
          monto: Number(monto),
          tipo: tipoCuota,
          diaVencimiento: Number(diaVencimiento),
        }),
      });

      if (res.ok) {
        alert("🎉 Concepto integrado al catálogo.");
        setNombreCuota("");
        setMonto("");
        cargarDatosDelCondominio();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Disparar cargos masivos
  const handleGenerarCargosMasivos = async () => {
    if (!cuotaSeleccionadaId) return alert("Selecciona una cuota del catálogo.");
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generar-cargos-mes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          cuotaId: cuotaSeleccionadaId,
          anio: anioSeleccionado,
          mes: mesSeleccionado,
        }),
      });
      if (res.ok) {
        alert("⚡ Cargos masivos generados con éxito.");
        cargarDatosDelCondominio();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 5. Acción rápida: Registrar pago directo de una unidad
  const handleRegistrarPago = async (cargoId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cargos/${cargoId}/pagar`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        cargarDatosDelCondominio();
      } else {
        alert("No se pudo registrar el pago.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrado lógico local en Frontend
  const unidadesFiltradas = (unidades || []).filter((u) => {
    const nombreUnidad = u?.unidad ? String(u.unidad) : "";
    const coincideBusqueda = nombreUnidad.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstatus = filtroEstatus === "TODOS" || u?.estatus === filtroEstatus;
    return coincideBusqueda && coincideEstatus;
  });

  // 🚨 SI NO HA SIDO MONTADO, RETORNA UN ESQUELETO O NADA PARA EVITAR DESFASES DE SSR
  if (!mounted) {
    return <div className="p-6 text-center text-slate-500 text-sm">Cargando Panel...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-950 text-white min-h-screen font-sans">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Panel Financiero de Administración</h1>
          <p className="text-slate-400 text-sm">Gestiona flujos, asigna mantenimiento mensual y audita departamentos.</p>
        </div>

        <div className="w-full sm:w-72 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">🏢 Condominio Activo</label>
          <select
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none cursor-pointer"
            value={condominioSeleccionadoId}
            onChange={(e) => setCondominioSeleccionadoId(e.target.value)}
          >
            {condominios.length === 0 ? (
              <option value="">Cargando propiedades...</option>
            ) : (
              condominios.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))
            )}
          </select>
        </div>
      </header>

      {/* TARJETAS KPI */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Recaudado</p>
          <p className="text-2xl font-bold text-emerald-400">
            ${(resumen?.totalRecaudado || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Por Cobrar</p>
          <p className="text-2xl font-bold text-amber-400">
            ${(resumen?.porCobrar || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-2">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Morosidad</p>
          <p className="text-2xl font-bold text-rose-400">{resumen?.morosidad || 0}%</p>
        </div>
      </section>

      {/* FORMULARIOS OPERATIVOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Catálogo */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">📋 1. Crear Concepto Base</h2>
          <form onSubmit={handleCrearCuota} className="space-y-4 text-sm">
            <input
              type="text"
              placeholder="Ej. Mantenimiento Regular Torres"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
              value={nombreCuota}
              onChange={(e) => setNombreCuota(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Monto Fijo ($)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                max="28"
                placeholder="Día límite mensual"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                value={diaVencimiento}
                onChange={(e) => setDiaVencimiento(e.target.value)}
                required
              />
            </div>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              value={tipoCuota}
              onChange={(e) => setTipoCuota(e.target.value)}
            >
              <option value="MANTENIMIENTO_ORDINARIO">Mantenimiento Ordinario</option>
              <option value="EXTRAORDINARIO">Cuota Extraordinaria</option>
            </select>
            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg transition">
              Registrar en Catálogo
            </button>
          </form>
        </div>

        {/* Facturación Masiva */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">🚀 2. Disparar Facturación</h2>
            {cuotasDisponibles.length === 0 ? (
              <div className="text-xs bg-slate-950 border border-dashed border-slate-800 rounded-lg p-4 text-amber-400 text-center">
                ⚠️ Registra una cuota en el Paso 1 para habilitar la facturación.
              </div>
            ) : (
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono focus:outline-none"
                value={cuotaSeleccionadaId}
                onChange={(e) => setCuotaSeleccionadaId(e.target.value)}
              >
                {cuotasDisponibles.map((cuota) => (
                  <option key={cuota.id} value={cuota.id}>{cuota.nombre} — ${cuota.monto} MXN</option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}>
                <option value="7">Julio</option>
                <option value="8">Agosto</option>
                <option value="9">Septiembre</option>
              </select>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)}>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerarCargosMasivos} disabled={cuotasDisponibles.length === 0} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg transition mt-4 disabled:opacity-40">
            Generar Cuentas por Cobrar
          </button>
        </div>
      </div>

      {/* TABLA Y FILTROS INTERACTIVOS */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/50">
          <h2 className="text-xl font-semibold text-slate-200">Estatus Financiero por Departamento</h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Buscar unidad (Ej. 101)..."
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-full sm:w-48 text-white"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <select
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none text-slate-300 cursor-pointer"
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
            >
              <option value="TODOS">Todos los Estatus</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PAGADO">Pagados</option>
              <option value="VENCIDO">Vencidos</option>
            </select>
          </div>
        </div>

        {cargandoUnidades ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">⏳ Extrayendo registros financieros en tiempo real...</div>
        ) : unidadesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">📭 No se encontraron registros coincidentes.</div>
        ) : (
          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4">ID Sistema</th>
                  <th className="p-4">Departamento / Unidad</th>
                  <th className="p-4">Último Cargo</th>
                  <th className="p-4 text-center">Estatus del Periodo</th>
                  <th className="p-4 text-center">Acciones de Cobro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unidadesFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-blue-400">{u.id}</td>
                    <td className="p-4 font-semibold text-white">Depto {u?.unidad || "S/N"}</td>
                    <td className="p-4 font-medium text-slate-300">
                      ${(u?.monto || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${obtenerEstiloEstatus(u?.estatus)}`}>
                        {u?.estatus || "PENDIENTE"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {u?.cargoId && u?.estatus !== "PAGADO" ? (
                        <button
                          onClick={() => handleRegistrarPago(u.cargoId!)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded-md text-xs transition shadow-sm"
                        >
                          Liquidar Deuda
                        </button>
                      ) : u?.estatus === "PAGADO" ? (
                        <span className="text-emerald-400 text-xs font-medium">✅ Al corriente</span>
                      ) : (
                        <span className="text-slate-500 text-xs">Sin cargos activos</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}