import Dexie, { type Table } from 'dexie';

export type AuthState = {
  id: 'current';
  accessToken: string;
  refreshToken: string;
  clientId: string;
  userId: string;
  role: 'Admin' | 'Reviewer' | 'Contractor';
  pinHash?: string;
  userData?: string;
};

export type DeficiencyRecord = {
  localId?: number;
  deficiencyId?: string;
  inspectionId: string;
  structureId: string;
  clientId: string;
  previousDeficiencyId?: string;
  componentTypeId?: string;
  componentNotes?: string;
  description: string;
  severity?: number;
  probability?: number;
  consequences?: number;
  calculatedPriority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  triageState: 'New' | 'Resolved' | 'Still Outstanding' | 'Worsened';
  gpsLatitude?: number;
  gpsLongitude?: number;
  category?: string;
  subComponent?: string;
  focusArea?: string;
  deficiencyCategory?: string;
  detailedDescription?: string;
  mechanisms?: string;
  vibrationPresent?: boolean;
  ndtRequired?: boolean;
  furtherInvestigationRequired?: boolean;
  recommendedAction?: string;
  consequenceSeverity?: number;
  likelihood?: string;
  mostAffectedConsequence?: string;
  priorityRating?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  createdAt: Date;
  updatedAt: Date;
  syncState: 'Draft' | 'Pending_Sync' | 'Synced';
};

export type PinOutboxRecord = {
  localId?: number;
  structureId: string;
  pinMode: boolean;
  createdAt: Date;
  data: unknown;
};

export type OfflineInspection = {
  id: string;
  structureId: string | null;
  siteId: string;
  clientId: string;
  inspectorId: string;
  assignedBy: string;
  status: string;
  scheduledDate: string | null;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
  returnedReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
};

export type OfflineDeficiency = {
  deficiencyId: string;
  inspectionId: string;
  clientId: string;
  description: string;
  calculatedPriority: string;
  category: string | null;
  subComponent: string | null;
  focusArea: string | null;
  deficiencyCategory: string | null;
  detailedDescription: string | null;
  mechanisms: string | null;
  recommendedAction: string | null;
  consequenceSeverity: number | null;
  likelihood: string | null;
  riskRank: number | null;
  riskRating: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfflineTaxonomy = {
  nodeId: string;
  parentId: string | null;
  level: string;
  category: string;
  label: string;
  displayOrder: number;
  isActive: boolean;
};

export type OfflineClient = {
  client_id: string;
  name: string;
};

export class StructAppLocalDB extends Dexie {
  authState!: Table<AuthState, 'current'>;
  deficiencies!: Table<DeficiencyRecord, number>;
  pinOutbox!: Table<PinOutboxRecord, number>;
  offlineInspections!: Table<OfflineInspection, string>;
  offlineDeficiencies!: Table<OfflineDeficiency, string>;
  offlineTaxonomy!: Table<OfflineTaxonomy, string>;
  offlineClients!: Table<OfflineClient, string>;

  constructor() {
    super('StructAppLocalDB');
    this.version(1).stores({
      authState: 'id, accessToken, refreshToken, clientId, userId, role',
      deficiencies: '++localId, inspectionId, syncState',
      pinOutbox: '++localId, structureId, pinMode, createdAt',
    });
    this.version(2).stores({
      authState: 'id, accessToken, refreshToken, clientId, userId, role',
      deficiencies: '++localId, inspectionId, syncState',
      pinOutbox: '++localId, structureId, pinMode, createdAt',
    }).upgrade(tx => {
    });
    this.version(3).stores({
      authState: 'id, accessToken, refreshToken, clientId, userId, role',
      deficiencies: '++localId, inspectionId, syncState',
      pinOutbox: '++localId, structureId, pinMode, createdAt',
      offlineInspections: 'id, clientId, inspectorId, status, createdAt',
      offlineDeficiencies: 'deficiencyId, inspectionId, clientId',
      offlineTaxonomy: 'nodeId, level, category',
    });
    this.version(4).stores({
      authState: 'id, accessToken, refreshToken, clientId, userId, role',
      deficiencies: '++localId, inspectionId, syncState',
      pinOutbox: '++localId, structureId, pinMode, createdAt',
      offlineInspections: 'id, clientId, inspectorId, status, createdAt',
      offlineDeficiencies: 'deficiencyId, inspectionId, clientId',
      offlineTaxonomy: 'nodeId, level, category',
      offlineClients: 'client_id',
    });
  }
}

export const db = new StructAppLocalDB();