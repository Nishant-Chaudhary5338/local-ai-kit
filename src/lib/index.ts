// Public surface of the future `local-ai-kit` package. The app consumes only
// from here, so extraction later is a move, not a rewrite.
export { cn } from "./cn";
export { LocalAI, type LoadProgress } from "./localAI";
export {
  detectCapability,
  recommendedTier,
  type Capability,
  type Tier,
} from "./capability";
export {
  CATALOG,
  defaultModelId,
  resolveModelId,
  loadLiveCatalog,
  EMBED_MODEL_ID,
  type CatalogModel,
} from "./catalog";
