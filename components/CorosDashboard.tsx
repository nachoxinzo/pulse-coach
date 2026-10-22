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
  Sparkles
} from 'lucide-react';
import { getSportVisual } from './ActivityFeed';
import { PerformanceChart } from './PerformanceChart';
import { RacePredictor } from './RacePredictor';

interface CorosDashboardProps {
  metrics: BiometricMetrics;
  activities: ActivitySession[];
  habit: NonZeroHabit;
  onNavigateTab: (tab: 'coach' | 'biometrics' | 'routes' | 'events' | 'activities') => void;
}

export function CorosDashboard({
  metrics,
  activities,
  habit,
  onNavigateTab,
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
      </div>

      {/* ============================================================== */}
      {/* 2. LOS 4 PILARES EVOLAB (ESTADO FÍSICO COROS) */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Pilar 1: Forma Base */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-wider">Forma Base (Fitness)</span>
            <TrendingUp className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{baseFitness}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">+2.4 este mes</span>
          </div>
          <p className="text-[11px] text-slate-500">Capacidad aeróbica y resistencia consolidada a largo plazo.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, baseFitness * 1.4)}%` }} />
          </div>
        </div>

        {/* Pilar 2: Fatiga / Impacto */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-wider">Fatiga / Carga Impacto</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{loadImpact}</span>
            <span className="text-xs font-semibold text-slate-500">Moderada</span>
          </div>
          <p className="text-[11px] text-slate-500">Cansancio muscular y neuromuscular en los últimos 7 días.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, loadImpact * 1.5)}%` }} />
          </div>
        </div>

        {/* Pilar 3: Carga Semanal (Training Load) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-wider">Carga 7 Días (TL)</span>
            <Flame className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{metrics.acuteLoad}</span>
            <span className="text-xs text-slate-400">/ 650 óptimo</span>
          </div>
          <p className="text-[11px] text-slate-500">Volumen e intensidad de estímulo fisiológico acumulado.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(100, (metrics.acuteLoad / 650) * 100)}%` }} />
          </div>
        </div>

        {/* Pilar 4: Ratio ACWR */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span className="uppercase tracking-wider">Ratio ACWR</span>
            <Gauge className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{metrics.acwr}</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {metrics.acwrStatus === 'optimo' ? 'Zona Óptima' : metrics.acwrStatus}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Equilibrio entre carga aguda y crónica. Riesgo lesional bajo.</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 cols): Última Actividad Real + Sugerencia del Coach */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de Última Sesión Real */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Último Entrenamiento Registrado</span>
              </div>
              <button
                onClick={() => onNavigateTab('activities')}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 transition-colors"
              >
                <span>Ver Historial ({activities.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {latestActivity ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
                <div className="flex items-start gap-3.5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${latestVisual?.iconBg} ${latestVisual?.iconColor}`}>
                    <LatestSportIcon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${latestVisual?.badgeBg} ${latestVisual?.badgeText} ${latestVisual?.badgeBorder}`}>
                        {latestVisual?.label}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Garmin Connect
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{latestActivity.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{latestActivity.date}</span>
                    </p>
                  </div>
                </div>

                {/* Métricas clave */}
                <div className="flex items-center gap-5 text-xs text-slate-700 tabular-nums border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  {latestActivity.distanceKm && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distancia</span>
                      <strong className="text-base font-black text-slate-900">{latestActivity.distanceKm} km</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tiempo</span>
                    <strong className="text-base font-black text-slate-900">{latestActivity.durationMin} min</strong>
                  </div>
                  {latestActivity.avgPaceOrSpeed && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ritmo / Vel</span>
                      <strong className="text-base font-black text-slate-900">{latestActivity.avgPaceOrSpeed}</strong>
                    </div>
                  )}
                  {latestActivity.elevationGainM && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Desnivel</span>
                      <strong className="text-base font-black text-emerald-700">+{latestActivity.elevationGainM}m</strong>
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
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Prescripción de Entrenamiento para Hoy</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Racha {habit.currentStreakDays} días activa
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Sesión Sugerida por Biometría</span>
                <h4 className="text-base font-bold text-white">Rodaje en Zona 2 Aeróbica o Salida en Bici (45-60 min)</h4>
                <p className="text-xs text-slate-400">
                  Tu VFC ({metrics.hrvValueMs} ms) y descanso permiten asimilar volumen a ritmo conversacional sin sobrecarga.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateTab('coach')}
                  className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-xs touch-target"
                >
                  Ver Sesión Coach
                </button>
                <button
                  onClick={() => onNavigateTab('routes')}
                  className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 touch-target"
                >
                  Buscar Ruta
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Columna Derecha (1 col): Biometría & Salud Diaria */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Biometría & Recuperación</span>
            </div>
            <button
              onClick={() => onNavigateTab('biometrics')}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-800"
            >
              Detalle
            </button>
          </div>

          <div className="space-y-3">
            
            {/* VFC / HRV */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                  <Heart className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">VFC / HRV Nocturna</span>
                  <strong className="text-sm font-black text-slate-900 tabular-nums">{metrics.hrvValueMs} ms</strong>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Equilibrada
              </span>
            </div>

            {/* Batería Corporal */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
                  <BatteryCharging className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Batería Corporal</span>
                  <strong className="text-sm font-black text-slate-900 tabular-nums">{metrics.bodyBattery}%</strong>
                </div>
              </div>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                {metrics.bodyBatteryTrend === 'charging' ? 'Recargando' : 'Óptima'}
              </span>
            </div>

            {/* Sueño */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100/80 text-indigo-700 flex items-center justify-center">
                  <Moon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Sueño & Descanso</span>
                  <strong className="text-sm font-black text-slate-900 tabular-nums">{metrics.sleepHours} h (Score {metrics.sleepScore})</strong>
                </div>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {metrics.deepSleepHours}h prof.
              </span>
            </div>

            {/* Estrés */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
                  <Zap className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">Nivel de Estrés</span>
                  <strong className="text-sm font-black text-slate-900 tabular-nums">{metrics.stressLevel} / 100</strong>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Bajo
              </span>
            </div>

            {/* VO2 Max */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100/80 text-purple-700 flex items-center justify-center">
                  <Award className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block">VO2 Máx Estimado</span>
                  <strong className="text-sm font-black text-slate-900 tabular-nums">{metrics.vo2Max} ml/kg/min</strong>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Superior
              </span>
            </div>

          </div>

          {/* Acceso Rápido a Rutas y Eventos */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('routes')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all text-center touch-target"
            >
              Explorar Senderos
            </button>
            <button
              onClick={() => onNavigateTab('events')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all text-center touch-target"
            >
              Eventos Populares
            </button>
          </div>

        </div>

      </div>

      {/* ============================================================== */}
      {/* 4. PREDICTOR DE TIEMPOS DE CARRERA (EVOLAB RACE PREDICTOR) */}
      {/* ============================================================== */}
      <RacePredictor vo2Max={metrics.vo2Max} />

    </div>
  );
}
