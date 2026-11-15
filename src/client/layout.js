/* SPDX-License-Identifier: MIT */

/**
 * Layered layout for a Sankey DAG. Nodes are grouped by longest-path layer;
 * each node's flow value is the larger of its inflow and outflow totals, so
 * sources show their outflow and sinks their inflow.
 * @param nodes - `{ id, label }` nodes (ids already validated unique).
 * @param links - `{ from, to, value }` links (acyclic, value > 0).
 * @returns layers in source-to-sink order with per-node values.
 */
export function layoutSankey(nodes, links) {
  const byId = new Map(nodes.map((node) => [node.id, node]))
  const outflow = new Map(nodes.map((node) => [node.id, 0]))
  const inflow = new Map(nodes.map((node) => [node.id, 0]))
  for (const link of links) {
    outflow.set(link.from, (outflow.get(link.from) ?? 0) + link.value)
    inflow.set(link.to, (inflow.get(link.to) ?? 0) + link.value)
  }
  const value = (id) => Math.max(inflow.get(id) ?? 0, outflow.get(id) ?? 0)
  // Longest-path layer assignment (Kahn order).
  const indegree = new Map(nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(nodes.map((node) => [node.id, []]))
  for (const link of links) {
    indegree.set(link.to, (indegree.get(link.to) ?? 0) + 1)
    outgoing.get(link.from)?.push(link.to)
  }
  const depth = new Map(nodes.map((node) => [node.id, 0]))
  const queue = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id)
  while (queue.length > 0) {
    const id = queue.shift()
    for (const next of outgoing.get(id) ?? []) {
      depth.set(next, Math.max(depth.get(next) ?? 0, (depth.get(id) ?? 0) + 1))
      indegree.set(next, (indegree.get(next) ?? 0) - 1)
      if (indegree.get(next) === 0) queue.push(next)
    }
  }
  const layerCount = Math.max(1, ...[...depth.values()].map((value) => value + 1))
  const layers = Array.from({ length: layerCount }, () => [])
  for (const node of nodes) {
    layers[depth.get(node.id) ?? 0].push({
      id: node.id,
      label: node.label,
      value: value(node.id),
      inflow: inflow.get(node.id) ?? 0,
      outflow: outflow.get(node.id) ?? 0,
    })
  }
  return layers
}

/**
 * Tidy tree layout: leaves get consecutive columns, every parent centers over
 * its children, and depth sets the row.
 * @param root - normalized tree root `{ label, detail?, children? }`.
 * @returns flat positioned nodes with `depth`, `x` (leaf column), and `parent`.
 */
export function layoutTree(root) {
  const positioned = []
  let nextLeaf = 0
  const walk = (node, depth, parent) => {
    const children = node.children ?? []
    let x
    if (children.length === 0) {
      x = nextLeaf
      nextLeaf += 1
    } else {
      const placed = children.map((child) => walk(child, depth + 1, node.label))
      x = placed.reduce((sum, childX) => sum + childX, 0) / placed.length
    }
    positioned.push({ label: node.label, detail: node.detail, depth, x, parent })
    return x
  }
  walk(root, 0, null)
  const leaves = Math.max(1, nextLeaf)
  const maxDepth = Math.max(...positioned.map((node) => node.depth))
  return { nodes: positioned, leaves, maxDepth }
}
