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

  const [mounted, setMounted] = useState(false);
  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  // Catálogos globales
  const [condominios, setCondominios] = useState<Condominio[]>([]);
  const [condominioSeleccionadoId, setCondominioSeleccionadoId] = useState("");
  const [cargandoCondos, setCargandoCondos] = useState(true);
  const [cuotasDisponibles, setCuotasDisponibles] = useState<CuotaCatalogo[]>([]);

  // Estado inicial de KPIs protegido
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

  // Estados de formularios
  const [nombreCuota, setNombreCuota] = useState("");
  const [monto, setMonto] = useState("");
  const [diaVencimiento, setDiaVencimiento] = useState("10");
  const [tipoCuota, setTipoCuota] = useState("MANTENIMIENTO_ORDINARIO");

  const [cuotaSeleccionadaId, setCuotaSeleccionadaId] = useState("");
  const [mesSeleccionado, setMesSeleccionado] = useState("7");
  const [anioSeleccionado, setAnioSeleccionado] = useState("2026");

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

  // 1. Cargar condominios protegiendo contra errores 403
  useEffect(() => {
    if (!mounted) return;
    const cargarCatalogoCondominios = async () => {
      setCargandoCondos(true);
      setErrorSesion(null);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        
        if (!token) {
          setErrorSesion("Token de sesión inexistente. Por favor, inicia sesión de nuevo.");
          setCargandoCondos(false);
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/admin/condominios`, {
          headers: { "Authorization": `Bearer ${token}` },
        });

        if (res.status === 403 || res.status === 401) {
          setErrorSesion("Tu sesión ha expirado o no tienes permisos suficientes (Error 403).");
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

  // 2. Extraer información financiera completa protegiendo desvíos
  const cargarDatosDelCondominio = async () => {
    if (!condominioSeleccionadoId) {
      setUnidades([]);
      setResumen({ totalRecaudado: 0, porCobrar: 0, morosidad: 0 });
      return;
    }
    setCargandoUnidades(true);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
    // 🚨 BUSCA ESTA LÍNEA EXACTA EN TU page.tsx DEL FRONTEND Y CAMBIA LA URL ASÍ:
const resUnidades = await fetch(`${API_BASE_URL}/api/admin/unidades/${condominioSeleccionadoId}/analiticas`, {
  headers: { "Authorization": `Bearer ${token}` },
});
      
      if (resUnidades.status === 403 || resUnidades.status === 401) {
        setErrorSesion("Sesión inválida al consultar datos financieros.");
        return;
      }

      if (resUnidades.ok) {
        const payload = await resUnidades.json() as any;
        
        // Asignación con fallbacks obligatorios de arreglos
        if (payload && payload.unidades && Array.isArray(payload.unidades)) {
          setUnidades(payload.unidades);
        } else if (payload && Array.isArray(payload)) {
          setUnidades(payload);
        } else {
          setUnidades([]);
        }

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
    } catch (error) {
      console.error("Error financiero:", error);
      setUnidades([]);
    } finally {
      setCargandoUnidades(false);
    }
  };

  useEffect(() => {
    if (mounted && condominioSeleccionadoId) {
      cargarDatosDelCondominio();
    }
  }, [condominioSeleccionadoId, mounted]);

  if (!mounted) {
    return <div className="p-6 text-center text-slate-500 text-sm">Cargando Panel...</div>;
  }

  // 🚨 VISTA INTERRUPTORA SI HAY ERROR DE AUTENTICACIÓN: Evita pantallas negras corporativas
  if (errorSesion) {
    return (
      <div className="p-12 max-w-md mx-auto my-20 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4">
        <p className="text-amber-400 text-xl font-bold">⚠️ Control de Acceso</p>
        <p className="text-slate-300 text-sm">{errorSesion}</p>
        <button 
          onClick={() => window.location.href = "/"} 
          className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm hover:bg-amber-600 transition"
        >
          Regresar al Login
        </button>
      </div>
    );
  }

  const seguroUnidades = Array.isArray(unidades) ? unidades : [];
  const unidadesFiltradas = seguroUnidades.filter((u) => {
    if (!u) return false;
    const nombreUnidad = u.unidad ? String(u.unidad) : "";
    return nombreUnidad.toLowerCase().includes(busqueda.toLowerCase());
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 bg-slate-950 text-white min-h-screen font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">Panel Financiero de Administración</h1>
          <p className="text-slate-400 text-sm">Sigmato PropTech en línea.</p>
        </div>
      </header>

      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-center text-slate-400 text-sm">
        🔒 Panel financiero listo y conectado a la API de Render.
      </div>
    </div>
  );
}