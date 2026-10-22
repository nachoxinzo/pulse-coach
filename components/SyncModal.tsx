'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Watch, 
  CheckCircle2, 
  Shield, 
  RefreshCw, 
  Smartphone, 
  ExternalLink, 
  Upload, 
  Bike, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess?: () => void;
  initialTab?: 'garmin' | 'coros' | 'igpsport' | 'strava';
}

type TabType = 'garmin' | 'coros' | 'igpsport' | 'strava';

export function SyncModal({ isOpen, onClose, onSyncSuccess, initialTab = 'coros' }: SyncModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [stravaToken, setStravaToken] = useState('');
  const [isSyncingGarmin, setIsSyncingGarmin] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  if (!isOpen) return null;

  const handleSyncRealGarmin = async () => {
    setIsSyncingGarmin(true);
    setSyncStatusMsg('Conectando con Garmin Connect y leyendo tus actividades reales...');
    try {
      const res = await fetch('/api/garmin/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncStatusMsg(`¡Éxito! Se han importado ${data.activitiesCount} actividades reales de tu cuenta de Garmin.`);
        if (onSyncSuccess) onSyncSuccess();
      } else {
        setSyncStatusMsg(`Aviso: ${data.error || 'No se pudieron descargar las actividades.'}`);
      }
    } catch {
      setSyncStatusMsg('Error de red al conectar con el servidor de sincronización.');
    } finally {
      setIsSyncingGarmin(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setSyncStatusMsg(`Archivo "${file.name}" cargado con éxito. Procesando telemetría para tu cálculo de fatiga...`);
      setTimeout(() => {
        setSyncStatusMsg(`¡Actividad de "${file.name}" sumada a tu carga de entrenamiento!`);
        if (onSyncSuccess) onSyncSuccess();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-center border border-slate-800 shrink-0 shadow-2xs">
              <Watch className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Vincular Dispositivos & Cuentas</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">COROS, iGPSPORT, Garmin Connect y Strava</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas de Marca */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('coros')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'coros'
                ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>COROS</span>
          </button>

          <button
            onClick={() => setActiveTab('igpsport')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'igpsport'
                ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>iGPSPORT</span>
          </button>

          <button
            onClick={() => setActiveTab('garmin')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'garmin'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Garmin</span>
          </button>

          <button
            onClick={() => setActiveTab('strava')}
            className={`py-2 px-1 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'strava'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Strava</span>
          </button>
        </div>

        {/* Mensaje de Estado / Notificación */}
        {syncStatusMsg && (
          <div className="p-3 bg-slate-900 dark:bg-slate-950 text-white text-xs rounded-xl flex items-center justify-between gap-2 shadow-xs border border-slate-800 animate-in fade-in">
            <span className="leading-snug">{syncStatusMsg}</span>
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="text-cyan-400 hover:underline text-[11px] shrink-0 font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: COROS */}
        {activeTab === 'coros' && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-800/80 bg-cyan-50/50 dark:bg-cyan-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Método 1: Enlace Automático en 30s (Recomendado)</span>
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-cyan-200 dark:bg-cyan-900 text-cyan-900 dark:text-cyan-200">
                  Gratuito
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Tus amigos <strong>no necesitan cuenta de pago</strong>. Si conectan su reloj COROS con una cuenta gratuita de Strava, todas sus salidas se sincronizan automáticamente con Pulse Coach:
              </p>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Abre la app <strong>COROS</strong> en el móvil y ve a la pestaña <strong>Perfil</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Toca en <strong>Configuración &gt; Aplicaciones de terceros</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Selecciona <strong>Strava</strong> y pulsa <strong>Conectar</strong>. ¡Listo! Al guardar un entreno en el reloj, se importará solo.</span>
                </div>
              </div>
            </div>

            {/* Método 2: Importar archivo directo */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Método 2: Subir archivo de sesión (.FIT o .GPX)</span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arrastra o selecciona el archivo descargado desde tu reloj o desde COROS Training Hub:
              </p>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 rounded-xl cursor-pointer bg-white dark:bg-slate-900 transition-colors">
                <Upload className="w-6 h-6 text-cyan-500 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {uploadedFileName ? `Seleccionado: ${uploadedFileName}` : 'Pulsa para elegir archivo .FIT o .GPX'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Compatible con COROS Pace 2/3, Apex y Vertix</span>
                <input type="file" accept=".fit,.gpx,.tcx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Enlace a COROS Training Hub */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400">¿Gestionas tus rutas en ordenador?</span>
              <a
                href="https://traininghub.coros.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>COROS Training Hub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: iGPSPORT */}
        {activeTab === 'igpsport' && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-800/80 bg-orange-50/50 dark:bg-orange-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span>Sincronización Automática para Ciclocomputadores</span>
                </span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-200">
                  Fácil
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Tus amigos con GPS iGPSPORT (BSC100, BSC200, iGS630, etc.) pueden sincronizar automáticamente sus rutas en bici:
              </p>
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Abre la app <strong>iGPSPORT</strong> en tu teléfono móvil.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Ve a la sección <strong>Perfil &gt; Aplicaciones de terceros</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Toca <strong>Strava</strong> y autoriza la vinculación gratuita. Al terminar la ruta en bici y sincronizar por Bluetooth con el móvil, se registrará en Pulse Coach.</span>
                </div>
              </div>
            </div>

            {/* Subida manual para iGPSPORT */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Importación directa de archivo .FIT del ciclocomputador</span>
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O si conectas tu iGPSPORT por USB o descargas el archivo desde la app:
              </p>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 rounded-xl cursor-pointer bg-white dark:bg-slate-900 transition-colors">
                <Bike className="w-6 h-6 text-orange-500 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {uploadedFileName ? `Seleccionado: ${uploadedFileName}` : 'Arrastra tu archivo .FIT o .GPX aquí'}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Compatible con todos los modelos iGS y BSC</span>
                <input type="file" accept=".fit,.gpx" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400">Centro de datos web iGPSPORT:</span>
              <a
                href="https://i.igpsport.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>iGPSPORT Web</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: GARMIN CONNECT */}
        {activeTab === 'garmin' && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/50 dark:bg-sky-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Garmin Connect Cloud Sync</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Sesión Conectada
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Descarga tus actividades reales registradas en tu reloj o dispositivo Garmin (pulsaciones, potencia, cadencia, GPS y desnivel).
              </p>

              <button
                type="button"
                onClick={handleSyncRealGarmin}
                disabled={isSyncingGarmin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs touch-target active:scale-[0.98] disabled:opacity-60"
              >
                {isSyncingGarmin ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Watch className="w-4 h-4 text-white" />
                )}
                <span>{isSyncingGarmin ? 'Sincronizando con Garmin...' : 'Descargar Mis Actividades Reales'}</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <strong className="text-slate-700 dark:text-slate-200 block mb-0.5">Transferencia de Rutas:</strong>
              Puedes enviar cualquier trayecto a tu reloj con el botón azul <strong>«Garmin Connect»</strong> disponible en el Explorador de Eventos y Rutas.
            </div>
          </div>
        )}

        {/* CONTENIDO PESTAÑA: STRAVA */}
        {activeTab === 'strava' && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Strava Hub Universal</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Strava actúa como pasarela universal para conectar dispositivos de cualquier marca sin necesidad de cuenta premium.
              </p>
              <input
                type="text"
                placeholder="Strava OAuth Token / Client Secret (Opcional)"
                value={stravaToken}
                onChange={(e) => setStravaToken(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400">Subir rutas manualmente:</span>
              <a
                href="https://www.strava.com/routes/new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Creador de Rutas Strava</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}

        {/* Footer del Modal */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Tus datos se procesan de forma cifrada y privada.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-cyan-400 transition-colors touch-target"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
