import { approveInspection, returnInspection, rescheduleInspection, reassignInspection, submitInspection, createInspection, updateInspectionMode } from '../src/services/inspections';
import { getReassignmentHistory } from '../src/services/inspections-admin';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('../src/services/notifications', () => ({
  notifyInspectionReturned: jest.fn().mockResolvedValue(undefined),
  notifyInspectionSubmitted: jest.fn().mockResolvedValue(undefined),
  notifyInspectionAssigned: jest.fn().mockResolvedValue(undefined),
  notifyInspectionReassigned: jest.fn().mockResolvedValue(undefined),
  resendAdapter: { sendEmail: jest.fn(), sendSms: jest.fn() },
}));

const mockPool = require('../src/lib/db').pool;

describe('inspections service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('approveInspection', () => {
    it('throws INSPECTION_NOT_FOUND for non-existent inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config  
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT with no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(approveInspection('non-existent-id', 'user-id', 'client-id')).rejects.toThrow(
        'INSPECTION_NOT_FOUND'
      );
    });

    it('throws MISSING_REMEDIATION_EVIDENCE when P1 deficiency lacks remediation photo', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Submitted', inspector_id: 'inspector-123' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ deficiency_id: 'def-1', photo_id: null }] }), // P1 deficiency without photo
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(approveInspection('test-id', 'user-id', 'client-id')).rejects.toThrow(
        'MISSING_REMEDIATION_EVIDENCE'
      );
    });

    it('approves an inspection with Submitted status', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Submitted', inspector_id: 'inspector-123' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [] }) // P1 check - no P1 deficiencies
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'Approved', approved_at: '2026-06-22T10:00:00Z' }] })
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await approveInspection('test-id', 'user-id', 'client-id');
      expect(result.status).toBe('Approved');
    });
  });

  describe('returnInspection', () => {
    it('throws INSPECTION_NOT_FOUND for non-existent inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(returnInspection('test-id', 'reason', 'user-id', 'client-id')).rejects.toThrow(
        'INSPECTION_NOT_FOUND'
      );
    });

    it('throws INSPECTION_APPROVED_USE_REOPEN for approved inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Approved', inspector_id: 'inspector-123' }], rowCount: 1 }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(returnInspection('test-id', 'reason', 'user-id', 'client-id')).rejects.toThrow(
        'INSPECTION_APPROVED_USE_REOPEN'
      );
    });

    it('returns inspection and fires notification on success', async () => {
      const { notifyInspectionReturned } = require('../src/services/notifications');
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Submitted', inspector_id: 'inspector-123' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'Returned' }] }) // UPDATE
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await returnInspection('test-id', 'Needs rework', 'user-id', 'client-id');

      expect(result.status).toBe('Returned');
      expect(result.inspection_id).toBe('test-id');
      expect(notifyInspectionReturned).toHaveBeenCalledWith(
        expect.any(Object),
        'inspector-123',
        { inspectionId: 'test-id', returnedReason: 'Needs rework' }
      );
    });
  });

  describe('rescheduleInspection', () => {
    it('updates scheduled_date and audits', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Assigned', inspector_id: 'inspector-123' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', scheduled_date: '2026-06-30' }] })
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await rescheduleInspection('test-id', '2026-06-30', 'user-id', 'client-id');
      expect(result.inspection_id).toBe('test-id');
    });

    it('throws INSPECTION_APPROVED_USE_REOPEN for approved inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Approved', inspector_id: 'inspector-123' }], rowCount: 1 }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(rescheduleInspection('test-id', '2026-06-30', 'user-id', 'client-id')).rejects.toThrow(
        'INSPECTION_APPROVED_USE_REOPEN'
      );
    });
  });

  describe('reassignInspection', () => {
    test('updates inspector_id and audits', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Assigned', inspector_id: 'old-inspector' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // user check
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', inspector_id: 'new-inspector' }] })
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}) // COMMIT
          .mockResolvedValueOnce({ rows: [] }) // inspection details - no rows
          .mockResolvedValueOnce({ rows: [] }), // inspector email - no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await reassignInspection('test-id', 'new-inspector', 'Transfer reason', 'user-id', 'client-id');

      expect(result.inspection_id).toBe('test-id');
    });

    test('throws TARGET_INSPECTOR_INVALID for inactive user', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Assigned', inspector_id: 'old-inspector' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // user check
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(reassignInspection('test-id', 'bad-inspector', 'Reason', 'user-id', 'client-id')).rejects.toThrow(
        'TARGET_INSPECTOR_INVALID'
      );
    });

    test('throws SOURCE_EQUALS_TARGET when inspector is the same', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Assigned', inspector_id: 'old-inspector' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }), // user check
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(reassignInspection('test-id', 'old-inspector', 'Reason', 'user-id', 'client-id')).rejects.toThrow(
        'SOURCE_EQUALS_TARGET'
      );
    });

    test('fires notifyInspectionReassigned on success', async () => {
      const { notifyInspectionReassigned } = require('../src/services/notifications');
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'Assigned', inspector_id: 'old-inspector' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{}], rowCount: 1 }) // user check for new inspector
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', inspector_id: 'new-inspector' }] }) // UPDATE
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}) // COMMIT
          .mockResolvedValueOnce({ rows: [{ structure_id: 'struct-1', scheduled_date: '2026-06-30' }] }) // inspection details
          .mockResolvedValueOnce({ rows: [{ email: 'old@example.com' }] }), // old inspector email
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await reassignInspection('test-id', 'new-inspector', 'Transfer reason', 'user-id', 'client-id');

      expect(result.inspection_id).toBe('test-id');
      expect(notifyInspectionReassigned).toHaveBeenCalledWith(
        expect.anything(),
        'old-inspector',
        expect.objectContaining({
          structureId: 'struct-1',
          scheduledDate: '2026-06-30',
          reason: 'Transfer reason',
        })
      );
    });
  });

  describe('submitInspection', () => {
    test('throws INSPECTION_NOT_FOUND for non-existent inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(submitInspection('non-existent', 'inspector-id', 'client-id', false)).rejects.toThrow(
        'INSPECTION_NOT_FOUND'
      );
    });

    test('throws NOT_ASSIGNED when caller is not the assigned inspector', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'In Progress', inspector_id: 'other-inspector' }], rowCount: 1 }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(submitInspection('test-id', 'caller-id', 'client-id', false)).rejects.toThrow('NOT_ASSIGNED');
    });

    test('throws NO_DEFICIENCIES_OR_FLAG when no deficiencies and flag is false', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'In Progress', inspector_id: 'inspector-id' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // deficiency check
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(submitInspection('test-id', 'inspector-id', 'client-id', false)).rejects.toThrow(
        'NO_DEFICIENCIES_OR_FLAG'
      );
    });

    test('throws MISSING_PHOTO_CRITICAL when P1/P2 deficiency has no photos', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'In Progress', inspector_id: 'inspector-id' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }) // deficiency exists
          .mockResolvedValueOnce({ rows: [{ deficiency_id: 'def-001' }], rowCount: 1 }), // photo check — P1/P2 with no photo
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(submitInspection('test-id', 'inspector-id', 'client-id', false)).rejects.toThrow(
        'MISSING_PHOTO_CRITICAL'
      );
    });

    test('submits inspection with no_deficiencies_found=true', async () => {
      const { notifyInspectionSubmitted } = require('../src/services/notifications');
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'In Progress', inspector_id: 'inspector-id' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'Submitted', submitted_at: '2026-06-24T05:00:00Z' }] }) // UPDATE
          .mockResolvedValueOnce({ rows: [{ reviewer_email: 'r@example.com' }, { reviewer_email: 'r2@example.com' }] }) // reviewers
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await submitInspection('test-id', 'inspector-id', 'client-id', true);

      expect(result.status).toBe('Submitted');
      expect(result.submitted_at).toBe('2026-06-24T05:00:00Z');
      expect(notifyInspectionSubmitted).toHaveBeenCalled();
    });

    test('submits inspection with deficiencies that have photos', async () => {
      const { notifyInspectionSubmitted } = require('../src/services/notifications');
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ status: 'In Progress', inspector_id: 'inspector-id' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }) // deficiency exists
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // photo check — no P1/P2 without photos
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'Submitted', submitted_at: '2026-06-24T05:00:00Z' }] }) // UPDATE
          .mockResolvedValueOnce({ rows: [{ reviewer_email: 'r@example.com' }] }) // reviewers
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await submitInspection('test-id', 'inspector-id', 'client-id', false);

      expect(result.status).toBe('Submitted');
      expect(notifyInspectionSubmitted).toHaveBeenCalled();
    });
  });

  describe('createInspection', () => {
    test('creates inspection with assigned notification', async () => {
      const { notifyInspectionAssigned } = require('../src/services/notifications');
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'new-id', status: 'Assigned' }] }) // INSERT
          .mockResolvedValueOnce({}) // audit
          .mockResolvedValueOnce({}) // COMMIT
          .mockResolvedValueOnce({ rows: [{ email: 'inspector@example.com' }] }), // inspector email
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await createInspection('struct-1', 'inspector-1', 'user-1', 'client-1');

      expect(result.status).toBe('Assigned');
      expect(notifyInspectionAssigned).toHaveBeenCalled();
    });

    it('throws DUPLICATE_INSPECTION when a duplicate active inspection exists', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockRejectedValueOnce(new Error('duplicate key value violates unique constraint "idx_inspections_active_duplicate_guard"')), // INSERT fails
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(
        createInspection('struct-1', 'inspector-1', 'user-1', 'client-1')
      ).rejects.toThrow('DUPLICATE_INSPECTION');
    });
  });

  describe('updateInspectionMode', () => {
    it('throws INSPECTION_NOT_FOUND for non-existent inspection', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }), // SELECT no rows
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updateInspectionMode('non-existent', 'post_inspection', 'client-id')).rejects.toThrow(
        'INSPECTION_NOT_FOUND'
      );
    });

    it('throws MODE_LOCKED_DEFICIENCIES_EXIST when deficiencies exist', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'In Progress' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ count: '1' }] }), // deficiency count
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(updateInspectionMode('test-id', 'post_inspection', 'client-id')).rejects.toThrow(
        'MODE_LOCKED_DEFICIENCIES_EXIST'
      );
    });

    it('updates inspection_mode successfully when no deficiencies exist', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({}) // set_config
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', status: 'Assigned' }], rowCount: 1 })
          .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // no deficiencies
          .mockResolvedValueOnce({ rows: [{ inspection_id: 'test-id', inspection_mode: 'post_inspection' }] }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await updateInspectionMode('test-id', 'post_inspection', 'client-id');
      expect(result.inspection_mode).toBe('post_inspection');
    });
  });

  describe('getReassignmentHistory', () => {
    it('returns empty array when no reassignments exist', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config client_id
          .mockResolvedValueOnce({}) // set_config bypass
          .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // no reassignments
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await getReassignmentHistory('insp-1', 'client-1');
      expect(result).toEqual([]);
    });

    it('returns reassignment history with resolved user names', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // set_config client_id
          .mockResolvedValueOnce({}) // set_config bypass
          .mockResolvedValueOnce({
            rows: [
              {
                log_id: 1,
                timestamp: '2026-07-22T10:00:00Z',
                old_values: { inspector_id: 'user-old' },
                new_values: { inspector_id: 'user-new', reason: 'Schedule conflict' },
                performed_by: 'user-admin',
              },
            ],
            rowCount: 1,
          }) // SELECT system_audit_logs
          .mockResolvedValueOnce({
            rows: [
              { user_id: 'user-old', display_name: 'Old Inspector' },
              { user_id: 'user-new', display_name: 'New Inspector' },
              { user_id: 'user-admin', display_name: 'Admin User' },
            ],
            rowCount: 3,
          }) // SELECT users
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      const result = await getReassignmentHistory('insp-1', 'client-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        log_id: 1,
        timestamp: '2026-07-22T10:00:00Z',
        old_inspector_id: 'user-old',
        old_inspector_name: 'Old Inspector',
        new_inspector_id: 'user-new',
        new_inspector_name: 'New Inspector',
        reason: 'Schedule conflict',
        performed_by: 'user-admin',
        performed_by_name: 'Admin User',
      });
    });

    it('rolls back and rethrows on error', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce(new Error('db error')),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient);

      await expect(getReassignmentHistory('insp-1', 'client-1')).rejects.toThrow('db error');
    });
  });
});
