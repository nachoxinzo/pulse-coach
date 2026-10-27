'use client';

import React, { useState } from 'react';
import { 
  Mountain, 
  TrendingUp, 
  ChevronRight, 
  Layers, 
  Info, 
  MapPin, 
  Zap, 
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { DetectedClimb } from '@/lib/climb-detector';

interface ClimbsPreviewSectionProps {
  climbs: DetectedClimb[];
  onSelectClimb?: (climb: DetectedClimb) => void;
  selectedClimbId?: string | null;
}

export function ClimbsPreviewSection({
  climbs,
  onSelectClimb,
  selectedClimbId,
}: ClimbsPreviewSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (climbs.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mountain className="w-4 h-4 text-slate-400 shrink-0" />
          <span><strong>Perfil Llano:</strong> No se detectan puertos ni subidas categorizadas (&gt;400m al 3%) en este trazado.</span>
        </div>
        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
          Sin Puertos
        </span>
      </div>
    );
  }

  // Contar categorías
  const categoryCounts = climbs.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const summaryLabels = Object.entries(categoryCounts)
    .map(([cat, count]) => `${count}x ${cat}`)
    .join(' • ');

  const maxRampOverall = Math.max(...climbs.map((c) => c.maxGradientPct));

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
      
      {/* Cabecera Desplegable */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 border border-orange-200">
            <Mountain className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Previsualización de Subidas & Puertos (ClimbPro)
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-600 text-white">
                {climbs.length} {climbs.length === 1 ? 'Subida' : 'Subidas'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              {summaryLabels} • Rampa máxima en ruta: <strong className="text-rose-700">{maxRampOverall}%</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Leyenda de Pendientes */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> 0-3%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> 3-6%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> 6-9%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> 9-12%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 inline-block" /> &gt;12%
            </span>
          </div>

          <button
            type="button"
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-transform"
            aria-label="Alternar visualización de subidas"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Lista de Subidas Expandible */}
      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {climbs.map((climb) => {
              const isSelected = selectedClimbId === climb.id;

              return (
                <div
                  key={climb.id}
                  onClick={() => onSelectClimb && onSelectClimb(climb)}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/50 border-amber-500 shadow-sm ring-2 ring-amber-200'
                      : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/90 hover:border-slate-300'
                  } ${onSelectClimb ? 'cursor-pointer' : ''}`}
                >
                  <div>
                    {/* Fila Superior: Badge Categoría + Km Inicio */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${climb.categoryBadge.bgColor} ${climb.categoryBadge.textColor} ${climb.categoryBadge.borderColor}`}>
                        {climb.categoryBadge.label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                        Inicia en Km {climb.startKm}
                      </span>
                    </div>

                    {/* Nombre y Estadísticas Clave */}
                    <div className="flex items-baseline justify-between mb-1">
                      <h5 className="font-extrabold text-slate-900 text-sm tracking-tight">
                        {climb.name}
                      </h5>
                      <span className="text-xs font-black text-rose-700 tabular-nums">
                        +{climb.elevationGainM} m
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 text-center bg-white rounded-lg border border-slate-200/70 my-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Longitud</span>
                        <span className="font-extrabold text-slate-800 tabular-nums text-xs">
                          {climb.lengthKm} km
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Pendiente Media</span>
                        <span className="font-extrabold text-slate-800 tabular-nums text-xs">
                          {climb.avgGradientPct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Rampa Máx</span>
                        <span className="font-extrabold text-rose-600 tabular-nums text-xs">
                          {climb.maxGradientPct}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {/* Barra de Colores del Puerto (ClimbPro Gradient Segments) */}
                    <div className="mt-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                        <span>Cota {climb.startElevationM}m</span>
                        <span>Cima {climb.summitElevationM}m (Km {climb.endKm})</span>
                      </div>

                      <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-200">
                        {climb.sectors.map((sec, sIdx) => {
                          const widthPct = Math.max(4, (sec.lengthM / (climb.lengthKm * 1000)) * 100);
                          return (
                            <div
                              key={sIdx}
                              style={{ width: `${widthPct}%`, backgroundColor: sec.colorHex }}
                              className="h-full transition-opacity hover:opacity-80"
                              title={`${sec.gradientPct}% (${sec.lengthM}m)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 italic pt-1">
            * Detección calculada con el algoritmo estándar de Garmin ClimbPro / Strava (criterio FIETS). Los ciclocomputadores GPS activarán la pantalla en tiempo real al aproximarte a cada tramo.
          </p>
        </div>
      )}

    </div>
  );
}
