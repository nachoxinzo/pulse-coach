'use client';

import React, { useState } from 'react';
import { ActivitySession } from '@/types';
import { ActivityDetailModal } from './ActivityDetailModal';
import { ActivityComparison } from './ActivityComparison';
import { PersonalRecords } from './PersonalRecords';
import { GearTracker } from './GearTracker';
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
  MapPin, 
  BarChart3, 
  Sparkles, 
  ChevronRight, 
  Maximize2,
  Trophy,
  Wrench
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
      badgeBg: 'bg-orange-50 dark:bg-orange-950/50',
      badgeText: 'text-orange-800 dark:text-orange-300',
      badgeBorder: 'border-orange-200 dark:border-orange-800',
      iconBg: 'bg-orange-100/80 dark:bg-orange-950/80',
      iconColor: 'text-orange-700 dark:text-orange-400',
    };
  }

  // 2. Ciclismo de Carretera / Gravel / Rodillo
  if (s === 'cycling' || t.includes('ciclismo') || t.includes('carretera') || t.includes('gravel') || t.includes('bici')) {
    const isGravel = t.includes('gravel');
    const isIndoor = t.includes('indoor') || t.includes('rodillo');
    return {
      icon: Bike,
      label: isGravel ? 'Ciclismo Gravel' : isIndoor ? 'Ciclismo Indoor' : 'Ciclismo en Ruta',
      badgeBg: 'bg-sky-50 dark:bg-sky-950/50',
      badgeText: 'text-sky-800 dark:text-sky-300',
      badgeBorder: 'border-sky-200 dark:border-sky-800',
      iconBg: 'bg-sky-100/80 dark:bg-sky-950/80',
      iconColor: 'text-sky-700 dark:text-sky-400',
    };
  }

  // 3. Senderismo
  if (s === 'hiking' || t.includes('senderismo') || t.includes('hike') || t.includes('andaina')) {
    return {
      icon: Mountain,
      label: 'Senderismo',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50',
      badgeText: 'text-emerald-800 dark:text-emerald-300',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100/80 dark:bg-emerald-950/80',
      iconColor: 'text-emerald-700 dark:text-emerald-400',
    };
  }

  // 4. Trail Running
  if (s === 'trail' || t.includes('trail')) {
    return {
      icon: Mountain,
      label: 'Trail Running',
      badgeBg: 'bg-teal-50 dark:bg-teal-950/50',
      badgeText: 'text-teal-800 dark:text-teal-300',
      badgeBorder: 'border-teal-200 dark:border-teal-800',
      iconBg: 'bg-teal-100/80 dark:bg-teal-950/80',
      iconColor: 'text-teal-700 dark:text-teal-400',
    };
  }

  // 5. Running Asfalto / Pista
  if (s === 'running' || t.includes('carrera') || t.includes('running') || t.includes('rodaje')) {
    return {
      icon: Footprints,
      label: 'Running',
      badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50',
      badgeText: 'text-indigo-800 dark:text-indigo-300',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800',
      iconBg: 'bg-indigo-100/80 dark:bg-indigo-950/80',
      iconColor: 'text-indigo-700 dark:text-indigo-400',
    };
  }

  // 6. Caminata / Paseo
  if (s === 'walking' || t.includes('caminata') || t.includes('paseo') || t.includes('walk')) {
    return {
      icon: Footprints,
      label: 'Caminata',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-800 dark:text-slate-200',
      badgeBorder: 'border-slate-200 dark:border-slate-700',
      iconBg: 'bg-slate-200/80 dark:bg-slate-800/80',
      iconColor: 'text-slate-700 dark:text-slate-300',
    };
  }

  // 7. Natación
  if (s === 'swimming' || t.includes('natación') || t.includes('nadar') || t.includes('swim')) {
    return {
      icon: Waves,
      label: 'Natación',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50',
      badgeText: 'text-cyan-800 dark:text-cyan-300',
      badgeBorder: 'border-cyan-200 dark:border-cyan-800',
      iconBg: 'bg-cyan-100/80 dark:bg-cyan-950/80',
      iconColor: 'text-cyan-700 dark:text-cyan-400',
    };
  }

  // 8. Fuerza / Gimnasio
  if (s === 'strength_mobility' || t.includes('fuerza') || t.includes('pesas') || t.includes('gimnasio')) {
    return {
      icon: Dumbbell,
      label: 'Fuerza / Gimnasio',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/50',
      badgeText: 'text-purple-800 dark:text-purple-300',
      badgeBorder: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100/80 dark:bg-purple-950/80',
      iconColor: 'text-purple-700 dark:text-purple-400',
    };
  }

  // 9. Cardio / Fitness
  if (s === 'cardio' || t.includes('cardio') || t.includes('elíptica') || t.includes('remo')) {
    return {
      icon: Zap,
      label: 'Cardio & Fitness',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/50',
      badgeText: 'text-amber-800 dark:text-amber-300',
      badgeBorder: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100/80 dark:bg-amber-950/80',
      iconColor: 'text-amber-700 dark:text-amber-400',
    };
  }

  // Por defecto
  return {
    icon: Activity,
    label: 'Actividad',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-200',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    iconBg: 'bg-slate-200/80 dark:bg-slate-800/80',
    iconColor: 'text-slate-700 dark:text-slate-300',
  };
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'comparison' | 'records' | 'gear'>('feed');
  const [selectedActivity, setSelectedActivity] = useState<ActivitySession | null>(null);

  return (
    <div className="space-y-6">
      
      {/* Cabecera con Selector de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/50 px-2.5 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Auditoría & Análisis de Telemetría
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              {activities.length} sesiones registradas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            Historial, Récords & Material
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Analiza todas las métricas de cada entrenamiento, compara salidas, revisa tus PRs y el desgaste de tu equipo.
          </p>
        </div>

        {/* Pestañas de Vista */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'feed'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sesiones</span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'comparison'
                ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 stroke-[2]" />
            <span>Comparar</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'records'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 stroke-[2]" />
            <span>Récords (PRs)</span>
          </button>

          <button
            onClick={() => setActiveTab('gear')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'gear'
                ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 stroke-[2]" />
            <span>Material</span>
          </button>
        </div>
      </div>

      {/* VISTA 1: COMPARADOR EVOLUTIVO */}
      {activeTab === 'comparison' && (
        <ActivityComparison
          activities={activities}
          onSelectActivity={(act) => setSelectedActivity(act)}
        />
      )}

      {/* VISTA 2: VITRINA DE RÉCORDS PERSONALES */}
      {activeTab === 'records' && (
        <PersonalRecords activities={activities} />
      )}

      {/* VISTA 3: GESTOR DE DESGASTE DE MATERIAL */}
      {activeTab === 'gear' && (
        <GearTracker />
      )}

      {/* VISTA 4: LISTA DE ACTIVIDADES CON ANÁLISIS DE TELEMETRÍA */}
      {activeTab === 'feed' && (
        <div className="space-y-3">
          {activities.map((act) => {
            const visual = getSportVisual(act.sport, act.title);
            const SportIcon = visual.icon;
            const isGarmin = act.source === 'garmin';

            return (
              <div 
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className="bg-white dark:bg-[#0F172A] rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] hover:border-cyan-500/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Bloque Izquierdo: Icono + Título + Badges */}
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${visual.iconBg} ${visual.iconColor} group-hover:scale-105 transition-transform`}>
                      <SportIcon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${visual.badgeBg} ${visual.badgeText} ${visual.badgeBorder}`}>
                          {visual.label}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                          isGarmin 
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' 
                            : 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                        }`}>
                          {isGarmin ? 'Garmin Connect' : 'Strava'}
                        </span>
                        {act.trainingEffect && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            TE {act.trainingEffect.aerobic} Aeróbico
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {act.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tabular-nums">
                        {act.date}
                      </p>
                    </div>
                  </div>

                  {/* Bloque Derecho: Métricas en Fila + Botón Analizar */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 sm:gap-6 text-xs text-slate-700 dark:text-slate-300 tabular-nums border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    
                    {act.distanceKm && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distancia</span>
                        <strong className="font-bold text-slate-900 dark:text-white text-sm">{act.distanceKm} km</strong>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duración</span>
                      <strong className="font-bold text-slate-900 dark:text-white text-sm">{act.durationMin} min</strong>
                    </div>

                    {act.avgPaceOrSpeed && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ritmo / Vel</span>
                        <strong className="font-bold text-slate-900 dark:text-white text-sm">{act.avgPaceOrSpeed}</strong>
                      </div>
                    )}

                    {act.elevationGainM && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Desnivel</span>
                        <strong className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">+{act.elevationGainM} m</strong>
                      </div>
                    )}

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">FC Media</span>
                      <strong className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                        {act.avgHr} ppm
                      </strong>
                    </div>

                    {/* Botón de Acción Directa */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedActivity(act);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold transition-all shadow-xs touch-target"
                      title="Ver análisis de telemetría, zonas y parciales"
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Analizar</span>
                    </button>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle Exhaustivo de la Actividad */}
      <ActivityDetailModal
        activity={selectedActivity}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

    </div>
  );
}
