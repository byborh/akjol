export const CITY_COORDS: Record<string, [number, number]> = {
  Paris: [48.8566, 2.3522],
  "Sophia Antipolis": [43.6147, 7.066],
  Saclay: [48.728, 2.175],
  "Gif-sur-Yvette": [48.696, 2.132],
  Nanterre: [48.8924, 2.207],
  Munich: [48.1351, 11.582],
  Manchester: [53.4808, -2.2426],
};

export function getCoordsForCity(city: string): [number, number] | null {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // light fuzzy: case-insensitive lookup
  const key = Object.keys(CITY_COORDS).find((k) => k.toLowerCase() === city.toLowerCase());
  return key ? CITY_COORDS[key] : null;
}
