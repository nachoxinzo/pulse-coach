'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Flame, 
  Mountain, 
  Footprints, 
  Bike, 
  Share2, 
  Clock, 
  Dumbbell, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Plus, 
  X, 
  UserPlus,
  Compass
} from 'lucide-react';
import { UserSessionPayload } from '@/lib/auth';
import { ActivitySession } from '@/types';

export type SportFilterType = 
  | 'all' 
  | 'running' 
  | 'cycling_total' 
  | 'cycling_road' 
  | 'cycling_mtb' 
  | 'cycling_indoor' 
  | 'gym_crossfit';

export type RankingCriterion = 'km' | 'time' | 'elevation' | 'streak';

export interface ClubMember {
  id: string;
  name: string;
  avatarInitials: string;
  primaryDevice: string;
  deviceBrand: 'coros' | 'igpsport' | 'garmin' | 'strava';
  weeklyKm: number;
  weeklyDurationMin: number;
  weeklyElevationM: number;
  streakDays: number;
  favSport?: SportFilterType;
  isCurrentUser?: boolean;
}

interface ClubLeaderboardProps {
  currentUser?: UserSessionPayload | null;
  activities?: ActivitySession[];
}

/**
 * Parsea fechas estándar (2026-10-22 14:14) o relativas (Ayer, Hace 3 días)
 */
function parseActivityDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  
  // Formato ISO o SQLite "YYYY-MM-DD HH:mm"
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return new Date(str.replace(' ', 'T'));
  }

  const now = new Date();
  if (str.toLowerCase().startsWith('hoy')) return new Date(now);
  if (str.toLowerCase().startsWith('ayer')) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  const matchDays = str.match(/hace\s+(\d+)\s+días?/i);
  if (matchDays) {
    const daysAgo = parseInt(matchDays[1], 10);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  }

  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Obtiene el rango exacto de la semana (Lunes 00:00:00 a Domingo 23:59:59.999)
 * con soporte para navegar semanas anteriores/siguientes mediante offset
 */
function getWeekRange(offsetWeeks = 0, referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + offsetWeeks * 7);
  const day = d.getDay();
  // En España y Europa, lunes = 1, domingo = 7
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const optDay: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const label = `${monday.toLocaleDateString('es-ES', optDay)} – ${sunday.toLocaleDateString('es-ES', optDay)}`;

  return { monday, sunday, label };
}

/**
 * Determina si una actividad coincide con el filtro de deporte seleccionado
 */
function matchesSport(activity: ActivitySession, filter: SportFilterType): boolean {
  if (filter === 'all') return true;

  const sport = (activity.sport || '').toLowerCase();
  const title = (activity.title || '').toLowerCase();

  // Carrera (Asfalto y Trail)
  if (filter === 'running') {
    return sport === 'running' || sport === 'trail' || title.includes('carrera') || title.includes('rodaje') || title.includes('trail');
  }

  // Ciclismo Total (Carretera, Monte, Rodillo)
  if (filter === 'cycling_total') {
    return sport === 'cycling' || sport === 'mtb' || title.includes('ciclismo') || title.includes('bici') || title.includes('rodillo') || title.includes('btt');
  }

  // Bici Carretera
  if (filter === 'cycling_road') {
    const isMtb = sport === 'mtb' || title.includes('mtb') || title.includes('btt') || title.includes('montaña') || title.includes('monte');
    const isIndoor = title.includes('rodillo') || title.includes('indoor') || title.includes('virtual') || title.includes('zwift') || title.includes('estática');
    return (sport === 'cycling' || title.includes('ciclismo en ruta') || title.includes('carretera')) && !isMtb && !isIndoor;
  }

  // Bici Monte / MTB
  if (filter === 'cycling_mtb') {
    return sport === 'mtb' || title.includes('mtb') || title.includes('btt') || title.includes('montaña') || title.includes('monte');
  }

  // Rodillo / Indoor
  if (filter === 'cycling_indoor') {
    return title.includes('rodillo') || title.includes('indoor') || title.includes('virtual') || title.includes('zwift') || title.includes('estática');
  }

  // Gimnasio & CrossFit (Fuerza, Mancuernas, Core, Funcional, Elíptica)
  if (filter === 'gym_crossfit') {
    return sport === 'strength_mobility' || 
           sport === 'cardio' || 
           title.includes('fuerza') || 
           title.includes('gym') || 
           title.includes('gimnasio') || 
           title.includes('crossfit') || 
           title.includes('pesas') || 
           title.includes('funcional') || 
           title.includes('core') || 
           title.includes('wod') ||
           title.includes('elíptica');
  }

  return true;
}

/**
 * Formatea minutos en horas y minutos legibles (e.g. "3h 45m" o "35m")
 */
function formatDuration(totalMin: number): string {
  if (!totalMin || totalMin <= 0) return '0m';
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}m`;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function ClubLeaderboard({ currentUser, activities = [] }: ClubLeaderboardProps) {
  const [rankingMode, setRankingMode] = useState<RankingCriterion>('km');
  const [sportFilter, setSportFilter] = useState<SportFilterType>('all');
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = esta semana, -1 = semana pasada
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [customMembers, setCustomMembers] = useState<ClubMember[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Formulario para añadir compañero de grupeta
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDevice, setNewMemberDevice] = useState('Garmin');
  const [newMemberBrand, setNewMemberBrand] = useState<'garmin' | 'coros' | 'igpsport' | 'strava'>('garmin');
  const [newMemberKm, setNewMemberKm] = useState('');
  const [newMemberDuration, setNewMemberDuration] = useState('');
  const [newMemberEle, setNewMemberEle] = useState('');
  const [newMemberSport, setNewMemberSport] = useState<SportFilterType>('cycling_road');

  // Cargar compañeros guardados localmente
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_club_members');
      if (stored) {
        const parsed: ClubMember[] = JSON.parse(stored);
        // Filtrar antiguos miembros ficticios
        const realMembers = parsed.filter(m => !['m-2', 'm-3', 'm-4', 'm-5'].includes(m.id));
        setCustomMembers(realMembers);
        if (realMembers.length !== parsed.length) {
          localStorage.setItem('pulse_club_members', JSON.stringify(realMembers));
        }
      }
    } catch {
      // Ignorar fallback
    }
  }, []);

  const saveMembers = (updated: ClubMember[]) => {
    setCustomMembers(updated);
    try {
      localStorage.setItem('pulse_club_members', JSON.stringify(updated));
    } catch {
      // Fallback
    }
  };

  // Rango semanal actual (Lunes a Domingo)
  const currentWeek = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  // Filtrar actividades del usuario por semana (Lunes a Domingo) y por deporte
  const userWeekActivities = useMemo(() => {
    return activities.filter(act => {
      const d = parseActivityDate(act.date);
      if (!d) return false;
      const inWeek = d >= currentWeek.monday && d <= currentWeek.sunday;
      if (!inWeek) return false;
      return matchesSport(act, sportFilter);
    });
  }, [activities, currentWeek, sportFilter]);

  // Métricas del usuario calculadas SOLO con sus actividades de esta semana
  const userWeeklyKm = useMemo(() => {
    const sum = userWeekActivities.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
    return Number(sum.toFixed(1));
  }, [userWeekActivities]);

  const userWeeklyMin = useMemo(() => {
    return userWeekActivities.reduce((acc, a) => acc + (a.durationMin || 0), 0);
  }, [userWeekActivities]);

  const userWeeklyEle = useMemo(() => {
    return userWeekActivities.reduce((acc, a) => acc + (a.elevationGainM || 0), 0);
  }, [userWeekActivities]);

  const userActiveDays = useMemo(() => {
    const dates = new Set(
      userWeekActivities
        .map(a => parseActivityDate(a.date)?.toDateString())
        .filter(Boolean)
    );
    return dates.size;
  }, [userWeekActivities]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'TU';
  };

  const currentMember: ClubMember = {
    id: currentUser?.userId || 'current-user',
    name: currentUser?.name ? `${currentUser.name} (Tú)` : 'Mi Perfil (Tú)',
    avatarInitials: getInitials(currentUser?.name || 'Tú'),
    primaryDevice: currentUser?.primaryDevice ? `Dispositivo ${currentUser.primaryDevice.toUpperCase()}` : 'Garmin / Strava',
    deviceBrand: (currentUser?.primaryDevice as any) || 'garmin',
    weeklyKm: userWeeklyKm,
    weeklyDurationMin: userWeeklyMin,
    weeklyElevationM: userWeeklyEle,
    streakDays: userActiveDays > 0 ? userActiveDays : (userWeekActivities.length > 0 ? userWeekActivities.length : 0),
    favSport: sportFilter,
    isCurrentUser: true,
  };

  // Filtrar también los compañeros según el deporte elegido
  const filteredCustomMembers = useMemo(() => {
    if (sportFilter === 'all') return customMembers;
    return customMembers.filter(m => {
      if (!m.favSport || m.favSport === 'all') return true;
      if (sportFilter === 'cycling_total') {
        return m.favSport.startsWith('cycling');
      }
      return m.favSport === sportFilter;
    });
  }, [customMembers, sportFilter]);

  // Lista de miembros totales del club para la semana y deporte seleccionados
  const allMembers: ClubMember[] = [currentMember, ...filteredCustomMembers];

  // Ordenar según criterio seleccionado
  const sortedMembers = useMemo(() => {
    return [...allMembers].sort((a, b) => {
      if (rankingMode === 'time') {
        return b.weeklyDurationMin - a.weeklyDurationMin;
      }
      if (rankingMode === 'elevation') {
        return b.weeklyElevationM - a.weeklyElevationM;
      }
      if (rankingMode === 'streak') {
        return b.streakDays - a.streakDays;
      }
      // Por defecto o 'km'
      return b.weeklyKm - a.weeklyKm;
    });
  }, [allMembers, rankingMode]);

  const totalClubKm = Number(allMembers.reduce((acc, m) => acc + m.weeklyKm, 0).toFixed(1));
  const totalClubMin = allMembers.reduce((acc, m) => acc + m.weeklyDurationMin, 0);
  const clubGoalKm = Math.max(50, Math.ceil((totalClubKm || 10) / 50) * 50);
  const clubProgressPct = Math.min(100, Math.round((totalClubKm / clubGoalKm) * 100));

  const handleCopyInvite = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}?club=grupeta-amigos`);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 4000);
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const km = parseFloat(newMemberKm) || 0;
    const durMin = parseInt(newMemberDuration) || (km > 0 ? Math.round(km * 2.5) : 45);
    const ele = parseInt(newMemberEle) || 0;

    const newMember: ClubMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      avatarInitials: getInitials(newMemberName.trim()),
      primaryDevice: newMemberDevice.trim() || 'Dispositivo GPS',
      deviceBrand: newMemberBrand,
      weeklyKm: km,
      weeklyDurationMin: durMin,
      weeklyElevationM: ele,
      streakDays: 1,
      favSport: newMemberSport,
      isCurrentUser: false,
    };

    saveMembers([...customMembers, newMember]);
    setIsAddMemberModalOpen(false);
    setNewMemberName('');
    setNewMemberKm('');
    setNewMemberDuration('');
    setNewMemberEle('');
  };

  const getBrandBadge = (brand: string) => {
    switch (brand) {
      case 'coros':
        return { label: 'COROS', bg: 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
      case 'igpsport':
        return { label: 'iGPSPORT', bg: 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
      case 'garmin':
        return { label: 'Garmin', bg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' };
      default:
        return { label: 'Strava', bg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    }
  };

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-5">
      
      {/* Cabecera del Club con Navegación Semanal (Lunes a Domingo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Club Amistoso Pulse Coach
            </span>
            <span className="text-xs text-slate-500 tabular-nums font-semibold">
              {allMembers.length} {allMembers.length === 1 ? 'atleta' : 'atletas'} en el club
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            Clasificación & Retos de Grupeta
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kilómetros reales de la semana en curso (Lunes a Domingo), filtrable por disciplina deportiva y tiempo activo.
          </p>
        </div>

        {/* Acciones y Selector Semanal */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Navegador de Semanas */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 p-0.5 text-xs font-bold">
            <button
              onClick={() => setWeekOffset(prev => prev - 1)}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all touch-target"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 py-1 text-center font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>{weekOffset === 0 ? 'Esta semana' : (weekOffset === -1 ? 'Semana pasada' : currentWeek.label)}</span>
            </div>
            <button
              onClick={() => setWeekOffset(prev => Math.min(0, prev + 1))}
              disabled={weekOffset >= 0}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all touch-target disabled:opacity-30 disabled:pointer-events-none"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddMemberModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all active:scale-[0.98] shadow-xs touch-target"
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Añadir Compañero</span>
          </button>

          <button
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all touch-target"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedInvite ? 'Enlace copiado' : 'Invitar'}</span>
          </button>
        </div>
      </div>

      {/* Rango de fechas oficial visible (Lunes a Domingo) */}
      <div className="flex items-center justify-between text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-cyan-500" />
          <span>Semana Oficial: <strong className="text-slate-900 dark:text-white">{currentWeek.label}</strong> (Lunes a Domingo)</span>
        </div>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
          >
            Volver a semana actual
          </button>
        )}
      </div>

      {/* Selector de Disciplinas Deportivas (Global, Running, Ciclismo [Total/Carretera/Monte/Rodillo], Gimnasio/CrossFit) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-500" />
          <span>Filtrar por Deporte:</span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          {/* Global */}
          <button
            onClick={() => setSportFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'all'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Todos los Deportes</span>
          </button>

          {/* Carrera */}
          <button
            onClick={() => setSportFilter('running')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'running'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-cyan-500" />
            <span>Carrera & Trail</span>
          </button>

          {/* Ciclismo Total */}
          <button
            onClick={() => setSportFilter('cycling_total')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'cycling_total'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ciclismo (Total)</span>
          </button>

          {/* Subfiltro Ciclismo Carretera */}
          <button
            onClick={() => setSportFilter('cycling_road')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'cycling_road'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-sky-500" />
            <span>Bici Carretera</span>
          </button>

          {/* Subfiltro Ciclismo Monte / MTB */}
          <button
            onClick={() => setSportFilter('cycling_mtb')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'cycling_mtb'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5 text-amber-500" />
            <span>Monte / MTB</span>
          </button>

          {/* Subfiltro Rodillo / Indoor */}
          <button
            onClick={() => setSportFilter('cycling_indoor')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'cycling_indoor'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5 text-purple-500" />
            <span>Rodillo / Indoor</span>
          </button>

          {/* Gimnasio & CrossFit */}
          <button
            onClick={() => setSportFilter('gym_crossfit')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              sportFilter === 'gym_crossfit'
                ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-rose-500" />
            <span>Gimnasio & CrossFit</span>
          </button>
        </div>
      </div>

      {/* Reto Semanal del Club Adaptativo */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-cyan-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-cyan-950/30 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              {sportFilter === 'gym_crossfit'
                ? `Reto Semanal de Fuerza: ${formatDuration(totalClubMin)} acumulados`
                : `Reto Semanal de Grupeta: Objetivo ${clubGoalKm} Km`}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {sportFilter === 'gym_crossfit'
                ? 'Tiempo total invertido por los miembros del club en sesiones de fuerza, core y crossfit.'
                : 'Suma de kilómetros reales acumulados por el club en esta semana.'}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            <span>
              {sportFilter === 'gym_crossfit' ? formatDuration(totalClubMin) : `${totalClubKm} / ${clubGoalKm} km`}
            </span>
            <span className="text-amber-600 dark:text-amber-400">
              {sportFilter === 'gym_crossfit' ? `${allMembers.length} atletas` : `${clubProgressPct}%`}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-cyan-500 h-full rounded-full transition-all" 
              style={{ width: `${sportFilter === 'gym_crossfit' ? 100 : clubProgressPct}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Selector de Criterio de Ordenación ("Ordenar por:") */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold pt-1">
        <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Ordenar por:</span>
        
        {/* Kilómetros Semanales */}
        <button
          onClick={() => setRankingMode('km')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            rankingMode === 'km'
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Kilómetros Semanales
        </button>

        {/* Tiempo de Actividad (Crucial: Incluye Gimnasio y CrossFit) */}
        <button
          onClick={() => setRankingMode('time')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            rankingMode === 'time'
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Tiempo de Actividad (Incluye Gym & CrossFit)</span>
        </button>

        {/* Desnivel (+m) */}
        <button
          onClick={() => setRankingMode('elevation')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            rankingMode === 'elevation'
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Mountain className="w-3.5 h-3.5" />
          <span>Desnivel (+m)</span>
        </button>

        {/* Sesiones / Racha */}
        <button
          onClick={() => setRankingMode('streak')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
            rankingMode === 'streak'
              ? 'bg-cyan-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Sesiones Semanales</span>
        </button>
      </div>

      {/* Tabla del Leaderboard */}
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-[10px] uppercase font-bold text-slate-400">
              <th className="py-2.5 pr-2 pl-3 w-8">#</th>
              <th className="py-2.5 px-3">Atleta & Dispositivo</th>
              <th className={`py-2.5 px-3 ${rankingMode === 'km' ? 'text-cyan-600 dark:text-cyan-400 font-black' : ''}`}>
                Distancia
              </th>
              <th className={`py-2.5 px-3 ${rankingMode === 'time' ? 'text-cyan-600 dark:text-cyan-400 font-black' : ''}`}>
                Tiempo Activo
              </th>
              <th className={`py-2.5 px-3 ${rankingMode === 'elevation' ? 'text-cyan-600 dark:text-cyan-400 font-black' : ''}`}>
                Desnivel
              </th>
              <th className={`py-2.5 pr-3 pl-3 text-right ${rankingMode === 'streak' ? 'text-cyan-600 dark:text-cyan-400 font-black' : ''}`}>
                Sesiones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium tabular-nums">
            {sortedMembers.map((member, idx) => {
              const brand = getBrandBadge(member.deviceBrand);
              const isFirst = idx === 0;

              return (
                <tr 
                  key={member.id} 
                  className={`transition-colors ${
                    member.isCurrentUser 
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/30 font-bold' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 pr-2 pl-3 font-black text-slate-400">
                    {isFirst ? (
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center text-[10px] font-black">
                        1
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        member.isCurrentUser
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}>
                        {member.avatarInitials}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {member.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${brand.bg}`}>
                            {brand.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {member.primaryDevice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Distancia Semanal */}
                  <td className={`py-3 px-3 font-bold ${
                    rankingMode === 'km' 
                      ? 'text-cyan-600 dark:text-cyan-400 font-black' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {sportFilter === 'gym_crossfit' ? (
                      <span className="text-slate-400 font-normal">N/A (Fuerza)</span>
                    ) : (
                      `${member.weeklyKm} km`
                    )}
                  </td>

                  {/* Tiempo Activo Semanal (Horas y Minutos) */}
                  <td className={`py-3 px-3 font-bold ${
                    rankingMode === 'time' 
                      ? 'text-cyan-600 dark:text-cyan-400 font-black' 
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDuration(member.weeklyDurationMin)}</span>
                    </span>
                  </td>

                  {/* Desnivel Semanal */}
                  <td className={`py-3 px-3 font-semibold ${
                    rankingMode === 'elevation' 
                      ? 'text-emerald-600 dark:text-emerald-400 font-black' 
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    +{member.weeklyElevationM} m
                  </td>

                  {/* Sesiones Semanales */}
                  <td className="py-3 pr-3 pl-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Flame className="w-3 h-3 text-emerald-600" />
                      {member.streakDays} {member.streakDays === 1 ? 'sesión' : 'sesiones'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para añadir compañero real con tiempo y disciplina */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Añadir Compañero de Grupeta</h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre o Apodo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Roberto o Laura"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plataforma</label>
                  <select
                    value={newMemberBrand}
                    onChange={e => {
                      const b = e.target.value as any;
                      setNewMemberBrand(b);
                      setNewMemberDevice(b === 'garmin' ? 'Garmin Edge' : b === 'coros' ? 'COROS Pace' : b === 'igpsport' ? 'iGPSPORT' : 'Strava App');
                    }}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="garmin">Garmin</option>
                    <option value="coros">COROS</option>
                    <option value="igpsport">iGPSPORT</option>
                    <option value="strava">Strava</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Disciplina Principal</label>
                  <select
                    value={newMemberSport}
                    onChange={e => setNewMemberSport(e.target.value as SportFilterType)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="cycling_road">Carretera</option>
                    <option value="cycling_mtb">Monte / MTB</option>
                    <option value="cycling_indoor">Rodillo</option>
                    <option value="running">Carrera / Trail</option>
                    <option value="gym_crossfit">Gimnasio & CrossFit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Km Semanales</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="35.5"
                    value={newMemberKm}
                    onChange={e => setNewMemberKm(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tiempo (min)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={newMemberDuration}
                    onChange={e => setNewMemberDuration(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Desnivel (+m)</label>
                  <input
                    type="number"
                    placeholder="420"
                    value={newMemberEle}
                    onChange={e => setNewMemberEle(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-xs"
                >
                  Añadir al Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
