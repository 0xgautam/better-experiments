/**
 * Better-a/b - Developer-first A/B testing framework
 */

// Core classes
export { BetterExperiments } from "./better-experiments";

// Storage adapters
export { MemoryStorage } from "./storage/memory";

// Types
export type {
  ABTestConfig,
  BetterExperimentConfig,
  ConversionEvent,
  StorageAdapter,
  TestResults,
  UserAssignment,
  VariantResults,
  TestStats,
  VariantValue,
} from "./types";

// Utilities
export { createUserHash } from "./utils/hash";
