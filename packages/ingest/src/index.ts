export { runIngestion } from "./upsert.js";
export { createOnisepAdapter } from "./sources/onisep.js";
export { createMonMasterAdapter } from "./sources/mon-master.js";
export { createUcasAdapter } from "./sources/ucas.js";
export { createCommonAppAdapter } from "./sources/common-app.js";
export type {
  NormalizedProgram,
  SourceAdapter,
  IngestSource,
  RunStats,
} from "./types.js";
