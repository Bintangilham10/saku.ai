import assert from "node:assert/strict";
import test from "node:test";

import {
  matchesRecurringCandidate,
  projectedRecurringSpend,
} from "../src/lib/ml/recurring-utils.ts";

test("recurring projection counts every occurrence through the horizon", () => {
  const projected = projectedRecurringSpend(
    [
      {
        amount: 100_000,
        confidence: 0.8,
        intervalDays: 7,
        nextOccurrence: "2026-06-16",
      },
    ],
    new Date("2026-06-15T12:00:00+07:00"),
    new Date("2026-06-30T23:59:59+07:00"),
  );

  assert.equal(projected, 240_000);
});

test("recurring projection includes an occurrence dated today", () => {
  const projected = projectedRecurringSpend(
    [
      {
        amount: 50_000,
        confidence: 1,
        intervalDays: 30,
        nextOccurrence: "2026-06-15",
      },
    ],
    new Date("2026-06-15T12:00:00+07:00"),
    new Date("2026-06-30T23:59:59+07:00"),
  );

  assert.equal(projected, 50_000);
});

test("same-date transaction is not recurring when merchant pattern differs", () => {
  const candidate = {
    merchantNormalized: "netflix",
    amount: 75_000,
  };

  assert.equal(
    matchesRecurringCandidate(
      { merchant: "Netflix 123", amount: 74_000 },
      candidate,
    ),
    true,
  );
  assert.equal(
    matchesRecurringCandidate(
      { merchant: "Belanja Harian", amount: 74_000 },
      candidate,
    ),
    false,
  );
});
