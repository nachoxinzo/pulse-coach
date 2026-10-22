'use client';

import React from 'react';
import { ActivitySession } from '@/types';
import { 
  Footprints, 
  Bike, 
  Mountain, 
  Dumbbell, 
  Watch, 
  Activity, 
  Flame, 
  Heart, 
  Clock, 
  TrendingUp 
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivitySession[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'running': return Footprints;
      case 'cycling': return Bike;
      case 'trail': return Mountain;
      case 'strength_mobility': return Dumbbell;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial Cruzado Garmin & Strava</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Feed unificado con telemetría de esfuerzo relativo (Strava) y efecto aeróbico/anaeróbico (Garmin).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
            {activities.length} sesiones analizadas
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((act) => {
          const SportIcon = getSportIcon(act.sport);
          const isGarmin = act.source === 'garmin';

          return (
            <div 
              key={act.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Deporte + Título */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    act.sport === 'running' 
                      ? 'bg-indigo-50 text-indigo-600' 
                      : act.sport === 'cycling' 
                      ? 'bg-sky-50 text-sky-600' 
                      : act.sport === 'trail' 
                      ? 'bg-amber-50 text-amber-600' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <SportIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{act.title}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isGarmin 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {isGarmin ? 'Garmin Connect' : 'Strava'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{act.date}</p>
                  </div>
                </div>

                {/* Métricas clave en fila */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-700 tabular-nums self-end sm:self-auto">
                  {act.distanceKm && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distancia</span>
                      <strong className="font-bold text-slate-900 text-sm">{act.distanceKm} km</strong>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duración</span>
                    <strong className="font-bold text-slate-900 text-sm">{act.durationMin} min</strong>
                  </div>

                  {act.avgPaceOrSpeed && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ritmo / Vel</span>
                      <strong className="font-bold text-slate-900 text-sm">{act.avgPaceOrSpeed}</strong>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">FC Media</span>
                    <strong className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      {act.avgHr} ppm
                    </strong>
                  </div>
                </div>

              </div>

              {/* Badges de impacto de entrenamiento */}
              {(act.trainingEffect || act.relativeEffortStrava) && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
                  {act.trainingEffect && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Training Effect Garmin:</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        Aeróbico {act.trainingEffect.aerobic}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                        Anaeróbico {act.trainingEffect.anaerobic}
                      </span>
                    </div>
                  )}

                  {act.relativeEffortStrava && (
                    <div className="flex items-center gap-1.5 text-orange-800 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200 font-bold">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      <span>Esfuerzo Relativo Strava: {act.relativeEffortStrava}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
