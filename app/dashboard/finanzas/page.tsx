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

  // Estado para verificar el montaje seguro en el cliente y evitar Hydration Errors
  const [mounted, setMounted] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  // Catálogos globales
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cargandoCondos, setCargandoCondos] = useState(true);
  const [cuotasDisponibles, setCuotasDisponibles] = useState<CuotaCatalogo[]>([]);

  // Estado inicial fuertemente protegido para el resumen de KPIs
  const [resumen, setResumen] = useState<ResumenFinanciero>({
    totalRecaudado: 0,
    porCobrar: 0,
    morosidad: 0
  });

  // Estados de la tabla y filtros
  const [unidades, setUnidades] = useState<UnidadFinanciera[]>([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("TODOS");

  // Estados de formularios (Paso 1: Crear Concepto)
  const [nombreCuota, setNombreCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("10");
  const [tipoCuota, setTipoCuota] = useState("MANTENIMIENTO_ORDINARIO");

  // Estados de cargos masivos (Paso 2: Disparar Facturación)
  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("7");
  const [anioSeleccionado, setAnioSeleccionado] = useState("2026");

  // Activar montaje seguro en el cliente
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

  // 1. Cargar catálogo de condominios al inicializar
  useEffect(() => {
    if (!mounted) return;
    const cargarCatalogoCondominios = async () => {
      setCargandoCondos(true);
      setErrorSesion(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        
        if (!token) {
          setErrorSesion("Token de sesión inexistente. Por favor, inicia sesión.");
          setCargandoCondos(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/admin/condominios`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (res.status === 403 || res.status === 401) {
          setErrorSesion("Tu sesión ha expirado o no tienes permisos (Error 403).");
          return;
        }

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
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      // 🔗 Conectado de forma precisa a la nueva ruta /analiticas de tu backend
      const resUnidades = await fetch(`${API_BASE_URL}/api/admin/unidades/${condominioSeleccionadoId}/analiticas`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      if (resUnidades.status === 403 || resUnidades.status === 401) {
        setErrorSesion("Sesión inválida al consultar datos financieros.");
        return;
      }

      if (resUnidades.ok) {
        const payload = await resUnidades.json() as any;
        
        // Mapeo ultra seguro de unidades
        if (payload && payload.unidades && Array.isArray(payload.unidades)) {
          setUnidades(payload.unidades);
        } else if (payload && Array.isArray(payload)) {
          setUnidades(payload);
        } else {
          setUnidades([]);
        }

        // Mapeo seguro del resumen analítico para los KPIs
        if (payload && payload.resumen) {
          setResumen({
            totalRecaudado: Number(payload.resumen.totalRecaudado) || 0,
            porCobrar: Number(payload.resumen.porCobrar) || 0,
            morosidad: Number(payload.resumen.morosidad) || 0
          });
        } else {
          setResumen({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
        }
      }

      // Cargar catálogo de cuotas para el selector masivo
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
      console.error("Error financiero:", error);
      setUnidades([]);
      setResumen({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
    } finally {
      setCargandoUnidades(false);
    }
  };

  useEffect(() => {
    if (mounted && condominioSeleccionadoId) {
      cargarDatosDelCondominio();
    }
  }, [condominioSeleccionadoId, mounted]);

  // 3. Crear Concepto Base
  const handleCrearCuota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condominioSeleccionadoId) return alert("Selecciona un condominio primero.");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cuotas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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

  // 4. Disparar Facturación Masiva del Mes
  const handleGenerarCargosMasivos = async () => {
    if (!cuotaSeleccionadaId) return alert("Selecciona una cuota del catálogo.");
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/generar-cargos-mes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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

  // 5. Acción Rápida: Liquidar Deuda
  const handleRegistrarPago = async (cargoId: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/cargos/${cargoId}/pagar`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok