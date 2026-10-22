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
  TrendingUp,
  Waves,
  Zap,
  MapPin
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivitySession[];
}

interface SportVisual {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconColor: string;
}

export function getSportVisual(sport: string, title?: string): SportVisual {
  const t = (title || '').toLowerCase();
  const s = (sport || '').toLowerCase();

  // 1. Mountain Bike / BTT
  if (s === 'mtb' || t.includes('btt') || t.includes('mountain') || t.includes('mtb') || t.includes('bici de monte')) {
    return {
      icon: Bike,
      label: 'BTT / MTB',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-800',
      badgeBorder: 'border-orange-200',
      iconBg: 'bg-orange-100/80',
      iconColor: 'text-orange-700',
    };
  }

  // 2. Ciclismo de Carretera / Gravel / Rodillo
  if (s === 'cycling' || t.includes('ciclismo') || t.includes('carretera') || t.includes('gravel') || t.includes('bici')) {
    const isGravel = t.includes('gravel');
    const isIndoor = t.includes('indoor') || t.includes('rodillo');
    return {
      icon: Bike,
      label: isGravel ? 'Ciclismo Gravel' : isIndoor ? 'Ciclismo Indoor' : 'Ciclismo en Ruta',
      badgeBg: 'bg-sky-50',
      badgeText: 'text-sky-800',
      badgeBorder: 'border-sky-200',
      iconBg: 'bg-sky-100/80',
      iconColor: 'text-sky-700',
    };
  }

  // 3. Senderismo
  if (s === 'hiking' || t.includes('senderismo') || t.includes('hike') || t.includes('andaina')) {
    return {
      icon: Mountain,
      label: 'Senderismo',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-800',
      badgeBorder: 'border-emerald-200',
      iconBg: 'bg-emerald-100/80',
      iconColor: 'text-emerald-700',
    };
  }

  // 4. Trail Running
  if (s === 'trail' || t.includes('trail')) {
    return {
      icon: Mountain,
      label: 'Trail Running',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-800',
      badgeBorder: 'border-teal-200',
      iconBg: 'bg-teal-100/80',
      iconColor: 'text-teal-700',
    };
  }

  // 5. Running Asfalto / Pista
  if (s === 'running' || t.includes('carrera') || t.includes('running') || t.includes('rodaje')) {
    return {
      icon: Footprints,
      label: 'Running',
      badgeBg: 'bg-indigo-50',
      badgeText: 'text-indigo-800',
      badgeBorder: 'border-indigo-200',
      iconBg: 'bg-indigo-100/80',
      iconColor: 'text-indigo-700',
    };
  }

  // 6. Caminata / Paseo
  if (s === 'walking' || t.includes('caminata') || t.includes('paseo') || t.includes('walk')) {
    return {
      icon: Footprints,
      label: 'Caminata',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      badgeBorder: 'border-slate-200',
      iconBg: 'bg-slate-200/80',
      iconColor: 'text-slate-700',
    };
  }

  // 7. Natación
  if (s === 'swimming' || t.includes('natación') || t.includes('nadar') || t.includes('swim')) {
    return {
      icon: Waves,
      label: 'Natación',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-800',
      badgeBorder: 'border-cyan-200',
      iconBg: 'bg-cyan-100/80',
      iconColor: 'text-cyan-700',
    };
  }

  // 8. Fuerza / Gimnasio
  if (s === 'strength_mobility' || t.includes('fuerza') || t.includes('pesas') || t.includes('gimnasio')) {
    return {
      icon: Dumbbell,
      label: 'Fuerza / Gimnasio',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-800',
      badgeBorder: 'border-purple-200',
      iconBg: 'bg-purple-100/80',
      iconColor: 'text-purple-700',
    };
  }

  // 9. Cardio / Fitness
  if (s === 'cardio' || t.includes('cardio') || t.includes('elíptica') || t.includes('remo')) {
    return {
      icon: Zap,
      label: 'Cardio & Fitness',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-800',
      badgeBorder: 'border-amber-200',
      iconBg: 'bg-amber-100/80',
      iconColor: 'text-amber-700',
    };
  }

  // Por defecto
  return {
    icon: Activity,
    label: 'Actividad',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-200',
    iconBg: 'bg-slate-200/80',
    iconColor: 'text-slate-700',
  };
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/90 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Historial de Actividades</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Registro cronológico sincronizado de entrenamientos y salidas de Garmin Connect y Strava.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 tabular-nums">
            {activities.length} sesiones registradas
          </span>
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-3">
        {activities.map((act) => {
          const visual = getSportVisual(act.sport, act.title);
          const SportIcon = visual.icon;
          const isGarmin = act.source === 'garmin';

          return (
            <div 
              key={act.id}
              className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Deporte + Icono + Título + Badges */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${visual.iconBg} ${visual.iconColor}`}>
                    <SportIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}>
                        {visual.label}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                        isGarmin 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {isGarmin ? 'Garmin Connect' : 'Strava'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{act.title}</h4>
                    <p className="text-xs text-slate-500 font-medium tabular-nums">{act.date}</p>
                  </div>
                </div>

                {/* Métricas clave en fila */}
                <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-700 tabular-nums self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
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

                  {act.elevationGainM && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Desnivel</span>
                      <strong className="font-bold text-emerald-700 text-sm">+{act.elevationGainM} m</strong>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">FC Media</span>
                    <strong className="font-bold text-slate-900 text-sm flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-50" />
                      {act.avgHr} ppm
                    </strong>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
