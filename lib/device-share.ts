export interface ShareTrackOptions {
  name: string;
  gpxContent: string;
  sport?: string;
}

export interface ShareResult {
  success: boolean;
  method: 'native_share' | 'download_fallback';
  message: string;
}

/**
 * Comparte el archivo GPX usando Web Share API en dispositivos móviles
 * permitiendo elegir directamente la app de COROS, iGPSPORT, Garmin o Strava.
 * Si el navegador no soporta Web Share de ficheros (escritorio), descarga el archivo.
 */
export async function shareTrackToDevice(options: ShareTrackOptions): Promise<ShareResult> {
  const { name, gpxContent } = options;
  const safeFilename = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.gpx`;

  // Comprobar compatibilidad con Web Share API para archivos
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'share' in navigator) {
    try {
      const file = new File([gpxContent], safeFilename, {
        type: 'application/gpx+xml',
        lastModified: Date.now(),
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Ruta: ${name}`,
          text: `Track de navegación GPX para tu app deportiva (COROS, iGPSPORT, Garmin): ${name}`,
          files: [file],
        });

        return {
          success: true,
          method: 'native_share',
          message: 'Hoja de compartir abierta. Selecciona la app de COROS, iGPSPORT o Garmin para transferir al dispositivo.',
        };
      }
    } catch (err: unknown) {
      // Si el usuario canceló el diálogo de compartir de forma voluntaria
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: true,
          method: 'native_share',
          message: 'Compartición cancelada por el usuario.',
        };
      }
      console.warn('Error en Web Share API, aplicando descarga fallback:', err);
    }
  }

  // Fallback: Descarga estándar del archivo GPX
  triggerDownloadGpx(safeFilename, gpxContent);

  return {
    success: true,
    method: 'download_fallback',
    message: `Archivo "${safeFilename}" descargado. Ábrelo desde la app de COROS o iGPSPORT en tu móvil.`,
  };
}

export function triggerDownloadGpx(filename: string, gpxContent: string): void {
  const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
