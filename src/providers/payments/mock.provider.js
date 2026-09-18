import crypto from "node:crypto";

// Stands in for a real mobile-money/card gateway (Selcom, AzamPay, ...) in
// development. Swap by adding a sibling file that implements the same
// `charge()` contract and registering it in `gateways/index.js`.
export const mockGateway = {
  code: "mock",
  async charge({ amount, currency, reference }) {
    return {
      success: true,
      status: "COMPLETED",
      providerReference: reference ?? `mock_${crypto.randomUUID()}`,
      raw: { amount, currency, simulated: true },
    };
  },
};
