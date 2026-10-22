'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Crown, 
  Flame, 
  Zap, 
  Mountain, 
  Clock, 
  Calendar, 
  TrendingUp, 
  ChevronRight,
  Footprints,
  Bike,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { SportType } from '@/types';

export interface PersonalRecordItem {
  id: string;
  category: string;
  sport: 'running' | 'cycling' | 'trail' | 'mtb';
  iconType: 'crown' | 'trophy' | 'award' | 'zap' | 'mountain' | 'flame';
  title: string;
  recordValue: string;
  subValue?: string;
  dateAchieved: string;
  activityTitle: string;
  previousBest?: string;
  improvementText?: string;
  badgeLevel: 'oro' | 'plata' | 'hito';
}

const INITIAL_RECORDS: PersonalRecordItem[] = [
  {
    id: 'pr-1k',
    category: '1K Rápido',
    sport: 'running',
    iconType: 'flame',
    title: 'Mejor 1.000 metros',
    recordValue: '3:38',
    subValue: 'Ritmo 3:38 /km',
    dateAchieved: '15 May 2026',
    activityTitle: 'Series 1000m Pista Ourense',
    previousBest: '3:45',
    improvementText: '-7 seg de mejora',
    badgeLevel: 'oro'
  },
  {
    id: 'pr-5k',
    category: '5K Oficial',
    sport: 'running',
    iconType: 'trophy',
    title: 'Mejor 5 Kilómetros',
    recordValue: '19:14',
    subValue: 'Ritmo 3:50 /km',
    dateAchieved: '24 May 2026',
    activityTitle: 'Carreira Pedestre Xinzo de Limia',
    previousBest: '19:42',
    improvementText: '-28 seg de récord',
    badgeLevel: 'oro'
  },
  {
    id: 'pr-10k',
    category: '10K Tempo',
    sport: 'running',
    iconType: 'crown',
    title: 'Mejor 10 Kilómetros',
    recordValue: '40:22',
    subValue: 'Ritmo 4:02 /km',
    dateAchieved: '10 Abr 2026',
    activityTitle: 'Test de 10K Ribera del Miño',
    previousBest: '41:15',
    improvementText: '-53 seg de mejora',
    badgeLevel: 'oro'
  },
  {
    id: 'pr-21k',
    category: 'Media Maratón',
    sport: 'running',
    iconType: 'award',
    title: '21.097 metros',
    recordValue: '1h 31m 45s',
    subValue: 'Ritmo 4:21 /km',
    dateAchieved: '08 Mar 2026',
    activityTitle: 'Medio Maratón Manzaneda',
    previousBest: '1h 35m 10s',
    improvementText: '-3m 25s de récord',
    badgeLevel: 'plata'
  },
  {
    id: 'pr-longest-dist',
    category: 'Mayor Distancia',
    sport: 'cycling',
    iconType: 'trophy',
    title: 'Salida Más Larga (Gran Fondo)',
    recordValue: '96.4 km',
    subValue: '3h 32m en movimiento',
    dateAchieved: '02 Jun 2026',
    activityTitle: 'Ruta dos Castelos da Limia',
    previousBest: '84.0 km',
    improvementText: '+12.4 km récord',
    badgeLevel: 'oro'
  },
  {
    id: 'pr-max-elevation',
    category: 'Mayor Desnivel (+D)',
    sport: 'mtb',
    iconType: 'mountain',
    title: 'Pico de Desnivel Positivo',
    recordValue: '+1.620 m',
    subValue: 'Pendiente media 7.4%',
    dateAchieved: '28 May 2026',
    activityTitle: 'Desafío Serra de San Mamede MTB',
    previousBest: '+1.380 m',
    improvementText: '+240m de ascensión',
    badgeLevel: 'oro'
  },
  {
    id: 'pr-max-power',
    category: 'Pico de Vatios',
    sport: 'cycling',
    iconType: 'zap',
    title: 'Máxima Potencia (Sprint 5s)',
    recordValue: '845 W',
    subValue: '12.1 W/kg',
    dateAchieved: '14 Abr 2026',
    activityTitle: 'Sprint Alto do Furco',
    previousBest: '810 W',
    improvementText: '+35W récord absoluto',
    badgeLevel: 'oro'
  }
];

export function PersonalRecords() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'cycling'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = INITIAL_RECORDS.filter(r => {
    if (activeFilter === 'running') return r.sport === 'running' || r.sport === 'trail';
    if (activeFilter === 'cycling') return r.sport === 'cycling' || r.sport === 'mtb';
    return true;
  });

  const handleSharePr = (item: PersonalRecordItem) => {
    const text = `🏆 ¡Nuevo Récord Personal en Pulse Coach! ${item.title}: ${item.recordValue} (${item.dateAchieved})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getIcon = (type: PersonalRecordItem['iconType']) => {
    switch (type) {
      case 'crown': return <Crown className="w-5 h-5 text-amber-500 stroke-[2]" />;
      case 'trophy': return <Trophy className="w-5 h-5 text-amber-500 stroke-[2]" />;
      case 'award': return <Award className="w-5 h-5 text-cyan-500 stroke-[2]" />;
      case 'zap': return <Zap className="w-5 h-5 text-amber-500 stroke-[2]" />;
      case 'mountain': return <Mountain className="w-5 h-5 text-emerald-500 stroke-[2]" />;
      default: return <Flame className="w-5 h-5 text-rose-500 stroke-[2]" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] space-y-6">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Strava & Garmin Trophy Case
            </span>
            <span className="text-xs text-slate-400">Mejores Marcas Históricas</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Vitrina de Récords Personales (PRs & Best Efforts)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hitos individuales calculados automáticamente sobre tus entrenamientos y carreras oficiales.
          </p>
        </div>

        {/* Filtro de Deporte */}
        <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todos ({INITIAL_RECORDS.length})
          </button>
          <button
            onClick={() => setActiveFilter('running')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'running'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-cyan-500" />
            <span>Carrera</span>
          </button>
          <button
            onClick={() => setActiveFilter('cycling')}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'cycling'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ciclismo</span>
          </button>
        </div>
      </div>

      {/* Grid de Récords */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filtered.map(item => (
          <div 
            key={item.id}
            className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 hover:border-amber-300 dark:hover:border-amber-800/80 transition-all space-y-3 relative overflow-hidden group shadow-2xs"
          >
            {/* Medalla decorativa sutil en esquina */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-3xl" />

            {/* Cabecera del Récord */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center shrink-0 shadow-2xs">
                  {getIcon(item.iconType)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {item.category}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Botón compartir / copiar hito */}
              <button
                onClick={() => handleSharePr(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                title="Copiar hito para compartir"
              >
                {copiedId === item.id ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Valor Principal del Récord */}
            <div className="pt-1">
              <div className="flex items-baseline gap-2">
                <strong className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {item.recordValue}
                </strong>
                {item.subValue && (
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.subValue}
                  </span>
                )}
              </div>

              {/* Mejora respecto a la marca anterior */}
              {item.improvementText && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                    {item.improvementText}
                  </span>
                  {item.previousBest && (
                    <span className="text-[11px] text-slate-400 tabular-nums">
                      (Anterior: {item.previousBest})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Sesión donde se logró */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[160px] font-medium text-slate-600 dark:text-slate-300">
                {item.activityTitle}
              </span>
              <span className="tabular-nums shrink-0 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {item.dateAchieved}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
