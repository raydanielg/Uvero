import { localStorage } from "./local.provider.js";

// Real cloud storage (S3-compatible, etc.) plugs in here the same way
// payment gateways do — implement `upload()`/`delete()` and register it,
// then flip the `storage` category's default IntegrationConfig row.
const registry = new Map([[localStorage.code, localStorage]]);

export function getStorageProvider(code = "local") {
  return registry.get(code) ?? localStorage;
}
