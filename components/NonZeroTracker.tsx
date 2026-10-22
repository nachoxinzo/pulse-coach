'use client';

import React, { useState } from 'react';
import { NonZeroHabit } from '@/types';
import { 
  Flame, 
  Bell, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

interface NonZeroTrackerProps {
  habit: NonZeroHabit;
  onUpdateReminder: (enabled: boolean, time: string) => void;
  onLogQuickRescue: () => void;
}

export function NonZeroTracker({
  habit,
  onUpdateReminder,
  onLogQuickRescue,
}: NonZeroTrackerProps) {
  const [reminderEnabled, setReminderEnabled] = useState(habit.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime);
  const [notificationStatus, setNotificationStatus] = useState<string>('');

  const weekDayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationStatus('Notificaciones activadas con éxito.');
        setReminderEnabled(true);
        onUpdateReminder(true, reminderTime);
        new Notification('Pulse Coach', {
          body: `¡Recordatorio diario activado a las ${reminderTime}! Te avisaremos para mantener tu racha.`,
          icon: '/favicon.ico',
        });
      } else {
        setNotificationStatus('Permiso denegado por el navegador.');
      }
    } else {
      setNotificationStatus('Tu navegador no soporta notificaciones nativas.');
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReminderTime(val);
    onUpdateReminder(reminderEnabled, val);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] p-6 space-y-6">
      
      {/* Cabecera y Racha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Constancia & Micro-Hábitos
            </span>
            <span className="text-xs text-slate-500 font-medium">Filosofía «Non-Zero Day»</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1">Tu Racha de Entrenamiento Diario</h3>
          <p className="text-xs text-slate-600">
            El secreto del rendimiento no es matarse un día, sino nunca dejar un día a cero. Incluso 10 minutos de movilidad cuentan.
          </p>
        </div>

        {/* Contador de Racha */}
        <div className="flex items-center gap-3 bg-amber-50/80 px-4 py-3 rounded-xl border border-amber-200/80 shrink-0">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-xs">
            <Flame className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 tabular-nums">{habit.currentStreakDays}</span>
              <span className="text-xs font-bold text-amber-800">días seguidos</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium">Récord personal: {habit.longestStreakDays} días</p>
          </div>
        </div>
      </div>

      {/* Días de la semana actual */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Semana Actual</p>
        <div className="grid grid-cols-7 gap-2">
          {weekDayLabels.map((day, idx) => {
            const isActive = habit.weeklyDaysActive[idx] || (idx === 3 && habit.todayCompleted);
            const isToday = idx === 3; // Jueves en mock
            return (
              <div 
                key={day}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-colors ${
                  isActive 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : isToday 
                    ? 'bg-amber-50/50 border-amber-300 border-dashed text-slate-700' 
                    : 'bg-slate-50 border-slate-200/60 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-bold">{day}</span>
                <div className="mt-1">
                  {isActive ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                  )}
                </div>
                {isToday && (
                  <span className="text-[9px] uppercase font-bold text-amber-700 mt-1">Hoy</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rescate Express si hoy no se ha entrenado */}
      {!habit.todayCompleted && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              ¿Sin tiempo hoy? Salva tu racha en 12 minutos
            </p>
            <p className="text-xs text-slate-600">
              Registra una micro-sesión de movilidad articular y core guiada desde casa para no romper la inercia.
            </p>
          </div>
          <button
            onClick={onLogQuickRescue}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all touch-target shrink-0"
          >
            Registrar Micro-Dosis (12 min)
          </button>
        </div>
      )}

      {/* Configuración de Recordatorio Diario */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <Bell className="w-4 h-4 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">Recordatorio Diario de Entrenamiento</p>
            <p className="text-xs text-slate-500">Te enviará una alerta si a esa hora no has registrado actividad todavía.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="time"
            value={reminderTime}
            onChange={handleTimeChange}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-800 tabular-nums focus:outline-indigo-500"
          />
          <button
            onClick={handleRequestPermission}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-all touch-target"
          >
            Activar Alerta PWA
          </button>
        </div>
      </div>

      {notificationStatus && (
        <p className="text-xs text-indigo-700 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
          {notificationStatus}
        </p>
      )}

    </div>
  );
}
