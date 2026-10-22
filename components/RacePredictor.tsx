'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Timer, Flame, Gauge, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';

interface RacePredictorProps {
  vo2Max?: number;
  thresholdPaceSec?: number; // Ritmo umbral en segundos por km (ej: 285s = 4:45/km)
}

interface RaceTarget {
  name: string;
  distanceKm: number;
  shortLabel: string;
  estimatedSeconds: number;
  paceSecPerKm: number;
  vo2Fraction: number; // Porcentaje de VO2max sostenible en esta distancia
  targetDescription: string;
}

export function RacePredictor({ vo2Max = 52, thresholdPaceSec = 285 }: RacePredictorProps) {
  const [selectedDistance, setSelectedDistance] = useState<'5k' | '10k' | '21k' | '42k'>('10k');
  const [fatigueFactor, setFatigueFactor] = useState<number>(0); // -5% (fresco) a +5% (fatigado)

  // Modelo de predicción de Jack Daniels / Cameron & Riegel modificado
  const predictions: Record<'5k' | '10k' | '21k' | '42k', RaceTarget> = useMemo(() => {
    // Estimación de velocidad aeróbica máxima (vVO2max en km/h) = VO2max / 3.5 aprox
    // Para VO2max 52: vVO2 = 14.85 km/h -> 4:02 min/km a 100% VO2max
    const vVO2maxKmh = (vo2Max * 3.5) / 12.2; 
    const vVO2maxSecPerKm = 3600 / vVO2maxKmh;

    // Factores de intensidad aeróbica sostenible según distancia:
    // 5K: ~96% vVO2max
    // 10K: ~91% vVO2max
    // 21K: ~85% vVO2max
    // 42K: ~78% vVO2max
    const modifier = 1 + fatigueFactor / 100;

    const calcTarget = (distanceKm: number, fraction: number, name: string, shortLabel: string, desc: string): RaceTarget => {
      const paceSec = (vVO2maxSecPerKm / fraction) * modifier;
      const totalSec = Math.round(paceSec * distanceKm);
      return {
        name,
        distanceKm,
        shortLabel,
        estimatedSeconds: totalSec,
        paceSecPerKm: Math.round(paceSec),
        vo2Fraction: Math.round(fraction * 100),
        targetDescription: desc,
      };
    };

    return {
      '5k': calcTarget(5.0, 0.965, '5 Kilómetros', '5K', 'Máxima potencia aeróbica y tolerancia de lactato.'),
      '10k': calcTarget(10.0, 0.912, '10 Kilómetros', '10K', 'Ritmo umbral anaeróbico constante de alta concentración.'),
      '21k': calcTarget(21.0975, 0.854, 'Media Maratón', '21K', 'Economía metabólica y gestión sostenida de carbohidratos.'),
      '42k': calcTarget(42.195, 0.785, 'Maratón Completa', '42K', 'Resistencia aeróbica pura, gestión de glucógeno y resiliencia muscular.'),
    };
  }, [vo2Max, fatigueFactor]);

  const current = predictions[selectedDistance];

  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
    }
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  };

  const formatPace = (secPerKm: number) => {
    const m = Math.floor(secPerKm / 60);
    const s = Math.round(secPerKm % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const speedKmh = ((current.distanceKm / (current.estimatedSeconds / 3600))).toFixed(1);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Luz ambiental púrpura/cian */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-400">
              EvoLab Race Predictor
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-1">
            Pronóstico de Tiempos y Ritmos de Competición
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400">VO2 Max Motor:</span>
          <span className="text-cyan-400 font-bold tabular-nums">{vo2Max} ml/kg/min</span>
        </div>
      </div>

      {/* Selector de distancia estilo COROS */}
      <div className="grid grid-cols-4 gap-2 my-4">
        {(['5k', '10k', '21k', '42k'] as const).map((distKey) => {
          const item = predictions[distKey];
          const isSelected = selectedDistance === distKey;
          return (
            <button
              key={distKey}
              onClick={() => setSelectedDistance(distKey)}
              className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950/80 to-slate-900 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                  : 'bg-slate-900/40 border-slate-800/70 hover:bg-slate-800/50 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {item.shortLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                  {item.distanceKm}k
                </span>
              </div>
              <div className="mt-2">
                <div className={`text-sm sm:text-base font-bold tabular-nums ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                  {formatTime(item.estimatedSeconds)}
                </div>
                <div className="text-[11px] text-slate-500 tabular-nums">
                  {formatPace(item.paceSecPerKm)} /km
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tarjeta de Detalle del Objetivo Seleccionado */}
      <div className="bg-gradient-to-br from-slate-900/90 to-indigo-950/40 border border-indigo-500/20 rounded-xl p-4 sm:p-5 my-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Predicción Detallada: {current.name}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums mt-1">
              {formatTime(current.estimatedSeconds)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {current.targetDescription}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
            <div className="text-center md:text-left">
              <span className="text-[11px] text-slate-400 block">Ritmo Objetivo</span>
              <span className="text-lg font-bold text-cyan-400 tabular-nums">
                {formatPace(current.paceSecPerKm)}
              </span>
              <span className="text-[10px] text-slate-500 block">min/km</span>
            </div>

            <div className="text-center md:text-left">
              <span className="text-[11px] text-slate-400 block">Velocidad</span>
              <span className="text-lg font-bold text-amber-400 tabular-nums">
                {speedKmh}
              </span>
              <span className="text-[10px] text-slate-500 block">km/h</span>
            </div>

            <div className="text-center md:text-left">
              <span className="text-[11px] text-slate-400 block">Esfuerzo VO2</span>
              <span className="text-lg font-bold text-rose-400 tabular-nums">
                {current.vo2Fraction}%
              </span>
              <span className="text-[10px] text-slate-500 block">sostenible</span>
            </div>
          </div>
        </div>

        {/* Simulador de Frescura / Condición del Día */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Ajuste por condición física del día de la prueba:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setFatigueFactor(-3)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                fatigueFactor === -3 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Día Óptimo (-3%)
            </button>
            <button
              onClick={() => setFatigueFactor(0)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
                fatigueFactor === 0 ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal (Base)
            </button>
            <button
              onClick={() => setFatigueFactor(3)}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-all ${
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
