'use client';

import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  Compass, 
  Watch, 
  ShieldCheck, 
  Trophy,
  Gauge,
  Flame
} from 'lucide-react';

interface GuidedTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export function GuidedTutorial({ isOpen, onClose, userName }: GuidedTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      badge: 'Paso 1 de 5 · Bienvenida',
      title: `¡Te damos la bienvenida a Pulse Coach, ${userName || 'Atleta'}!`,
      subtitle: 'Tu nuevo centro de analítica biométrica y entrenamiento inteligente.',
      icon: Sparkles,
      iconColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Pulse Coach nace para que no dependas de una sola marca de reloj ni de suscripciones de pago mensuales. Aquí puedes unificar datos de <strong className="text-white">Garmin Connect, Strava, COROS e iGPSPORT</strong> en un único motor de análisis fisiológico.
          </p>
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-white block text-xs">Cero Sesgo Comercial</span>
              <span className="text-[11px] text-slate-400">Algoritmos fisiológicos transparentes.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="font-bold text-white block text-xs">Privacidad Aislada</span>
              <span className="text-[11px] text-slate-400">Tus datos nunca se venden ni comparten.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'Paso 2 de 5 · Dashboard Fisiológico',
      title: 'Predisposición Diaria al Esfuerzo',
      subtitle: 'Aprende a escuchar a tu cuerpo antes de cada entrenamiento.',
      icon: Gauge,
      iconColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            En la parte superior del Dashboard encontrarás el <strong className="text-white">Dial de Predisposición (Training Readiness)</strong>. Este indicador combina de forma inteligente:
          </p>
          <ul className="space-y-2 pt-1 text-xs">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong>Variabilidad Cardíaca (HRV nocturna)</strong>: Refleja la recuperación del sistema nervioso parasimpático.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Horas y Calidad de Sueño Profundo</strong>: Tiempo de regeneración muscular activa.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Batería Corporal (Body Battery)</strong>: Nivel de energía disponible al despertar.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      badge: 'Paso 3 de 5 · EvoLab & Fatiga',
      title: 'Curva de Carga y Fatiga (PMC)',
      subtitle: 'Entrena con el modelo matemático de Banister para no lesionarte.',
      icon: TrendingUp,
      iconColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/40',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            El gráfico <strong className="text-white">EvoLab Performance Management Chart</strong> te muestra tres métricas clave:
          </p>
          <div className="space-y-2 pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-400">Forma Base (CTL - 42 días)</span>
              <span className="text-[11px] text-slate-400">Tu resistencia y fondo acumulado</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-400">Fatiga Aguda (ATL - 7 días)</span>
              <span className="text-[11px] text-slate-400">El estrés de las últimas sesiones</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400">Frescura (TSB = CTL - ATL)</span>
              <span className="text-[11px] text-slate-400">Balance: ¿estás listo para competir?</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'Paso 4 de 5 · Competición & Rutas',
      title: 'Race Predictor y Rutas Circulares GPX',
      subtitle: 'Tus objetivos de carrera y planificación de salidas al aire libre.',
      icon: Trophy,
      iconColor: 'text-amber-400 bg-amber-950/60 border-amber-500/40',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Dos herramientas imprescindibles que puedes explorar en cualquier momento:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Trophy className="w-3.5 h-3.5" />
                <span>Race Predictor</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calcula tiempos y ritmos exactos para 5K, 10K, Media Maratón y 42K según tu VO2max.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                <Compass className="w-3.5 h-3.5" />
                <span>Generador de Rutas</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dibuja bucles circulares de los km que elijas y descarga el archivo GPX para tu ciclocomputador.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'Paso 5 de 5 · Sincronización',
      title: '¡Todo Listo para tu Primera Sesión!',
      subtitle: 'Conecta tu dispositivo o sincroniza tu historial deportivo.',
      icon: Watch,
      iconColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40',
      content: (
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Para activar la sincronización automática con tu cuenta, pulsa el botón <strong className="text-white">"Cuentas"</strong> en la barra de navegación o accede desde los ajustes:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Sincronización Segura sin Costes</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Compatible con cuentas de Garmin Connect y Strava gratuitas. Siempre puedes revocar el acceso en cualquier momento.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const step = steps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0F172A] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de progreso de pasos */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep
                      ? 'w-6 bg-cyan-400'
                      : idx < currentStep
                      ? 'w-3 bg-cyan-600/70'
                      : 'w-3 bg-slate-700'
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-400 ml-2">
              {currentStep + 1} / {steps.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all touch-target"
            aria-label="Cerrar tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del paso actual */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${step.iconColor} shrink-0`}>
              <StepIcon className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 block">
                {step.badge}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 font-medium">
            {step.subtitle}
          </p>

          <div className="pt-2">
            {step.content}
          </div>
        </div>

        {/* Footer con Controles de Navegación */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white px-2 py-1.5 transition-colors touch-target"
          >
            Saltar tutorial
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 touch-target"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black shadow-md shadow-cyan-400/20 transition-all flex items-center gap-1.5 touch-target active:scale-[0.98]"
            >
              <span>{currentStep === steps.length - 1 ? '¡Comenzar a Entrenar!' : 'Siguiente'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
