/**
 * DSA: Graph + Dijkstra's Algorithm
 * Used for: Finding the shortest delivery route from restaurant to customer.
 *           The city is modeled as a weighted graph where nodes = locations
 *           and edges = roads with weights = travel time in minutes.
 *
 * Time Complexity: O((V + E) log V) with binary heap
 * Space Complexity: O(V + E)
 */

const { MinHeap } = require('./MinHeap');

class Graph {
  constructor(directed = false) {
    this.adjacencyList = new Map();  // node -> [{to, weight, roadName}]
    this.nodes = new Set();
    this.directed = directed;
    this.edgeCount = 0;
  }

  addNode(id, metadata = {}) {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
      this.nodes.add(id);
    }
    return this;
  }

  addEdge(from, to, weight = 1, roadName = '') {
    this.addNode(from);
    this.addNode(to);

    this.adjacencyList.get(from).push({ to, weight, roadName });
    if (!this.directed) {
      this.adjacencyList.get(to).push({ to: from, weight, roadName });
    }
    this.edgeCount++;
    return this;
  }

  getNeighbors(node) {
    return this.adjacencyList.get(node) || [];
  }

  hasNode(id) {
    return this.adjacencyList.has(id);
  }

  getStats() {
    return {
      nodes: this.nodes.size,
      edges: this.edgeCount,
      directed: this.directed,
    };
  }
}

/**
 * Dijkstra's Algorithm Implementation
 * Returns: { distance, path, totalTime, roads }
 */
function dijkstra(graph, source, target) {
  if (!graph.hasNode(source) || !graph.hasNode(target)) {
    return { error: 'Source or target node not found', distance: Infinity, path: [] };
  }

  const distances = new Map();
  const previous = new Map();
  const visited = new Set();

  // Initialize distances to Infinity
  for (const node of graph.nodes) {
    distances.set(node, Infinity);
    previous.set(node, null);
  }
  distances.set(source, 0);

  // Min-heap: { priority: distance, node }
  const pq = new MinHeap();
  pq.insert({ priority: 0, node: source });

  while (!pq.isEmpty()) {
    const { node: current } = pq.extractMin();

    if (current === target) break;
    if (visited.has(current)) continue;
    visited.add(current);

    for (const { to: neighbor, weight } of graph.getNeighbors(current)) {
      if (visited.has(neighbor)) continue;

      const newDist = distances.get(current) + weight;
      if (newDist < distances.get(neighbor)) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, current);
        pq.insert({ priority: newDist, node: neighbor });
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = target;
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current);
  }

  const isReachable = path[0] === source;
  const roads = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = graph.getNeighbors(path[i]).find(e => e.to === path[i + 1]);
    if (edge) roads.push(edge.roadName || `${path[i]}-${path[i + 1]}`);
  }

  return {
    source,
    target,
    distance: isReachable ? distances.get(target) : Infinity,
    path: isReachable ? path : [],
    roads,
    totalTimeMinutes: isReachable ? distances.get(target) : null,
    reachable: isReachable,
    nodesExplored: visited.size,
  };
}

/**
 * All-pairs shortest paths using repeated Dijkstra
 * Used for: precomputing delivery time matrix between all city zones
 */
function allPairsShortestPaths(graph) {
  const result = {};
  for (const source of graph.nodes) {
    result[source] = {};
    for (const target of graph.nodes) {
      if (source !== target) {
        result[source][target] = dijkstra(graph, source, target);
      }
    }
  }
  return result;
}

/**
 * City Delivery Graph — prebuilt sample city with zones
 */
function buildCityGraph() {
  const graph = new Graph(false);

  // Zones: restaurant areas and residential zones
  const edges = [
    ['RestaurantHub', 'Zone_A', 5, 'MG Road'],
    ['RestaurantHub', 'Zone_B', 8, 'NH-48'],
    ['Zone_A', 'Zone_C', 4, 'Linking Road'],
    ['Zone_A', 'Zone_D', 6, 'SV Road'],
    ['Zone_B', 'Zone_D', 3, 'Western Express'],
    ['Zone_B', 'Zone_E', 7, 'Eastern Highway'],
    ['Zone_C', 'CustomerArea', 5, 'Inner Ring Road'],
    ['Zone_D', 'CustomerArea', 4, 'Outer Ring Road'],
    ['Zone_E', 'CustomerArea', 6, 'Bypass Road'],
    ['Zone_C', 'Zone_E', 9, 'Cross Link'],
    ['Zone_A', 'Zone_E', 11, 'Long Route'],
  ];

  edges.forEach(([from, to, weight, road]) => graph.addEdge(from, to, weight, road));

  return graph;
}

module.exports = { Graph, dijkstra, allPairsShortestPaths, buildCityGraph };
