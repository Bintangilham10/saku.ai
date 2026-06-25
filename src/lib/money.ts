// Semua uang di domain layer = bigint minor units. Jangan pakai float.
export type Minor = bigint;

export function toMinor(major: number, decimals = 2): Minor {
  // Hindari float drift: kerjakan via string.
  const [int, frac = ""] = major.toFixed(decimals).split(".");
  return BigInt(int + frac.padEnd(decimals, "0"));
}

export function fromMinor(minor: Minor, decimals = 2): number {
  return Number(minor) / 10 ** decimals;
}

export function sumMinor(values: Minor[]): Minor {
  return values.reduce((accumulator, value) => accumulator + value, BigInt(0));
}

export function formatMinor(minor: Minor, currency = "IDR", decimals = 2) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(
    fromMinor(minor, decimals),
  );
}
