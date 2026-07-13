const d = require('./proper-taxonomy.json');

console.log('=== GENERATED TAXONOMY SUMMARY ===');
console.log('Total nodes:', d.nodes.length);
console.log('');

console.log('--- Node counts by level ---');
const counts = {};
for (const n of d.nodes) { counts[n.level] = (counts[n.level] || 0) + 1; }
for (const [k, v] of Object.entries(counts)) { console.log('  ' + k + ':', v); }
console.log('');

console.log('--- Hierarchy Validation ---');
const expectedParent = { equipment_type: 'category', component: 'equipment_type', sub_component: 'component', focus_area: 'sub_component' };
const nodeById = {};
for (const n of d.nodes) { nodeById[n.node_id] = n; }
let errors = [];
for (const n of d.nodes) {
  if (n.level === 'category') {
    if (n.parent_id !== null) errors.push('Category "' + n.label + '" has non-null parent');
  } else {
    const exp = expectedParent[n.level];
    if (exp && n.parent_id) {
      const p = nodeById[n.parent_id];
      if (p && p.level !== exp) errors.push(n.level + ' "' + n.label + '" -> ' + p.level + ' (expected ' + exp + ')');
    }
  }
}
console.log('All valid:', errors.length === 0);
if (errors.length) { console.log('Errors:', errors.slice(0, 5)); }
console.log('');

console.log('--- Top-level categories ---');
for (const c of d.nodes.filter(function(n) { return n.level === 'category'; })) {
  console.log('  ' + c.label + ' (display_order: ' + c.display_order + ')');
}
console.log('');

console.log('--- Sample focus_area node ---');
const fa = d.nodes.find(function(n) { return n.level === 'focus_area'; });
console.log(JSON.stringify(fa, null, 2));
console.log('');

console.log('--- Deficiency codes used across all focus areas ---');
const codes = new Set();
for (const n of d.nodes.filter(function(n) { return n.level === 'focus_area'; })) {
  if (n.deficiency_codes) n.deficiency_codes.forEach(function(c) { codes.add(c); });
}
console.log(Array.from(codes).sort().join(', '));
console.log('');

console.log('--- Deficiency category reference count ---');
console.log(d.deficiency_category_reference.length + ' reference entries');
console.log('');

console.log('--- Hierarchy level definitions ---');
console.log(JSON.stringify(d.hierarchy_levels, null, 2));