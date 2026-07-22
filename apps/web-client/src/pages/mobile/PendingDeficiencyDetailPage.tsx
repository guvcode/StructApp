import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { calculateGlencoreRisk } from '../../utils/riskCalculator';
import { db } from '../../lib/db';
import { getActiveClientId } from '../../lib/authStore';
import { usePendingStructure } from '../../hooks/usePendingStructures';
import Skeleton from '../../components/Skeleton';

const LIKELIHOOD_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const;
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;

export default function PendingDeficiencyDetailPage() {
  const { id: pendingStructureId, localId } = useParams<{ id: string; localId: string }>();
  const navigate = useNavigate();
  const isNew = localId === 'new';
  const [error, setError] = useState('');

  const { data: pending, isLoading: isLoadingPending } = usePendingStructure(pendingStructureId);

  const { data: site } = useQuery({
    queryKey: ['sites', pending?.site_id],
    queryFn: () => apiClient<{ id: string; name: string }>(ENDPOINTS.sites.byId(pending!.site_id)),
    enabled: !!pending?.site_id,
  });

  const { data: structureTypes = [] } = useQuery({
    queryKey: ['structure-types'],
    queryFn: () => apiClient<Array<{ structure_type_id: string; name: string }>>(ENDPOINTS.picklists.byType('structure-types')),
  });

  const matchingStructureType = useMemo(() => {
    if (!pending?.asset_tag) return null;
    const prefix = pending.asset_tag.split('-')[0];
    if (!prefix) return null;
    return structureTypes.find(st => st.name.toLowerCase() === prefix.toLowerCase()) ?? null;
  }, [pending?.asset_tag, structureTypes]);

  const { data: templatesData } = useQuery({
    queryKey: ['structure-taxonomy-templates', matchingStructureType?.structure_type_id],
    queryFn: () => apiClient<{ templates: Array<{ taxonomy_node_id: string }>; ancestors: Record<string, Array<{ node_id: string }>> }>(ENDPOINTS.structureTaxonomyTemplates.byStructureType(matchingStructureType!.structure_type_id)),
    enabled: !!matchingStructureType?.structure_type_id,
  });

  const { data: taxonomyNodes = [] } = useQuery({
    queryKey: ['taxonomy', 'offline'],
    queryFn: async () => {
      const online = await apiClient<Array<{ node_id: string; parent_id: string | null; level: string; category: string; label: string; display_order: number; is_active: boolean }>>(ENDPOINTS.taxonomy.list);
      const mapped = online.map(n => ({
        nodeId: n.node_id,
        parentId: n.parent_id,
        level: n.level,
        category: n.category,
        label: n.label,
        displayOrder: n.display_order,
        isActive: n.is_active,
      }));
      await db.offlineTaxonomy.bulkPut(mapped);
      return mapped;
    },
  });

  const pinnedNodeIds = useMemo(() => {
    if (!templatesData?.ancestors) return new Set<string>();
    const ids = new Set<string>();
    for (const ancestors of Object.values(templatesData.ancestors)) {
      for (const node of ancestors) {
        ids.add(node.node_id);
      }
    }
    return ids;
  }, [templatesData]);

  const isPinned = (nodeId: string) => pinnedNodeIds.has(nodeId);

  const categories = taxonomyNodes.filter(n => n.level === 'category').map(n => n.label);
  const getChildren = (parentId: string | null) => taxonomyNodes.filter(n => n.parentId === parentId);

  const firstCategory = categories.length > 0 ? categories[0] : '';

  const [category, setCategory] = useState(firstCategory);
  const [equipmentType, setEquipmentType] = useState('');
  const [component, setComponent] = useState('');
  const [subComponent, setSubComponent] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [deficiencyCategory, setDeficiencyCategory] = useState('');
  const [detailedDescription, setDetailedDescription] = useState('');
  const [description, setDescription] = useState('');
  const [mechanisms, setMechanisms] = useState('');
  const [vibrationPresent, setVibrationPresent] = useState<boolean | undefined>(undefined);
  const [ndtRequired, setNdtRequired] = useState<boolean | undefined>(undefined);
  const [furtherInvestigationRequired, setFurtherInvestigationRequired] = useState<boolean | undefined>(undefined);
  const [recommendedAction, setRecommendedAction] = useState('');
  const [consequenceSeverity, setConsequenceSeverity] = useState<number>(3);
  const [likelihood, setLikelihood] = useState<string>('C');
  const [priorityRating, setPriorityRating] = useState<string>('P3');
  const [locationDesc, setLocationDesc] = useState('');

  const categoryNode = taxonomyNodes.find(n => n.label === category && n.level === 'category');
  const equipmentTypeNodes = categoryNode ? getChildren(categoryNode.nodeId).filter(n => n.level === 'equipment_type') : [];
  const equipmentTypeLabels = equipmentTypeNodes.map(n => n.label);
  const pinnedEquipmentTypes = equipmentTypeNodes.filter(n => isPinned(n.nodeId)).map(n => n.label);
  const unpinnedEquipmentTypes = equipmentTypeNodes.filter(n => !isPinned(n.nodeId)).map(n => n.label);
  const equipmentTypeNode = taxonomyNodes.find(n => n.label === equipmentType && n.parentId === categoryNode?.nodeId);
  const componentNodes = equipmentTypeNode ? getChildren(equipmentTypeNode.nodeId) : [];
  const components = componentNodes.map(n => n.label);
  const componentNode = taxonomyNodes.find(n => n.label === component && n.parentId === equipmentTypeNode?.nodeId);
  const subComponents = componentNode ? getChildren(componentNode.nodeId).map(n => n.label) : [];
  const subComponentNode = taxonomyNodes.find(n => n.label === subComponent && n.parentId === componentNode?.nodeId);
  const focusAreas = subComponentNode ? getChildren(subComponentNode.nodeId).map(n => n.label) : [];
  const focusAreaNode = taxonomyNodes.find(n => n.label === focusArea && n.parentId === subComponentNode?.nodeId);
  const deficiencyCategories = focusAreaNode ? getChildren(focusAreaNode.nodeId).map(n => n.label) : [];
  const deficiencyCategoryNode = taxonomyNodes.find(n => n.label === deficiencyCategory && n.parentId === focusAreaNode?.nodeId);
  const detailedDescriptions = deficiencyCategoryNode ? getChildren(deficiencyCategoryNode.nodeId).map(n => n.label) : [];

  const glencoreResult = consequenceSeverity && likelihood
    ? calculateGlencoreRisk(consequenceSeverity as 1|2|3|4|5, likelihood as 'A'|'B'|'C'|'D'|'E')
    : null;

  useEffect(() => {
    if (!component && subComponent && taxonomyNodes.length > 0) {
      const subComponentNode = taxonomyNodes.find(n => n.label === subComponent && n.level === 'sub_component');
      if (subComponentNode?.parentId) {
        const parent = taxonomyNodes.find(n => n.nodeId === subComponentNode.parentId);
        if (parent) setComponent(parent.label);
      }
    }
  }, [subComponent, taxonomyNodes, component]);

  useEffect(() => {
    if (!subComponent && focusArea && taxonomyNodes.length > 0) {
      const focusAreaNode = taxonomyNodes.find(n => n.label === focusArea && n.level === 'focus_area');
      if (focusAreaNode?.parentId) {
        const parent = taxonomyNodes.find(n => n.nodeId === focusAreaNode.parentId);
        if (parent) setSubComponent(parent.label);
      }
    }
  }, [focusArea, taxonomyNodes, subComponent]);

  const addPendingDeficiency = useMutation({
    mutationFn: async () => {
      const data: Record<string, unknown> = {
        category,
        equipment_type: equipmentType,
        component,
        sub_component: subComponent,
        focus_area: focusArea,
        deficiency_category: deficiencyCategory,
        detailed_description: detailedDescription,
        mechanism: mechanisms,
        vibration_present: vibrationPresent,
        ndt_required: ndtRequired,
        further_investigation_required: furtherInvestigationRequired,
        recommended_action: recommendedAction,
        consequence_severity: consequenceSeverity,
        likelihood,
        priority_tier: priorityRating,
        gps_latitude: null,
        gps_longitude: null,
      };

      if (navigator.onLine) {
        try {
          const created = await apiClient<{ pending_deficiency_id: string }>(ENDPOINTS.pendingStructures.addDeficiency(pendingStructureId!), { method: 'POST', body: JSON.stringify(data) });
          return { ...created, pending_structure_id: pendingStructureId };
        } catch {
          // fall through to offline storage
        }
      }

      const clientId = getActiveClientId() || 'unknown';
      const record = {
        pendingStructureLocalId: parseInt(pendingStructureId!, 10),
        clientLocalId: clientId,
        pendingDeficiencyId: `local_${Date.now()}`,
        category: data.category as string | null,
        equipmentType: data.equipment_type as string | null,
        component: data.component as string | null,
        subComponent: data.sub_component as string | null,
        focusArea: data.focus_area as string | null,
        deficiencyCategory: data.deficiency_category as string | null,
        detailedDescription: data.detailed_description as string | null,
        consequenceSeverity: data.consequence_severity as number | null,
        likelihood: data.likelihood as string | null,
        recommendedAction: data.recommended_action as string | null,
        mostAffectedConsequence: null,
        gpsLatitude: null,
        gpsLongitude: null,
        syncState: 'Pending_Sync' as const,
      };

      const insertedId = await db.offlinePendingStructureDeficiencies.add(record);
      return { pending_deficiency_id: `local_${insertedId}`, pending_structure_id: pendingStructureId };
    },
    onSuccess: (result) => {
      if (result?.pending_deficiency_id) {
        navigate(`/m/pending-structures/${pendingStructureId}`);
      }
    },
    onError: () => setError('Failed to save deficiency.'),
  });

  const saving = addPendingDeficiency.isPending;

  if (isLoadingPending || !pending) {
    return <div className="p-4 space-y-3"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-24 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(`/m/pending-structures/${pendingStructureId}`)} className="text-sm text-accent">&larr; Back</button>
      <h2 className="text-lg font-bold text-text-primary">{isNew ? 'New Deficiency' : 'Edit Deficiency'}</h2>
      <div className="bg-surface-secondary rounded-lg p-3 border border-border text-sm text-left">
        <p className="text-text-primary font-medium">{pending.asset_tag}</p>
        <p className="text-xs text-text-secondary">{pending.description}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setEquipmentType(''); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
          <option value="">Select category...</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {category && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Equipment Type</label>
          <select value={equipmentType} onChange={e => { setEquipmentType(e.target.value); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select equipment type...</option>
            {pinnedEquipmentTypes.length > 0 && <optgroup label="Suggested for this asset type">{pinnedEquipmentTypes.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>}
            {unpinnedEquipmentTypes.length > 0 && <optgroup label="Other equipment types">{unpinnedEquipmentTypes.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>}
            {pinnedEquipmentTypes.length === 0 && unpinnedEquipmentTypes.length === 0 && equipmentTypeLabels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {equipmentType && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Component</label>
          <select value={component} onChange={e => { setComponent(e.target.value); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select component...</option>
            {components.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {component && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Sub-Component</label>
          <select value={subComponent} onChange={e => { setSubComponent(e.target.value); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select sub-component...</option>
            {subComponents.map(sc => <option key={sc} value={sc}>{sc}</option>)}
          </select>
        </div>
      )}

      {subComponent && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Focus Area</label>
          <select value={focusArea} onChange={e => { setFocusArea(e.target.value); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select focus area...</option>
            {focusAreas.map(fa => <option key={fa} value={fa}>{fa}</option>)}
          </select>
        </div>
      )}

      {focusArea && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Deficiency Category</label>
          <select value={deficiencyCategory} onChange={e => { setDeficiencyCategory(e.target.value); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select deficiency category...</option>
            {deficiencyCategories.map(dc => <option key={dc} value={dc}>{dc}</option>)}
          </select>
        </div>
      )}

      {deficiencyCategory && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Detailed Description</label>
          <select value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
            <option value="">Select detailed description...</option>
            {detailedDescriptions.map(dd => <option key={dd} value={dd}>{dd}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Inspector Notes</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Additional observations, measurements, or context..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Indication Details</p>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Potential Failure Mechanism</label>
          <input value={mechanisms} onChange={e => setMechanisms(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="e.g., Atmospheric corrosion, fatigue loading..." />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Consequence (1-5)</label>
            <select value={consequenceSeverity} onChange={e => setConsequenceSeverity(Number(e.target.value))} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {['','Minimal','Moderate','Major','Severe','Catastrophic'][v]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Likelihood</label>
            <select value={likelihood} onChange={e => setLikelihood(e.target.value)} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {['A','B','C','D','E'].map((v, i) => <option key={v} value={v}>{v} — {['','Rare','Unlikely','Possible','Likely','Almost Certain'][i + 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Priority</label>
            <select value={priorityRating} onChange={e => setPriorityRating(e.target.value)} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {PRIORITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        {glencoreResult && (
          <div className="mt-3 bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-text-secondary">Risk Rank: {glencoreResult.riskRank}/25</p>
            <p className={`text-lg font-bold ${glencoreResult.riskRating === 'High' ? 'text-red-600' : glencoreResult.riskRating === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
              {glencoreResult.riskRating}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Location</label>
        <input value={locationDesc} onChange={e => setLocationDesc(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="e.g., Floor 12, column grid C-4" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Recommended Action</label>
        <textarea value={recommendedAction} onChange={e => setRecommendedAction(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Describe the recommended repair or action..." />
      </div>

      <button
        onClick={() => addPendingDeficiency.mutate()}
        disabled={saving || !category}
        className="w-full px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Deficiency'}
      </button>

      {!navigator.onLine && (
        <p className="text-xs text-text-secondary text-center">Offline — deficiency will sync when connected.</p>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded text-sm text-center">{error}</div>
      )}
    </div>
  );
}
