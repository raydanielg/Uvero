// Cash isn't actually gatewayed — the provider collects it in person and the
// app just records that the job was paid.
export const cashGateway = {
  code: "cash",
  async charge({ reference }) {
    return { success: true, status: "COMPLETED", providerReference: reference ?? "cash", raw: {} };
  },
};
