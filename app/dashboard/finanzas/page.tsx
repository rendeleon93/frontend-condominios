"use client";

import { useState, useEffect } from "react";

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

export default function FinanzasDashboardPage() {
  // Estados para el catálogo de condominios dinámico
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cargandoCondos, setCargandoCondos] = useState(true);

  // Estados de formularios (Paso 1)
  const [nombreCuota, setNombreCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("10");
  const [tipoCuota, setTipoCuota] = useState("MANTENIMIENTO_ORDINARIO");

  // Estados de cargos masivos (Paso 2)
  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("7");
  const [anioSeleccionado, setAnioSeleccionado] = useState("2026");

  // Estado de la tabla de unidades
  const [unidades, setUnidades] = useState<UnidadFinanciera[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);

  // 1. Cargar el catálogo global de condominios al inicializar
  useEffect(() => {
    const cargarCatálogoCondominios = async () => {
      setCargandoCondos(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/api/admin/condominios", {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCondominios(data);
          if (data.length > 0) {
            setCondominioSeleccionadoId(data[0].id); // Preselecciona el primero
          }
        }
      } catch (error) {
        console.error("Error al obtener catálogo de condominios:", error);
      } finally {
        setCargandoCondos(false);
      }
    };

    cargarCatálogoCondominios();
  }, []);

  // 2. Extraer las unidades financieras cada vez que cambie el condominio seleccionado
  const cargarEstatusUnidades = async () => {
    if (!condominioSeleccionadoId) {
      setUnidades([]);
      return;
    }
    setCargandoUnidades(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:3000/api/admin/unidades/${condominioSeleccionadoId}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnidades(data);
      } else {
        setUnidades([]);
      }
    } catch (error) {
      console.error("Error al cargar unidades del condominio:", error);
    } finally {
      setCargandoUnidades(false);
    }
  };

  useEffect(() => {
    cargarEstatusUnidades();
  }, [condominioSeleccionadoId]);

  // 3. Guardar concepto en el catálogo enlazado al condominio activo
  const handleCrearCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominioSeleccionadoId) return alert("Por favor selecciona o registra un condominio primero.");

    try {
      const res = await fetch("http://localhost:3000/api/admin/cuotas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          condominioId: condominioSeleccionadoId,
          nombre: nombreCuota,
          monto: monto,
          tipo: tipoCuota,
          diaVencimiento: diaVencimiento,
        }),
      });

      if (res.ok) {
        const nuevaCuota = await res.json();
        alert(`🎉 Guardada con éxito. Copia este ID para la facturación masiva:\n\n${nuevaCuota.id}`);
        setNombreCuota("");
        setMonto("");
        setCuotaSeleccionadaId(nuevaCuota.id); // Autorellena el paso 2 por comodidad
      } else {
        alert("Error al guardar la cuota en el servidor.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  // 4. Lanzar cobro masivo del periodo seleccionado
  const handleGenerarCargosMasivos = async () => {
    if (!cuotaSeleccionadaId) return alert("Por favor ingresa el ID de la cuota base del paso 1.");
    
    try {
      const res = await fetch("http://localhost:3000/api/admin/generar-cargos-mes", {
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

      const data = await res.json();
      if (res.ok) {
        alert(`⚡ ${data.mensaje}`);
        cargarEstatusUnidades(); // Actualiza la tabla automáticamente
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-950 text-white min-h-screen">
      {/* HEADER PRINCIPAL */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Financiero de Administración</h1>
          <p className="text-slate-400 text-sm">Gestiona flujos, asigna mantenimiento mensual y audita departamentos.</p>
        </div>

        {/* SELECTOR GLOBAL DE ENTORNO */}
        <div className="w-full sm:w-72 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">🏢 Condominio Activo</label>
          {cargandoCondos ? (
            <div className="text-xs text-slate-500 animate-pulse py-1">Cargando complejos...</div>
          ) : (
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              value={condominioSeleccionadoId}
              onChange={(e) => setCondominioSeleccionadoId(e.target.value)}
            >
              {condominios.length === 0 ? (
                <option value="">No hay propiedades de alta</option>
              ) : (
                condominios.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))
              )}
            </select>
          )}
        </div>
      </header>

      <hr className="border-slate-800" />

      {/* SECCIÓN DE OPERACIONES (FORMULARIOS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CATALOGO DE CUOTAS */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
            <span>📋</span> 1. Crear Concepto de Cuota Base
          </h2>
          <form onSubmit={handleCrearCuota} className="space-y-4 text-sm">
            <div>
              <label className="block text-slate-400 mb-1">Nombre Comercial</label>
              <input
                type="text"
                placeholder="Ej. Mantenimiento Regular Torres"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                value={nombreCuota}
                onChange={(e) => setNombreCuota(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Monto Fijo ($)</label>
                <input
                  type="number"
                  placeholder="1800"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Día límite mensual</label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  placeholder="10"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                  value={diaVencimiento}
                  onChange={(e) => setDiaVencimiento(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Clasificación Contable</label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                value={tipoCuota}
                onChange={(e) => setTipoCuota(e.target.value)}
              >
                <option value="MANTENIMIENTO_ORDINARIO">Mantenimiento Ordinario</option>
                <option value="EXTRAORDINARIO">Cuota Extraordinaria</option>
                <option value="FONDO_RESERVA">Fondo de Reserva</option>
                <option value="MULTA">Multa / Penalización</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-lg transition">
              Registrar en Catálogo
            </button>
          </form>
        </div>

        {/* FACTURACIÓN MASIVA */}
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
              <span>🚀</span> 2. Disparar Facturación del Mes
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              El sistema asociará un nuevo cargo con estatus "PENDIENTE" a cada uno de los departamentos registrados en el condominio seleccionado arriba.
            </p>

            <div>
              <label className="block text-slate-400 mb-1">ID de la Cuota Catálogo</label>
              <input
                type="text"
                placeholder="Pega el ID o se autorellenará al hacer el paso 1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 font-mono text-xs text-emerald-400"
                value={cuotaSeleccionadaId}
                onChange={(e) => setCuotaSeleccionadaId(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Mes de Cobertura</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                >
                  <option value="1">Enero</option>
                  <option value="2">Febrero</option>
                  <option value="3">Marzo</option>
                  <option value="4">Abril</option>
                  <option value="5">Mayo</option>
                  <option value="6">Junio</option>
                  <option value="7">Julio</option>
                  <option value="8">Agosto</option>
                  <option value="9">Septiembre</option>
                  <option value="10">Octubre</option>
                  <option value="11">Noviembre</option>
                  <option value="12">Diciembre</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Año Fiscal</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerarCargosMasivos}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 rounded-lg transition mt-4"
          >
            Generar Cuentas por Cobrar
          </button>
        </div>
      </div>

      {/* DETALLE FINANCIERO DINÁMICO */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Estatus Financiero por Departamento</h2>
          <span className="text-xs bg-slate-800 px-3 py-1 rounded-full text-slate-400">
            {unidades.length} Unidades Totales
          </span>
        </div>

        {cargandoUnidades ? (
          <div className="p-10 text-center text-slate-500 text-sm animate-pulse">
            ⏳ Extrayendo registros financieros en tiempo real desde Render...
          </div>
        ) : unidades.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            📭 No hay departamentos vinculados a este condominio o no se han generado cargos activos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs tracking-wider">
                <tr>
                  <th className="p-4">ID Sistema</th>
                  <th className="p-4">Departamento / Unidad</th>
                  <th className="p-4">Monto Último Cargo</th>
                  <th className="p-4 text-center">Estatus del Periodo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {unidades.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-500">{u.id}</td>
                    <td className="p-4 font-semibold text-white">Depto {u.unidad}</td>
                    <td className="p-4 font-medium text-slate-200">
                      ${u.monto.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.clase}`}>
                        {u.estatus}
                      </span>
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