import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { getDeficiencyById } from '../../services/api/inspections';
import { calculateGlencoreRisk } from '../../utils/riskCalculator';
import { db, type DeficiencyRecord } from '../../lib/db';
import { getActiveClientId } from '../../lib/authStore';
import Skeleton from '../../components/Skeleton';
import { useOfflinePhotos } from '../../hooks/useOfflinePhotos';
import { InspectionStatus, PriorityTier } from '../../types';

const LIKELIHOOD_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const;
const PRIORITY_OPTIONS = Object.values(PriorityTier);

export default function DeficiencyDetailPage() {
  const { localId } = useParams<{ localId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inspectionId = searchParams.get('inspection_id') ?? '';
  const isNew = localId === 'new';
  const [error, setError] = useState('');

  const { data: inspection } = useQuery({
    queryKey: ['inspections', inspectionId],
    queryFn: () => apiClient<{ site_id?: string; siteId?: string; structure_id?: string; structureId?: string; status: string; assignee_name?: string; assignee_email?: string; assigned_to?: string }>(ENDPOINTS.inspections.byId(inspectionId)),
    enabled: !!inspectionId,
  });

  const { data: site } = useQuery({
    queryKey: ['sites', inspection?.site_id ?? inspection?.siteId],
    queryFn: () => apiClient<{ id: string; name: string }>(ENDPOINTS.sites.byId(inspection!.site_id ?? inspection!.siteId!)),
    enabled: !!inspection?.site_id || !!inspection?.siteId,
  });

  const { data: structure } = useQuery({
    queryKey: ['structures', inspection?.structure_id ?? inspection?.structureId],
    queryFn: () => apiClient<{ id: string; name: string; identifier: string; type: string }>(ENDPOINTS.structures.byId(inspection!.structure_id ?? inspection!.structureId!)),
    enabled: !!inspection?.structure_id || !!inspection?.structureId,
  });

  const { data: existingDeficiency, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['deficiencies', localId],
    queryFn: async () => {
      // Check offline outbox first (locally-created pending sync)
      const outboxRecords = await db.deficiencies
        .where('deficiencyId')
        .equals(localId!)
        .toArray();
      if (outboxRecords.length > 0) return outboxRecords[0];

      // Check cached server deficiencies
      const offline = await db.offlineDeficiencies.get(localId!);
      if (offline) return offline;

      // Fall back to network
      return getDeficiencyById(localId!);
    },
    enabled: !!localId && localId !== 'new',
  });

  useEffect(() => {
    if (!existingDeficiency) return;
    const d = existingDeficiency as Record<string, unknown>;
        setCategory((d.category as string) || firstCategory);
    setEquipmentType((d.equipmentType as string) || (d.equipment_type as string) || '');
    setComponent((d.component as string) || '');
    setFocusArea((d.focusArea as string) || (d.focus_area as string) || '');
    setDeficiencyCategory((d.deficiencyCategory as string) || (d.deficiency_category as string) || '');
    setDetailedDescription((d.detailedDescription as string) || (d.detailed_description as string) || '');
    setDescription((d.description as string) || '');
    setMechanisms((d.mechanisms as string) || '');
    setVibrationPresent(d.vibration_present as boolean | undefined);
    setNdtRequired(d.ndt_required as boolean | undefined);
    setFurtherInvestigationRequired(d.further_investigation_required as boolean | undefined);
    setRecommendedAction((d.recommendedAction as string) || (d.recommended_action as string) || '');
    setConsequenceSeverity((d.consequenceSeverity as number) || (d.consequence_severity as number) || 3);
    setLikelihood((d.likelihood as string) || 'C');
    setPriorityRating((d.priorityTier as string) || (d.priority_tier as string) || 'P3');
    setComponentNote((d.componentNote as string) || (d.component_note as string) || '');
    setLocationDesc((d.locationDesc as string) || (d.location_desc as string) || '');
  }, [existingDeficiency]);

  const { data: structureTypes = [] } = useQuery({
    queryKey: ['structure-types'],
    queryFn: () => apiClient<Array<{ structure_type_id: string; name: string }>>(ENDPOINTS.picklists.byType('structure-types')),
  });

  const matchingStructureType = useMemo(() => {
    const typeName = structure?.type;
    if (!typeName || !structureTypes.length) return null;
    return structureTypes.find(st => st.name === typeName) ?? null;
  }, [structure?.type, structureTypes]);

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
  const [componentNote, setComponentNote] = useState('');
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

  // Derive component from the taxonomy tree when it's not persisted
  // but subComponent is known. This bridges the gap.
  useEffect(() => {
    if (!component && subComponent && taxonomyNodes.length > 0) {
      const subComponentNode = taxonomyNodes.find(n => n.label === subComponent && n.level === 'sub_component');
      if (subComponentNode?.parentId) {
        const parent = taxonomyNodes.find(n => n.nodeId === subComponentNode.parentId);
        if (parent) setComponent(parent.label);
      }
    }
  }, [subComponent, taxonomyNodes, component]);

  // Derive subComponent from the taxonomy tree when it's not persisted
  // but focusArea is known.
  useEffect(() => {
    if (!subComponent && focusArea && taxonomyNodes.length > 0) {
      const focusAreaNode = taxonomyNodes.find(n => n.label === focusArea && n.level === 'focus_area');
      if (focusAreaNode?.parentId) {
        const parent = taxonomyNodes.find(n => n.nodeId === focusAreaNode.parentId);
        if (parent) setSubComponent(parent.label);
      }
    }
  }, [focusArea, taxonomyNodes, subComponent]);

  // Fetch inspection status to determine read-only mode
  const deficiencyInspectionId = (existingDeficiency as Record<string, unknown> | undefined)?.inspection_id as string | undefined ?? inspectionId;
  const { data: deficiencyInspection } = useQuery({
    queryKey: ['inspection', deficiencyInspectionId],
    queryFn: () => apiClient<{ status: string }>(ENDPOINTS.inspections.byId(deficiencyInspectionId!)),
    enabled: !!deficiencyInspectionId && !isNew,
  });
  const isReadOnly = !isNew && (deficiencyInspection?.status === InspectionStatus.Submitted || deficiencyInspection?.status === InspectionStatus.Approved);

  const { uploadPending } = useOfflinePhotos(localId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: Record<string, unknown> = {
        description: description || detailedDescription,
        category,
        equipment_type: equipmentType,
        component,
        sub_component: subComponent,
        focus_area: focusArea,
        deficiency_category: deficiencyCategory,
        detailed_description: detailedDescription,
        mechanisms,
        vibration_present: vibrationPresent,
        ndt_required: ndtRequired,
        further_investigation_required: furtherInvestigationRequired,
        recommended_action: recommendedAction,
        consequence_severity: consequenceSeverity,
        likelihood,
        priority_tier: priorityRating,
        risk_rank: glencoreResult?.riskRank,
        risk_rating: glencoreResult?.riskRating,
      };
      if (componentNote) data.component_note = componentNote;
      if (locationDesc) data.location_desc = locationDesc;

      // Try API first — if online, this succeeds normally
      if (navigator.onLine) {
        try {
          if (isNew && inspectionId) {
            const created = await apiClient<{ deficiency_id: string }>(ENDPOINTS.deficiencies.create(inspectionId), { method: 'POST', body: JSON.stringify(data) });
            return created;
          } else if (localId) {
            await apiClient(ENDPOINTS.deficiencies.update(localId), { method: 'PATCH', body: JSON.stringify(data) });
            return { deficiency_id: localId } as { deficiency_id: string };
          }
          return { deficiency_id: '' } as { deficiency_id: string };
        } catch {
          // API call failed — fall through to offline storage below
        }
      }

      // Offline: write to local Dexie outbox
      const clientId = getActiveClientId() || 'unknown';
      const structureId = (inspection as Record<string, unknown>)?.structure_id as string
        || (inspection as Record<string, unknown>)?.structureId as string
        || '';

      const record = {
        inspectionId,
        structureId,
        clientId,
        description: (data.description as string) || '',
        calculatedPriority: (data.priority_tier as 'P1' | 'P2' | 'P3' | 'P4' | 'P5') || 'P3',
        triageState: 'New' as const,
        ...(data.category ? { category: data.category as string } : {}),
        ...(data.equipment_type ? { equipmentType: data.equipment_type as string } : {}),
        ...(data.component ? { component: data.component as string } : {}),
        ...(data.sub_component ? { subComponent: data.sub_component as string } : {}),
        ...(data.focus_area ? { focusArea: data.focus_area as string } : {}),
        ...(data.deficiency_category ? { deficiencyCategory: data.deficiency_category as string } : {}),
        ...(data.detailed_description ? { detailedDescription: data.detailed_description as string } : {}),
        ...(data.mechanisms ? { mechanisms: data.mechanisms as string } : {}),
        ...(data.vibration_present !== undefined ? { vibrationPresent: data.vibration_present as boolean } : {}),
        ...(data.ndt_required !== undefined ? { ndtRequired: data.ndt_required as boolean } : {}),
        ...(data.further_investigation_required !== undefined ? { furtherInvestigationRequired: data.further_investigation_required as boolean } : {}),
        ...(data.recommended_action ? { recommendedAction: data.recommended_action as string } : {}),
        ...(data.consequence_severity !== undefined ? { consequenceSeverity: data.consequence_severity as number } : {}),
        ...(data.likelihood ? { likelihood: data.likelihood as string } : {}),
        ...(data.priority_tier ? { priorityRating: (data.priority_tier as 'P1' | 'P2' | 'P3' | 'P4' | 'P5') } : {}),
        ...(data.component_note ? { componentNotes: data.component_note as string } : {}),
        ...(data.location_desc ? { locationDesc: data.location_desc as string } : {}),
        createdAt: new Date(),
        updatedAt: new Date(),
        syncState: 'Pending_Sync' as const,
      } as DeficiencyRecord;

      if (!isNew && localId) {
        // Editing an existing local deficiency — update the record
        await db.deficiencies.where('deficiencyId').equals(localId).modify(record);
        return { deficiency_id: localId } as { deficiency_id: string };
      }

      // Insert new local deficiency
      const insertedId = await db.deficiencies.add(record);
      return { deficiency_id: `local_${insertedId}` } as { deficiency_id: string };
    },
    onSuccess: async (result) => {
      if (result?.deficiency_id) {
        // Re-link any photos that were stored under the temp 'new' ID to the actual deficiency ID
        const pendingPhotos = await db.offlinePhotos
          .where('deficiencyLocalId')
          .equals('new')
          .toArray();
        for (const photo of pendingPhotos) {
          await db.offlinePhotos.put({ ...photo, deficiencyLocalId: result.deficiency_id });
        }

        // Upload any pending photos captured while this deficiency was unsaved
        if (navigator.onLine) {
          await uploadPending(result.deficiency_id, inspectionId);
        }
        navigate(`/m/deficiencies/${result.deficiency_id}?inspection_id=${inspectionId}`, { replace: true });
      }
    },
    onError: () => setError('Failed to save deficiency.'),
  });

  const saving = saveMutation.isPending;

  if (!isNew && isLoadingExisting) {
    return <div className="p-4"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32 w-full rounded-lg" /></div>;
  }

  return (
    <div className="space-y-4">
      <button onClick={() => navigate(inspectionId ? `/m/inspections/${inspectionId}` : '/m/dashboard')} className="text-sm text-accent">&larr; Back</button>
      {inspection && (
        <button
          onClick={() => navigate(`/m/inspections/${inspectionId}`)}
          className="w-full bg-surface-secondary rounded-lg p-3 border border-border text-sm text-left hover:bg-surface-primary transition-colors"
          aria-label={`View inspection for ${site?.name ?? 'Site'} — ${structure?.name ?? structure?.identifier ?? inspection.structure_id ?? inspection.structureId}`}
        >
          <p className="text-text-primary font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-text-secondary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {site?.name ?? 'Site'} — {structure?.name ?? structure?.identifier ?? inspection.structure_id ?? inspection.structureId}
          </p>
          <p className="text-text-secondary text-xs ml-6">{inspection.status}</p>
        </button>
      )}
      {(inspection?.assignee_name || inspection?.assigned_to) && (
        <div className="bg-surface-primary border border-border rounded-lg p-3">
          <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-1">Assigned Contractor</p>
          <p className="text-sm text-text-primary font-medium">
            {inspection.assignee_name ? `${inspection.assignee_name}${inspection.assignee_email ? ` (${inspection.assignee_email})` : ''}` : inspection.assigned_to}
          </p>
        </div>
      )}
      <h2 className="text-lg font-bold text-text-primary">{isNew ? 'New Deficiency' : 'Edit Deficiency'}</h2>

      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          This inspection is {deficiencyInspection?.status?.toLowerCase()} — deficiencies are read-only.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setEquipmentType(''); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {category && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Equipment Type</label>
          <select value={equipmentType} onChange={e => { setEquipmentType(e.target.value); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select equipment type...</option>
            {pinnedEquipmentTypes.length > 0 && <optgroup label="Suggested for this asset type">
              {pinnedEquipmentTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>}
            {unpinnedEquipmentTypes.length > 0 && <optgroup label="Other equipment types">
              {unpinnedEquipmentTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </optgroup>}
            {pinnedEquipmentTypes.length === 0 && unpinnedEquipmentTypes.length === 0 && equipmentTypeLabels.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {equipmentType && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Component</label>
          <select value={component} onChange={e => { setComponent(e.target.value); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select component...</option>
            {components.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {component && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Sub-Component</label>
          <select value={subComponent} onChange={e => { setSubComponent(e.target.value); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select sub-component...</option>
            {subComponents.map(sc => <option key={sc} value={sc}>{sc}</option>)}
          </select>
        </div>
      )}

      {subComponent && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Focus Area</label>
          <select value={focusArea} onChange={e => { setFocusArea(e.target.value); setDeficiencyCategory(''); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select focus area...</option>
            {focusAreas.map(fa => <option key={fa} value={fa}>{fa}</option>)}
          </select>
        </div>
      )}

      {focusArea && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Deficiency Category</label>
          <select value={deficiencyCategory} onChange={e => { setDeficiencyCategory(e.target.value); setDetailedDescription(''); }} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select deficiency category...</option>
            {deficiencyCategories.map(dc => <option key={dc} value={dc}>{dc}</option>)}
          </select>
        </div>
      )}

      {deficiencyCategory && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Detailed Description</label>
          <select value={detailedDescription} onChange={e => setDetailedDescription(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60">
            <option value="">Select detailed description...</option>
            {detailedDescriptions.map(dd => <option key={dd} value={dd}>{dd}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Inspector Notes</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60" placeholder="Additional observations, measurements, or context..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Indication Details</p>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Potential Failure Mechanism</label>
          <input value={mechanisms} onChange={e => setMechanisms(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60" placeholder="e.g., Atmospheric corrosion, fatigue loading..." />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Vibration Present</label>
            <select value={vibrationPresent === undefined ? '' : vibrationPresent ? 'yes' : 'no'} onChange={e => setVibrationPresent(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">NDT Required</label>
            <select value={ndtRequired === undefined ? '' : ndtRequired ? 'yes' : 'no'} onChange={e => setNdtRequired(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Further Investigation</label>
            <select value={furtherInvestigationRequired === undefined ? '' : furtherInvestigationRequired ? 'yes' : 'no'} onChange={e => setFurtherInvestigationRequired(e.target.value === '' ? undefined : e.target.value === 'yes')} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              <option value="">—</option>
              <option value="yes">Required</option>
              <option value="no">Not Required</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Recommended Action</label>
        <textarea value={recommendedAction} onChange={e => setRecommendedAction(e.target.value)} rows={2} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" placeholder="Describe the recommended repair or action..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Risk Assessment</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Consequence (1-5)</label>
<select value={consequenceSeverity} onChange={e => setConsequenceSeverity(Number(e.target.value))} disabled={isReadOnly} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm disabled:opacity-60">
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {['','Minimal','Moderate','Major','Severe','Catastrophic'][v]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Likelihood</label>
            <select value={likelihood} onChange={e => setLikelihood(e.target.value)} disabled={isReadOnly} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm disabled:opacity-60">
              {['A','B','C','D','E'].map((v, i) => <option key={v} value={v}>{v} — {['','Rare','Unlikely','Possible','Likely','Almost Certain'][i + 1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Priority</label>
            <select value={priorityRating} onChange={e => setPriorityRating(e.target.value)} disabled={isReadOnly} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm disabled:opacity-60">
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
        <input value={locationDesc} onChange={e => setLocationDesc(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60" placeholder="e.g., Floor 12, column grid C-4" />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Component Note</label>
        <input value={componentNote} onChange={e => setComponentNote(e.target.value)} disabled={isReadOnly} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary disabled:opacity-60" placeholder="Optional note about this component..." />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wide">Photos</p>
        {localId && localId !== 'new' && !isReadOnly && (
          <button
            onClick={() => navigate(`/m/deficiencies/${localId}/photos`)}
            className="w-full px-4 py-2 border border-signal text-signal rounded-lg text-sm"
          >
            Manage Photos
          </button>
        )}
        {isNew && (
          <p className="text-xs text-text-secondary">Save the deficiency first, then add photos.</p>
        )}
        {isReadOnly && (
          <p className="text-xs text-text-secondary">Photos cannot be added in read-only mode.</p>
        )}
      </div>

      {!isReadOnly && (
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saving || !category}
        className="w-full px-4 py-2 bg-signal text-white rounded-lg disabled:opacity-50"
        aria-label="Save deficiency"
      >
        {saving ? 'Saving...' : 'Save Deficiency'}
      </button>
      )}

      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded text-sm text-center">{error}</div>
      )}
    </div>
  );
}