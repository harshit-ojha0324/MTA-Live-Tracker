import { describe, it, expect } from "vitest";
import { dijkstra, getSharedLine } from "./dijkstra";

// ── dijkstra ──────────────────────────────────────────────────────

describe("dijkstra", () => {
  it("finds route between adjacent stations", () => {
    const result = dijkstra("ts", "gc");
    expect(result.path).toEqual(["ts", "gc"]);
    expect(result.time).toBeGreaterThan(0);
    expect(result.stops).toBeGreaterThan(0);
  });

  it("same origin and destination returns trivial path", () => {
    const result = dijkstra("ts", "ts");
    expect(result.path).toEqual(["ts"]);
    expect(result.time).toBe(0);
    expect(result.stops).toBe(0);
  });

  it("finds multi-hop route across Manhattan", () => {
    const result = dijkstra("ts", "jay");
    expect(result.path[0]).toBe("ts");
    expect(result.path[result.path.length - 1]).toBe("jay");
    expect(result.path.length).toBeGreaterThan(2);
    expect(result.time).toBeGreaterThan(5);
  });

  it("Bay Ridge to Times Sq has realistic stop count", () => {
    const result = dijkstra("br", "ts");
    expect(result.path[0]).toBe("br");
    expect(result.path[result.path.length - 1]).toBe("ts");
    expect(result.stops).toBeGreaterThan(10);
  });

  it("returns empty path for unknown start station", () => {
    const result = dijkstra("INVALID_ID", "ts");
    expect(result.path).toEqual([]);
    expect(result.stops).toBe(0);
  });

  it("returns empty path for unknown end station", () => {
    const result = dijkstra("ts", "INVALID_ID");
    expect(result.path).toEqual([]);
  });

  it("path always starts with origin and ends with destination", () => {
    const pairs = [
      ["ts", "br"],
      ["gc", "jay"],
      ["ps", "hoy"],
      ["inv", "ci"],
      ["rh", "lex59"],
      ["jk", "bg"],
    ];
    for (const [from, to] of pairs) {
      const result = dijkstra(from, to);
      expect(result.path[0]).toBe(from);
      expect(result.path[result.path.length - 1]).toBe(to);
    }
  });

  it("all previously-isolated stations are now reachable from Times Sq", () => {
    // These were the 3 completely disconnected stations before graph fixes
    for (const id of ["br", "ci", "rh"]) {
      const result = dijkstra("ts", id);
      expect(result.path.length).toBeGreaterThan(0);
      expect(result.path[result.path.length - 1]).toBe(id);
    }
  });

  it("Queens stations are reachable from Manhattan", () => {
    for (const id of ["jk", "fl"]) {
      const result = dijkstra("ts", id);
      expect(result.path[result.path.length - 1]).toBe(id);
    }
  });

  it("travel time is symmetric (undirected graph)", () => {
    const ab = dijkstra("ts", "jay");
    const ba = dijkstra("jay", "ts");
    expect(ab.time).toBe(ba.time);
  });

  it("stops count is always positive for a real route", () => {
    const result = dijkstra("ts", "at");
    expect(result.stops).toBeGreaterThan(0);
  });
});

// ── getSharedLine ─────────────────────────────────────────────────

describe("getSharedLine", () => {
  it("returns shared line between connected stations", () => {
    expect(getSharedLine("ts", "hz")).toBeTruthy();   // N/Q/R/W
    expect(getSharedLine("ts", "ps")).toBeTruthy();   // 1/2/3
    expect(getSharedLine("jay", "hp")).toBeTruthy();  // A/C
  });

  it("returns null for stations with no shared line", () => {
    // ts has 1,2,3,7,N,Q,R,W,S; spr has 6 only
    expect(getSharedLine("ts", "spr")).toBeNull();
  });

  it("returns null for unknown station IDs", () => {
    expect(getSharedLine("INVALID", "ts")).toBeNull();
    expect(getSharedLine("ts", "INVALID")).toBeNull();
  });

  it("returns null when both IDs are unknown", () => {
    expect(getSharedLine("FOO", "BAR")).toBeNull();
  });
});
