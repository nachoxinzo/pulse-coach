'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CloudSun, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Thermometer, 
  Utensils, 
  Radio, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight, 
  Layers, 
  Compass,
  Bike
} from 'lucide-react';
import { GeneratedRoute, SportType } from '@/types';
import { 
  fetchHourlyWeatherForecast, 
  generateNutritionCoursePoints, 
  buildTcxXml, 
  HourlyWeatherForecast, 
  NutritionCoursePoint, 
  RouteGeoPoint,
  getEstimatedSpeedKmh 
} from '@/lib/nutrition-course';
import { FoodStrategy } from '@/lib/sports-nutrition';

interface RouteNutritionPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  route: GeneratedRoute | null;
  sport: SportType;
  onSuccessGarmin?: (msg: string) => void;
}

export function RouteNutritionPlannerModal({
  isOpen,
  onClose,
  route,
  sport,
  onSuccessGarmin,
}: RouteNutritionPlannerModalProps) {
  // Configuración de fecha/hora
  const [datePreset, setDatePreset] = useState<'tomorrow' | 'today' | 'weekend' | 'custom'>('tomorrow');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  
  // Peso del usuario (por defecto 99 kg)
  const [weightKg, setWeightKg] = useState<number>(99);
  const [foodStrategy, setFoodStrategy] = useState<FoodStrategy>('real_food');
  const [speedKmh, setSpeedKmh] = useState<number>(getEstimatedSpeedKmh(sport));

  // Estado meteorológico y de cálculo
  const [weather, setWeather] = useState<HourlyWeatherForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [isSendingGarmin, setIsSendingGarmin] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inicializar fecha personalizada por defecto a mañana a las 09:30
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 30, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
    setCustomDateTime(localIso);

    // Cargar peso guardado
    if (typeof window !== 'undefined') {
      const savedWeight = localStorage.getItem('pulse_user_weight_kg');
      if (savedWeight) {
        const parsed = parseFloat(savedWeight);
        if (!isNaN(parsed) && parsed >= 45 && parsed <= 140) {
          setWeightKg(parsed);
        }
      }
    }
  }, []);

  // Calcular la fecha objetivo según el preset
  const targetDate = useMemo(() => {
    const now = new Date();
    if (datePreset === 'today') {
      // Hoy dentro de 2 horas (o a las 18:00 si es de mañana)
      const target = new Date();
      target.setHours(target.getHours() + 2, 0, 0, 0);
      return target;
    } else if (datePreset === 'tomorrow') {
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(9, 30, 0, 0);
      return target;
    } else if (datePreset === 'weekend') {
      const target = new Date();
      // Próximo sábado
      const day = target.getDay();
      const diff = (6 - day + 7) % 7 || 7;
      target.setDate(target.getDate() + diff);
      target.setHours(9, 30, 0, 0);
      return target;
    } else {
      return customDateTime ? new Date(customDateTime) : now;
    }
  }, [datePreset, customDateTime]);

  // Actualizar velocidad por defecto según el deporte cuando cambie la ruta
  useEffect(() => {
    setSpeedKmh(getEstimatedSpeedKmh(sport));
  }, [sport]);

  // Consultar previsión meteorológica cuando cambie la fecha objetivo o las coordenadas
  useEffect(() => {
    if (!isOpen || !route || route.coordinates.length === 0) return;

    let isMounted = true;
    async function loadForecast() {
      setIsLoadingWeather(true);
      try {
        const startLat = route!.coordinates[0][0];
        const startLng = route!.coordinates[0][1];
        const forecast = await fetchHourlyWeatherForecast(startLat, startLng, targetDate);
        if (isMounted) {
          setWeather(forecast);
        }
      } catch (err) {
        console.error('Error cargando meteo:', err);
      } finally {
        if (isMounted) setIsLoadingWeather(false);
      }
    }

    loadForecast();
    return () => { isMounted = false; };
  }, [isOpen, route, targetDate]);

  // Convertir coordenadas y perfil en geoPoints para el cálculo
  const geoPoints: RouteGeoPoint[] = useMemo(() => {
    if (!route || route.coordinates.length < 2) return [];

    let cumDist = 0;
    const points: RouteGeoPoint[] = [];

    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    route.coordinates.forEach((coord, idx) => {
      let ele = 600;
      if (route.elevationProfile && route.elevationProfile.length > 0) {
        const profIdx = Math.min(
          route.elevationProfile.length - 1,
          Math.floor((idx / Math.max(1, route.coordinates.length - 1)) * (route.elevationProfile.length - 1))
        );
        ele = route.elevationProfile[profIdx]?.elevationM ?? 600;
      }

      if (idx > 0) {
        const prev = route.coordinates[idx - 1];
        cumDist += haversine(prev[0], prev[1], coord[0], coord[1]);
      }

      points.push({
        latitude: coord[0],
        longitude: coord[1],
        elevation: ele,
        distance: cumDist,
      });
    });

    return points;
  }, [route]);

  // Generar CoursePoints de Nutrición e Hidratación
  const nutritionCalculation = useMemo(() => {
    if (geoPoints.length < 2) return null;

    try {
      return generateNutritionCoursePoints({
        geoPoints,
        sport,
        startTime: targetDate,
        weightKg,
        weatherCategory: weather?.weatherCategory ?? 'moderate',
        foodStrategy,
        speedKmh,
      });
    } catch (err) {
      console.warn('Error calculando CoursePoints:', err);
      return null;
    }
  }, [geoPoints, sport, targetDate, weightKg, weather, foodStrategy, speedKmh]);

  // Envío a Garmin Connect con los CoursePoints de Nutrición
  const handleSendToGarminWithNutrition = async () => {
    if (!route || !nutritionCalculation) return;

    setIsSendingGarmin(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/garmin/send-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${route.name.slice(0, 36)} + Nutrición`,
          sport: route.sport,
          coordinates: route.coordinates,
          elevationProfile: route.elevationProfile,
          gpxContent: route.gpxContent,
          coursePoints: nutritionCalculation.coursePoints,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage({
          type: 'success',
          text: `¡Ruta enviada a tu Garmin Connect con ${nutritionCalculation.coursePoints.length} avisos de avituallamiento programados! Sincroniza la app Garmin Connect y aparecerán en la pantalla "Up Ahead" y con pitidos en carretera.`,
        });
        if (onSuccessGarmin) {
          onSuccessGarmin(`¡Ruta transferida con ${nutritionCalculation.coursePoints.length} avisos de nutrición!`);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'No se pudo sincronizar con Garmin Connect.',
        });
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Error de conexión con el servicio de Garmin Connect.',
      });
    } finally {
      setIsSendingGarmin(false);
    }
  };

  // Descarga del archivo .TCX con CoursePoints para Wahoo, Karoo o Garmin
  const handleDownloadTcx = () => {
    if (!route || !nutritionCalculation) return;

    const speedMps = (speedKmh * 1000) / 3600;
    const tcxXml = buildTcxXml({
      courseName: `${route.name} (Con Nutrición)`,
      sport,
      startTime: targetDate,
      geoPoints,
      coursePoints: nutritionCalculation.coursePoints,
      speedMps,
    });

    const blob = new Blob([tcxXml], { type: 'application/vnd.garmin.tcx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${route.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_nutricion.tcx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setStatusMessage({
      type: 'success',
      text: 'Archivo .TCX descargado con todos los CoursePoints de comida y agua. Compatible con Wahoo ELEMNT, Hammerhead Karoo y Garmin Edge.',
    });
  };

  if (!isOpen || !route) return null;

  const plan = nutritionCalculation?.nutritionPlan;
  const coursePoints = nutritionCalculation?.coursePoints ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Cabecera Modal */}
        <div className="px-5 py-4 border-b border-slate-200/90 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Utensils className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-100/70 px-2 py-0.5 rounded-md border border-sky-200">
                  Plan de Ruta & Alertas en Ciclocomputador
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Garmin Edge, Wahoo, Karoo & COROS
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Integración de Nutrición y Clima: {route.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors touch-target"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">

          {/* 1. Selector de "¿Cuándo tienes pensado hacerla?" */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>¿Cuándo tienes pensado salir a hacerla?</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                {targetDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} a las {targetDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDatePreset('tomorrow')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border touch-target ${
                  datePreset === 'tomorrow'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Mañana (09:30)
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border touch-target ${
                  datePreset === 'today'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Hoy (+2 horas)
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('weekend')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border touch-target ${
                  datePreset === 'weekend'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Fin de Semana
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('custom')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border touch-target ${
                  datePreset === 'custom'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                Personalizado
              </button>
            </div>

            {datePreset === 'custom' && (
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="text-xs text-slate-500">
                  Selecciona la fecha y hora exacta de salida.
                </span>
              </div>
            )}
          </div>

          {/* 2. Tarjeta de Meteorología Prevista en Tiempo Real (Open-Meteo) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-xl border border-slate-700/80 shadow-md">
            <div className="flex items-center justify-between mb-3 border-b border-slate-700/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-sky-400" />
                Previsión Meteorológica para la Salida
              </span>
              {isLoadingWeather ? (
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  Consultando satélite...
                </span>
              ) : (
                <span className="text-xs text-slate-300 font-medium">
                  {weather?.conditionLabel}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Temperatura</span>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                  <Thermometer className="w-5 h-5 text-amber-400" />
                  <span>{weather?.tempC ?? 18}°C</span>
                </div>
                <span className="text-[10px] text-slate-400">Sensación {weather?.apparentTempC ?? 18}°C</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Humedad Relativa</span>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <span>{weather?.humidityPct ?? 60}%</span>
                </div>
                <span className="text-[10px] text-slate-400">Pérdida por sudor</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Viento Previsto</span>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                  <Wind className="w-5 h-5 text-emerald-400" />
                  <span>{weather?.windSpeedKmh ?? 12} km/h</span>
                </div>
                <span className="text-[10px] text-slate-400">Viento favorable/lateral</span>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Prob. Lluvia</span>
                <div className="text-xl sm:text-2xl font-black text-white tabular-nums flex items-center justify-center sm:justify-start gap-1">
                  <CloudRain className="w-5 h-5 text-indigo-400" />
                  <span>{weather?.precipitationProb ?? 5}%</span>
                </div>
                <span className="text-[10px] text-slate-400">Precipitación</span>
              </div>
            </div>

            {weather?.sweatImpactAdvice && (
              <div className="mt-3 pt-3 border-t border-slate-700/60 text-xs text-sky-200 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span><strong>Impacto Biofísico (Atleta {weightKg} kg):</strong> {weather.sweatImpactAdvice}</span>
              </div>
            )}
          </div>

          {/* 3. Desglose del Plan Nutricional & Packlist para el Maillot */}
          {plan && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600" />
                    <span>Qué meter en los bolsillos del maillot (Plan para {weightKg} kg)</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Calculado para {route.distanceKm} km ({nutritionCalculation.estimatedDurationMin} min aprox. a {speedKmh} km/h).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {plan.carbsPerHour}g Carbs/h
                  </span>
                  <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
                    {plan.waterMlPerHour} ml Agua/h
                  </span>
                </div>
              </div>

              {/* Grid Packlist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plan.pocketPackList.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-900">{item.foodName}</span>
                        <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mb-2">{item.unit}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 italic bg-white p-1.5 rounded border border-slate-200/60">
                      {item.tip}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Lista de Avisos de Nutrición (CoursePoints) Geolocalizados en la Ruta */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-600" />
                  <span>Avisos que sonarán en tu Ciclocomputador durante la ruta</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {coursePoints.length} puntos integrados que activarán alarmas acústicas y ventanas emergentes al cruzar cada kilómetro.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200">
                Pantalla &quot;Up Ahead&quot;
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {coursePoints.map((cp, idx) => {
                const isSandwich = cp.name.toLowerCase().includes('sándwich') || cp.name.toLowerCase().includes('sandwich');
                return (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-700 bg-white px-2 py-1 rounded border border-slate-200 tabular-nums shrink-0">
                        Km {cp.distanceKm}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          {cp.pointType === 'Water' ? (
                            <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                          ) : (
                            <Utensils className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          <span>{cp.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            (~Minuto {cp.minute})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate max-w-sm sm:max-w-md">
                          {cp.notes}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shrink-0">
                      Cota {cp.elevationM}m
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Feedback de estado */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

        </div>

        {/* Barra Inferior con Botones de Acción */}
        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
            <span>Atleta: <strong>{weightKg} kg</strong></span> • <span>Estrategia: <strong>Bocaditos de Guayaba & Sándwich</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownloadTcx}
              disabled={coursePoints.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all active:scale-[0.98] touch-target shadow-xs disabled:opacity-50"
              title="Descargar archivo TCX con CoursePoints para Wahoo, Karoo o Garmin por cable"
            >
              <Download className="w-4 h-4 stroke-[2]" />
              <span>Descargar .TCX</span>
            </button>

            <button
              type="button"
              onClick={handleSendToGarminWithNutrition}
              disabled={isSendingGarmin || coursePoints.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all active:scale-[0.98] touch-target shadow-xs disabled:opacity-50"
              title="Enviar directamente a la cuenta de Garmin Connect"
            >
              {isSendingGarmin ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Radio className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>{isSendingGarmin ? 'Enviando a Garmin...' : 'Enviar a Garmin con Nutrición'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
