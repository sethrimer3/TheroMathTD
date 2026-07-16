import { mindGate } from './mindGate.js';
import { shadowGate } from './shadowGate.js';
import { alpha, beta, gamma } from './basicTowers.js';
import { delta, epsilon, zeta, eta, theta, iota } from './greekTowers.js';
import { kappa, lambda, mu, nu, xi, omicron, pi, rho, sigma, tau, upsilon, phi, chi, psi, omega, } from './advancedTowers.js';
import { infinity } from './infinityTower.js';
/** Canonical ordered registry of authored tower-equation blueprints. */
export const TOWER_EQUATION_BLUEPRINTS = {
    'mind-gate': mindGate,
    'shadow-gate': shadowGate,
    alpha,
    beta,
    gamma,
    delta,
    epsilon,
    eta,
    theta,
    iota,
    kappa,
    lambda,
    mu,
    zeta,
    nu,
    xi,
    omicron,
    pi,
    rho,
    sigma,
    tau,
    upsilon,
    phi,
    chi,
    psi,
    omega,
    infinity,
};
export function getTowerEquationBlueprint(towerId) {
    if (!towerId) {
        return null;
    }
    return TOWER_EQUATION_BLUEPRINTS[towerId] || null;
}
