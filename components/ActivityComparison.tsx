'use client';

import React, { useState } from 'react';
import { ActivitySession, SportType } from '@/types';
import { compareRecentActivities } from '@/lib/telemetry-analysis';
import { getSportVisual } from './ActivityFeed';
import { 
  TrendingUp, 
  TrendingDown, 
  Heart, 
  Zap, 
  Clock, 
  Activity, 
  Sparkles, 
  Footprints, 
  Bike, 
  Mountain, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface ActivityComparisonProps {
  activities: ActivitySession[];
  onSelectActivity?: (activity: ActivitySession) => void;
}

export function ActivityComparison({ activities, onSelectActivity }: ActivityComparisonProps) {
  const [selectedSport, setSelectedSport] = useState<SportType>('running');

  const comparison = compareRecentActivities(activities, selectedSport);
  const relevantActivities = activities.filter((a) => a.sport === selectedSport || (selectedSport === 'cycling' && a.sport === 'mtb'));

  return (
    <div className="space-y-4">
      
      {/* Selector de Disciplina para Comparar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200/90 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            <TrendingUp className="w-4 h-4 stroke-[2]" />
            <span>Comparador Evolutivo de Sesiones</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
            Evolución Fisiológica & Eficiencia Aeróbica
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compara tus últimas salidas para auditar si corres o ruedas más rápido a menor coste cardiovascular.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSelectedSport('running')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSport === 'running'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Running</span>
          </button>
          <button
            onClick={() => setSelectedSport('cycling')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSport === 'cycling'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Ciclismo</span>
          </button>
          <button
            onClick={() => setSelectedSport('trail')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSport === 'trail'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Trail</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Progreso Comparativo */}
      {comparison ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Card 1: Ganancia en Eficiencia Aeróbica */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Eficiencia Aeróbica (Pa:Hr)</span>
            <div className="flex items-baseline gap-2">
              <strong className={`text-2xl font-black tabular-nums ${comparison.efficiencyGainPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {comparison.efficiencyGainPercent >= 0 ? `+${comparison.efficiencyGainPercent}%` : `${comparison.efficiencyGainPercent}%`}
              </strong>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {comparison.efficiencyGainPercent >= 0 ? 'Mejora de economía' : 'Estable'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menos pulsaciones necesarias para sostener el mismo ritmo.
            </p>
          </div>

          {/* Card 2: Diferencial de Ritmo */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Diferencial de Ritmo</span>
            <div className="flex items-baseline gap-2">
              <strong className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {comparison.paceImprovementSec > 0 ? `-${comparison.paceImprovementSec}s` : `+${Math.abs(comparison.paceImprovementSec)}s`}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                / km respecto a la salida previa
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {comparison.paceImprovementSec > 0 ? 'Mayor velocidad crucero registrada.' : 'Sesión de recuperación regenerativa.'}
            </p>
          </div>

          {/* Card 3: Tendencia de Pulso Cardíaco */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Respuesta Cardiovascular</span>
            <div className="flex items-baseline gap-2">
              <strong className={`text-2xl font-black tabular-nums ${comparison.avgHrTrend <= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-500'}`}>
                {comparison.avgHrTrend <= 0 ? `${comparison.avgHrTrend} ppm` : `+${comparison.avgHrTrend} ppm`}
              </strong>
              <span className="text-xs font-bold text-slate-500">
                en FC Media
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {comparison.avgHrTrend <= 0 ? 'El corazón bombea más volumen por latido (hipertrofia ventricular sana).' : 'Esfuerzo superior por intensidad o calor.'}
            </p>
          </div>

        </div>
      ) : (
        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
          Se necesitan al menos 2 sesiones registradas en <strong>{selectedSport}</strong> para calcular la comparativa. Realiza o sincroniza otra salida para ver tu progreso.
        </div>
      )}

      {/* Tabla Comparativa de Sesiones Recientes */}
      {relevantActivities.length > 0 && (
        <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Historial Comparativo ({relevantActivities.length} sesiones)
            </span>
            <span className="text-[11px] text-slate-400">
              Pulsa en cualquier fila para ver el análisis completo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 pr-3">Sesión & Fecha</th>
                  <th className="py-2.5 px-3">Distancia</th>
                  <th className="py-2.5 px-3">Duración</th>
                  <th className="py-2.5 px-3">Ritmo / Vel</th>
                  <th className="py-2.5 px-3">FC Media</th>
                  <th className="py-2.5 px-3">Desnivel</th>
                  <th className="py-2.5 pl-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium tabular-nums">
                {relevantActivities.map((act, idx) => (
                  <tr 
                    key={act.id} 
                    onClick={() => onSelectActivity && onSelectActivity(act)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {idx === 0 && (
                          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" title="Más reciente" />
                        )}
                        <span>{act.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-normal">{act.date}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {act.distanceKm ? `${act.distanceKm} km` : '-'}
                    </td>
                    <td className="py-3 px-3">{act.durationMin} min</td>
                    <td className="py-3 px-3 font-bold text-cyan-600 dark:text-cyan-400">
                      {act.avgPaceOrSpeed || '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {act.avgHr} ppm
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400">
                      {act.elevationGainM ? `+${act.elevationGainM}m` : '0m'}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectActivity) onSelectActivity(act);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conclusión del Coach sobre la Adaptación */}
      {comparison && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Veredicto del Coach: {comparison.progressVerdict}</span>
          </div>
          <div className="space-y-1 leading-relaxed">
            {comparison.keyInsights.map((insight, i) => (
              <p key={i} className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <span>{insight}</span>
              </p>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
