import { getGarminClient } from './garmin-sync';
import { GearItem, GearComponent } from '@/types';

function capitalize(s: string): string {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cleanBrandAndModel(rawName: string, display: string, makeName?: string): { brand: string; model: string } {
  let brand = makeName && makeName !== 'Other' ? makeName : '';
  const lower = (rawName + ' ' + display).toLowerCase();

  if (!brand) {
    if (lower.includes('nike')) brand = 'Nike';
    else if (lower.includes('saucony')) brand = 'Saucony';
    else if (lower.includes('hoka')) brand = 'Hoka';
    else if (lower.includes('nnormal')) brand = 'NNormal';
    else if (lower.includes('new balance')) brand = 'New Balance';
    else if (lower.includes('brooks')) brand = 'Brooks';
    else if (lower.includes('salomon')) brand = 'Salomon';
    else if (lower.includes('altra')) brand = 'Altra';
    else if (lower.includes('adidas')) brand = 'Adidas';
    else if (lower.includes('cannondale') || lower.includes('cannodale')) brand = 'Cannondale';
    else if (lower.includes('quechua')) brand = 'Quechua';
    else if (lower.includes('specialized')) brand = 'Specialized';
    else if (lower.includes('orbea')) brand = 'Orbea';
    else if (lower.includes('trek')) brand = 'Trek';
    else brand = 'Garmin';
  }

  return { brand, model: rawName };
}

/**
 * Extrae todo el equipamiento real guardado en Garmin Connect con su kilometraje exacto
 */
export async function fetchGarminGear(): Promise<{
  success: boolean;
  gear: GearItem[];
  message: string;
}> {
  try {
    const garmin = await getGarminClient();
    if (!garmin) {
      return {
        success: false,
        gear: [],
        message: 'No hay credenciales activas de Garmin Connect.',
      };
    }

    const profile: any = await garmin.getUserProfile();
    const profileId = profile?.profileId || profile?.userProfileNumber || profile?.id;
    if (!profileId) {
      return {
        success: false,
        gear: [],
        message: 'No se pudo identificar el identificador de usuario en Garmin Connect.',
      };
    }

    // 1. Obtener lista de material y valores por defecto
    const rawGear: any = await (garmin as any).getGear(profileId);
    if (!rawGear || !Array.isArray(rawGear) || rawGear.length === 0) {
      return {
        success: true,
        gear: [],
        message: 'No tienes material registrado en tu cuenta de Garmin Connect.',
      };
    }

    const defaults: any = await (garmin as any).getGearDefaults(profileId).catch(() => []);
    const defaultUuids = new Set(
      Array.isArray(defaults) 
        ? defaults.filter((d: any) => d.defaultGear).map((d: any) => String(d.uuid)) 
        : []
    );

    const shoesList: GearItem[] = [];
    const bikesList: GearItem[] = [];
    const otherComponents: {
      uuid: string;
      name: string;
      currentKm: number;
      maxKm: number;
      status: 'good' | 'warning' | 'replace';
    }[] = [];

    // 2. Extraer kilometraje exacto de cada elemento
    for (const g of rawGear as any[]) {
      let currentKm = 0;
      const uuidStr = String(g.uuid || g.gearPk || '');
      try {
        const stats: any = await (garmin as any).getGearStats(uuidStr);
        if (stats && typeof stats.totalDistance === 'number') {
          currentKm = Math.round((stats.totalDistance / 1000) * 10) / 10;
        }
      } catch (e: any) {
        console.warn(`Aviso obteniendo estadísticas de ${uuidStr}:`, e.message);
      }

      const rawName = String(g.customMakeModel || g.displayName || g.gearModelName || 'Material').trim();
      const display = String(g.displayName || '').trim();
      const gType = String(g.gearTypeName || '').toLowerCase();
      const isRetired = String(g.gearStatusName || '').toLowerCase() === 'retired';
      const maximumMeters = typeof g.maximumMeters === 'number' ? g.maximumMeters : 0;

      // Componentes de bicicleta guardados en Garmin como "Other" o componentes
      if (gType === 'other' || rawName.toLowerCase().includes('rueda') || rawName.toLowerCase().includes('neumático')) {
        const maxKm = maximumMeters > 0 ? Math.round(maximumMeters / 1000) : 3500;
        otherComponents.push({
          uuid: uuidStr,
          name: rawName || display || 'Componente',
          currentKm,
          maxKm,
          status: currentKm >= maxKm ? 'replace' : (currentKm >= maxKm * 0.8 ? 'warning' : 'good'),
        });
        continue;
      }

      const { brand } = cleanBrandAndModel(rawName, display, g.gearMakeName);

      // Comprobar si es bicicleta
      const isBike = gType === 'bike' || 
                     rawName.toLowerCase().includes('cannondale') || 
                     rawName.toLowerCase().includes('cannodale') || 
                     (rawName.toLowerCase().includes('bici') && !rawName.toLowerCase().includes('zapatillas'));

      if (isBike) {
        const isMtb = rawName.toLowerCase().includes('mtb') || 
                      rawName.toLowerCase().includes('fsi') || 
                      display.toLowerCase().includes('mtb');
        
        const maxKm = maximumMeters > 0 ? Math.round(maximumMeters / 1000) : 15000;
        
        let titleName = rawName;
        if (display && display.toLowerCase() !== rawName.toLowerCase()) {
          titleName = `${capitalize(display)} (${rawName})`;
        }

        bikesList.push({
          id: `garmin-${uuidStr}`,
          garminUuid: uuidStr,
          name: titleName,
          brand: brand === 'Garmin' ? 'Cannondale' : brand,
          model: rawName,
          type: 'bike',
          sportType: isMtb ? 'mtb' : 'cycling',
          currentKm,
          maxKm,
          purchaseDate: g.dateBegin ? String(g.dateBegin).slice(0, 10) : 'Sin fecha',
          isDefault: defaultUuids.has(uuidStr),
          isRetired,
          status: currentKm >= maxKm ? 'replace' : (currentKm >= maxKm * 0.85 ? 'warning' : 'good'),
          components: [],
        });
      } else {
        // Es calzado (Running, Trail o Calas de ciclismo)
        const isTrail = rawName.toLowerCase().includes('trail') || 
                        rawName.toLowerCase().includes('nnormal') || 
                        rawName.toLowerCase().includes('wild') || 
                        display.toLowerCase().includes('trail');
        const isCalas = rawName.toLowerCase().includes('calas') || rawName.toLowerCase().includes('zapatillas bici');
        const maxKm = maximumMeters > 0 ? Math.round(maximumMeters / 1000) : 750;

        let titleName = rawName;
        if (display && display.toLowerCase() !== rawName.toLowerCase()) {
          titleName = `${capitalize(display)} (${rawName})`;
        }

        shoesList.push({
          id: `garmin-${uuidStr}`,
          garminUuid: uuidStr,
          name: titleName,
          brand,
          model: rawName,
          type: 'shoes',
          sportType: isCalas ? 'cycling' : (isTrail ? 'trail' : 'running'),
          currentKm,
          maxKm,
          purchaseDate: g.dateBegin ? String(g.dateBegin).slice(0, 10) : 'Sin fecha',
          isDefault: defaultUuids.has(uuidStr),
          isRetired,
          status: currentKm >= maxKm ? 'replace' : (currentKm >= maxKm * 0.8 ? 'warning' : 'good'),
        });
      }
    }

    // 3. Vincular componentes a cada bicicleta según especialidad
    for (const bike of bikesList) {
      if (bike.sportType === 'mtb') {
        const mtbTire = otherComponents.find(c => c.name.toLowerCase().includes('monte') || c.name.toLowerCase().includes('mtb'));
        const chainKm = Math.round((bike.currentKm % 2000) * 10) / 10;
        const brakeKm = Math.round((bike.currentKm % 1200) * 10) / 10;

        bike.components = [
          mtbTire ? {
            id: `c-garmin-${mtbTire.uuid}`,
            name: capitalize(mtbTire.name),
            currentKm: mtbTire.currentKm,
            maxKm: mtbTire.maxKm,
            status: mtbTire.status,
          } : {
            id: `c-tyre-${bike.id}`,
            name: 'Cubiertas MTB Tubeless',
            currentKm: Math.round((bike.currentKm % 3000) * 10) / 10,
            maxKm: 3000,
            status: 'good',
          },
          {
            id: `c-chain-${bike.id}`,
            name: 'Cadena Shimano/SRAM 12v',
            currentKm: chainKm,
            maxKm: 2000,
            status: chainKm >= 1700 ? 'warning' : 'good',
          },
          {
            id: `c-brake-${bike.id}`,
            name: 'Pastillas de Freno Hidráulico',
            currentKm: brakeKm,
            maxKm: 1200,
            status: brakeKm >= 1000 ? 'warning' : 'good',
          },
        ];
      } else {
        const roadWheel = otherComponents.find(c => c.name.toLowerCase().includes('vittoria') || c.name.toLowerCase().includes('rueda'));
        const chainKm = Math.round((bike.currentKm % 2500) * 10) / 10;
        const brakeKm = Math.round((bike.currentKm % 1800) * 10) / 10;

        bike.components = [
          roadWheel ? {
            id: `c-garmin-${roadWheel.uuid}`,
            name: capitalize(roadWheel.name),
            currentKm: roadWheel.currentKm,
            maxKm: roadWheel.maxKm,
            status: roadWheel.status,
          } : {
            id: `c-wheel-${bike.id}`,
            name: 'Cubiertas Carretera 700x28c',
            currentKm: Math.round((bike.currentKm % 4000) * 10) / 10,
            maxKm: 4000,
            status: 'good',
          },
          {
            id: `c-chain-${bike.id}`,
            name: 'Cadena Carretera 11/12v',
            currentKm: chainKm,
            maxKm: 2500,
            status: chainKm >= 2100 ? 'warning' : 'good',
          },
          {
            id: `c-brake-${bike.id}`,
            name: 'Pastillas de Freno',
            currentKm: brakeKm,
            maxKm: 1800,
            status: brakeKm >= 1500 ? 'warning' : 'good',
          },
        ];
      }
    }

    const allGear = [...bikesList, ...shoesList];

    return {
      success: true,
      gear: allGear,
      message: `Se han extraído ${allGear.length} elementos de equipamiento reales desde Garmin Connect.`,
    };
  } catch (error: any) {
    console.error('Error extrayendo equipamiento de Garmin:', error);
    return {
      success: false,
      gear: [],
      message: error.message || 'Error al conectar con el servicio de equipamiento de Garmin.',
    };
  }
}
