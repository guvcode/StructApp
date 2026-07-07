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

export class StructAppLocalDB extends Dexie {
  authState!: Table<AuthState, 'current'>;
  deficiencies!: Table<DeficiencyRecord, number>;
  pinOutbox!: Table<PinOutboxRecord, number>;

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
  }
}

export const db = new StructAppLocalDB();