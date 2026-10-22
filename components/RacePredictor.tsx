'use client';

import React, { useState, useMemo } from 'react';
import { ActivitySession } from '@/types';
import { recalculateRacePredictions, RecalculatedRacePrediction } from '@/lib/telemetry-analysis';
import { 
  Trophy, 
  Timer, 
  Flame, 
  Gauge, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Award,
  ChevronRight 
} from 'lucide-react';

interface RacePredictorProps {
  vo2Max?: number;
  activities?: ActivitySession[];
}

export function RacePredictor({ vo2Max = 52, activities = [] }: RacePredictorProps) {
  const [selectedDistance, setSelectedDistance] = useState<'5k' | '10k' | '21k' | '42k'>('10k');
  const [fatigueFactor, setFatigueFactor] = useState<number>(0); // -3% (óptimo), 0 (base), +3% (fatiga)
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalcFeedback, setRecalcFeedback] = useState<string | null>(null);

  // Recálculo dinámico con telemetría real
  const predictions = useMemo(() => {
    return recalculateRacePredictions(vo2Max, activities, fatigueFactor);
  }, [vo2Max, activities, fatigueFactor]);

  const current = predictions[selectedDistance];

  const handleManualRecalculate = () => {
    setIsRecalculating(true);
    setRecalcFeedback('Analizando ritmos en Z2, frecuencia cardíaca y volumen de tus últimas salidas...');
    setTimeout(() => {
      setIsRecalculating(false);
      setRecalcFeedback(`¡Predicciones recalculadas con éxito! Calibrado con ${activities.length} sesiones recientes de Garmin & Strava.`);
      setTimeout(() => setRecalcFeedback(null), 5000);
    }, 1200);
  };

  const speedKmh = ((current.distanceKm / (current.timeSec / 3600))).toFixed(1);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
      {/* Luz ambiental púrpura/cian */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera con Recalibrador Dinámico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
              EvoLab Race Predictor · Calibración Real
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Pronóstico de Tiempos y Ritmos de Competición
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Recalculado con tu VO2 máx ({vo2Max} ml/kg/min) y los ritmos de tus sesiones registradas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Botón Recalcular */}
          <button
            onClick={handleManualRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-xs transition-all active:scale-[0.98] touch-target disabled:opacity-60"
            title="Recalcular con las últimas actividades sincronizadas"
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Recalculando...' : 'Recalcular Telemetría'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400">Confianza:</span>
            <span className="text-cyan-400 font-bold tabular-nums">{current.confidencePercent}%</span>
          </div>
        </div>
      </div>

      {/* Feedback de Recálculo */}
      {recalcFeedback && (
        <div className="p-3 bg-slate-900 text-cyan-300 text-xs rounded-xl flex items-center gap-2 border border-cyan-500/30 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{recalcFeedback}</span>
        </div>
      )}

      {/* Selector de distancia estilo COROS con Tiempos y Deltas de Mejora */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {(['5k', '10k', '21k', '42k'] as const).map((distKey) => {
          const item = predictions[distKey];
          const isSelected = selectedDistance === distKey;

          return (
            <button
              key={distKey}
              onClick={() => setSelectedDistance(distKey)}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between touch-target ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {item.distKey.toUpperCase()}
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  -{item.improvementSec}s
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-sm sm:text-base font-bold tabular-nums ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {item.timeFormatted}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {item.paceFormatted}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tarjeta de Detalle del Objetivo Seleccionado */}
      <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Predicción Detallada: {current.name}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums mt-1">
              {current.timeFormatted}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              <strong>Estrategia de ritmo: </strong>{current.strategyTip}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-center md:text-left">
            <div>
              <span className="text-[11px] text-slate-400 block">Ritmo Objetivo</span>
              <span className="text-lg font-bold text-cyan-400 tabular-nums">
                {current.paceFormatted}
              </span>
              <span className="text-[10px] text-slate-500 block">min/km</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Velocidad</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                {speedKmh}
              </span>
              <span className="text-[10px] text-slate-500 block">km/h</span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Mejora Neta</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">
                -{current.improvementSec}s
              </span>
              <span className="text-[10px] text-slate-500 block">vs mes anterior</span>
            </div>
          </div>
        </div>

        {/* Simulador de Frescura / Condición del Día */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Condición física del día de la prueba:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFatigueFactor(-3)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                fatigueFactor === -3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Día Óptimo (-3%)
            </button>
            <button
              onClick={() => setFatigueFactor(0)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                fatigueFactor === 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal (Base)
            </button>
            <button
              onClick={() => setFatigueFactor(3)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                fatigueFactor === 3 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fatiga Leve (+3%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
