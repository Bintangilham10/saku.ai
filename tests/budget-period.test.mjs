import assert from "node:assert/strict";
import test from "node:test";

import {
  isDateWithinBudgetRange,
  resolveBudgetDateRange,
} from "../src/lib/budget-period.ts";

const reference = new Date("2026-06-17T12:00:00+07:00");

test("monthly budget defaults to the current calendar month", () => {
  const range = resolveBudgetDateRange(
    { period: "bulanan", startDate: null, endDate: null },
    reference,
  );

  assert.deepEqual(range, {
    startDate: "2026-06-01",
    endDate: "2026-06-30",
  });
});

test("weekly budget uses Monday through Sunday", () => {
  const range = resolveBudgetDateRange(
    { period: "mingguan", startDate: null, endDate: null },
    reference,
  );

  assert.deepEqual(range, {
    startDate: "2026-06-15",
    endDate: "2026-06-21",
  });
});

test("explicit budget dates override the generated period", () => {
  const range = resolveBudgetDateRange(
    {
      period: "bulanan",
      startDate: "2026-05-20",
      endDate: "2026-06-19",
    },
    reference,
  );

  assert.deepEqual(range, {
    startDate: "2026-05-20",
    endDate: "2026-06-19",
  });
});

test("a single explicit boundary derives the other from its period", () => {
  assert.deepEqual(
    resolveBudgetDateRange(
      {
        period: "mingguan",
        startDate: "2026-06-10",
        endDate: null,
      },
      reference,
    ),
    {
      startDate: "2026-06-10",
      endDate: "2026-06-14",
    },
  );
});

test("budget date matching includes both boundaries", () => {
  const range = {
    startDate: "2026-06-15",
    endDate: "2026-06-21",
  };

  assert.equal(isDateWithinBudgetRange("2026-06-14", range), false);
  assert.equal(isDateWithinBudgetRange("2026-06-15", range), true);
  assert.equal(isDateWithinBudgetRange("2026-06-21", range), true);
  assert.equal(isDateWithinBudgetRange("2026-06-22", range), false);
});
