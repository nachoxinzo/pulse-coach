'use client';

import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Radio, 
  Download, 
  Watch, 
  Smartphone, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  Compass,
  ChevronRight
} from 'lucide-react';
import { shareTrackToDevice, triggerDownloadGpx } from '@/lib/device-share';
import { SportType } from '@/types';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackName: string;
  sport: SportType;
  gpxContent: string;
  coordinates: [number, number][];
  elevationProfile?: { distanceKm: number; elevationM: number }[];
  onGarminSent?: (msg: string) => void;
}

type TabType = 'share' | 'coros' | 'igpsport' | 'garmin' | 'strava';

export function DeviceSyncModal({
  isOpen,
  onClose,
  trackName,
  sport,
  gpxContent,
  coordinates,
  elevationProfile,
  onGarminSent,
}: DeviceSyncModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('share');
  const [isSendingGarmin, setIsSendingGarmin] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShareMobile = async () => {
    setStatusMsg('Abriendo selector de aplicaciones del móvil...');
    const res = await shareTrackToDevice({
      name: trackName,
      gpxContent,
      sport,
    });
    setStatusMsg(res.message);
    setTimeout(() => setStatusMsg(null), 6000);
  };

  const handleDownload = () => {
    const filename = `${trackName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;
    triggerDownloadGpx(filename, gpxContent);
    setStatusMsg(`Archivo "${filename}" descargado con éxito.`);
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleSendGarmin = async () => {
    setIsSendingGarmin(true);
    setStatusMsg('Conectando directamente con Garmin Connect...');
    try {
      const res = await fetch('/api/garmin/send-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trackName,
          sport,
          coordinates,
          elevationProfile,
          gpxContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `¡"${trackName}" transferido a tu Garmin! Sincroniza Garmin Connect en tu teléfono y búscalo en Navegación > Trayectos.`;
        setStatusMsg(msg);
        if (onGarminSent) onGarminSent(msg);
      } else {
        setStatusMsg(`Aviso Garmin: ${data.error || 'No se pudo crear el trayecto automático.'}`);
      }
    } catch {
      setStatusMsg('Error de conexión con el servicio de trayectos de Garmin.');
    } finally {
      setIsSendingGarmin(false);
      setTimeout(() => setStatusMsg(null), 7000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-700">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Enviar Trayecto al Dispositivo</h3>
              <p className="text-xs text-slate-500 line-clamp-1">{trackName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all touch-target"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {statusMsg && (
          <div className="mx-4 mt-3 p-3 bg-slate-900 text-white text-xs rounded-xl flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
            <span className="line-clamp-2">{statusMsg}</span>
            <button 
              onClick={() => setStatusMsg(null)} 
              className="text-slate-400 hover:text-white underline text-[11px] shrink-0"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Acciones Rápidas */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 border-b border-slate-100 bg-white">
          <button
            onClick={handleShareMobile}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs touch-target active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4 stroke-[2.2]" />
            <span>Abrir en COROS / iGPSPORT</span>
          </button>

          <button
            onClick={handleSendGarmin}
            disabled={isSendingGarmin}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-xs touch-target active:scale-[0.98] disabled:opacity-50"
          >
            {isSendingGarmin ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Radio className="w-4 h-4 stroke-[2.2]" />
            )}
            <span>{isSendingGarmin ? 'Enviando...' : 'Garmin Connect'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs touch-target active:scale-[0.98]"
          >
            <Download className="w-4 h-4 stroke-[2.2]" />
            <span>Descargar GPX</span>
          </button>
        </div>

        {/* Selector de Pestañas de Instrucciones */}
        <div className="px-4 pt-3 flex items-center gap-1 overflow-x-auto border-b border-slate-100 scrollbar-none">
          <button
            onClick={() => setActiveTab('share')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Compartir Móvil
          </button>
          <button
            onClick={() => setActiveTab('coros')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'coros'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispositivos COROS
          </button>
          <button
            onClick={() => setActiveTab('igpsport')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'igpsport'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dispositivos iGPSPORT
          </button>
          <button
            onClick={() => setActiveTab('garmin')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'garmin'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Garmin Connect
          </button>
          <button
            onClick={() => setActiveTab('strava')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'strava'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Strava Routes
          </button>
        </div>

        {/* Contenido de la Guía */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'share' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 font-medium">
                Al pulsar <strong>«Abrir en COROS / iGPSPORT»</strong> desde tu teléfono móvil, se activará la ventana nativa de compartir del sistema operativo. Selecciona el icono de tu aplicación deportiva preferida para transferir el track directamente sin necesidad de cables.
              </div>
              <ol className="list-decimal list-inside space-y-2 text-slate-700 font-medium">
                <li>Pulsa el botón verde superior <strong>«Abrir en COROS / iGPSPORT»</strong>.</li>
                <li>En la lista de aplicaciones que muestra tu teléfono, toca <strong>COROS</strong> o <strong>iGPSPORT</strong>.</li>
                <li>La aplicación abrirá la vista previa del recorrido con el perfil de altitud.</li>
                <li>Confirma en la app para enviarlo por Bluetooth a tu reloj o ciclocomputador.</li>
              </ol>
            </div>
          )}

          {activeTab === 'coros' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Watch className="w-4 h-4 text-indigo-600" />
                <span>Cómo sincronizar con relojes COROS (Pace, Apex, Vertix)</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Método 1: Desde la App COROS (Móvil)</span>
                  <p>Descarga el archivo GPX o usa el botón de compartir. Selecciona la app <strong>COROS</strong> &gt; La ruta se importa automáticamente en <em>Explorar &gt; Mis Rutas</em> &gt; Pulsa <strong>Sincronizar con el reloj</strong>.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Método 2: COROS Training Hub (Web)</span>
                  <p>Accede a <em>coros.com/traininghub</em> con tu cuenta &gt; Ve a <em>Herramientas de Ruta</em> &gt; <em>Importar Ruta</em> &gt; Arrastra el archivo GPX descargado. Quedará sincronizado con tu reloj al abrir la app móvil.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'igpsport' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Smartphone className="w-4 h-4 text-orange-600" />
                <span>Cómo sincronizar con ciclocomputadores iGPSPORT (iGS630, BSC300, etc.)</span>
              </div>
              <div className="space-y-2.5">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Método 1: Con la App iGPSPORT en tu móvil</span>
                  <p>Descarga el GPX en el móvil o pulsa compartir. En la app <strong>iGPSPORT</strong> ve a <em>Rutas</em> &gt; <em>Importar archivo local</em> &gt; Selecciona el archivo &gt; Con el ciclocomputador encendido, pulsa <strong>Enviar a dispositivo</strong> vía Bluetooth.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-900 block mb-1">Método 2: Sincronización automática vía Strava</span>
                  <p>Si tienes vinculada tu cuenta de iGPSPORT con Strava en la app (<em>Ajustes &gt; Cuentas conectadas</em>), cualquier ruta que guardes en tus rutas de Strava se transmitirá automáticamente a tu dispositivo iGPSPORT.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'garmin' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <Radio className="w-4 h-4 text-sky-600" />
                <span>Sincronización Directa Garmin Connect</span>
              </div>
              <p>
                Al pulsar <strong>«Garmin Connect»</strong>, el track se inyecta directamente en tu cuenta mediante la API de Garmin. Abre la aplicación Garmin Connect en tu teléfono móvil para que el trayecto se envíe a tu reloj por Bluetooth o Wi-Fi.
              </p>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-950 font-medium">
                En tu reloj Garmin, ve a: <strong>Actividad &gt; Menú Navegación &gt; Trayectos &gt; Seleccionar Ruta &gt; Realizar Trayecto</strong>.
              </div>
            </div>
          )}

          {activeTab === 'strava' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>Importación en Strava</span>
              </div>
              <p>
                Descarga el archivo GPX y súbelo a tu cuenta en <strong>strava.com/upload/select</strong> o en el creador de rutas de Strava. Si tus amigos tienen vinculada su app de COROS o iGPSPORT con Strava, las rutas marcadas con estrella aparecerán automáticamente en sus dispositivos.
              </p>
            </div>
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all touch-target"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
