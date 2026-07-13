// Euler's number for range calculation
const EULER = Math.E; // ≈ 2.71828
export const INFINITY_TOWER = Object.freeze({
    id: 'infinity',
    symbol: '∞',
    name: '∞ Tower',
    tier: 25,
    baseCost: 31000000000000000,
    damage: 0, // Infinity tower doesn't deal direct damage
    rate: 0,
    range: 2 * EULER, // 2×e ≈ 5.4366 meters
    icon: 'assets/images/tower-infinity.svg',
    nextTierId: null,
});
export default INFINITY_TOWER;
