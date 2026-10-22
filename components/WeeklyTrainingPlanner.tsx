'use client';

import React, { useState } from 'react';
import { BiometricMetrics, SportType } from '@/types';
import { 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Footprints, 
  Bike, 
  Mountain, 
  Dumbbell, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  Sliders,
  ChevronLeft,
  ChevronRight,
  MoveRight
} from 'lucide-react';

export interface PlannedDayWorkout {
  id: string;
  dayIndex: number; // 0 = Lun, 1 = Mar, ..., 6 = Dom
  dayName: string;
  dateStr: string;
  isToday: boolean;
  status: 'completed' | 'planned' | 'rest' | 'adapted';
  title: string;
  sport: SportType;
  durationMin: number;
  intensityZone: 'Z1 Recuperación' | 'Z2 Base Aeróbica' | 'Z3 Tempo' | 'Z4 Umbral' | 'Z5 Intervalos' | 'Descanso Total';
  rationale: string;
  distanceKm?: number;
}

interface WeeklyTrainingPlannerProps {
  metrics: BiometricMetrics;
  onSelectDayWorkout?: (workout: PlannedDayWorkout) => void;
}

const INITIAL_WEEK_SCHEDULE: PlannedDayWorkout[] = [
  {
    id: 'plan-mon',
    dayIndex: 0,
    dayName: 'Lunes',
    dateStr: '19 Oct',
    isToday: false,
    status: 'completed',
    title: 'Rodaje Progresivo en Parque Central',
    sport: 'running',
    durationMin: 42,
    intensityZone: 'Z2 Base Aeróbica',
    rationale: 'Activación muscular de inicio de semana.',
    distanceKm: 8.4,
  },
  {
    id: 'plan-tue',
    dayIndex: 1,
    dayName: 'Martes',
    dateStr: '20 Oct',
    isToday: false,
    status: 'completed',
    title: 'Fondo Aeróbico de Ciclismo',
    sport: 'cycling',
    durationMin: 78,
    intensityZone: 'Z2 Base Aeróbica',
    rationale: 'Volumen aeróbico sin impacto articular.',
    distanceKm: 34.2,
  },
  {
    id: 'plan-wed',
    dayIndex: 2,
    dayName: 'Miércoles',
    dateStr: '21 Oct',
    isToday: false,
    status: 'completed',
    title: 'Fuerza Funcional & Estabilidad Core',
    sport: 'strength_mobility',
    durationMin: 35,
    intensityZone: 'Z1 Recuperación',
    rationale: 'Refuerzo de cadena posterior y glúteos.',
  },
  {
    id: 'plan-thu',
    dayIndex: 3,
    dayName: 'Jueves',
    dateStr: '22 Oct',
    isToday: true,
    status: 'planned',
    title: 'Series de Umbral Lactato (4x1000m)',
    sport: 'running',
    durationMin: 45,
    intensityZone: 'Z4 Umbral',
    rationale: 'Estímulo anaeróbico controlado para mejorar VO2 máx.',
    distanceKm: 8.0,
  },
  {
    id: 'plan-fri',
    dayIndex: 4,
    dayName: 'Viernes',
    dateStr: '23 Oct',
    isToday: false,
    status: 'planned',
    title: 'Movilidad Suave o Descanso Activo',
    sport: 'strength_mobility',
    durationMin: 25,
    intensityZone: 'Z1 Recuperación',
    rationale: 'Asimilación de la carga previa al fin de semana.',
  },
  {
    id: 'plan-sat',
    dayIndex: 5,
    dayName: 'Sábado',
    dateStr: '24 Oct',
    isToday: false,
    status: 'planned',
    title: 'Tirada Larga por Senderos (Trail / BTT)',
    sport: 'trail',
    durationMin: 90,
    intensityZone: 'Z2 Base Aeróbica',
    rationale: 'Consolidación de fondo y resistencia mitocondrial.',
    distanceKm: 15.0,
  },
  {
    id: 'plan-sun',
    dayIndex: 6,
    dayName: 'Domingo',
    dateStr: '25 Oct',
    isToday: false,
    status: 'rest',
    title: 'Día de Descanso Total & Regeneración',
    sport: 'strength_mobility',
    durationMin: 0,
    intensityZone: 'Descanso Total',
    rationale: 'Reparación de glucógeno y reposo del sistema nervioso simpático.',
  },
];

export function WeeklyTrainingPlanner({ metrics, onSelectDayWorkout }: WeeklyTrainingPlannerProps) {
  const [schedule, setSchedule] = useState<PlannedDayWorkout[]>(INITIAL_WEEK_SCHEDULE);
  const [selectedDayId, setSelectedDayId] = useState<string>('plan-thu');
  const [autoFatigueAdaptation, setAutoFatigueAdaptation] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const selectedWorkout = schedule.find((s) => s.id === selectedDayId) || schedule[3];

  // Reasignar sesión a otro día o cambiar estado
  const handleMoveToTomorrow = (dayId: string) => {
    const currentIndex = schedule.findIndex((s) => s.id === dayId);
    if (currentIndex >= 0 && currentIndex < schedule.length - 1) {
      const nextIndex = currentIndex + 1;
      const updated = [...schedule];
      
      const currentWorkout = updated[currentIndex];
      const nextWorkout = updated[nextIndex];

      // Intercambiar
      updated[currentIndex] = {
        ...nextWorkout,
        id: currentWorkout.id,
        dayIndex: currentWorkout.dayIndex,
        dayName: currentWorkout.dayName,
        dateStr: currentWorkout.dateStr,
        isToday: currentWorkout.isToday,
      };

      updated[nextIndex] = {
        ...currentWorkout,
        id: nextWorkout.id,
        dayIndex: nextWorkout.dayIndex,
        dayName: nextWorkout.dayName,
        dateStr: nextWorkout.dateStr,
        isToday: nextWorkout.isToday,
        status: 'adapted',
      };

      setSchedule(updated);
      setSelectedDayId(updated[nextIndex].id);
      setStatusBanner(`Sesión "${currentWorkout.title}" movida al ${updated[nextIndex].dayName}. El plan se ha reequilibrado.`);
      setTimeout(() => setStatusBanner(null), 5000);
    }
  };

  const handleToggleCompleted = (dayId: string) => {
    const updated = schedule.map((s) => {
      if (s.id === dayId) {
        const nextStatus = s.status === 'completed' ? 'planned' : 'completed';
        return { ...s, status: nextStatus as 'completed' | 'planned' };
      }
      return s;
    });
    setSchedule(updated);
  };

  const getSportIcon = (sport: SportType) => {
    switch (sport) {
      case 'running': return Footprints;
      case 'cycling': return Bike;
      case 'mtb': return Bike;
      case 'trail': return Mountain;
      default: return Dumbbell;
    }
  };

  // Métricas del plan semanal
  const totalMinutes = schedule.reduce((acc, s) => acc + (s.status === 'completed' || s.status === 'planned' || s.status === 'adapted' ? s.durationMin : 0), 0);
  const completedMinutes = schedule.filter((s) => s.status === 'completed').reduce((acc, s) => acc + s.durationMin, 0);
  const percentCompleted = Math.round((completedMinutes / Math.max(1, totalMinutes)) * 100);

  return (
    <div className="space-y-4">
      
      {/* Cabecera del Planificador */}
      <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-indigo-200 dark:border-cyan-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Periodización Adaptativa Semanal
              </span>
              <span className="text-xs text-slate-500 tabular-nums">
                Semana 42 / 2026
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Planificador & Calendario de Entrenamientos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribución polarizada 80/20. Reajusta tus sesiones con 1 clic si cambia tu jornada o nivel de fatiga.
            </p>
          </div>

          {/* Toggle de Auto-adaptación por fatiga */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div className="text-left text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">Protección Antilesión</span>
              <span className="text-[10px] text-slate-400">Auto-ajuste por VFC/ACWR</span>
            </div>
            <button
              onClick={() => setAutoFatigueAdaptation(!autoFatigueAdaptation)}
              className={`w-9 h-5 rounded-full transition-colors relative ml-1 ${autoFatigueAdaptation ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${autoFatigueAdaptation ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Notificación de cambio */}
        {statusBanner && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{statusBanner}</span>
          </div>
        )}

        {/* Resumen de Progreso Semanal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs tabular-nums">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Progreso Semanal</span>
            <strong className="text-base font-black text-slate-900 dark:text-white">{percentCompleted}%</strong>
            <span className="text-[10px] text-slate-500 block">{completedMinutes} de {totalMinutes} min</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Volumen Planificado</span>
            <strong className="text-base font-black text-indigo-600 dark:text-cyan-400">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</strong>
            <span className="text-[10px] text-slate-500 block">6 sesiones + 1 descanso</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ratio ACWR Semanal</span>
            <strong className="text-base font-black text-emerald-600 dark:text-emerald-400">{metrics.acwr}</strong>
            <span className="text-[10px] text-emerald-600 block font-semibold">Carga Óptima</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distribución Polarizada</span>
            <strong className="text-base font-black text-slate-900 dark:text-white">82% Z2 / 18% Z4</strong>
            <span className="text-[10px] text-slate-500 block">Modelo Seiler Pro</span>
          </div>
        </div>

      </div>

      {/* Grid Interactivo de los 7 Días de la Semana */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        {schedule.map((item) => {
          const isSelected = selectedDayId === item.id;
          const isCompleted = item.status === 'completed';
          const isRest = item.status === 'rest';
          const SportIcon = getSportIcon(item.sport);

          return (
            <div
              key={item.id}
              onClick={() => setSelectedDayId(item.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between touch-target relative ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 border-indigo-600 dark:border-cyan-400 shadow-md ring-2 ring-indigo-500/20 dark:ring-cyan-500/30'
                  : item.isToday
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800'
                  : 'bg-white dark:bg-[#0F172A] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {item.isToday && (
                <span className="absolute -top-2 right-2 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-indigo-600 text-white shadow-2xs">
                  Hoy
                </span>
              )}

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-bold ${item.isToday ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.dayName.slice(0, 3)}
                  </span>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {item.dateStr.split(' ')[0]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 my-1">
                  <div className={`p-1 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    <SportIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                    {isRest ? 'Descanso' : `${item.durationMin}m`}
                  </span>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mt-1">
                  {item.title}
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-bold ${
                  isCompleted 
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60' 
                    : isRest 
                    ? 'text-slate-500 bg-slate-100 dark:bg-slate-800' 
                    : 'text-indigo-700 dark:text-cyan-400 bg-indigo-50 dark:bg-cyan-950/60'
                }`}>
                  {isCompleted ? 'Hecho' : isRest ? 'Reposo' : 'Plan'}
                </span>
                {item.distanceKm && (
                  <span className="text-slate-400 font-bold tabular-nums">
                    {item.distanceKm}k
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ficha Detallada del Día Seleccionado con Botones de Reasignación */}
      {selectedWorkout && (
        <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-cyan-950/60 text-indigo-700 dark:text-cyan-400 flex items-center justify-center border border-indigo-200 dark:border-cyan-800 shrink-0">
                {React.createElement(getSportIcon(selectedWorkout.sport), { className: 'w-5 h-5 stroke-[2]' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {selectedWorkout.dayName} · {selectedWorkout.dateStr}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
                    {selectedWorkout.intensityZone}
                  </span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedWorkout.title}
                </h4>
              </div>
            </div>

            {/* Botonera de Gestión Rápida */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => handleToggleCompleted(selectedWorkout.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all touch-target ${
                  selectedWorkout.status === 'completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2]" />
                <span>{selectedWorkout.status === 'completed' ? 'Completado ✓' : 'Marcar como Hecho'}</span>
              </button>

              {selectedWorkout.dayIndex < 6 && (
                <button
                  onClick={() => handleMoveToTomorrow(selectedWorkout.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all touch-target"
                  title="Posponer o mover esta sesión al día siguiente"
                >
                  <MoveRight className="w-3.5 h-3.5" />
                  <span>Mover a Mañana</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white block mb-1">Objetivo del Coach Fisiológico:</strong>
            {selectedWorkout.rationale}
          </div>
        </div>
      )}

    </div>
  );
}
