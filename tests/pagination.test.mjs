import assert from "node:assert/strict"
import test from "node:test"

import { fetchAllPages } from "../src/lib/pagination.ts"

function createFetcher(rowCount, pageSize) {
  const rows = Array.from({ length: rowCount }, (_, index) => index)
  const ranges = []

  return {
    ranges,
    fetchPage(from, to) {
      ranges.push([from, to])
      return Promise.resolve(rows.slice(from, Math.min(to + 1, from + pageSize)))
    },
  }
}

for (const scenario of [
  { name: "zero rows", rowCount: 0, expectedCalls: 1 },
  { name: "fewer than one page", rowCount: 999, expectedCalls: 1 },
  { name: "exactly one page", rowCount: 1000, expectedCalls: 2 },
  { name: "more than one page", rowCount: 1001, expectedCalls: 2 },
]) {
  test(`fetchAllPages handles ${scenario.name}`, async () => {
    const fetcher = createFetcher(scenario.rowCount, 1000)
    const rows = await fetchAllPages(fetcher.fetchPage, 1000)

    assert.equal(rows.length, scenario.rowCount)
    assert.equal(fetcher.ranges.length, scenario.expectedCalls)
    assert.deepEqual(fetcher.ranges[0], [0, 999])
  })
}

test("fetchAllPages stops and propagates page errors", async () => {
  const expectedError = new Error("page failed")

  await assert.rejects(
    fetchAllPages(async (from) => {
      if (from === 1000) {
        throw expectedError
      }

      return Array.from({ length: 1000 }, (_, index) => index)
    }),
    expectedError
  )
})
