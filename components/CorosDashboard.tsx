'use client';

import React from 'react';
import { 
  BiometricMetrics, 
  ActivitySession, 
  NonZeroHabit, 
  SportType 
} from '@/types';
import { 
  Activity, 
  Zap, 
  Flame, 
  Heart, 
  Moon, 
  BatteryCharging, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Compass, 
  CheckCircle2, 
  Bike, 
  Mountain, 
  Footprints, 
  Gauge, 
  Calendar,
  Sparkles,
  Watch,
  Upload,
  Radio
} from 'lucide-react';
import { getSportVisual } from './ActivityFeed';
import { PerformanceChart } from './PerformanceChart';
import { RacePredictor } from './RacePredictor';
import { ClubLeaderboard } from './ClubLeaderboard';
import { UserSessionPayload } from '@/lib/auth';

interface CorosDashboardProps {
  metrics: BiometricMetrics;
  activities: ActivitySession[];
  habit: NonZeroHabit;
  onNavigateTab: (tab: 'coach' | 'biometrics' | 'routes' | 'events' | 'activities') => void;
  onOpenSync?: (tab?: 'garmin' | 'coros' | 'igpsport' | 'strava') => void;
  currentUser?: UserSessionPayload | null;
}

export function CorosDashboard({
  metrics,
  activities,
  habit,
  onNavigateTab,
  onOpenSync,
  currentUser,
}: CorosDashboardProps) {
  // Última actividad real registrada
  const latestActivity = activities.length > 0 ? activities[0] : null;
  const latestVisual = latestActivity ? getSportVisual(latestActivity.sport, latestActivity.title) : null;
  const LatestSportIcon = latestVisual?.icon || Activity;

  // Cálculos estilo COROS EvoLab
  const baseFitness = Math.round(metrics.chronicLoad / 8); // Aptitud base a largo plazo
  const loadImpact = Math.round(metrics.acuteLoad / 8.5); // Fatiga a corto plazo
  const readiness = metrics.trainingReadiness || 78;

  // Estado EvoLab
  const getTrainingStatus = () => {
    if (metrics.acwr > 1.35) return { label: 'Sobrecarga / Exceso', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
    if (metrics.acwr < 0.8) return { label: 'Recuperación Activa', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
    return { label: 'Optimizado / Productivo', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  };

  const status = getTrainingStatus();

  return (
    <div className="space-y-6">
      
      {/* ============================================================== */}
      {/* 1. HERO BANNER: ESTILO COROS EVOLAB & LOGO PULSE COACH */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white p-6 sm:p-8 shadow-2xl">
        {/* Glow de fondo cian/esmeralda como el logo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Logo + Título + Status */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900/90 border border-cyan-500/30 p-2 shrink-0 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="Pulse Coach Logo" 
                className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" 
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30">
                  EvoLab Hub
                </span>
                <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Dashboard de Rendimiento</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl">
                Centro de mando fisiológico. Análisis de carga semanal, fatiga acumulada y predisposición diaria al esfuerzo.
              </p>
            </div>
          </div>

          {/* Dial de Disposición / Training Readiness Ring */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 self-start lg:self-auto shrink-0 shadow-inner">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-cyan-400"
                  strokeDasharray={`${readiness}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="url(#corosGrad)"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <defs>
                  <linearGradient id="corosGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-black text-white tabular-nums leading-none">{readiness}%</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Predisposición</span>
              <span className="text-sm font-bold text-cyan-300 block">
                {readiness >= 75 ? 'Excelente para entrenar' : readiness >= 50 ? 'Moderado · Mantener Z2' : 'Descanso recomendado'}
              </span>
              <span className="text-[11px] text-slate-500">Basado en HRV, VFC y Sueño</span>
            </div>
          </div>

        </div>

        {/* Barra Rápida de Sincronización Multi-dispositivo */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Sincronizar Dispositivo o Actividades:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón COROS */}
            <button
              onClick={() => onOpenSync && onOpenSync('coros')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all active:scale-[0.98] touch-target shadow-2xs"
              title="Sincronizar reloj COROS Pace, Apex o Vertix"
            >
              <Watch className="w-4 h-4 text-cyan-400 stroke-[2]" />
              <span>Sincronizar COROS</span>
            </button>

            {/* Botón iGPSPORT */}
            <button
              onClick={() => onOpenSync && onOpenSync('igpsport')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-300 border border-orange-500/40 text-xs font-bold transition-all active:scale-[0.98] touch-target shadow-2xs"
              title="Sincronizar ciclocomputador iGPSPORT (BSC / iGS)"
            >
              <Bike className="w-4 h-4 text-orange-400 stroke-[2]" />
              <span>Sincronizar iGPSPORT</span>
            </button>

            {/* Botón Garmin Connect */}
            <button
              onClick={() => onOpenSync && onOpenSync('garmin')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all active:scale-[0.98] touch-target shadow-2xs"
              title="Sincronizar con cuenta de Garmin Connect"
            >
              <Radio className="w-4 h-4 text-sky-400 stroke-[2]" />
              <span>Garmin Connect</span>
            </button>

            {/* Botón Subir Archivo Manual */}
            <button
              onClick={() => onOpenSync && onOpenSync('coros')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold transition-all active:scale-[0.98] touch-target"
              title="Subir archivo de actividad .FIT o .GPX"
            >
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Subir .FIT / .GPX</span>
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2. LOS 4 PILARES EVOLAB (ESTADO FÍSICO COROS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Pilar 1: Forma Base */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="uppercase tracking-wider text-[10px] sm:text-xs">Forma Base (CTL)</span>
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{baseFitness}</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">+2.4 mes</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Capacidad aeróbica consolidada.</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, baseFitness * 1.4)}%` }} />
          </div>
        </div>

        {/* Pilar 2: Fatiga / Impacto */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="uppercase tracking-wider text-[10px] sm:text-xs">Fatiga (ATL)</span>
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{loadImpact}</span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">Moderada</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Estrés últimos 7 días.</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, loadImpact * 1.5)}%` }} />
          </div>
        </div>

        {/* Pilar 3: Carga Semanal (Training Load) */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="uppercase tracking-wider text-[10px] sm:text-xs">Carga 7D (TL)</span>
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{metrics.acuteLoad}</span>
            <span className="text-[10px] sm:text-xs text-slate-400">/ 650 ópt</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Estímulo fisiológico total.</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (metrics.acuteLoad / 650) * 100)}%` }} />
          </div>
        </div>

        {/* Pilar 4: Ratio ACWR */}
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span className="uppercase tracking-wider text-[10px] sm:text-xs">Ratio ACWR</span>
            <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{metrics.acwr}</span>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              {metrics.acwrStatus === 'optimo' ? 'Óptimo' : metrics.acwrStatus}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">Riesgo lesional muy bajo.</p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }} />
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 2.5. GRÁFICA EVOLUTIVA EVOLAB (PERFORMANCE MANAGEMENT CHART - PMC) */}
      {/* ============================================================== */}
      <PerformanceChart activities={activities as any} currentVo2Max={metrics.vo2Max} />

      {/* ============================================================== */}
      {/* 3. DOS COLUMNAS: ÚLTIMA ACTIVIDAD + BIOMETRÍA DE SALUD */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Columna Izquierda (2 cols): Última Actividad Real + Sugerencia del Coach */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          
          {/* Tarjeta de Última Sesión Real */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Último Entrenamiento Registrado</span>
              </div>
              <button
                onClick={() => onNavigateTab('activities')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 flex items-center gap-1 transition-colors"
              >
                <span>Ver Historial ({activities.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestActivity ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${latestVisual?.iconBg} ${latestVisual?.iconColor}`}>
                    <LatestSportIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${latestVisual?.badgeBg} ${latestVisual?.badgeText} ${latestVisual?.badgeBorder}`}>
                        {latestVisual?.label}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        Garmin Connect
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">{latestActivity.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{latestActivity.date}</span>
                    </p>
                  </div>
                </div>

                {/* Métricas clave */}
                <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-5 text-xs text-slate-700 dark:text-slate-300 tabular-nums border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-200 dark:border-slate-800">
                  {latestActivity.distanceKm && (
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold block">Distancia</span>
                      <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{latestActivity.distanceKm} km</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold block">Tiempo</span>
                    <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{latestActivity.durationMin} min</strong>
                  </div>
                  {latestActivity.avgPaceOrSpeed && (
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold block">Ritmo / Vel</span>
                      <strong className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{latestActivity.avgPaceOrSpeed}</strong>
                    </div>
                  )}
                  {latestActivity.elevationGainM && (
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold block">Desnivel</span>
                      <strong className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">+{latestActivity.elevationGainM}m</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No hay actividades registradas todavía. Pulsa en Cuentas para sincronizar tu Garmin o Strava.
              </div>
            )}
          </div>

          {/* Tarjeta de Sugerencia del Coach y Racha Non-Zero */}
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Prescripción Diaria</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Racha {habit.currentStreakDays}d
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Sesión Sugerida por Biometría</span>
                <h4 className="text-sm sm:text-base font-bold text-white">Rodaje en Zona 2 Aeróbica o Salida en Bici (45-60 min)</h4>
                <p className="text-xs text-slate-400">
                  Tu VFC ({metrics.hrvValueMs} ms) y descanso permiten asimilar volumen a ritmo conversacional sin sobrecarga.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateTab('coach')}
                  className="px-3.5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all shadow-xs touch-target"
                >
                  Ver Sesión Coach
                </button>
                <button
                  onClick={() => onNavigateTab('routes')}
                  className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 touch-target"
                >
                  Buscar Ruta
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha (1 col): Biometría & Salud Diaria */}
        <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Biometría & Recuperación</span>
            </div>
            <button
              onClick={() => onNavigateTab('biometrics')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700"
            >
              Detalle
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            
            {/* VFC / HRV */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <Heart className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">VFC / HRV Nocturna</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{metrics.hrvValueMs} ms</strong>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Equilibrada
              </span>
            </div>

            {/* Batería Corporal */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-cyan-100/80 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                  <BatteryCharging className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Batería Corporal</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{metrics.bodyBattery}%</strong>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                {metrics.bodyBatteryTrend === 'charging' ? 'Recargando' : 'Óptima'}
              </span>
            </div>

            {/* Sueño */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Sueño & Descanso</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{metrics.sleepHours} h (Score {metrics.sleepScore})</strong>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                {metrics.deepSleepHours}h prof.
              </span>
            </div>

            {/* Estrés */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-100/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">Nivel de Estrés</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{metrics.stressLevel} / 100</strong>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                Bajo
              </span>
            </div>

            {/* VO2 Max */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-purple-100/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <Award className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">VO2 Máx Estimado</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{metrics.vo2Max} ml/kg/min</strong>
                </div>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                Superior
              </span>
            </div>

          </div>

          {/* Acceso Rápido a Rutas y Eventos */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('routes')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all text-center touch-target"
            >
              Explorar Senderos
            </button>
            <button
              onClick={() => onNavigateTab('events')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold transition-all text-center touch-target"
            >
              Eventos Populares
            </button>
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. PREDICTOR DE TIEMPOS DE CARRERA (EVOLAB RACE PREDICTOR) */}
      {/* ============================================================== */}
      <RacePredictor vo2Max={metrics.vo2Max} activities={activities} />

      {/* ============================================================== */}
      {/* 5. CLUB PULSE COACH & RETOS DE GRUPO */}
      {/* ============================================================== */}
      <ClubLeaderboard currentUser={currentUser} />

    </div>
  );
}
