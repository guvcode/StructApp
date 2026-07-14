export interface TaxonomyNode {
  node_id: string;
  parent_id: string | null;
  level: string;
  category: string;
  label: string;
  display_order: number;
  is_active: boolean;
  deficiency_codes?: string[] | null;
  deficiency_mechanisms?: string[] | null;
}

export interface TreeNode extends TaxonomyNode {
  children: TreeNode[];
  depth: number;
}

const LEVEL_ORDER: Record<string, number> = {
  category: 0,
  equipment_type: 1,
  component: 2,
  sub_component: 3,
  focus_area: 4,
};

export function buildTree(nodes: TaxonomyNode[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const node of nodes) {
    map.set(node.node_id, { ...node, children: [], depth: 0 });
  }

  for (const node of nodes) {
    const treeNode = map.get(node.node_id)!;
    if (node.parent_id && map.has(node.parent_id)) {
      const parent = map.get(node.parent_id)!;
      parent.children.push(treeNode);
      treeNode.depth = parent.depth + 1;
    } else {
      roots.push(treeNode);
    }
  }

  const sortFn = (a: TreeNode, b: TreeNode) => {
    const levelDiff = (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99);
    if (levelDiff !== 0) return levelDiff;
    return a.display_order - b.display_order;
  };

  function sortTree(nodes: TreeNode[]) {
    nodes.sort(sortFn);
    for (const n of nodes) sortTree(n.children);
  }

  sortTree(roots);
  return roots;
}

export function findNodeById(tree: TreeNode[], id: string): TreeNode | null {
  for (const node of tree) {
    if (node.node_id === id) return node;
    const found = findNodeById(node.children, id);
    if (found) return found;
  }
  return null;
}

export function getPathToNode(tree: TreeNode[], id: string): TreeNode[] {
  for (const node of tree) {
    if (node.node_id === id) return [node];
    const found = getPathToNode(node.children, id);
    if (found.length > 0) return [node, ...found];
  }
  return [];
}

export function filterTree(tree: TreeNode[], query: string): TreeNode[] {
  if (!query.trim()) return tree;
  const lower = query.toLowerCase();

  function matches(node: TreeNode): boolean {
    return node.label.toLowerCase().includes(lower) ||
           node.level.toLowerCase().includes(lower);
  }

  function filter(node: TreeNode): TreeNode | null {
    const filteredChildren = node.children.map(filter).filter((n): n is TreeNode => n !== null);
    if (matches(node) || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  }

  return tree.map(filter).filter((n): n is TreeNode => n !== null);
}

export function flattenTree(tree: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  function walk(nodes: TreeNode[]) {
    for (const n of nodes) {
      result.push(n);
      walk(n.children);
    }
  }
  walk(tree);
  return result;
}