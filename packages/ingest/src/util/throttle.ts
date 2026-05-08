/**
 * Limiteur de débit minimaliste : impose un intervalle minimum entre 2 fetch
 * vers un même hôte. Utilisé par les scrapers (Mon Master, UCAS, Common App)
 * pour rester respectueux (cf. robots.txt + courtoisie de base).
 */
export function createThrottle(minIntervalMs: number) {
  let last = 0;
  return async function throttle(): Promise<void> {
    const now = Date.now();
    const wait = last + minIntervalMs - now;
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
  };
}
