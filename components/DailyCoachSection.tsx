'use client';

import React, { useState, useMemo } from 'react';
import { BiometricMetrics, DailyWorkoutPlan, SportType } from '@/types';
import { generateDailyPlans, calculateReadinessVerdict } from '@/lib/coach-engine';
import { downloadStructuredWorkout } from '@/lib/workout-export';
import { WeeklyTrainingPlanner } from './WeeklyTrainingPlanner';
import { 
  Flame, 
  Clock, 
  Footprints, 
  Bike, 
  Mountain, 
  Dumbbell, 
  CheckCircle2, 
  Sparkles, 
  Compass, 
  ChevronRight, 
  ShieldCheck,
  AlertCircle,
  Download,
  Calendar,
  Watch
} from 'lucide-react';

interface DailyCoachSectionProps {
  metrics: BiometricMetrics;
  onSelectRouteForWorkout: (sport: SportType, distanceKm: number) => void;
  onCompleteWorkout: (workoutTitle: string) => void;
  todayCompleted: boolean;
  completedWorkoutTitle?: string;
}

export function DailyCoachSection({
  metrics,
  onSelectRouteForWorkout,
  onCompleteWorkout,
  todayCompleted,
  completedWorkoutTitle,
}: DailyCoachSectionProps) {
  const [selectedTimeMin, setSelectedTimeMin] = useState<number>(45);
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [activePlanId, setActivePlanId] = useState<string>('');
  const [coachView, setCoachView] = useState<'today' | 'weekly'>('today');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const verdict = useMemo(() => calculateReadinessVerdict(metrics), [metrics]);

  const plans = useMemo(() => {
    return generateDailyPlans(metrics, selectedTimeMin, selectedSport);
  }, [metrics, selectedTimeMin, selectedSport]);

  const currentPlan = plans.find((p) => p.id === activePlanId) || plans[0];

  const handleExportWorkout = (plan: DailyWorkoutPlan) => {
    downloadStructuredWorkout(plan);
    setExportNotice(`¡Entrenamiento "${plan.title}" descargado en formato estructurado! Puedes importarlo en Garmin Connect (Entrenamientos) o COROS Training Hub.`);
    setTimeout(() => setExportNotice(null), 6000);
  };

  const timeOptions = [15, 30, 45, 60, 90];
  const sportOptions: { id: SportType | 'all'; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'Cualquier Deporte', icon: Sparkles },
    { id: 'mtb', label: 'MTB / BTT', icon: Bike },
    { id: 'trail', label: 'Trail Running', icon: Mountain },
    { id: 'running', label: 'Running Asfalto', icon: Footprints },
    { id: 'cycling', label: 'Ciclismo Carretera', icon: Bike },
    { id: 'strength_mobility', label: 'Fuerza / Casa', icon: Dumbbell },
  ];

  const getSportIcon = (sport: SportType) => {
    switch (sport) {
      case 'running': return Footprints;
      case 'cycling': return Bike;
      case 'mtb': return Bike;
      case 'trail': return Mountain;
      case 'strength_mobility': return Dumbbell;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Estado Diario del Coach */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Coach Adaptativo IA
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Basado en tu VFC ({metrics.hrvValueMs}ms) y Body Battery ({metrics.bodyBattery}%)
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">{verdict.headline}</h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{verdict.advice}</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60 shrink-0">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Predisposición Hoy</p>
              <p className="text-2xl font-extrabold text-indigo-400 tabular-nums">{metrics.trainingReadiness}%</p>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">ACWR Fatiga</p>
              <p className="text-2xl font-extrabold text-emerald-400 tabular-nums">{metrics.acwr}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Modo de Planificación: Sesión de Hoy vs Calendario Semanal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0F172A] p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Planificación del Coach
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alterna entre las propuestas de la sesión de hoy o el calendario semanal completo.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setCoachView('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              coachView === 'today'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sesión de Hoy</span>
          </button>

          <button
            onClick={() => setCoachView('weekly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              coachView === 'weekly'
                ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario Semanal</span>
          </button>
        </div>
      </div>

      {/* Notificación de Descarga de Entrenamiento Estructurado */}
      {exportNotice && (
        <div className="p-3 bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-200 dark:border-cyan-800 rounded-xl text-xs text-cyan-950 dark:text-cyan-200 flex items-center gap-2 animate-in fade-in">
          <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* VISTA 1: CALENDARIO SEMANAL INTERACTIVO */}
      {coachView === 'weekly' && (
        <WeeklyTrainingPlanner metrics={metrics} />
      )}

      {/* VISTA 2: SESIÓN DE HOY */}
      {coachView === 'today' && (
        <>
          {/* Si ya se completó el entreno hoy, mensaje de éxito */}
      {todayCompleted && (
        <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">¡Objetivo de hoy completado!</p>
              <p className="text-xs text-emerald-700">
                Has registrado: <strong className="font-semibold">{completedWorkoutTitle || 'Entrenamiento diario'}</strong>. Tu racha se mantiene intacta.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg">
            Racha Activa
          </span>
        </div>
      )}

      {/* Selectores de Tiempo Disponible & Deporte */}
      <div className="bg-white dark:bg-[#0F172A] p-4 sm:p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-4">
        
        {/* Selector de Tiempo */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            ¿Cuánto tiempo tienes para entrenar hoy?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {timeOptions.map((minutes) => (
              <button
                key={minutes}
                onClick={() => setSelectedTimeMin(minutes)}
                className={`py-2.5 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center touch-target ${
                  selectedTimeMin === minutes
                    ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 active:scale-[0.98]'
                }`}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        {/* Selector de Deporte */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Deporte o Enfoque Preferido
          </label>
          <div className="flex flex-wrap gap-2">
            {sportOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedSport === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setSelectedSport(opt.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all touch-target ${
                    isSelected
                      ? 'bg-indigo-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 active:scale-[0.98]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white dark:text-slate-950' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Pestañas de Planes Generados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plans.map((p) => {
            const isSelected = (currentPlan?.id === p.id);
            const SportIcon = getSportIcon(p.sport);
            return (
              <button
                key={p.id}
                onClick={() => setActivePlanId(p.id)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border touch-target ${
                  isSelected
                    ? 'bg-white dark:bg-[#0F172A] border-indigo-600 dark:border-cyan-400 text-indigo-900 dark:text-cyan-300 shadow-sm ring-2 ring-indigo-100 dark:ring-cyan-950'
                    : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-850'
                }`}
              >
                <SportIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                <span>
                  {p.category === 'primary' && '★ Recomendación Óptima'}
                  {p.category === 'alternative' && 'Opción Alternativa'}
                  {p.category === 'non_zero_rescue' && '⚡ Micro-Dosis (12m)'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 tabular-nums">
                  {p.estimatedDurationMin}m
                </span>
              </button>
            );
          })}
        </div>

        {/* Detalle del Plan Seleccionado */}
        {currentPlan && (
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] overflow-hidden">
            
            {/* Header del Entrenamiento */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                      {currentPlan.sport === 'running' && 'Running'}
                      {currentPlan.sport === 'cycling' && 'Ciclismo Carretera'}
                      {currentPlan.sport === 'mtb' && 'Mountain Bike (MTB)'}
                      {currentPlan.sport === 'trail' && 'Trail Running Monte'}
                      {currentPlan.sport === 'strength_mobility' && 'Fuerza / Movilidad'}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {currentPlan.intensityLevel}
                    </span>
                    <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
                      {currentPlan.estimatedDurationMin} min
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">{currentPlan.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Zona Objetivo: <strong className="text-slate-700 dark:text-slate-200">{currentPlan.targetZoneDescription}</strong>
                  </p>
                </div>

                {/* Acciones principales */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => handleExportWorkout(currentPlan)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-xs font-bold border border-cyan-200 dark:border-cyan-800 transition-all touch-target"
                    title="Descargar sesión estructurada con intervalos para Garmin o COROS"
                  >
                    <Watch className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>Enviar al Reloj (.FIT)</span>
                  </button>

                  {currentPlan.suggestedRouteDistanceKm && (
                    <button
                      onClick={() => onSelectRouteForWorkout(currentPlan.sport, currentPlan.suggestedRouteDistanceKm!)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 transition-all touch-target"
                    >
                      <Compass className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Ruta ({currentPlan.suggestedRouteDistanceKm} km)</span>
                    </button>
                  )}

                  <button
                    onClick={() => onCompleteWorkout(currentPlan.title)}
                    className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg bg-slate-900 dark:bg-cyan-500 hover:bg-slate-800 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-all active:scale-[0.98] touch-target"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
                    <span>{todayCompleted ? 'Actualizar' : 'Completar'}</span>
                  </button>
                </div>
              </div>

              {/* Justificación Científica */}
              <div className="mt-4 p-3 bg-slate-100/70 dark:bg-slate-900/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/60 dark:border-slate-800">
                <strong className="font-semibold text-slate-900 dark:text-white">Por qué este entrenamiento: </strong>
                {currentPlan.rationale}
              </div>
            </div>

            {/* Estructura del Entrenamiento por Bloques */}
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estructura Paso a Paso
              </h4>

              <div className="space-y-2">
                {currentPlan.steps.map((step, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 sm:gap-4 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{step.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                            {step.intensity}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {step.durationMin} min
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{step.instruction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
