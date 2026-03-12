import { STATIONS } from "../constants/stations";
import { EDGES } from "../constants/edges";

export function dijkstra(startId, endId) {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const queue = [];

  STATIONS.forEach(s => { dist[s.id] = Infinity; });
  dist[startId] = 0;
  queue.push({ id: startId, d: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id: u } = queue.shift();
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === endId) break;

    EDGES.forEach(([a, b, w]) => {
      if (a === u && !visited.has(b)) {
        const alt = dist[u] + w;
        if (alt < dist[b]) {
          dist[b] = alt;
          prev[b] = u;
          queue.push({ id: b, d: alt });
        }
      }
      if (b === u && !visited.has(a)) {
        const alt = dist[u] + w;
        if (alt < dist[a]) {
          dist[a] = alt;
          prev[a] = u;
          queue.push({ id: a, d: alt });
        }
      }
    });
  }

  const path = [];
  let cur = endId;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  if (path[0] !== startId) return { path: [], time: Infinity, stops: 0 };

  // Sum real stop counts along the chosen path
  let stops = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    const edge = EDGES.find(([ea, eb]) => (ea === a && eb === b) || (ea === b && eb === a));
    stops += edge ? (edge[3] ?? 1) : 1;
  }

  return { path, time: dist[endId], stops };
}

export function getSharedLine(s1Id, s2Id) {
  const s1 = STATIONS.find(s => s.id === s1Id);
  const s2 = STATIONS.find(s => s.id === s2Id);
  if (!s1 || !s2) return null;
  return s1.lines.find(l => s2.lines.includes(l)) ?? null;
}
