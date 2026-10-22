'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Flame, 
  TrendingUp, 
  Trophy, 
  Compass, 
  Watch, 
  ArrowRight, 
  Lock, 
  Activity, 
  Zap, 
  CheckCircle2, 
  Gauge, 
  Layers,
  Sparkles,
  Eye
} from 'lucide-react';

interface WelcomeHeroProps {
  onOpenRegister: () => void;
  onOpenLogin: () => void;
  onExploreDemo: () => void;
}

export function WelcomeHero({
  onOpenRegister,
  onOpenLogin,
  onExploreDemo,
}: WelcomeHeroProps) {
  return (
    <div className="space-y-12 py-4 sm:py-8">
      
      {/* ============================================================== */}
      {/* 1. HERO PRINCIPAL DE PRESENTACIÓN */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0B1120] via-[#0F172A] to-[#0A0E1A] border border-cyan-500/20 p-6 sm:p-10 lg:p-14 text-white shadow-2xl">
        {/* Resplandor ambiental de fondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Ecosistema EvoLab Multideporte Unificado</span>
          </div>

          {/* Logotipo Central con halo */}
          <div className="flex justify-center my-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900/90 border border-cyan-500/40 p-2.5 shadow-[0_0_35px_rgba(6,182,212,0.35)] flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Pulse Coach" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(6,182,212,0.7)]" 
              />
            </div>
          </div>

          {/* Título de Impacto */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Tu Centro de Mando Fisiológico & Rutas de Rendimiento
          </h1>

          {/* Subtítulo */}
          <p className="text-base sm:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed">
            Analítica de carga <strong className="text-white font-semibold">COROS EvoLab</strong>, cálculo de fatiga Banister (CTL, ATL, TSB), predicción de tiempos de carrera y generador de tracks circulares GPX para Garmin, COROS, Strava e iGPSPORT.
          </p>

          {/* Llamadas a la Acción Principales */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md mx-auto sm:max-w-none">
            <button
              onClick={onOpenRegister}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 touch-target"
            >
              <span>Crear Cuenta Gratuita</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-sm border border-slate-700/80 shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 touch-target"
            >
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Iniciar Sesión</span>
            </button>

            <button
              onClick={onExploreDemo}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-transparent hover:bg-slate-800/40 text-slate-300 hover:text-white font-medium text-xs transition-all flex items-center justify-center gap-1.5 touch-target"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Explorar Modo Demo</span>
            </button>
          </div>

          {/* Dispositivos compatibles */}
          <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Compatible con:</span>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
              <Watch className="w-3.5 h-3.5 text-cyan-400" />
              <span>Garmin Connect™</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Strava (Free & Premium)</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              <span>COROS Training Hub</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1 rounded-lg border border-slate-800 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>iGPSPORT</span>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. LOS 4 PILARES DE VALOR TÉCNICO */}
      {/* ============================================================== */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Todo lo que necesitas para tu entrenamiento inteligente
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Sin algoritmos opacos ni suscripciones forzosas. Ciencia deportiva aplicada directamente a tus datos reales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Pilar 1 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200/80 text-cyan-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Curva de Carga EvoLab (PMC)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Calcula tu Forma Base (CTL a 42 días) y Fatiga Inmediata (ATL a 7 días). Conoce con precisión tu Balance de Frescura (TSB) para competir en tu punto óptimo.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-700 flex items-center justify-center">
              <Trophy className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Predictor de Competición
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pronósticos de tiempos y ritmos exactos por kilómetro para 5K, 10K, Media Maratón y 42K basados en tu VO2max real y economía aeróbica.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 flex items-center justify-center">
              <Compass className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Rutas Circulares con GPX
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Genera tiradas circulares de la distancia que desees (5 a 120 km) partiendo desde tu ubicación actual y envíalas directamente a Garmin Connect.
            </p>
          </div>

          {/* Pilar 4 */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Privacidad & Cuentas Aisladas
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cada usuario dispone de su propia base de datos cifrada en Turso. Compatible con cuentas gratuitas de Strava sin alterar tus actividades ni perfiles.
            </p>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. LLAMADA FINAL A LA ACCIÓN */}
      {/* ============================================================== */}
      <section className="rounded-2xl bg-slate-900 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-1.5 text-center sm:text-left">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
            ¿Listo para llevar tu entrenamiento al siguiente nivel?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Regístrate en menos de 30 segundos y comienza a auditar tu rendimiento deportivo.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenRegister}
            className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wide transition-all active:scale-[0.98] shadow-md touch-target"
          >
            Registrarse Ahora
          </button>
          <button
            onClick={onOpenLogin}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-all active:scale-[0.98] touch-target"
          >
            Ya tengo cuenta
          </button>
        </div>
      </section>

    </div>
  );
}
