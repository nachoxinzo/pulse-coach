'use client';

import React from 'react';
import { BiometricMetrics } from '@/types';
import { 
  BatteryCharging, 
  Activity, 
  Moon, 
  Gauge, 
  Zap, 
  TrendingUp, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface BiometricOverviewProps {
  metrics: BiometricMetrics;
}

export function BiometricOverview({ metrics }: BiometricOverviewProps) {
  // Estado del ACWR
  const getAcwrBadge = (acwr: number) => {
    if (acwr < 0.8) {
      return {
        label: 'Desentrenamiento',
        desc: 'Carga aguda por debajo de tu capacidad crónica.',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: TrendingUp,
      };
    }
    if (acwr <= 1.3) {
      return {
        label: 'Zona Óptima de Adaptación',
        desc: 'Mejora de rendimiento con mínimo riesgo de lesión.',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
      };
    }
    if (acwr <= 1.5) {
      return {
        label: 'Sobrecarga de Carga',
        desc: 'Precaución: aumento rápido de fatiga.',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'Alto Riesgo de Lesión',
      desc: 'Peligro de rotura o sobreentrenamiento severo.',
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: ShieldAlert,
    };
  };

  const acwrInfo = getAcwrBadge(metrics.acwr);

  return (
    <div className="space-y-6">
      {/* Cabecera del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Estado Biométrico & Fatiga</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sincronización en tiempo real de Garmin Connect (VFC/Body Battery) y Strava (Carga de entrenamiento).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Datos Sincronizados
          </span>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Training Readiness */}
        <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Predisposición</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Gauge className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{metrics.trainingReadiness}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-cyan-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${metrics.trainingReadiness}%` }}
              />
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1">
              {metrics.trainingReadiness >= 70 ? 'Listo para entrenar fuerte hoy' : 'Priorizar aeróbico'}
            </p>
          </div>
        </div>

        {/* Card 2: Body Battery */}
        <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Body Battery</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BatteryCharging className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{metrics.bodyBattery}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">%</span>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-medium text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Estrés: <strong className="text-slate-800 dark:text-slate-200">{metrics.stressLevel}</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Estable</span>
          </div>
        </div>

        {/* Card 3: VFC / HRV Nocturna */}
        <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">VFC (HRV)</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Activity className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{metrics.hrvValueMs}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 text-[10px] sm:text-xs">
              Equilibrada (58-72 ms)
            </span>
          </div>
        </div>

        {/* Card 4: Sueño y Recuperación */}
        <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sueño</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Moon className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">{metrics.sleepHours}</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-400">h</span>
          </div>
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>Score: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{metrics.sleepScore}</strong></span>
            <span>Profundo: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{metrics.deepSleepHours}h</strong></span>
          </div>
        </div>

      </div>

      {/* Bloque Detallado de Prevención de Lesiones: ACWR */}
      <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Modelo Científico de Carga</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${acwrInfo.badgeClass}`}>
                <acwrInfo.icon className="w-3.5 h-3.5" />
                {acwrInfo.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Ratio de Carga Aguda : Crónica (ACWR) = <span className="tabular-nums font-mono text-cyan-600 dark:text-cyan-400">{metrics.acwr}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {acwrInfo.desc} Calculado cruzando los impulsos de entrenamiento de los últimos 7 días contra tu base de las últimas 4 semanas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-72 bg-slate-50 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">Carga Aguda (7d)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">{metrics.acuteLoad} <span className="text-xs font-normal text-slate-500">UA</span></p>
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">Carga Crónica (28d)</p>
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">{metrics.chronicLoad} <span className="text-xs font-normal text-slate-500">UA</span></p>
            </div>
          </div>
        </div>

        {/* Barra visual de seguridad ACWR */}
        <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>&lt; 0.8 (Baja carga)</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">0.8 - 1.3 (Óptimo)</span>
            <span className="text-rose-700 dark:text-rose-400 font-bold">&gt; 1.5 (Peligro)</span>
          </div>
          <div className="relative w-full h-2.5 sm:h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div className="h-full bg-blue-300 w-[20%]" title="Desentrenamiento" />
            <div className="h-full bg-emerald-500 w-[45%]" title="Zona Dulce Óptima" />
            <div className="h-full bg-amber-400 w-[15%]" title="Sobrecarga moderada" />
            <div className="h-full bg-rose-500 w-[20%]" title="Riesgo alto" />
          </div>
          <p className="mt-2 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Tu ratio de 1.13 significa que estás progresando de manera segura sin poner en riesgo tendones ni articulaciones.
          </p>
        </div>
      </div>
    </div>
  );
}
