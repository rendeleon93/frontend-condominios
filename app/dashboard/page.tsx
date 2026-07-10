"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Condominio {
  id: string;
  nombre: string;
  direccion: string;
}

interface UnidadFinanciera {
  id: string;
  unidad: string;
  estatus: "PENDIENTE" | "PAGADO" | "PARCIAL" | "VENCIDO";
  monto: number;
  clase: string;
}

export default function DashboardPrincipalPage() {
  const router = useRouter();

  // Estados de carga de datos
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cargandoCondos, setCargandoCondos] = useState(true);
  const [unidades, setUnidades] = useState<UnidadFinanciera[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);

  // Estados de filtros tipo Facturama
  const [periodoFiltro, setPeriodoFiltro] = useState("Mensual");
  const [mesFiltro, setMesFiltro] = useState("Julio");
  const [anioFiltro, setAnioFiltro] = useState("2026");

  // Formulario rápido para agregar departamento en el mismo flujo
  const [idUnidadManual, setIdUnidadManual] = useState("");
  const [numeroUnidad, setNumeroUnidad] = useState("");
  const [pisoUnidad, setPisoUnidad] = useState("1");

  // 1. Catálogo inicial de condominios
  useEffect(() => {
    const cargarCondominios = async () => {
      setCargandoCondos(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/admin/condominios", {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCondominios(data);
          if (data.length > 0) setCondominioSeleccionadoId(data[0].id);
        }
      } catch (err) {
        console.error("Error al traer condominios:", err);
      } finally {
        setCargandoCondos(false);
      }
    };
    cargarCondominios(); // ✨ Corregido aquí de forma definitiva
  }, []);

  // 2. Censo de unidades conectadas
  const cargarUnidadesDelCondominio = async () => {
    if (!condominioSeleccionadoId) return;
    setCargandoUnidades(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/admin/unidades/${condominioSeleccionadoId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnidades(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargandoUnidades(false);
    }
  };

  useEffect(() => {
    cargarUnidadesDelCondominio();
  }, [condominioSeleccionadoId]);

  // 3. Crear departamento rápido
  const handleRegistrarDepartamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominioSeleccionadoId) return;

    try {
      const res = await fetch("http://localhost:3000/api/admin/unidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          id: idUnidadManual || undefined,
          numeroUnidad,
          piso: pisoUnidad,
          condominioId: condominioSeleccionadoId,
        }),
      });

      if (res.ok) {
        alert("🎉 Departamento guardado con éxito.");
        setIdUnidadManual("");
        setNumeroUnidad("");
        setPisoUnidad("1");
        cargarUnidadesDelCondominio();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // KPIs Financieros mapeados
  const totalRecaudado = unidades.filter(u => u.estatus === "PAGADO").reduce((acc, curr) => acc + curr.monto, 0);
  const totalPorCobrar = unidades.filter(u => u.estatus === "PENDIENTE" || u.estatus === "VENCIDO").reduce((acc, curr) => acc + curr.monto, 0);
  const morosidad = unidades.length > 0 ? Math.round((unidades.filter(u => u.estatus === "VENCIDO").length / unidades.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 bg-slate-950 text-white min-h-screen font-sans">
      
      {/* HEADER DE BIENVENIDA Y CONDOMINIO ACTIVO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            ✨ Sigmato PropTech 
            <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md font-mono">v1.5.0</span>
          </h1>
          <p className="text-slate-400 text-xs">Gestión y administración integral de complejos habitacionales.</p>
        </div>
        <div className="w-full md:w-64 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Complejo Seleccionado</span>
          <select 
            className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pt-0.5"
            value={condominioSeleccionadoId}
            onChange={(e) => setCondominioSeleccionadoId(e.target.value)}
          >
            {condominios.map(c => <option key={c.id} value={c.id} className="bg-slate-950">{c.nombre}</option>)}
          </select>
        </div>
      </header>

      {/* CUADRÍCULA EXPANDIDA A 6 MÓDULOS DE ACCESO DIRECTO */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. FINANZAS */}
        <div 
          onClick={() => router.push("/dashboard/finanzas")}
          className="bg-gradient-to-br from-blue-600/90 to-blue-800 p-4 rounded-xl border border-blue-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Módulo de Finanzas</h3>
            <p className="text-[11px] text-blue-100/80">Cobros masivos y cuotas base.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">💵</span>
        </div>

        {/* 2. CASETA DE ACCESOS */}
        <div 
          onClick={() => router.push("/dashboard/caseta")}
          className="bg-gradient-to-br from-cyan-600/90 to-cyan-800 p-4 rounded-xl border border-cyan-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Caseta de Control</h3>
            <p className="text-[11px] text-cyan-100/80">Validar QRs y registro vehicular.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">🛡️</span>
        </div>

        {/* 3. PORTAL DE RESIDENTES */}
        <div 
          onClick={() => router.push("/dashboard/residentes")}
          className="bg-gradient-to-br from-purple-600/90 to-purple-800 p-4 rounded-xl border border-purple-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Portal Residentes</h3>
            <p className="text-[11px] text-purple-100/80">Crear invitaciones express rápidas.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">📲</span>
        </div>

        {/* 4. BITÁCORA DE TICKETS */}
        <div 
          onClick={() => router.push("/dashboard/tickets")}
          className="bg-gradient-to-br from-amber-600/90 to-amber-800 p-4 rounded-xl border border-amber-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Reportes Técnicos</h3>
            <p className="text-[11px] text-amber-100/80">Levantar tickets e incidencias de staff.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">🛠️</span>
        </div>

        {/* 5. RESERVACIONES DE AMENIDADES */}
        <div 
          onClick={() => router.push("/dashboard/amenidades")}
          className="bg-gradient-to-br from-emerald-600/90 to-emerald-800 p-4 rounded-xl border border-emerald-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Amenidades y Reservas</h3>
            <p className="text-[11px] text-emerald-100/80">Control de palapas, albercas y canchas.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">🏊</span>
        </div>

        {/* 6. ALTA DE COMPLEJOS / TORRES */}
        <div 
          onClick={() => router.push("/dashboard/condominios")}
          className="bg-gradient-to-br from-indigo-600/90 to-indigo-800 p-4 rounded-xl border border-indigo-500/30 shadow-lg cursor-pointer hover:scale-[1.01] transition-all group flex items-start justify-between"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:underline">Complejos Residenciales</h3>
            <p className="text-[11px] text-indigo-100/80">Dar de alta nuevas torres y complejos.</p>
          </div>
          <span className="text-xl p-1.5 bg-white/10 rounded-lg">🏢</span>
        </div>
      </section>

      {/* BLOQUE FACTURAMA: CONSULTA DE ESTADÍSTICAS POR PERIODO */}
      <section className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between shadow-md">
        <div className="w-full lg:w-auto">
          <h4 className="text-sm font-bold text-slate-200">Filtrar Reportes Estadísticos</h4>
          <p className="text-[11px] text-slate-400">Visualiza el flujo de cobranza ajustando el corte temporal.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 w-full lg:w-auto flex-1 max-w-xl text-xs">
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[9px] uppercase font-semibold text-slate-500 mb-0.5">Periodo</span>
            <select className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer" value={periodoFiltro} onChange={(e)=>setPeriodoFiltro(e.target.value)}>
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[9px] uppercase font-semibold text-slate-500 mb-0.5">Mes</span>
            <select className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer" value={mesFiltro} onChange={(e)=>setMesFiltro(e.target.value)}>
              <option value="Julio">Julio</option>
              <option value="Agosto">Agosto</option>
            </select>
          </div>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex flex-col">
            <span className="text-[9px] uppercase font-semibold text-slate-500 mb-0.5">Año Fiscal</span>
            <select className="bg-transparent font-medium text-slate-200 focus:outline-none cursor-pointer" value={anioFiltro} onChange={(e)=>setAnioFiltro(e.target.value)}>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>
        <button 
          onClick={cargarUnidadesDelCondominio}
          className="w-full lg:w-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-3 rounded-lg text-xs transition shadow-md"
        >
          Consultar Periodo
        </button>
      </section>

      {/* DASHBOARD PRINCIPAL EN DOS COLUMNAS */}
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: TABLA FINANCIERA DE UNIDADES */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total Recaudado</span>
              <h3 className="text-xl font-bold text-emerald-400">${totalRecaudado.toLocaleString("es-MX")}</h3>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Por Cobrar</span>
              <h3 className="text-xl font-bold text-amber-400">${totalPorCobrar.toLocaleString("es-MX")}</h3>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Morosidad</span>
              <h3 className="text-xl font-bold text-rose-400">{morosidad}%</h3>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-sm font-bold text-slate-200">Estatus de Cuentas por Unidad</h2>
              <span className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2.5 py-0.5 rounded-full font-medium">{unidades.length} Activas</span>
            </div>

            {cargandoUnidades ? (
              <div className="p-12 text-center text-xs text-slate-500 animate-pulse">⏳ Sincronizando datos con Postgres...</div>
            ) : unidades.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">📭 No hay departamentos en este complejo residencial.</div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="p-3">ID Sistema</th>
                      <th className="p-3">Unidad</th>
                      <th className="p-3">Recibo</th>
                      <th className="p-3">Monto Cuota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {unidades.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition">
                        <td className="p-3 font-mono text-blue-400 text-[11px]">{u.id}</td>
                        <td className="p-3 font-semibold text-slate-200">Depto {u.unidad}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.clase}`}>{u.estatus}</span>
                        </td>
                        <td className="p-3 font-medium text-slate-300">${u.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: SIDEBAR DE ACCIONES Y AVISOS */}
        <div className="space-y-4">
          
          {/* REGISTRO RÁPIDO INTERNO */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🏢 Registro Express de Unidad</h3>
            <form onSubmit={handleRegistrarDepartamento} className="space-y-2.5">
              <input
                type="text"
                placeholder="ID Manual (Ej. depto-102)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
                value={idUnidadManual}
                onChange={(e) => setIdUnidadManual(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nº Unidad"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  value={numeroUnidad}
                  onChange={(e) => setNumeroUnidad(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Piso"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none"
                  value={pisoUnidad}
                  onChange={(e) => setPisoUnidad(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-lg font-sans transition mt-1">
                Guardar Departamento
              </button>
            </form>
          </div>

          {/* AVISOS INTERNOS SIMULADOS TIPO FACTURAMA */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Avisos y Novedades</h3>
            <div className="space-y-3 divide-y divide-slate-800/80">
              <div className="pt-0 space-y-1">
                <h5 className="text-blue-400 font-bold hover:underline cursor-pointer">Asamblea Ordinaria de Condóminos</h5>
                <p className="text-[10px] text-slate-400">Revisión del presupuesto anual para mantenimiento de áreas comunes este fin de semana...</p>
              </div>
              <div className="pt-2.5 space-y-1">
                <h5 className="text-amber-400 font-bold hover:underline cursor-pointer">Mantenimiento preventivo de Elevadores</h5>
                <p className="text-[10px] text-slate-400">Torre Forestal suspenderá el servicio en el cubo B el próximo martes de 9:00 AM a 1:00 PM.</p>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}