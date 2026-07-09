import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { ENDPOINTS } from '../../services/api/endpoints';
import { getDeficiencyById } from '../../services/api/inspections';
import { calculateGlencoreRisk } from '../../utils/riskCalculator';
import { db } from '../../lib/db';
import Skeleton from '../../components/Skeleton';

const LIKELIHOOD_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const;
const PRIORITY_OPTIONS = ['P1', 'P2', 'P3', 'P4', 'P5'] as const;

export default function DeficiencyDetailPage() {
  const { localId } = useParams<{ localId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const inspectionId = searchParams.get('inspection_id') ?? '';
  const isNew = localId === 'new';
  const [error, setError] = useState('');

  const { data: inspection } = useQuery({
    queryKey: ['inspections', inspectionId],
    queryFn: () => apiClient<{ site_id?: string; siteId?: string; structure_id?: string; structureId?: string; status: string }>(ENDPOINTS.inspections.byId(inspectionId)),
    enabled: !!inspectionId,
  });

  const { data: site } = useQuery({
    queryKey: ['sites', inspection?.site_id ?? inspection?.siteId],
    queryFn: () => apiClient<{ id: string; name: string }>(ENDPOINTS.sites.byId(inspection!.site_id ?? inspection!.siteId!)),
    enabled: !!inspection?.site_id || !!inspection?.siteId,
  });

  const { data: structure } = useQuery({
    queryKey: ['structures', inspection?.structure_id ?? inspection?.structureId],
    queryFn: () => apiClient<{ id: string; name: string; identifier: string }>(ENDPOINTS.structures.byId(inspection!.structure_id ?? inspection!.structureId!)),
    enabled: !!inspection?.structure_id || !!inspection?.structureId,
  });

  const { data: existingDeficiency, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['deficiencies', localId],
    queryFn: async () => {
      const offline = await db.offlineDeficiencies.get(localId!);
      if (offline) return offline;
      return getDeficiencyById(localId!);
    },
    enabled: !!localId && localId !== 'new',
  });

  useEffect(() => {
    if (!existingDeficiency) return;
    const d = existingDeficiency as Record<string, unknown>;
    setCategory((d.category as string) || firstCategory);
    setComponent((d.subComponent as string) || (d.sub_component as string) || '');
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

  const { data: taxonomyNodes = [] } = useQuery({
    queryKey: ['taxonomy', 'offline'],
    queryFn: async () => {
      const nodes = await db.offlineTaxonomy.toArray();
      if (nodes.length > 0) return nodes;
      const online = await apiClient<Array<{ node_id: string; parent_id: string | null; level: string; label: string }>>(ENDPOINTS.taxonomy.list);
      await db.offlineTaxonomy.bulkPut(
        online.map(n => ({
          nodeId: n.node_id,
          parentId: n.parent_id,
          level: n.level,
          category: '',
          label: n.label,
          displayOrder: 0,
          isActive: true,
        }))
      );
      return db.offlineTaxonomy.toArray();
    },
  });

  const categories = taxonomyNodes.filter(n => n.level === 'category').map(n => n.label);
  const getChildren = (parentId: string | null) => taxonomyNodes.filter(n => n.parentId === parentId);

  const firstCategory = categories.length > 0 ? categories[0] : '';

  const [category, setCategory] = useState(firstCategory);
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
  const components = categoryNode ? getChildren(categoryNode.nodeId).map(n => n.label) : [];
  const componentNode = taxonomyNodes.find(n => n.label === component && n.parentId === categoryNode?.nodeId);
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data: Record<string, unknown> = {
        description: description || detailedDescription,
        category,
        sub_component: component,
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
      if (isNew && inspectionId) {
        const created = await apiClient<{ deficiency_id: string }>(ENDPOINTS.deficiencies.create(inspectionId), { method: 'POST', body: JSON.stringify(data) });
        return created;
      } else if (localId) {
        await apiClient(ENDPOINTS.deficiencies.update(localId), { method: 'PATCH', body: JSON.stringify(data) });
        return { deficiency_id: localId } as { deficiency_id: string };
      }
      return { deficiency_id: '' } as { deficiency_id: string };
    },
    onSuccess: (result) => {
      if (result?.deficiency_id) {
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
      {inspection && (
        <div className="bg-surface-secondary rounded-lg p-3 border border-border text-sm">
          <p className="text-text-primary font-medium">
            {site?.name ?? 'Site'} — {structure?.name ?? structure?.identifier ?? inspection.structure_id ?? inspection.structureId}
          </p>
          <p className="text-text-secondary text-xs">{inspection.status}</p>
        </div>
      )}
      <h2 className="text-lg font-bold text-text-primary">{isNew ? 'New Deficiency' : 'Edit Deficiency'}</h2>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
        <select value={category} onChange={e => { setCategory(e.target.value); setComponent(''); setSubComponent(''); setFocusArea(''); setDeficiencyCategory(''); setDetailedDescription(''); }} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {category && (
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
        <p className="text-sm font-semibold text-text-primary mb-3">Risk Assessment</p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Consequence (1-5)</label>
            <select value={consequenceSeverity} onChange={e => setConsequenceSeverity(Number(e.target.value))} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {[1,2,3,4,5].map(v => <option key={v} value={v}>{v} — {['Negligible','Minor','Moderate','Major','Catastrophic'][v-1]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-primary mb-1">Likelihood</label>
            <select value={likelihood} onChange={e => setLikelihood(e.target.value)} className="w-full px-2 py-2 bg-surface-primary border border-border rounded-lg text-text-primary text-sm">
              {LIKELIHOOD_OPTIONS.map(v => <option key={v} value={v}>{v} — {['Rare','Unlikely','Possible','Likely','Almost Certain']['ABCDE'.indexOf(v)]}</option>)}
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
        <label className="block text-sm font-medium text-text-primary mb-1">Component Notes</label>
        <input value={componentNote} onChange={e => setComponentNote(e.target.value)} className="w-full px-3 py-2 bg-surface-primary border border-border rounded-lg text-text-primary" />
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary mb-3">Photos</p>
        {localId && localId !== 'new' && (
          <button
            onClick={() => navigate(`/m/deficiencies/${localId}/photos`)}
            className="w-full px-4 py-2 border border-accent text-accent rounded-lg text-sm"
          >
            Manage Photos
          </button>
        )}
        {isNew && (
          <p className="text-xs text-text-secondary">Save the deficiency first, then add photos.</p>
        )}
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saving || !category}
        className="w-full px-4 py-2 bg-accent text-white rounded-lg disabled:opacity-50"
        aria-label="Save deficiency"
      >
        {saving ? 'Saving...' : 'Save Deficiency'}
      </button>

      {error && (
        <div className="bg-red-100 text-red-800 p-2 rounded text-sm text-center">{error}</div>
      )}
    </div>
  );
}