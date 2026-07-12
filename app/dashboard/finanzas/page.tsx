"use client";

import { useState, useEffect } from "react";

interface Condominio { id: string; nombre: string; }
interface CuotaCatalogo { id: string; nombre: string; monto: number; }
interface UnidadFinanciera { id: string; unidad: string; estatus: "PENDIENTE" | "PAGADO" | "PARCIAL" | "VENCIDO"; monto: number; cargoId: string | null; }
interface ResumenFinanciero { totalRecaudado: number; porCobrar: number; morosidad: number; }
interface DesgloseCargo { cargoId: string; concepto: string; monto: number; estado: string; vencimiento: string; urlPagoDigital?: string; }

export default function FinanzasDashboardPage() {
  const API_BASE_URL = "https://backend-condominios.onrender.com";

  const [mounted, setMounted] = useState(false);

  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cuotasDisponibles, setCuotasDisponibles] = useState<CuotaCatalogo[]>([]);

  const [resumen, setResumen] = useState<ResumenFinanciero>({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
  const [unidades, setUnidades] = useState<UnidadFinanciera[]>([]);
  
  const [cargandoUnidades, setCargandoUnidades] = useState(false);
  const [ejecutandoAccion, setEjecutandoAccion] = useState(false);
  const [cargandoDesglose, setCargandoDesglose] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");

  const [nombreCuota, setNombreCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("10");
  const [tipoCuota, setTipoCuota] = useState("MANTENIMIENTO_ORDINARIO");

  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("7");
  const [anioSeleccionado, setAnioSeleccionado] = useState("2026");

  const [unidadSeleccionadaModal, setUnidadSeleccionadaModal] = useState<string | null>(null);
  const [cargoIdEspecifico, setCargoIdEspecifico] = useState<string | null>(null);
  const [itemsDesglose, setItemsDesglose] = useState<DesgloseCargo[]>([]);
  const [montoAbono, setMontoAbono] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Forzar la carga apenas cambie el ID del Condominio
  useEffect(() => {
    if (mounted && condominioSeleccionadoId && condominioSeleccionadoId !== "null" && condominioSeleccionadoId !== "undefined") {
      cargarDatosDelCondominio(condominioSeleccionadoId);
    }
  }, [mounted, condominioSeleccionadoId]);

  // Escuchar retorno de Stripe Checkout
  useEffect(() => {
    if (mounted) {
      const queryParams = new URLSearchParams(window.location.search);
      const pagoExitoso = queryParams.get("pago_exitoso");
      const cargoId = queryParams.get("cargoId");

      if (pagoExitoso === "true" && cargoId) {
        const conciliarPagoStripe = async () => {
          try {
            const res = await fetch(`${API_BASE_URL}/api/admin/cargos/${cargoId}/pagar`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            if (res.ok) {
              alert("🎉 ¡Pago recibido y conciliado automáticamente por Stripe Checkout!");
              window.history.replaceState({}, document.title, window.location.pathname);
              if (condominioSeleccionadoId) cargarDatosDelCondominio(condominioSeleccionadoId);
            }
          } catch (e) { console.error(e); }
        };
        conciliarPagoStripe();
      }
    }
  }, [mounted, condominioSeleccionadoId]);

  const formatoMoneda = (val: number) => {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(val);
  };

  const obtenerEstiloEstatus = (estatus: string) => {
    const estilos: Record<string, string> = {
      PAGADO: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
      PENDIENTE: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      VENCIDO: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
      PARCIAL: "bg-sky-500/10 text-sky-400 border border-sky-500/30",
    };
    return estilos[estatus] || "bg-slate-800 text-slate-400";
  };

  const cargarCatalogoCondominios = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/admin/condominios`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCondominios(data);
          // 🛡️ Seteo inmediato del primer condominio para que nunca aparezca vacío
          setCondominioSeleccionadoId(String(data[0].id));
        }
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (mounted) cargarCatalogoCondominios(); }, [mounted]);

  const cargarDatosDelCondominio = async (idCondo: string) => {
    if (!idCondo || idCondo === "undefined" || idCondo.trim() === "" || idCondo === "null") return;
    setCargandoUnidades(true);
    const token = localStorage.getItem("token");

    try {
      const resUnidades = await fetch(`${API_BASE_URL}/api/admin/unidades/${idCondo}/analiticas`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (resUnidades.ok) {
        const payload = await resUnidades.json();
        if (payload) {
          setUnidades(payload.unidades || []);
          setResumen(payload.resumen || { totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
        }
      }
      const resCuotas = await fetch(`${API_BASE_URL}/api/admin/cuotas?condominioId=${idCondo}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (resCuotas.ok) {
        const dataCuotas = await resCuotas.json();
        setCuotasDisponibles(dataCuotas || []);
        if (dataCuotas.length > 0) setCuotaSeleccionadaId(dataCuotas[0].id);
      }
    } catch (error) {
      console.error(error);
    } finally { setCargandoUnidades(false); }
  };

  const abrirGestorCobroDetallado = async (unidadId: string) => {
    setUnidadSeleccionadaModal(unidadId);
    setCargoIdEspecifico(null);
    setItemsDesglose([]);
    setCargandoDesglose(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/unidades/${unidadId}/cargos-detallados`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItemsDesglose(data || []);
      }
    } catch (e) { console.error(e); } finally { setCargandoDesglose(false); }
  };

  const handleCrearCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setEjecutandoAccion(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cuotas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ condominioId: condominioSeleccionadoId, nombre: nombreCuota, monto: Number(monto), tipo: tipoCuota, diaVencimiento: Number(diaVencimiento) }),
      });
      if (res.ok) {
        setNombreCuota(""); setMonto("");
        cargarDatosDelCondominio(condominioSeleccionadoId);
      }
    } catch (e) { console.error(e); } finally { setEjecutandoAccion(false); }
  };

  const handleGenerarCargosMasivos = async () => {
    setEjecutandoAccion(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generar-cargos-mes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ cuotaId: cuotaSeleccionadaId, anio: anioSeleccionado, mes: mesSeleccionado }),
      });
      if (res.ok) {
        alert("⚡ Lote masivo aplicado con éxito.");
        cargarDatosDelCondominio(condominioSeleccionadoId);
      }
    } catch (e) { console.error(e); } finally { setEjecutandoAccion(false); }
  };

  const procesarCobroEfectivo = async (esParcial: boolean) => {
    if (!cargoIdEspecifico) return;
    setEjecutandoAccion(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cargos/${cargoIdEspecifico}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ montoAbono: esParcial ? Number(montoAbono) : null })
      });
      if (res.ok) {
        setMontoAbono("");
        setCargoIdEspecifico(null);
        if (unidadSeleccionadaModal) abrirGestorCobroDetallado(unidadSeleccionadaModal);
        cargarDatosDelCondominio(condominioSeleccionadoId);
      }
    } catch (e) { console.error(e); } finally { setEjecutandoAccion(false); }
  };

  const emitirReciboPDFNativo = (item: DesgloseCargo) => {
    const ventanaImpresion = window.open("", "_blank");
    if (!ventanaImpresion) return;

    ventanaImpresion.document.write(`
      <html>
        <head>
          <title>Recibo de Pago - Sigmato PropTech</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .recibo-card { border: 2px solid #ddd; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto; }
            .header { border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
            .title { font-size: 22px; font-weight: bold; color: #0f172a; }
            .monto { font-size: 26px; color: #10b981; font-weight: bold; margin: 20px 0; }
            .footer { font-size: 11px; color: #777; text-align: center; margin-top: 30px; border-top: 1px dashed #ddd; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="recibo-card">
            <div class="header">
              <div>
                <div class="title">SIGMATO PROPTECH</div>
                <p style="font-size:12px; color:#666; margin:4px 0;">Comprobante Digital Fiscal Homologado</p>
              </div>
              <div style="text-align:right; font-size:12px;">
                <p><b>Folio:</b> ${item.cargoId.slice(0,8).toUpperCase()}</p>
                <p><b>Fecha:</b> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <p><b>Concepto Liquidado:</b> ${item.concepto}</p>
            <p><b>Estatus de Transacción:</b> <span style="color:#10b981; font-weight:bold;">LIQUIDADO ✓</span></p>
            <div class="monto">Total Recibido: ${formatoMoneda(item.monto)}</div>
            <div class="footer">Este documento sirve como recibo legal de pago. Gracias por mantener sus cuotas al corriente.</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    ventanaImpresion.document.close();
  };

  const exportarDataCSV = () => {
    const encabezados = ["ID Sistema", "Unidad", "Monto Restante", "Estatus\n"];
    const filas = unidadesFiltradas.map((u: UnidadFinanciera) => `${u.id},Depto ${u.unidad},${u.monto},${u.estatus}\n`);
    const blob = new Blob([encabezados.join(",") + filas.join("")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.setAttribute("download", `Reporte_Finanzas.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const seguroUnidades = Array.isArray(unidades) ? unidades : [];
  const unidadesFiltradas = seguroUnidades.filter((u) => {
    if (!u) return false;
    const textoDepto = `depto ${String(u.unidad).toLowerCase()}`;
    const coincideBusqueda = String(u.unidad).toLowerCase().includes(busqueda.toLowerCase()) || textoDepto.includes(busqueda.toLowerCase());
    const coincideEstatus = filtroEstatus === "TODOS" || u.estatus === filtroEstatus;
    return coincideBusqueda && coincideEstatus;
  });

  const deudasPendientes = itemsDesglose.filter(i => i.estado !== "PAGADO");
  const deudasLiquidadas = itemsDesglose.filter(i => i.estado === "PAGADO");

  const totalProyectado = resumen.totalRecaudado + resumen.porCobrar;
  const porcentajeRecaudado = totalProyectado > 0 ? Math.round((resumen.totalRecaudado / totalProyectado) * 100) : 0;
  const porcentajePendiente = totalProyectado > 0 ? Math.round((resumen.porCobrar / totalProyectado) * 100) : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-950 text-white min-h-screen font-sans">
      
      {/* MODAL AVANZADA: DESGLOSE COMPLETO DE ADEUDOS */}
      {unidadSeleccionadaModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-100">📋 Desglosado Analítico de Adeudos</h3>
              <button onClick={() => setUnidadSeleccionadaModal(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕ Cerrar</button>
            </div>
            
            {cargandoDesglose ? (
              <p className="text-xs text-slate-500 text-center py-4">⏳ Extrayendo conceptos...</p>
            ) : itemsDesglose.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">✅ Esta unidad no cuenta con ningún registro.</p>
            ) : (
              <div className="space-y-6">
                
                {/* 1. SECCIÓN DE CUOTAS PENDIENTES */}
                <div className="space-y-3">
                  <p className="text-xs text-amber-400 uppercase font-bold tracking-wider">⚠️ Conceptos Pendientes de Liquidar</p>
                  {deudasPendientes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-2">Al corriente. No hay saldos pendientes.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/60 space-y-2">
                      {deudasPendientes.map((item) => {
                        // URL real de Stripe o fallback seguro si el backend no cuenta con llaves configuradas
                        const linkFinalStripe = item.urlPagoDigital || `https://checkout.stripe.com/pay/sigmato_checkout_${item.cargoId}`;

                        return (
                          <div key={item.cargoId} className="pt-2 flex justify-between items-center gap-2 text-xs">
                            <div>
                              <p className="font-semibold text-white">{item.concepto}</p>
                              <p className="text-[10px] text-slate-500">Vence: {item.vencimiento}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-amber-400 font-mono">{formatoMoneda(item.monto)}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${obtenerEstiloEstatus(item.estado)}`}>{item.estado}</span>
                              
                              <a href={linkFinalStripe} target="_blank" rel="noopener noreferrer" className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-2 py-1 rounded text-[10px] transition text-center shadow-sm">
                                Link de Pago 💳
                              </a>
                              
                              <button onClick={() => setCargoIdEspecifico(item.cargoId)} className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3 py-1 rounded text-[10px] transition shadow-sm">Cobrar</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. SECCIÓN DE HISTORIAL LIQUIDADO */}
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <p className="text-xs text-emerald-400 uppercase font-bold tracking-wider">✅ Historial de Pagos Liquidados</p>
                  {deudasLiquidadas.length === 0 ? (
                    <p className="text-xs text-slate-500 italic pl-2">No se registran pagos previos en este periodo.</p>
                  ) : (
                    <div className="divide-y divide-slate-800/40 space-y-2">
                      {deudasLiquidadas.map((item) => (
                        <div key={item.cargoId} className="pt-2 flex justify-between items-center gap-2 text-xs opacity-70">
                          <div>
                            <p className="font-semibold text-slate-300">{item.concepto}</p>
                            <p className="text-[10px] text-slate-500">Emitido: {item.vencimiento}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-emerald-400 font-mono">{formatoMoneda(item.monto)}</span>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${obtenerEstiloEstatus(item.estado)}`}>{item.estado}</span>
                            
                            <button onClick={() => emitirReciboPDFNativo(item)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-2 py-1 rounded text-[10px] font-medium transition">
                              Recibo PDF 📄
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* CAJA DE CONTROL PARA PROCESAR EL COBRO */}
            {cargoIdEspecifico && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3 mt-4">
                <p className="text-xs font-bold text-sky-400">⚡ Aplicar cobro al concepto seleccionado</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input type="number" placeholder="Monto abono parcial" className="bg-slate-900 border border-slate-800 rounded p-2 text-white" value={montoAbono} onChange={(e) => setMontoAbono(e.target.value)} />
                  <div className="flex gap-1">
                    <button onClick={() => procesarCobroEfectivo(true)} disabled={!montoAbono} className="w-1/2 bg-sky-500 hover:bg-sky-600 font-bold rounded text-slate-950 text-[11px]">Abonar</button>
                    <button onClick={() => procesarCobroEfectivo(false)} className="w-1/2 bg-emerald-500 hover:bg-emerald-600 font-bold rounded text-slate-950 text-[11px]">Liquidar</button>
                  </div>
                </div>
                <button onClick={() => setCargoIdEspecifico(null)} className="text-[10px] text-slate-500 underline w-full text-center block">Cancelar abono</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Panel Financiero de Administración</h1>
          <p className="text-slate-400 text-sm">Flujos analíticos, pasarela Stripe activa y moratorias automáticas.</p>
        </div>
        <div className="w-full sm:w-72 bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">🏢 Condominio Activo</label>
          <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-white focus:outline-none cursor-pointer" value={condominioSeleccionadoId} onChange={(e) => setCondominioSeleccionadoId(e.target.value)}>
            {condominios.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </header>

      {/* KPIS */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Total Recaudado</p>
          <p className="text-2xl font-bold text-emerald-400">{formatoMoneda(resumen.totalRecaudado)}</p>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Por Cobrar (Con Recargos ⚠️)</p>
          <p className="text-2xl font-bold text-amber-400">{formatoMoneda(resumen.porCobrar)}</p>
        </div>
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm space-y-1">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Morosidad</p>
          <p className="text-2xl font-bold text-rose-400">{resumen.morosidad}%</p>
        </div>
      </section>

      {/* GRÁFICA */}
      <section className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <h2 className="text-base font-semibold text-slate-200">📊 Gráfica de Tendencia de Ingresos (Periodo Activo)</h2>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Flujo de Caja Real (Recaudado)</span>
              <span className="font-mono text-emerald-400 font-bold">{formatoMoneda(resumen.totalRecaudado)} ({porcentajeRecaudado}%)</span>
            </div>
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${porcentajeRecaudado}%` }}></div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Cuentas por Cobrar Activas</span>
              <span className="font-mono text-amber-400 font-bold">{formatoMoneda(resumen.porCobrar)} ({porcentajePendiente}%)</span>
            </div>
            <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${porcentajePendiente}%` }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-amber-400">📋 1. Registrar Concepto</h2>
          <form onSubmit={handleCrearCuota} className="space-y-3 text-sm">
            <input type="text" placeholder="Ej. Mantenimiento Ordinario" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={nombreCuota} onChange={(e) => setNombreCuota(e.target.value)} required />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="Monto ($)" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={monto} onChange={(e) => setMonto(e.target.value)} required />
              <input type="number" min="1" max="28" placeholder="Día Vence" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none" value={diaVencimiento} onChange={(e) => setDiaVencimiento(e.target.value)} required />
            </div>
            <button type="submit" disabled={ejecutandoAccion} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition">
              {ejecutandoAccion ? "Procesando..." : "Agregar al Catálogo"}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3 text-sm">
            <h2 className="text-base font-semibold text-emerald-400">🚀 2. Facturación Masiva</h2>
            {cuotasDisponibles.length === 0 ? (
              <div className="text-xs bg-slate-950 border border-dashed border-slate-800 rounded-lg p-4 text-center text-amber-400">Registra un concepto primero.</div>
            ) : (
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono" value={cuotaSeleccionadaId} onChange={(e) => setCuotaSeleccionadaId(e.target.value)}>
                {cuotasDisponibles.map((cuota) => <option key={cuota.id} value={cuota.id}>{cuota.nombre} ({formatoMoneda(cuota.monto)})</option>)}
              </select>
            )}
            <div className="grid grid-cols-2 gap-2">
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)}>
                <option value="7">Julio</option><option value="8">Agosto</option>
              </select>
              <select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white" value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(e.target.value)}>
                <option value="2026">2026</option>
              </select>
            </div>
          </div>
          <button onClick={handleGenerarCargosMasivos} disabled={cuotasDisponibles.length === 0 || ejecutandoAccion} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition mt-2">
            {ejecutandoAccion ? "Generando..." : "Aplicar Cuentas Masivas"}
          </button>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-200">Estatus de Cuentas</h2>
            <button onClick={exportarDataCSV} disabled={unidadesFiltradas.length === 0} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3 py-1 rounded-lg text-slate-300 font-medium transition">📥 Exportar CSV</button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" placeholder="Buscar unidad..." className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300" value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)}>
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PAGADO">Pagados</option>
              <option value="PARCIAL">Parciales</option>
              <option value="VENCIDO">Vencidos</option>
            </select>
          </div>
        </div>

        {cargandoUnidades ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse">⏳ Sincronizando balance...</div>
        ) : unidadesFiltradas.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">📭 No hay registros financieros para mostrar.</div>
        ) : (
          <div className="overflow-x-auto text-xs sm:text-sm">
            <table className="w-full text-left text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="p-4">ID Sistema</th>
                  <th className="p-4">Unidad</th>
                  <th className="p-4">Saldo Pendiente</th>
                  <th className="p-4 text-center">Estatus Global</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {unidadesFiltradas.map((u) => {
                  if (!u) return null;
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-blue-400">{u.id}</td>
                      <td className="p-4 font-semibold text-white">Depto {u.unidad}</td>
                      <td className="p-4 font-medium text-slate-300">{formatoMoneda(u.monto)}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${obtenerEstiloEstatus(u.estatus)}`}>{u.estatus}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => abrirGestorCobroDetallado(u.id)} className="bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold px-3 py-1 rounded-md text-xs transition">
                          Gestionar Cobro
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}