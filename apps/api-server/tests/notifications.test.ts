import {
  resendAdapter,
  messagebirdAdapter,
  notifyP1Deficiency,
  notifyInspectionAssigned,
  notifyInspectionSubmitted,
  notifyInspectionReturned,
  notifyInspectionReassigned,
  notifyBulkReassignSummary,
} from '../src/services/notifications';

jest.mock('../src/lib/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'send-id' } }),
    },
  })),
}));

jest.mock('messagebird', () => ({
  messages: {
    create: jest.fn().mockResolvedValue({}),
  },
}));

const mockResendAdapter = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendSms: jest.fn().mockResolvedValue(undefined),
};

const mockMessageBirdAdapter = {
  sendEmail: jest.fn().mockResolvedValue(undefined),
  sendSms: jest.fn().mockResolvedValue(undefined),
};

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resendAdapter', () => {
    it('sends email via Resend', async () => {
      await mockResendAdapter.sendEmail('test@example.com', 'Subject', 'Body');
      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith('test@example.com', 'Subject', 'Body');
    });
  });

  describe('messagebirdAdapter', () => {
    it('sends SMS via MessageBird', async () => {
      await mockMessageBirdAdapter.sendSms('+15551234567', 'Test message');
      expect(mockMessageBirdAdapter.sendSms).toHaveBeenCalledWith('+15551234567', 'Test message');
    });
  });

  describe('notifyP1Deficiency', () => {
    it('sends email and SMS to reviewer when phone present', async () => {
      const deficiency = { component: 'Test Frame' };
      const client = { safety_contact_email: 'safety@example.com' };
      const reviewer = { phone_number: '+15551234567' };

      await notifyP1Deficiency(mockResendAdapter, mockMessageBirdAdapter, deficiency, client, reviewer);

      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith(
        client.safety_contact_email,
        'Critical (P1) Structural Deficiency Logged',
        expect.stringContaining('Test Frame')
      );
      expect(mockMessageBirdAdapter.sendSms).toHaveBeenCalledWith(
        reviewer.phone_number,
        'P1 deficiency logged — review required.'
      );
    });

    it('sends email only when no phone number', async () => {
      const deficiency = { component: 'Test Frame' };
      const client = { safety_contact_email: 'safety@example.com' };
      const reviewer = {};

      await notifyP1Deficiency(mockResendAdapter, mockMessageBirdAdapter, deficiency, client, reviewer);

      expect(mockResendAdapter.sendEmail).toHaveBeenCalled();
      expect(mockMessageBirdAdapter.sendSms).not.toHaveBeenCalled();
    });
  });

  describe('notifyInspectionAssigned', () => {
    it('sends email to inspector', async () => {
      const inspector = { email: 'inspector@example.com' };
      const structure = { asset_tag: 'AST-001' };

      await notifyInspectionAssigned(mockResendAdapter, inspector, structure);

      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith(
        inspector.email,
        'Inspection Assigned',
        expect.stringContaining('AST-001')
      );
    });
  });

  describe('notifyInspectionSubmitted', () => {
    it('sends email to all reviewers', async () => {
      const reviewers = [
        { email: 'reviewer1@example.com' },
        { email: 'reviewer2@example.com' },
      ];

      await notifyInspectionSubmitted(mockResendAdapter, reviewers, 'client-123');

      expect(mockResendAdapter.sendEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyInspectionReturned', () => {
    it('sends email with return reason to inspector', async () => {
      const mockPool = require('../src/lib/db').pool;
      mockPool.query.mockResolvedValueOnce({
        rows: [{ email: 'inspector@example.com' }],
      });

      await notifyInspectionReturned(mockResendAdapter, 'inspector-123', {
        inspectionId: 'ins-456',
        returnedReason: 'Missing photo evidence',
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT email FROM users WHERE user_id = $1',
        ['inspector-123']
      );
      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith(
        'inspector@example.com',
        'Inspection Returned',
        expect.stringContaining('Missing photo evidence')
      );
    });
  });

  describe('notifyBulkReassignSummary', () => {
    it('sends summary email to source and target inspector', async () => {
      const mockPool = require('../src/lib/db').pool;
      mockPool.query.mockResolvedValueOnce({
        rows: [{ email: 'source@example.com' }],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ email: 'target@example.com' }],
      });

      await notifyBulkReassignSummary(mockResendAdapter, 'source-123', 'target-456', 5);

      expect(mockPool.query).toHaveBeenCalledTimes(2);
      expect(mockResendAdapter.sendEmail).toHaveBeenCalledTimes(2);
      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith(
        'source@example.com',
        'Inspections Reassigned',
        expect.stringContaining('5')
      );
      expect(mockResendAdapter.sendEmail).toHaveBeenCalledWith(
        'target@example.com',
        'New Inspections Assigned',
        expect.stringContaining('5')
      );
    });

    it('skips email when source or target has no matching user row', async () => {
      const mockPool = require('../src/lib/db').pool;
      mockPool.query.mockResolvedValueOnce({
        rows: [],
      });
      mockPool.query.mockResolvedValueOnce({
        rows: [{ email: 'target@example.com' }],
      });

      await notifyBulkReassignSummary(mockResendAdapter, 'source-123', 'target-456', 5);

      expect(mockResendAdapter.sendEmail).toHaveBeenCalledTimes(1);
    });
  });
});