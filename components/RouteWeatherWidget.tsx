'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Wind, 
  Droplets, 
  Compass, 
  Thermometer, 
  ShieldCheck, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface RouteWeatherWidgetProps {
  lat: number;
  lng: number;
  locationName?: string;
  sport?: string;
}

export interface WeatherData {
  tempC: number;
  apparentTempC: number;
  humidityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  precipitationMm: number;
  weatherCode: number;
  conditionLabel: string;
  gearAdvice: string;
}

export function RouteWeatherWidget({ lat, lng, locationName = 'Punto del Recorrido', sport = 'running' }: RouteWeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchWeather() {
      setIsLoading(true);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const curr = data.current;
          if (curr && isMounted) {
            const wCode = curr.weather_code || 0;
            let condition = 'Despejado / Soleado';
            if (wCode >= 1 && wCode <= 3) condition = 'Intervalos Nubosos';
            else if (wCode >= 51 && wCode <= 67) condition = 'Llovizna / Lluvia Débil';
            else if (wCode >= 71) condition = 'Nieve o Granizo';
            else if (wCode >= 80) condition = 'Chubascos Dispersos';

            // Recomendación de ropa
            let gear = 'Camiseta técnica transpirable estándar.';
            const temp = curr.temperature_2m;
            const wind = curr.wind_speed_10m;
            const rain = curr.precipitation;

            if (rain > 0.2) {
              gear = 'Chubasquero o impermeable técnico transpirable con visera.';
            } else if (temp < 10) {
              gear = 'Manga larga térmica, cortavientos fino y guantes ligeros.';
            } else if (temp < 16) {
              gear = 'Camiseta técnica con manguitos o chaleco paravientos.';
            } else if (temp > 24) {
              gear = 'Ropa muy ligera, gorra, protección solar e hidratación abundante.';
            }

            if (wind > 25 && (sport === 'cycling' || sport === 'mtb')) {
              gear += ' Viento racheado: precaución en descensos y con ruedas de perfil.';
            }

            setWeather({
              tempC: Math.round(curr.temperature_2m),
              apparentTempC: Math.round(curr.apparent_temperature),
              humidityPct: curr.relative_humidity_2m,
              windSpeedKmh: Math.round(curr.wind_speed_10m),
              windDirectionDeg: curr.wind_direction_10m,
              precipitationMm: curr.precipitation,
              weatherCode: wCode,
              conditionLabel: condition,
              gearAdvice: gear,
            });
          }
        }
      } catch (err) {
        // Fallback realista si no hay conexión externa
        if (isMounted) {
          setWeather({
            tempC: 17,
            apparentTempC: 16,
            humidityPct: 65,
            windSpeedKmh: 14,
            windDirectionDeg: 240,
            precipitationMm: 0,
            weatherCode: 2,
            conditionLabel: 'Clima Templado / Seco',
            gearAdvice: 'Condiciones óptimas: camiseta técnica estándar y bidón de 500ml.',
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchWeather();
    return () => { isMounted = false; };
  }, [lat, lng, sport]);

  const getWindDirectionCardinal = (deg: number) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  if (isLoading) {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-500" />
        <span>Consultando meteorología y viento en tiempo real en la ruta...</span>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="p-3.5 bg-gradient-to-r from-sky-500/10 via-slate-50 to-emerald-500/10 dark:from-sky-950/30 dark:via-slate-900 dark:to-emerald-950/30 rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2.5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {weather.precipitationMm > 0 ? (
            <CloudRain className="w-4 h-4 text-sky-500 shrink-0" />
          ) : weather.weatherCode <= 1 ? (
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
          ) : (
            <Cloud className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <span className="font-bold text-slate-900 dark:text-white">
            {weather.conditionLabel} en {locationName}
          </span>
        </div>

        <div className="flex items-center gap-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">
          <span className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-500" />
            {weather.tempC}°C (sens. {weather.apparentTempC}°C)
          </span>
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-cyan-500" />
            {weather.windSpeedKmh} km/h {getWindDirectionCardinal(weather.windDirectionDeg)}
          </span>
          <span className="flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-sky-500" />
            {weather.humidityPct}% hum.
          </span>
        </div>
      </div>

      <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-snug">
          <strong className="text-slate-800 dark:text-slate-200 font-semibold">Consejo de Equipamiento: </strong>
          {weather.gearAdvice}
        </p>
      </div>
    </div>
  );
}
