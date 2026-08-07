/**
 * Office Service - Legacy (Not used in NagrikSeva citizen model)
 */

import { supabase } from '../config/supabase';

// Office type for legacy support
interface Office {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  is_active: boolean;
  distance?: string;
  distanceValue?: number;
}

export const officeService = {
  // Get nearby offices
  getNearby: async (latitude: number, longitude: number, radiusKm: number = 10): Promise<Office[]> => {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('is_active', true)
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lngDelta)
      .lte('longitude', longitude + lngDelta);

    if (error) throw new Error(error.message);

    // Calculate distance and sort
    const officesWithDistance = (data || []).map(office => {
      const distance = calculateDistance(
        latitude, longitude,
        office.latitude, office.longitude
      );
      return {
        ...office,
        distance: `${distance.toFixed(1)} km`,
        distanceValue: distance
      };
    }).sort((a, b) => a.distanceValue - b.distanceValue);

    return officesWithDistance;
  },

  // Get all offices
  getAll: async (): Promise<Office[]> => {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get office by ID
  getById: async (id: string): Promise<Office | null> => {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Search offices
  search: async (query: string): Promise<Office[]> => {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .limit(20);

    if (error) throw new Error(error.message);
    return data || [];
  }
};

// Haversine formula to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default officeService;
