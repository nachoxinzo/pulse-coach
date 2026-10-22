'use client';

import React, { useState } from 'react';
import { 
  Trophy, 
  Users, 
  Flame, 
  Mountain, 
  Footprints, 
  Bike, 
  Share2, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Watch, 
  Radio, 
  Copy 
} from 'lucide-react';
import { UserSessionPayload } from '@/lib/auth';

export interface ClubMember {
  id: string;
  name: string;
  avatarInitials: string;
  primaryDevice: string;
  deviceBrand: 'coros' | 'igpsport' | 'garmin' | 'strava';
  weeklyKm: number;
  weeklyElevationM: number;
  streakDays: number;
  challengeProgressPct: number;
  isCurrentUser?: boolean;
}

interface ClubLeaderboardProps {
  currentUser?: UserSessionPayload | null;
}

const INITIAL_MEMBERS: ClubMember[] = [
  {
    id: 'm-1',
    name: 'Nacho (Tú)',
    avatarInitials: 'NA',
    primaryDevice: 'Garmin Forerunner 965',
    deviceBrand: 'garmin',
    weeklyKm: 42.6,
    weeklyElevationM: 480,
    streakDays: 12,
    challengeProgressPct: 85,
    isCurrentUser: true,
  },
  {
    id: 'm-2',
    name: 'Carlos M. (Limia BTT)',
    avatarInitials: 'CM',
    primaryDevice: 'iGPSPORT BSC200',
    deviceBrand: 'igpsport',
    weeklyKm: 68.4,
    weeklyElevationM: 920,
    streakDays: 8,
    challengeProgressPct: 92,
  },
  {
    id: 'm-3',
    name: 'Ana R. (Trail Ourense)',
    avatarInitials: 'AR',
    primaryDevice: 'COROS Pace 3',
    deviceBrand: 'coros',
    weeklyKm: 38.2,
    weeklyElevationM: 710,
    streakDays: 14,
    challengeProgressPct: 76,
  },
  {
    id: 'm-4',
    name: 'David F. (Xinzo Runners)',
    avatarInitials: 'DF',
    primaryDevice: 'COROS Apex 2 Pro',
    deviceBrand: 'coros',
    weeklyKm: 31.5,
    weeklyElevationM: 220,
    streakDays: 5,
    challengeProgressPct: 63,
  },
  {
    id: 'm-5',
    name: 'Marcos V. (Gravel Galicia)',
    avatarInitials: 'MV',
    primaryDevice: 'iGPSPORT iGS630',
    deviceBrand: 'igpsport',
    weeklyKm: 54.0,
    weeklyElevationM: 640,
    streakDays: 9,
    challengeProgressPct: 72,
  },
];

export function ClubLeaderboard({ currentUser }: ClubLeaderboardProps) {
  const [rankingMode, setRankingMode] = useState<'km' | 'elevation' | 'streak'>('km');
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Ordenar según métrica elegida
  const sortedMembers = [...INITIAL_MEMBERS].sort((a, b) => {
    if (rankingMode === 'km') return b.weeklyKm - a.weeklyKm;
    if (rankingMode === 'elevation') return b.weeklyElevationM - a.weeklyElevationM;
    return b.streakDays - a.streakDays;
  });

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(window.location.origin + '?club=amigos-pulse-coach');
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 4000);
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
    <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 shadow-sm space-y-4">
      
      {/* Cabecera del Club */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Club Amistoso Pulse Coach
            </span>
            <span className="text-xs text-slate-500 tabular-nums">
              5 miembros activos esta semana
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            Clasificación & Retos de Grupo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compara tus entrenamientos con tus amigos tengan COROS, iGPSPORT o Garmin sin suscripciones de pago.
          </p>
        </div>

        {/* Botón Invitar Amigo */}
        <button
          onClick={handleCopyInvite}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all self-start sm:self-auto touch-target"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedInvite ? '¡Enlace copiado!' : 'Invitar Amigo al Club'}</span>
        </button>
      </div>

      {/* Reto Semanal Activo del Club */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-cyan-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-cyan-950/30 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Reto Semanal de Otoño: 250 Km en Grupo
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Objetivo común: sumar kilómetros en bici o carrera entre todos los miembros.
            </span>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            <span>234.7 / 250 km</span>
            <span className="text-amber-600 dark:text-amber-400">94%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-cyan-500 h-full rounded-full" style={{ width: '94%' }} />
          </div>
        </div>
      </div>

      {/* Selector de Criterio de Ranking */}
      <div className="flex items-center gap-1.5 text-xs font-bold">
        <span className="text-slate-400 mr-1 text-[11px] uppercase tracking-wider">Ordenar por:</span>
        <button
          onClick={() => setRankingMode('km')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            rankingMode === 'km'
              ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Kilómetros Semanales
        </button>

        <button
          onClick={() => setRankingMode('elevation')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            rankingMode === 'elevation'
              ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Desnivel (+m)
        </button>

        <button
          onClick={() => setRankingMode('streak')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            rankingMode === 'streak'
              ? 'bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          Días de Racha
        </button>
      </div>

      {/* Tabla del Leaderboard */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400">
              <th className="py-2.5 pr-2 w-8">#</th>
              <th className="py-2.5 px-3">Atleta & Dispositivo</th>
              <th className="py-2.5 px-3">Distancia</th>
              <th className="py-2.5 px-3">Desnivel</th>
              <th className="py-2.5 pl-3 text-right">Racha Non-Zero</th>
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
                      ? 'bg-cyan-50/40 dark:bg-cyan-950/20 font-bold' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 pr-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isFirst 
                        ? 'bg-amber-400 text-slate-950 shadow-xs' 
                        : idx === 1 
                        ? 'bg-slate-300 text-slate-800' 
                        : idx === 2 
                        ? 'bg-amber-700/60 text-white' 
                        : 'text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {member.avatarInitials}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-bold ${brand.bg}`}>
                            {brand.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block font-normal">
                          {member.primaryDevice}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white text-sm">
                    {member.weeklyKm} km
                  </td>

                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                    +{member.weeklyElevationM} m
                  </td>

                  <td className="py-3 pl-3 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <Flame className="w-3.5 h-3.5 stroke-[2.2]" />
                      {member.streakDays} días
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
