import { mockGateway } from "./mock.provider.js";
import { cashGateway } from "./cash.provider.js";

// Real gateways (Selcom, AzamPay, card processors, ...) plug in here once
// their credentials are configured through the Integration Engine — the
// rest of the payments module only ever talks to this registry, never to a
// gateway module directly.
const registry = new Map([
  [cashGateway.code, cashGateway],
  [mockGateway.code, mockGateway],
]);

export function getGateway(code) {
  return registry.get(code);
}
