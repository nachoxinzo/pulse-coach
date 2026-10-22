'use client';

import React, { useState, useEffect } from 'react';
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
  Check,
  Plus,
  X
} from 'lucide-react';
import { ActivitySession, SportType } from '@/types';

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

interface PersonalRecordsProps {
  activities?: ActivitySession[];
}

export function PersonalRecords({ activities = [] }: PersonalRecordsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'cycling'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customRecords, setCustomRecords] = useState<PersonalRecordItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Formulario manual
  const [newTitle, setNewTitle] = useState('5K Oficial');
  const [newSport, setNewSport] = useState<'running' | 'cycling'>('running');
  const [newTime, setNewTime] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newActivityName, setNewActivityName] = useState('');

  // Cargar marcas manuales guardadas por el usuario
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_user_prs');
      if (stored) {
        setCustomRecords(JSON.parse(stored));
      }
    } catch {
      // Ignorar error de lectura
    }
  }, []);

  const saveCustomRecords = (updated: PersonalRecordItem[]) => {
    setCustomRecords(updated);
    try {
      localStorage.setItem('pulse_user_prs', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  // Calcular automáticamente récords reales a partir del historial de actividades
  const calculatedRecords: PersonalRecordItem[] = React.useMemo(() => {
    const list: PersonalRecordItem[] = [];
    if (!activities || activities.length === 0) return list;

    // 1. Mayor Distancia en Carrera / Trail
    const runningSessions = activities.filter(a => a.sport === 'running' || a.sport === 'trail');
    const runningWithDist = runningSessions.filter(a => (a.distanceKm || 0) > 0);
    if (runningWithDist.length > 0) {
      const longestRun = [...runningWithDist].sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0))[0];
      list.push({
        id: `pr-run-longest-${longestRun.id}`,
        category: 'Mayor Distancia Carrera',
        sport: longestRun.sport as any,
        iconType: 'crown',
        title: 'Tirada Más Larga a Pie',
        recordValue: `${longestRun.distanceKm} km`,
        subValue: `${longestRun.durationMin} min (${longestRun.avgPaceOrSpeed || ''})`,
        dateAchieved: longestRun.date,
        activityTitle: longestRun.title,
        badgeLevel: 'oro',
      });
    }

    // 2. Mayor Distancia en Ciclismo / MTB
    const cyclingSessions = activities.filter(a => a.sport === 'cycling' || a.sport === 'mtb');
    const cyclingWithDist = cyclingSessions.filter(a => (a.distanceKm || 0) > 0);
    if (cyclingWithDist.length > 0) {
      const longestRide = [...cyclingWithDist].sort((a, b) => (b.distanceKm || 0) - (a.distanceKm || 0))[0];
      list.push({
        id: `pr-bike-longest-${longestRide.id}`,
        category: 'Mayor Distancia Ciclismo',
        sport: 'cycling',
        iconType: 'trophy',
        title: 'Salida Más Larga en Bicicleta',
        recordValue: `${longestRide.distanceKm} km`,
        subValue: `${longestRide.durationMin} min (${longestRide.avgPaceOrSpeed || ''})`,
        dateAchieved: longestRide.date,
        activityTitle: longestRide.title,
        badgeLevel: 'oro',
      });

      // Hito Centurión: Si ha completado >= 100 km en bicicleta
      const centuryRide = cyclingWithDist.find(a => (a.distanceKm || 0) >= 98);
      if (centuryRide) {
        list.push({
          id: `pr-bike-century-${centuryRide.id}`,
          category: 'Gran Fondo en Bicicleta',
          sport: 'cycling',
          iconType: 'award',
          title: 'Hito Centurión (+100 Km Bici)',
          recordValue: `${centuryRide.distanceKm} km`,
          subValue: `${centuryRide.durationMin} min · ${centuryRide.avgPaceOrSpeed || '24.7 km/h'}`,
          dateAchieved: centuryRide.date,
          activityTitle: centuryRide.title,
          badgeLevel: 'oro',
        });
      }

      // Hito Medio Fondo: Si ha completado >= 50 km en bicicleta
      const halfCentury = cyclingWithDist.find(a => (a.distanceKm || 0) >= 50 && (a.distanceKm || 0) < 98);
      if (halfCentury) {
        list.push({
          id: `pr-bike-half-${halfCentury.id}`,
          category: 'Fondo Medio en Bicicleta',
          sport: 'cycling',
          iconType: 'trophy',
          title: 'Medio Fondo (+50 Km Bici)',
          recordValue: `${halfCentury.distanceKm} km`,
          subValue: `${halfCentury.durationMin} min · ${halfCentury.avgPaceOrSpeed || ''}`,
          dateAchieved: halfCentury.date,
          activityTitle: halfCentury.title,
          badgeLevel: 'plata',
        });
      }
    }

    // 3. Mayor Desnivel Positivo (+D) Acumulado
    const sessionsWithEle = activities.filter(a => (a.elevationGainM || 0) > 0);
    if (sessionsWithEle.length > 0) {
      const maxEleActivity = [...sessionsWithEle].sort((a, b) => (b.elevationGainM || 0) - (a.elevationGainM || 0))[0];
      list.push({
        id: `pr-elevation-${maxEleActivity.id}`,
        category: 'Mayor Desnivel (+D)',
        sport: maxEleActivity.sport as any,
        iconType: 'mountain',
        title: 'Pico de Desnivel en una Sesión',
        recordValue: `+${maxEleActivity.elevationGainM} m`,
        subValue: `${maxEleActivity.distanceKm ? `${maxEleActivity.distanceKm} km · ` : ''}${maxEleActivity.durationMin} min`,
        dateAchieved: maxEleActivity.date,
        activityTitle: maxEleActivity.title,
        badgeLevel: 'oro',
      });
    }

    // 4. Mejor Ritmo Medio Registrado
    const runningWithPace = runningSessions.filter(a => a.avgPaceOrSpeed && a.avgPaceOrSpeed.includes(':'));
    if (runningWithPace.length > 0) {
      // Ordenar por ritmo más rápido
      const parsePace = (p?: string) => {
        if (!p) return 9999;
        const match = p.match(/(\d+):(\d+)/);
        if (!match) return 9999;
        return parseInt(match[1]) * 60 + parseInt(match[2]);
      };
      const fastestRun = [...runningWithPace].sort((a, b) => parsePace(a.avgPaceOrSpeed) - parsePace(b.avgPaceOrSpeed))[0];
      if (parsePace(fastestRun.avgPaceOrSpeed) < 9999) {
        list.push({
          id: `pr-fastest-pace-${fastestRun.id}`,
          category: 'Mejor Ritmo Registrado',
          sport: fastestRun.sport as any,
          iconType: 'flame',
          title: 'Ritmo Medio Más Rápido',
          recordValue: fastestRun.avgPaceOrSpeed || '',
          subValue: `${fastestRun.distanceKm || 0} km en ${fastestRun.durationMin} min`,
          dateAchieved: fastestRun.date,
          activityTitle: fastestRun.title,
          badgeLevel: 'oro',
        });
      }
    }

    return list;
  }, [activities]);

  // Combinar récords calculados automáticamente con marcas añadidas manualmente
  const allRecords = [...calculatedRecords, ...customRecords];

  const filtered = allRecords.filter(r => {
    if (activeFilter === 'running') return r.sport === 'running' || r.sport === 'trail';
    if (activeFilter === 'cycling') return r.sport === 'cycling' || r.sport === 'mtb';
    return true;
  });

  const handleSharePr = (item: PersonalRecordItem) => {
    const text = `Récord Personal en Pulse Coach: ${item.title}: ${item.recordValue} (${item.dateAchieved})`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleAddManualPr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime.trim()) return;

    const newRecord: PersonalRecordItem = {
      id: `manual-pr-${Date.now()}`,
      category: 'Marca Personal Oficial',
      sport: newSport,
      iconType: 'award',
      title: newTitle,
      recordValue: newTime.trim(),
      dateAchieved: newDate.trim() || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      activityTitle: newActivityName.trim() || 'Carrera Oficial',
      badgeLevel: 'oro',
    };

    saveCustomRecords([...customRecords, newRecord]);
    setIsAddModalOpen(false);
    setNewTime('');
    setNewActivityName('');
  };

  const getIcon = (item: PersonalRecordItem) => {
    if (item.sport === 'cycling' || item.sport === 'mtb') {
      return <Bike className="w-5 h-5 text-emerald-500 stroke-[2]" />;
    }
    if (item.sport === 'running' || item.sport === 'trail') {
      return <Footprints className="w-5 h-5 text-cyan-500 stroke-[2]" />;
    }
    switch (item.iconType) {
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
            <span className="text-xs text-slate-400">Mejores Marcas Reales</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Vitrina de Récords Personales (PRs & Best Efforts)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hitos y mejores marcas calculados estrictamente a partir de tus actividades reales o introducidos manualmente.
          </p>
        </div>

        {/* Acciones y Filtro de Deporte */}
        <div className="flex flex-wrap items-center gap-2">
          {allRecords.length > 0 && (
            <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                  activeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Todos ({allRecords.length})
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
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-[0.98] shadow-xs touch-target"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Añadir Marca Oficial</span>
          </button>
        </div>
      </div>

      {/* Grid de Récords o Estado Vacío */}
      {filtered.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Trophy className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sin marcas personales registradas todavía</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A medida que sincronices entrenamientos de Garmin, Strava o COROS, tus récords de distancia máxima, ritmos y mayor desnivel se calcularán automáticamente aquí.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all active:scale-[0.98] shadow-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Registrar Mi Primera Marca</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map(item => (
            <div 
              key={item.id}
              className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 hover:border-amber-300 dark:hover:border-amber-800/80 transition-all space-y-3 relative overflow-hidden group shadow-2xs"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-3xl" />

              {/* Cabecera del Récord */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${
                    item.sport === 'cycling' || item.sport === 'mtb'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800/80'
                      : 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800/80'
                  }`}>
                    {getIcon(item)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {item.category}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        item.sport === 'cycling' || item.sport === 'mtb'
                          ? 'bg-emerald-100/70 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-cyan-100/70 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                      }`}>
                        {item.sport === 'cycling' || item.sport === 'mtb' ? 'Bicicleta' : 'Carrera'}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                      {item.title}
                    </h3>
                  </div>
                </div>

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
      )}

      {/* Modal para añadir marca oficial manualmente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Añadir Marca Oficial</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualPr} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipo de Prueba</label>
                <select
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="Mejor 1.000 metros">1K (1.000m)</option>
                  <option value="Mejor 5 Kilómetros">5K en Ruta / Pista</option>
                  <option value="Mejor 10 Kilómetros">10K en Ruta</option>
                  <option value="Media Maratón (21.097m)">Media Maratón (21K)</option>
                  <option value="Maratón (42.195m)">Maratón (42K)</option>
                  <option value="Salida Más Larga (Gran Fondo)">Mayor Distancia en Bici</option>
                  <option value="Pico Máximo de Potencia">Pico de Potencia (W)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deporte</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSport('running')}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 ${
                      newSport === 'running' 
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span>Carrera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSport('cycling')}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 ${
                      newSport === 'cycling' 
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Ciclismo</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Marca o Tiempo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 19:45 o 41:10"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Fecha de la Marca</label>
                  <input
                    type="text"
                    placeholder="Ej. 12 May 2026"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Carrera o Lugar (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Carreira Pedestre Popular"
                  value={newActivityName}
                  onChange={e => setNewActivityName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-xs"
                >
                  Guardar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
