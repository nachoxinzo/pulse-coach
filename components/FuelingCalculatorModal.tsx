'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Flame, 
  Droplets, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Apple, 
  Zap, 
  Scale, 
  Thermometer, 
  Coffee 
} from 'lucide-react';
import { SportType } from '@/types';

interface FuelingCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  defaultSport?: SportType;
  defaultDurationMin?: number;
  defaultDistanceKm?: number;
}

export function FuelingCalculatorModal({
  isOpen,
  onClose,
  eventTitle = 'Prueba de Fondo / Competición',
  defaultSport = 'running',
  defaultDurationMin = 90,
  defaultDistanceKm = 15,
}: FuelingCalculatorModalProps) {
  const [durationMin, setDurationMin] = useState<number>(defaultDurationMin);
  const [weightKg, setWeightKg] = useState<number>(70);
  const [sport, setSport] = useState<SportType>(defaultSport);
  const [weatherCondition, setWeatherCondition] = useState<'cool' | 'moderate' | 'hot'>('moderate');
  const [gutTrainingLevel, setGutTrainingLevel] = useState<'standard' | 'adapted'>('standard');
  const [useCaffeine, setUseCaffeine] = useState<boolean>(true);

  // Cálculos de nutrición según consensos ISSN / ACSM
  const fuelingPlan = useMemo(() => {
    const hours = durationMin / 60;
    
    // Gramos de carbohidratos por hora según duración y tolerancia
    let carbsPerHour = 30;
    if (durationMin < 60) carbsPerHour = 0; // Enjuague bucal o nada
    else if (durationMin <= 90) carbsPerHour = 45;
    else if (durationMin <= 150) carbsPerHour = gutTrainingLevel === 'adapted' ? 75 : 60;
    else carbsPerHour = gutTrainingLevel === 'adapted' ? 90 : 75;

    // Hidratación en ml por hora según peso y clima
    const weatherFactor = weatherCondition === 'hot' ? 1.4 : weatherCondition === 'cool' ? 0.8 : 1.0;
    const waterMlPerHour = Math.round((weightKg * 8) * weatherFactor);

    // Sodio en mg por hora
    const sodiumMgPerHour = weatherCondition === 'hot' ? 750 : weatherCondition === 'cool' ? 400 : 550;

    const totalCarbsGrams = Math.round(carbsPerHour * hours);
    const totalWaterMl = Math.round(waterMlPerHour * hours);
    const totalSodiumMg = Math.round(sodiumMgPerHour * hours);

    const gelsCount = carbsPerHour > 0 ? Math.ceil(totalCarbsGrams / 30) : 0;
    const saltCapsCount = Math.ceil(totalSodiumMg / 300);

    // Timeline de ingestas
    const schedule: { min: number; label: string; item: string; detail: string; hasCaffeine?: boolean }[] = [];
    
    // Antes de salir
    schedule.push({
      min: -15,
      label: '15 min antes',
      item: 'Activación Previa',
      detail: '200ml de agua + 1 medio gel o medio plátano (15g HC) para asegurar glucemia estable.',
    });

    if (durationMin >= 45) {
      let currentMin = 30;
      let gelIdx = 1;
      while (currentMin < durationMin) {
        const isCaffeineGel = useCaffeine && (gelIdx === 2 || currentMin >= 75);
        schedule.push({
          min: currentMin,
          label: `Minuto ${currentMin}`,
          item: `Gel #${gelIdx} ${isCaffeineGel ? '(con Cafeína)' : ''}`,
          detail: `Tomar 1 gel (30g HC) acompañado de 150ml de agua para facilitar el vaciamiento gástrico.`,
          hasCaffeine: isCaffeineGel,
        });
        currentMin += Math.round(60 / (carbsPerHour / 30));
        gelIdx++;
      }
    }

    schedule.push({
      min: durationMin,
      label: 'Meta / Llegada',
      item: 'Ventana Metabólica de Recuperación',
      detail: `Consumir 4:1 carbohidratos/proteína (${Math.round(weightKg * 1.0)}g HC + ${Math.round(weightKg * 0.3)}g proteína) en los primeros 30 min.`,
    });

    return {
      carbsPerHour,
      waterMlPerHour,
      sodiumMgPerHour,
      totalCarbsGrams,
      totalWaterMl,
      totalSodiumMg,
      gelsCount,
      saltCapsCount,
      schedule,
    };
  }, [durationMin, weightKg, weatherCondition, gutTrainingLevel, useCaffeine]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Calculadora de Nutrición, Hidratación & Geles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Estrategia para: <strong className="text-slate-800 dark:text-slate-200">{eventTitle}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1. SELECTORES DE ENTRADA Y PARÁMETROS */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          
          {/* Tiempo Objetivo */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-500" />
              Tiempo Estimado
            </span>
            <select
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value={45}>45 min (10K Rápido)</option>
              <option value={60}>1h 00m (10K / Rodaje)</option>
              <option value={90}>1h 30m (Media Maratón)</option>
              <option value={120}>2h 00m (Trail / Fondo)</option>
              <option value={150}>2h 30m (BTT Medio)</option>
              <option value={210}>3h 30m (Maratón / Gran Fondo)</option>
              <option value={270}>4h 30m+ (Ultra / BTT Largo)</option>
            </select>
          </div>

          {/* Peso Corporal */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              <Scale className="w-3 h-3 text-emerald-500" />
              Peso Atleta
            </span>
            <select
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              {[55, 60, 65, 70, 75, 80, 85, 90].map((w) => (
                <option key={w} value={w}>{w} kg</option>
              ))}
            </select>
          </div>

          {/* Clima / Temperatura */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-500" />
              Clima Previsto
            </span>
            <select
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="cool">Fresco (&lt;14°C)</option>
              <option value="moderate">Templado (15-22°C)</option>
              <option value="hot">Calor (&gt;23°C)</option>
            </select>
          </div>

          {/* Tolerancia Estomacal */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-500" />
              Estómago (Gut)
            </span>
            <select
              value={gutTrainingLevel}
              onChange={(e) => setGutTrainingLevel(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="standard">Estándar (60g/h)</option>
              <option value="adapted">Entrenado (90g/h)</option>
            </select>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 2. TARJETAS DE RESULTADO: TOTALES Y TASAS HORARIAS */}
        {/* ============================================================== */}
        <div className="grid grid-cols-3 gap-2.5 text-xs">
          
          {/* Carbohidratos */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
              Carbohidratos
            </span>
            <strong className="text-xl font-black text-amber-600 dark:text-amber-300 tabular-nums">
              {fuelingPlan.carbsPerHour}g <span className="text-xs font-medium text-slate-500">/ hora</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{fuelingPlan.totalCarbsGrams}g</strong> ({fuelingPlan.gelsCount} geles aprox.)
            </span>
          </div>

          {/* Hidratación */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">
              Hidratación
            </span>
            <strong className="text-xl font-black text-cyan-600 dark:text-cyan-300 tabular-nums">
              {fuelingPlan.waterMlPerHour}ml <span className="text-xs font-medium text-slate-500">/ hora</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{(fuelingPlan.totalWaterMl / 1000).toFixed(1)} L</strong> agua/isotónico
            </span>
          </div>

          {/* Sodio / Sales */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
              Sodio & Electrolitos
            </span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-300 tabular-nums">
              {fuelingPlan.sodiumMgPerHour}mg <span className="text-xs font-medium text-slate-500">/ hora</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{fuelingPlan.totalSodiumMg}mg</strong> ({fuelingPlan.saltCapsCount} cápsulas)
            </span>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 3. CRONOGRAMA MINUTO A MINUTO (TIMELINE) */}
        {/* ============================================================== */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              Cronograma de Ingestas Recomendado
            </span>
            <span className="text-[10px] text-slate-400">
              Protocolo de vaciamiento gástrico rápido
            </span>
          </div>

          <div className="space-y-2">
            {fuelingPlan.schedule.map((step, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div className="w-16 shrink-0 font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {step.label}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{step.item}</span>
                    {step.hasCaffeine && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                        <Coffee className="w-3 h-3" />
                        <span>Cafeína</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {step.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400">
            Ajustado para ratio 1:0.8 Maltodextrina/Fructosa.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-cyan-400 transition-colors touch-target"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
