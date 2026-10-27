'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Coffee,
  Package,
  Utensils,
  Sandwich,
  ChevronRight,
  Info,
  Bike,
  Footprints
} from 'lucide-react';
import { SportType } from '@/types';
import { 
  calculateSportsNutrition, 
  FoodStrategy, 
  WeatherType, 
  GutTrainingLevel, 
  WorkoutIntensity,
  ENDURANCE_FOOD_DB
} from '@/lib/sports-nutrition';

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
  eventTitle = 'Salida de Fondo / Competición',
  defaultSport = 'cycling',
  defaultDurationMin = 150, // 2h 30m por defecto
  defaultDistanceKm = 50,
}: FuelingCalculatorModalProps) {
  const [durationMin, setDurationMin] = useState<number>(defaultDurationMin);
  const [weightKg, setWeightKg] = useState<number>(99); // Valor por defecto 99 kg según peso real del usuario
  const [sport, setSport] = useState<SportType>(defaultSport);
  const [foodStrategy, setFoodStrategy] = useState<FoodStrategy>('real_food'); // Comida real por defecto (bocaditos de guayaba, sándwiches)
  const [weatherCondition, setWeatherCondition] = useState<WeatherType>('moderate');
  const [gutTrainingLevel, setGutTrainingLevel] = useState<GutTrainingLevel>('standard');
  const [intensity, setIntensity] = useState<WorkoutIntensity>('endurance_z2');
  const [useCaffeine, setUseCaffeine] = useState<boolean>(false);

  // Cargar peso guardado en localStorage o inicializar en 99 kg
  useEffect(() => {
    try {
      const storedWeight = localStorage.getItem('pulse_user_weight_kg');
      if (storedWeight) {
        const val = parseFloat(storedWeight);
        if (!isNaN(val) && val >= 45 && val <= 140) {
          setWeightKg(val);
        }
      }
      const storedStrategy = localStorage.getItem('pulse_food_strategy') as FoodStrategy;
      if (storedStrategy) {
        setFoodStrategy(storedStrategy);
      }
    } catch {
      // Ignorar
    }
  }, []);

  const handleWeightChange = (newWeight: number) => {
    const clamped = Math.max(45, Math.min(140, newWeight));
    setWeightKg(clamped);
    try {
      localStorage.setItem('pulse_user_weight_kg', clamped.toString());
      // Disparar evento para que otros componentes (PowerDurationCurve, W/kg) se sincronicen
      window.dispatchEvent(new Event('pulse_weight_updated'));
    } catch {
      // Ignorar
    }
  };

  const handleStrategyChange = (st: FoodStrategy) => {
    setFoodStrategy(st);
    try {
      localStorage.setItem('pulse_food_strategy', st);
    } catch {
      // Ignorar
    }
  };

  // Motor bioenergético de nutrición deportiva
  const plan = useMemo(() => {
    return calculateSportsNutrition({
      weightKg,
      durationMin,
      sport,
      weather: weatherCondition,
      foodStrategy,
      gutTrainingLevel,
      intensity,
      useCaffeine,
    });
  }, [weightKg, durationMin, sport, weatherCondition, foodStrategy, gutTrainingLevel, intensity, useCaffeine]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
              <Apple className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Algoritmo Bioenergético
                </span>
                <span className="text-xs text-slate-400">Nutrición Deportiva Real</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                Calculadora de Avituallamiento & Nutrición
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Estrategia adaptada a: <strong className="text-slate-800 dark:text-slate-200">{eventTitle}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* 1. SELECTOR PRINCIPAL: PREFERENCIA DE ALIMENTOS */}
        {/* ============================================================== */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Utensils className="w-4 h-4 text-emerald-500" />
              <span>Fuente de Combustible Principal</span>
            </span>
            <span className="text-[11px] text-slate-400">¿Qué prefieres tomar en tus salidas?</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Opción 1: Comida Real (Bocaditos & Sándwiches) */}
            <button
              type="button"
              onClick={() => handleStrategyChange('real_food')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                foodStrategy === 'real_food'
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <span>Guayaba & Sándwich</span>
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                  Comida Real
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Bocaditos de guayaba, sándwich de jamón/pavo y membrillo. Cero náuseas y sabor natural.
              </p>
            </button>

            {/* Opción 2: Mixto */}
            <button
              type="button"
              onClick={() => handleStrategyChange('hybrid')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                foodStrategy === 'hybrid'
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 text-slate-900 dark:text-white ring-2 ring-amber-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-amber-700 dark:text-amber-300">
                  Mixto Equilibrado
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                  Híbrido
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Guayaba o sándwich sólido combinado con bebida isotónica en bidón para hidratar.
              </p>
            </button>

            {/* Opción 3: Geles tradicionales */}
            <button
              type="button"
              onClick={() => handleStrategyChange('supplements')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                foodStrategy === 'supplements'
                  ? 'bg-cyan-50/80 dark:bg-cyan-950/40 border-cyan-500 text-slate-900 dark:text-white ring-2 ring-cyan-500/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-cyan-700 dark:text-cyan-300">
                  Geles Clásicos
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200">
                  Suplementos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Geles de maltodextrina comerciales + pastillas de sales de laboratorio.
              </p>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. PARÁMETROS BIOMÉTRICOS & DE RUTA */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          
          {/* Peso Corporal (Soporta desde 45 hasta 130 kg, por defecto 99 kg) */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Scale className="w-3 h-3 text-emerald-500" />
                Tu Peso
              </span>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {weightKg} kg
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleWeightChange(weightKg - 1)}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min={45}
                max={140}
                value={weightKg}
                onChange={(e) => handleWeightChange(Number(e.target.value))}
                className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 text-xs font-black text-slate-900 dark:text-white tabular-nums"
              />
              <button
                type="button"
                onClick={() => handleWeightChange(weightKg + 1)}
                className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 transition-colors"
              >
                +
              </button>
            </div>
            <span className="text-[9px] text-slate-400 block text-center">Escala fluidos y sodio</span>
          </div>

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
              <option value={45}>45 min (10K / Salida corta)</option>
              <option value={60}>1h 00m (Rodaje)</option>
              <option value={90}>1h 30m (Media Maratón / Bici Z2)</option>
              <option value={120}>2h 00m (Trail / Fondo)</option>
              <option value={150}>2h 30m (Salida Carretera 65km)</option>
              <option value={210}>3h 30m (Salida 90-100km)</option>
              <option value={270}>4h 30m+ (Gran Fondo / +100km)</option>
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
              <option value="cool">Fresco (&lt; 14°C)</option>
              <option value="moderate">Templado (15-22°C)</option>
              <option value="hot">Caluroso (23-28°C)</option>
              <option value="very_hot">Calor Extremo (&gt; 29°C)</option>
            </select>
          </div>

          {/* Deporte / Modalidad */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
              {sport === 'cycling' || sport === 'mtb' ? (
                <Bike className="w-3 h-3 text-sky-500" />
              ) : (
                <Footprints className="w-3 h-3 text-cyan-500" />
              )}
              Modalidad
            </span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="cycling">Ciclismo Carretera</option>
              <option value="mtb">BTT / Ciclismo Montaña</option>
              <option value="running">Running Asfalto</option>
              <option value="trail">Trail Running</option>
            </select>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 3. METRICAS TOTALES & TASAS HORARIAS */}
        {/* ============================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          
          {/* Carbohidratos */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
              Carbohidratos
            </span>
            <strong className="text-xl font-black text-amber-600 dark:text-amber-300 tabular-nums">
              {plan.carbsPerHour}g <span className="text-xs font-medium text-slate-500">/ h</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{plan.totalCarbsGrams}g</strong> ({Math.round(plan.totalCarbsGrams * 4)} kcal)
            </span>
          </div>

          {/* Hidratación (Ajustada para 99 kg) */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 block">
              Hidratación ({weightKg} kg)
            </span>
            <strong className="text-xl font-black text-cyan-600 dark:text-cyan-300 tabular-nums">
              {plan.waterMlPerHour}ml <span className="text-xs font-medium text-slate-500">/ h</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{plan.totalWaterLiters} L</strong> (~{Math.ceil(plan.totalWaterLiters / 0.75)} bidones)
            </span>
          </div>

          {/* Sodio / Electrolitos */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
              Sodio & Sales
            </span>
            <strong className="text-xl font-black text-emerald-600 dark:text-emerald-300 tabular-nums">
              {plan.sodiumMgPerHour}mg <span className="text-xs font-medium text-slate-500">/ h</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Total: <strong>{plan.totalSodiumMg}mg</strong>
            </span>
          </div>

          {/* Pérdida de Sudor Estimada */}
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
            <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 block">
              Tasa Sudoración
            </span>
            <strong className="text-xl font-black text-indigo-600 dark:text-indigo-300 tabular-nums">
              ~{plan.sweatRateEstimateLitersPerHour} L <span className="text-xs font-medium text-slate-500">/ h</span>
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 block">
              Según masa y clima
            </span>
          </div>

        </div>

        {/* ============================================================== */}
        {/* 4. LISTA DE CARGA PARA EL MAILLOT O MOCHILA ("PACKLIST") */}
        {/* ============================================================== */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-500" />
              <span>Qué meter en los bolsillos del maillot / mochila</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
              {foodStrategy === 'real_food' ? '100% Comida Real' : foodStrategy === 'hybrid' ? 'Mixto Natural' : 'Geles'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plan.pocketPackList.map((item, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3 shadow-2xs"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  {item.foodName.toLowerCase().includes('guayaba') ? (
                    <Apple className="w-4 h-4" />
                  ) : item.foodName.toLowerCase().includes('sándwich') ? (
                    <Sandwich className="w-4 h-4" />
                  ) : item.foodName.toLowerCase().includes('bidón') ? (
                    <Droplets className="w-4 h-4 text-cyan-500" />
                  ) : (
                    <Zap className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.quantity} × {item.foodName}
                    </strong>
                    {item.totalCarbsGrams > 0 && (
                      <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 tabular-nums">
                        {item.totalCarbsGrams}g HC
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {item.tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 5. CRONOGRAMA MINUTO A MINUTO (TIMELINE) */}
        {/* ============================================================== */}
        <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              <span>Cronograma de Ingestas en Marcha</span>
            </span>
            <span className="text-[10px] text-slate-400">
              Digestión en tramos llanos o rodaje suave
            </span>
          </div>

          <div className="space-y-2">
            {plan.timeline.map((step, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs transition-colors ${
                  step.category === 'pre'
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : step.category === 'post'
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="w-20 shrink-0 font-black text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {step.label}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>{step.foodName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({step.portion})</span>
                    {step.waterMl > 0 && (
                      <span className="text-[9px] font-semibold text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-200 dark:border-cyan-800 flex items-center gap-0.5">
                        <Droplets className="w-2.5 h-2.5" />
                        <span>+{step.waterMl}ml agua</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {step.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 6. FUNDAMENTOS CIENTÍFICOS & CONSEJOS PARA EL ATLETA */}
        {/* ============================================================== */}
        <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-200 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Sparkles className="w-4 h-4" />
            <span>Por qué funciona: Ciencia de la Comida Real a {weightKg} kg</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
            {plan.scienceInsights.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-800/70 border border-slate-700/60">
                <span className="text-emerald-400 font-bold shrink-0">•</span>
                <p className="leading-snug">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400">
            Peso de {weightKg} kg guardado para cálculos de W/kg y fatiga.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-cyan-400 transition-colors touch-target"
          >
            Cerrar & Aplicar
          </button>
        </div>

      </div>
    </div>
  );
}
