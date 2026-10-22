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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Estado Biométrico & Fatiga</h2>
          <p className="text-sm text-slate-500">
            Sincronización en tiempo real de Garmin Connect (VFC/Body Battery) y Strava (Carga de entrenamiento).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Datos Sincronizados
          </span>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Training Readiness */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Predisposición (Readiness)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Gauge className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{metrics.trainingReadiness}</span>
            <span className="text-sm font-semibold text-slate-400">/ 100</span>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${metrics.trainingReadiness}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {metrics.trainingReadiness >= 70 ? 'Listo para entrenar fuerte hoy' : 'Capacidad moderada, priorizar aeróbico'}
            </p>
          </div>
        </div>

        {/* Card 2: Body Battery */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Body Battery</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <BatteryCharging className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{metrics.bodyBattery}</span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 pt-1 border-t border-slate-100">
            <span>Estrés actual: <strong className="text-slate-800">{metrics.stressLevel}</strong></span>
            <span className="text-emerald-600 font-semibold">Carga estable</span>
          </div>
        </div>

        {/* Card 3: VFC / HRV Nocturna */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">VFC Nocturna (HRV)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
              <Activity className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{metrics.hrvValueMs}</span>
            <span className="text-sm font-semibold text-slate-400">ms</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Equilibrada (58-72 ms)
            </span>
          </div>
        </div>

        {/* Card 4: Sueño y Recuperación */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sueño & Descanso</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Moon className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{metrics.sleepHours}</span>
            <span className="text-sm font-semibold text-slate-400">horas</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1 border-t border-slate-100">
            <span>Score: <strong className="text-slate-800 tabular-nums">{metrics.sleepScore}/100</strong></span>
            <span>Profundo: <strong className="text-slate-800 tabular-nums">{metrics.deepSleepHours}h</strong></span>
          </div>
        </div>

      </div>

      {/* Bloque Detallado de Prevención de Lesiones: ACWR (Acute:Chronic Workload Ratio) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Modelo Científico de Carga</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${acwrInfo.badgeClass}`}>
                <acwrInfo.icon className="w-3.5 h-3.5" />
                {acwrInfo.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Ratio de Carga Aguda : Crónica (ACWR) = <span className="tabular-nums font-mono text-indigo-700">{metrics.acwr}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              {acwrInfo.desc} Calculado cruzando los impulsos de entrenamiento de los últimos 7 días contra tu base de las últimas 4 semanas.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-72 bg-slate-50 p-4 rounded-lg border border-slate-200/80">
            <div>
              <p className="text-xs text-slate-500 font-semibold">Carga Aguda (7d)</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{metrics.acuteLoad} <span className="text-xs font-normal text-slate-500">UA</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold">Carga Crónica (28d)</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">{metrics.chronicLoad} <span className="text-xs font-normal text-slate-500">UA</span></p>
            </div>
          </div>
        </div>

        {/* Barra visual de seguridad ACWR */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1.5">
            <span>&lt; 0.8 (Baja carga)</span>
            <span className="text-emerald-700 font-bold">0.8 - 1.3 (Rango Óptimo de Rendimiento)</span>
            <span className="text-rose-700 font-bold">&gt; 1.5 (Peligro)</span>
          </div>
          <div className="relative w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div className="h-full bg-blue-300 w-[20%]" title="Desentrenamiento" />
            <div className="h-full bg-emerald-500 w-[45%]" title="Zona Dulce Óptima" />
            <div className="h-full bg-amber-400 w-[15%]" title="Sobrecarga moderada" />
            <div className="h-full bg-rose-500 w-[20%]" title="Riesgo alto" />
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Tu ratio de 1.13 significa que estás progresando de manera segura sin poner en riesgo tendones ni articulaciones.
          </p>
        </div>
      </div>
    </div>
  );
}
