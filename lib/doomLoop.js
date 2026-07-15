'use strict';

const config = require('./config');
const logger = require('./logger');

class DoomLoop {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations ?? config.doomLoop.maxIterations;
    this.maxRepetitions = options.maxRepetitions ?? config.doomLoop.maxRepetitions;
    this.fingerprintKeys = options.fingerprintKeys ?? config.doomLoop.fingerprintKeys;
    this._history = [];
  }

  fingerprint(state) {
    const fp = {};
    for (const key of this.fingerprintKeys) {
      const val = this._deepGet(state, key);
      if (val !== undefined) fp[key] = val;
    }
    return JSON.stringify(fp);
  }

  _deepGet(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined;
      current = current[part];
    }
    return current;
  }

  check(state) {
    const fp = this.fingerprint(state);
    this._history.push(fp);

    const iteration = this._history.length;

    if (iteration > this.maxIterations) {
      logger.warn('DoomLoop: max iterations (%d) exceeded after %d iterations', this.maxIterations, iteration);
      return {
        ok: false,
        terminated: true,
        iterationsUsed: iteration,
        reason: 'max_iterations_exceeded',
        maxIterations: this.maxIterations
      };
    }

    if (this._history.length >= this.maxRepetitions) {
      const recent = this._history.slice(-this.maxRepetitions);
      if (recent.every(f => f === fp)) {
        logger.warn('DoomLoop: state repetition detected — same fingerprint %d times', recent.length);
        return {
          ok: false,
          terminated: true,
          iterationsUsed: iteration,
          reason: 'state_repetition',
          repetitions: recent.length,
          fingerprint: fp
        };
      }
    }

    return { ok: true, terminated: false, iterationsUsed: iteration };
  }

  reset() {
    this._history = [];
  }

  get iterationCount() {
    return this._history.length;
  }
}

function createDoomGuard(loopType, maxIterations) {
  const guard = new DoomLoop({ maxIterations: maxIterations || config.doomLoop.maxIterations });
  return {
    guard,
    wrap: async (fn, getState) => {
      guard.reset();
      while (true) {
        const result = await fn();
        const state = typeof getState === 'function' ? getState(result) : result;
        const check = guard.check(state);
        if (!check.ok) {
          return {
            ...result,
            loop_type: loopType,
            iterations_used: check.iterationsUsed,
            terminated_early: true,
            termination_reason: check.reason,
            doom_loop: check
          };
        }
        if (state.should_continue === false || state.converged === true) {
          return {
            ...result,
            loop_type: loopType,
            iterations_used: check.iterationsUsed,
            terminated_early: false,
            termination_reason: state.termination_reason || 'converged'
          };
        }
      }
    }
  };
}

module.exports = { DoomLoop, createDoomGuard };
