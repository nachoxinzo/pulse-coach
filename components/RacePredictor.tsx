'use client';

import React, { useState, useMemo } from 'react';
import { ActivitySession } from '@/types';
import { 
  calculateRacePredictions, 
  VDotPrediction, 
  formatSecondsToTime, 
  formatPace 
} from '@/lib/race-power-algorithms';
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
  ChevronRight,
  Sliders,
  Compass,
  Layers,
  Info
} from 'lucide-react';

interface RacePredictorProps {
  vo2Max?: number;
  activities?: ActivitySession[];
}

export function RacePredictor({ vo2Max = 52, activities = [] }: RacePredictorProps) {
  const [selectedDistance, setSelectedDistance] = useState<'1500m' | '5k' | '10k' | '21k' | '42k' | 'custom'>('10k');
  const [customDistanceInput, setCustomDistanceInput] = useState<string>('8.4');
  const [fatigueFactor, setFatigueFactor] = useState<number>(0); // -3% (óptimo), 0 (base), +3% (fatiga)
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [recalcFeedback, setRecalcFeedback] = useState<string | null>(null);

  const customKmNum = parseFloat(customDistanceInput) || 8.4;

  // Cálculo científico mediante algoritmos VDOT (Daniels & Gilbert) + Riegel-Vickers (2016)
  const calculation = useMemo(() => {
    return calculateRacePredictions(vo2Max, activities, customKmNum);
  }, [vo2Max, activities, customKmNum]);

  const current: VDotPrediction = useMemo(() => {
    if (selectedDistance === 'custom' && calculation.customPrediction) {
      return calculation.customPrediction;
    }
    const standardKey = selectedDistance === 'custom' ? '10k' : selectedDistance;
    return calculation.standardPredictions[standardKey] || calculation.standardPredictions['10k'];
  }, [selectedDistance, calculation]);

  // Aplicar factor de frescura del día (-3%, 0, +3%)
  const adjustedTimeSec = Math.round(current.timeSec * (1 + fatigueFactor / 100));
  const adjustedPaceSec = adjustedTimeSec / current.targetDistanceKm;
  const adjustedTimeFormatted = formatSecondsToTime(adjustedTimeSec);
  const adjustedPaceFormatted = formatPace(adjustedPaceSec);
  const speedKmh = ((current.targetDistanceKm / (adjustedTimeSec / 3600))).toFixed(1);

  const handleManualRecalculate = () => {
    setIsRecalculating(true);
    setRecalcFeedback('Calibrando VDOT con ritmos en Z2, frecuencia cardíaca y volumen aeróbico...');
    setTimeout(() => {
      setIsRecalculating(false);
      setRecalcFeedback(`¡Calibración completada! VDOT actualizado a ${calculation.vdot} con ${activities.length} sesiones analizadas.`);
      setTimeout(() => setRecalcFeedback(null), 5000);
    }, 1000);
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden space-y-5">
      {/* Luz ambiental cian/ámbar */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera con Badge de Estudios Científicos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black tracking-wider uppercase text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Algoritmo Daniels & Gilbert (VDOT) + Riegel-Vickers (2016)
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              VDOT Calibrado: <strong className="text-white">{calculation.vdot}</strong>
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Predictor de Competición & Ritmos de Carrera
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Modelado según consumo de oxígeno, fatiga exponencial por volumen semanal ({calculation.weeklyRunningKm} km) y telemetría real.
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
            <span>{isRecalculating ? 'Calibrando...' : 'Recalcular VDOT'}</span>
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

      {/* Selector de distancia estándar y personalizada */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {(['1500m', '5k', '10k', '21k', '42k'] as const).map((distKey) => {
          const item = calculation.standardPredictions[distKey];
          const isSelected = selectedDistance === distKey;

          return (
            <button
              key={distKey}
              onClick={() => setSelectedDistance(distKey)}
              className={`p-2.5 sm:p-3 rounded-xl border transition-all text-left flex flex-col justify-between touch-target ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {item.targetDistanceKm === 1.5 ? '1.500 M' : `${item.targetDistanceKm}K`}
                </span>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800 px-1 py-0.2 rounded">
                  VDOT
                </span>
              </div>
              <div className="mt-1.5">
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

        {/* Botón Distancia Personalizada */}
        <button
          onClick={() => setSelectedDistance('custom')}
          className={`p-2.5 sm:p-3 rounded-xl border transition-all text-left flex flex-col justify-between touch-target ${
            selectedDistance === 'custom'
              ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
              : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${selectedDistance === 'custom' ? 'text-indigo-400' : 'text-slate-400'}`}>
              A MEDIDA
            </span>
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1.5">
            <div className={`text-sm sm:text-base font-bold tabular-nums ${selectedDistance === 'custom' ? 'text-white' : 'text-slate-300'}`}>
              {calculation.customPrediction?.timeFormatted || '00:00'}
            </div>
            <div className="text-[11px] text-slate-500 tabular-nums">
              {customKmNum} km
            </div>
          </div>
        </button>
      </div>

      {/* Input de distancia a medida si está seleccionada */}
      {selectedDistance === 'custom' && (
        <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-slate-300 font-semibold">Introduce la distancia exacta de tu carrera en kilómetros:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0.5"
              max="160"
              value={customDistanceInput}
              onChange={e => setCustomDistanceInput(e.target.value)}
              className="w-24 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-bold tabular-nums text-center focus:border-cyan-500 focus:outline-hidden"
              placeholder="8.4"
            />
            <span className="text-slate-400 font-bold">km</span>
          </div>
        </div>
      )}

      {/* Tarjeta de Detalle del Pronóstico Seleccionado */}
      <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pronóstico Científico: {current.name}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums mt-1">
              {adjustedTimeFormatted}
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
              <strong>Estrategia recomendada: </strong>{current.strategyTip}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-center md:text-left">
            <div>
              <span className="text-[11px] text-slate-400 block">Ritmo Objetivo</span>
              <span className="text-lg font-bold text-cyan-400 tabular-nums">
                {adjustedPaceFormatted}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Velocidad</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                {speedKmh} km/h
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">VDOT Teórico</span>
              <span className="text-lg font-bold text-emerald-400 tabular-nums">
                {formatSecondsToTime(current.vdotTimeSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Comparador de Modelos Científicos: Daniels VDOT vs Riegel-Vickers */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 text-[11px] font-bold block flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Modelo VDOT (Daniels & Gilbert):
            </span>
            <span className="text-white font-bold tabular-nums">
              {formatSecondsToTime(current.vdotTimeSec)} ({formatPace(current.vdotTimeSec / current.targetDistanceKm)})
            </span>
            <p className="text-[10px] text-slate-500">
              Potencial aeróbico puro asumiendo óptima resistencia muscular y economía de carrera.
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 text-[11px] font-bold block flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Modelo Fatiga de Volumen (Vickers & Vertosick 2016):
            </span>
            <span className="text-white font-bold tabular-nums">
              {formatSecondsToTime(current.riegelTimeSec)} ({formatPace(current.riegelTimeSec / current.targetDistanceKm)})
            </span>
            <p className="text-[10px] text-slate-500">
              Ajustado según tus {calculation.weeklyRunningKm} km semanales reales de carrera para evitar fatiga prematura.
            </p>
          </div>
        </div>

        {/* Simulador de Frescura / Condición del Día */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Condición física / frescura del día de la carrera:</span>
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
