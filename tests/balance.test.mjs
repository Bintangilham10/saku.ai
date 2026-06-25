import assert from "node:assert/strict";
import test from "node:test";

import { buildBalanceSummary } from "../src/lib/balance-summary.ts";

function findTotal(totals, currency) {
  return totals.find((item) => item.currency === currency);
}

test("pending transactions do not enter available balance", () => {
  const summary = buildBalanceSummary(
    [
      {
        amount_minor: 100_000n,
        status: "cleared",
        date: "2026-01-01",
        currency: "IDR",
        type: "credit",
      },
      {
        amount_minor: 500_000n,
        status: "pending",
        date: "2026-01-02",
        currency: "IDR",
        type: "credit",
      },
    ],
    new Date("2026-01-03T00:00:00.000Z"),
  );

  assert.equal(findTotal(summary.availableBalances, "IDR")?.amountMinor, "100000");
  assert.equal(findTotal(summary.projectedBalances, "IDR")?.amountMinor, "600000");
  assert.equal(summary.pendingCount, 1);
});

test("future-dated transactions do not enter available balance", () => {
  const summary = buildBalanceSummary(
    [
      {
        amount_minor: 100_000n,
        status: "cleared",
        date: "2026-01-01",
        currency: "IDR",
        type: "credit",
      },
      {
        amount_minor: 500_000n,
        status: "cleared",
        date: "2026-01-04",
        currency: "IDR",
        type: "credit",
      },
    ],
    new Date("2026-01-03T00:00:00.000Z"),
  );

  assert.equal(findTotal(summary.availableBalances, "IDR")?.amountMinor, "100000");
  assert.equal(findTotal(summary.projectedBalances, "IDR")?.amountMinor, "600000");
  assert.equal(summary.pendingCount, 1);
});

test("different currencies are not collapsed into one total", () => {
  const summary = buildBalanceSummary(
    [
      {
        amount_minor: 100_000n,
        status: "cleared",
        date: "2026-01-01",
        currency: "IDR",
        type: "credit",
      },
      {
        amount_minor: 50_000n,
        status: "cleared",
        date: "2026-01-01",
        currency: "USD",
        type: "credit",
      },
    ],
    new Date("2026-01-03T00:00:00.000Z"),
  );

  assert.deepEqual(
    summary.availableBalances.map((item) => item.currency),
    ["IDR", "USD"],
  );
  assert.equal(findTotal(summary.availableBalances, "IDR")?.amountMinor, "100000");
  assert.equal(findTotal(summary.availableBalances, "USD")?.amountMinor, "50000");
  assert.equal(summary.availableBalance, findTotal(summary.availableBalances, "IDR")?.total);
});
