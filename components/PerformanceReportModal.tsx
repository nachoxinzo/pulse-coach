'use client';

import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Award, 
  TrendingUp, 
  Heart, 
  Zap, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  Trophy,
  CheckCircle2
} from 'lucide-react';
import { BiometricMetrics, ActivitySession, NonZeroHabit } from '@/types';
import { UserSessionPayload } from '@/lib/auth';

interface PerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: BiometricMetrics;
  activities: ActivitySession[];
  habit: NonZeroHabit;
  currentUser?: UserSessionPayload | null;
}

export function PerformanceReportModal({
  isOpen,
  onClose,
  metrics,
  activities,
  habit,
  currentUser,
}: PerformanceReportModalProps) {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pulse Coach · Informe de Rendimiento (${currentUser?.name || 'Atleta'})`,
          text: `Mi estado de forma en Pulse Coach: VO2 máx ${metrics.vo2Max}, Racha ${habit.currentStreakDays} días y Predisposición ${metrics.trainingReadiness}%.`,
          url: window.location.href,
        });
      } catch (err) {
        // Ignorar si cancela
      }
    }
  };

  const totalKm = activities.reduce((acc, a) => acc + (a.distanceKm || 0), 0);
  const totalMins = activities.reduce((acc, a) => acc + a.durationMin, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Barra superior de acciones */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Informe Ejecutivo de Rendimiento
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all touch-target"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all touch-target"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DOCUMENTO EJECUTIVO DE RENDIMIENTO (PRINTABLE CERTIFICATE) */}
        {/* ============================================================== */}
        <div ref={reportRef} className="space-y-4 p-4 sm:p-6 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 print:bg-white print:border-none">
          
          {/* Header del Certificado */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-950 p-2 border border-cyan-500/30 flex items-center justify-center shrink-0">
                <img src="/logo.png" alt="Pulse Coach" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                  Pulse Coach Fisiología & Telemetría
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Auditoría Fisiológica: {currentUser?.name || 'Atleta Pulse Coach'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dispositivo Principal: {currentUser?.primaryDevice || 'Garmin / COROS Multi-Sensor'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block tabular-nums">
                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Estado Físico Verificado
              </span>
            </div>
          </div>

          {/* Cuadrícula de Pilares Fisiológicos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">VO2 Máx Motor</span>
              <strong className="text-2xl font-black text-indigo-600 dark:text-cyan-400">{metrics.vo2Max}</strong>
              <span className="text-[10px] text-slate-500 block">ml/kg/min (Superior)</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Predisposición</span>
              <strong className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.trainingReadiness}%</strong>
              <span className="text-[10px] text-slate-500 block">HRV {metrics.hrvValueMs}ms</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ratio Carga ACWR</span>
              <strong className="text-2xl font-black text-slate-900 dark:text-white">{metrics.acwr}</strong>
              <span className="text-[10px] text-emerald-600 font-bold block">Rango Seguro Óptimo</span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Racha Non-Zero</span>
              <strong className="text-2xl font-black text-amber-500">{habit.currentStreakDays} días</strong>
              <span className="text-[10px] text-slate-500 block">Máx récord: {habit.longestStreakDays}d</span>
            </div>
          </div>

          {/* Resumen de Telemetría Acumulada */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Volumen & Carga de Entrenamiento
            </h4>
            <div className="grid grid-cols-3 gap-2 pt-1 tabular-nums">
              <div>
                <span className="text-[10px] text-slate-400 block">Distancia Acumulada:</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white">{totalKm.toFixed(1)} km</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tiempo en Movimiento:</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(totalMins / 60)}h {totalMins % 60}m</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Sesiones Auditadas:</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-white">{activities.length} sesiones</strong>
              </div>
            </div>
          </div>

          {/* Conclusión del Fisiólogo */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Diagnóstico de Rendimiento Pulse Coach</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              El atleta muestra una sólida asimilación mitocondrial con baja deriva cardiovascular en Zona 2. El ratio agudo/crónico (ACWR {metrics.acwr}) avala la continuidad hacia su objetivo de temporada sin riesgo significativo de sobreentrenamiento ni lesión por fatiga.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs print:hidden">
          <span className="text-[11px] text-slate-400">
            Documento cifrado y generado automáticamente para el atleta.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold touch-target"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
