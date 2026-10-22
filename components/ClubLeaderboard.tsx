'use client';

import React, { useState, useEffect } from 'react';
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
  Copy,
  Plus,
  X,
  UserPlus
} from 'lucide-react';
import { UserSessionPayload } from '@/lib/auth';
import { ActivitySession } from '@/types';

export interface ClubMember {
  id: string;
  name: string;
  avatarInitials: string;
  primaryDevice: string;
  deviceBrand: 'coros' | 'igpsport' | 'garmin' | 'strava';
  weeklyKm: number;
  weeklyElevationM: number;
  streakDays: number;
  isCurrentUser?: boolean;
}

interface ClubLeaderboardProps {
  currentUser?: UserSessionPayload | null;
  activities?: ActivitySession[];
}

export function ClubLeaderboard({ currentUser, activities = [] }: ClubLeaderboardProps) {
  const [rankingMode, setRankingMode] = useState<'km' | 'elevation' | 'streak'>('km');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [customMembers, setCustomMembers] = useState<ClubMember[]>([]);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Formulario para añadir compañero de grupeta real
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberDevice, setNewMemberDevice] = useState('Garmin');
  const [newMemberBrand, setNewMemberBrand] = useState<'garmin' | 'coros' | 'igpsport' | 'strava'>('garmin');
  const [newMemberKm, setNewMemberKm] = useState('');
  const [newMemberEle, setNewMemberEle] = useState('');

  // Cargar miembros reales almacenados localmente
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pulse_club_members');
      if (stored) {
        const parsed: ClubMember[] = JSON.parse(stored);
        // Filtrar antiguos miembros ficticios para garantizar que solo haya datos reales
        const realMembers = parsed.filter(m => !['m-2', 'm-3', 'm-4', 'm-5'].includes(m.id));
        setCustomMembers(realMembers);
        if (realMembers.length !== parsed.length) {
          localStorage.setItem('pulse_club_members', JSON.stringify(realMembers));
        }
      }
    } catch {
      // Ignorar error de lectura
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

  // Calcular métricas reales del usuario actual desde sus actividades
  const userWeeklyKm = Number(activities.reduce((acc, a) => acc + (a.distanceKm || 0), 0).toFixed(1));
  const userWeeklyEle = activities.reduce((acc, a) => acc + (a.elevationGainM || 0), 0);

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
    weeklyElevationM: userWeeklyEle,
    streakDays: activities.length > 0 ? activities.length : 1,
    isCurrentUser: true,
  };

  // Lista de miembros totales del club (Usuario actual + compañeros reales que se unan)
  const allMembers: ClubMember[] = [currentMember, ...customMembers];

  // Ordenar según métrica elegida
  const sortedMembers = [...allMembers].sort((a, b) => {
    if (rankingMode === 'km') return b.weeklyKm - a.weeklyKm;
    if (rankingMode === 'elevation') return b.weeklyElevationM - a.weeklyElevationM;
    return b.streakDays - a.streakDays;
  });

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
    const ele = parseInt(newMemberEle) || 0;

    const newMember: ClubMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      avatarInitials: getInitials(newMemberName.trim()),
      primaryDevice: newMemberDevice.trim() || 'Dispositivo GPS',
      deviceBrand: newMemberBrand,
      weeklyKm: km,
      weeklyElevationM: ele,
      streakDays: 1,
      isCurrentUser: false,
    };

    saveMembers([...customMembers, newMember]);
    setIsAddMemberModalOpen(false);
    setNewMemberName('');
    setNewMemberKm('');
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

  const totalClubKm = Number(allMembers.reduce((acc, m) => acc + m.weeklyKm, 0).toFixed(1));
  const clubGoalKm = Math.max(100, Math.ceil(totalClubKm / 50) * 50);
  const clubProgressPct = Math.min(100, Math.round((totalClubKm / clubGoalKm) * 100));

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
              {allMembers.length} {allMembers.length === 1 ? 'miembro' : 'miembros'} esta semana
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            Clasificación & Retos de Grupo
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compara tus entrenamientos con tus compañeros de grupeta sin suscripciones de pago.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
            <span>{copiedInvite ? 'Enlace copiado' : 'Invitar Amigo'}</span>
          </button>
        </div>
      </div>

      {/* Reto Semanal del Club con Kilómetros Reales */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-cyan-500/10 dark:from-amber-950/30 dark:via-slate-900 dark:to-cyan-950/30 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-white block">
              Reto Semanal de Grupeta: Objetivo {clubGoalKm} Km
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Suma de kilómetros acumulados por los miembros del club esta semana.
            </span>
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <div className="flex justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            <span>{totalClubKm} / {clubGoalKm} km</span>
            <span className="text-amber-600 dark:text-amber-400">{clubProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-cyan-500 h-full rounded-full" style={{ width: `${clubProgressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Aviso si solo está el usuario */}
      {customMembers.length === 0 && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Users className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Eres el único miembro en el club por ahora. Invita a tus amigos o añade a tus compañeros de salida para competir sanamente.</span>
          </div>
          <button
            onClick={handleCopyInvite}
            className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0"
          >
            Copiar invitación
          </button>
        </div>
      )}

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
          Racha de Días
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
                  <td className="py-3 pr-2 font-black text-slate-400">
                    {isFirst ? (
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center text-[10px]">
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

                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {member.weeklyKm} km
                  </td>

                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                    +{member.weeklyElevationM} m
                  </td>

                  <td className="py-3 pl-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <Flame className="w-3 h-3 text-emerald-600" />
                      {member.streakDays}d
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal para añadir compañero real */}
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

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Plataforma / Reloj</label>
                <select
                  value={newMemberBrand}
                  onChange={e => {
                    const b = e.target.value as any;
                    setNewMemberBrand(b);
                    setNewMemberDevice(b === 'garmin' ? 'Garmin Edge / Forerunner' : b === 'coros' ? 'COROS Pace' : b === 'igpsport' ? 'iGPSPORT BSC' : 'Strava App');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="garmin">Garmin</option>
                  <option value="coros">COROS</option>
                  <option value="igpsport">iGPSPORT</option>
                  <option value="strava">Strava</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Km Semanales</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ej. 35.5"
                    value={newMemberKm}
                    onChange={e => setNewMemberKm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Desnivel (+m)</label>
                  <input
                    type="number"
                    placeholder="Ej. 420"
                    value={newMemberEle}
                    onChange={e => setNewMemberEle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
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
