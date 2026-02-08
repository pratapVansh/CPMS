/**
 * Bulk Message Modal
 * 
 * Modal component for creating and sending bulk email campaigns
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Send,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  Users,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/common';
import { apiPost } from '@/lib/api';

// ==================== TYPES ====================

interface MessageBlock {
  id: string; // Temporary client-side ID
  blockOrder: number;
  targetType: 'STATUS' | 'MANUAL_ALL' | 'MANUAL_SELECTED' | 'MANUAL_REMAINING';
  targetValue: string;
  subject: string;
  body: string;
  recipientCount?: number;
}

interface BulkMessageModalProps {
  driveId: string;
  companyName: string;
  totalApplicants: number;
  selectedStudentIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PreviewData {
  subject: string;
  body: string;
  recipient: string;
}

// ==================== COMPONENT ====================

export default function BulkMessageModal({
  driveId,
  companyName,
  totalApplicants,
  selectedStudentIds,
  isOpen,
  onClose,
  onSuccess,
}: BulkMessageModalProps) {
  const [campaignName, setCampaignName] = useState('');
  const [messageBlocks, setMessageBlocks] = useState<MessageBlock[]>([]);
  const [currentStep, setCurrentStep] = useState<'compose' | 'preview' | 'confirm'>('compose');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewBlockIndex, setPreviewBlockIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize with one empty message block
  useEffect(() => {
    if (isOpen && messageBlocks.length === 0) {
      addMessageBlock();
    }
  }, [isOpen]);

  // Generate unique client-side ID
  const generateId = () => `block_${Date.now()}_${Math.random()}`;

  // Add new message block
  const addMessageBlock = () => {
    const newBlock: MessageBlock = {
      id: generateId(),
      blockOrder: messageBlocks.length + 1,
      targetType: 'STATUS',
      targetValue: 'APPLIED',
      subject: '',
      body: '',
    };
    setMessageBlocks([...messageBlocks, newBlock]);
  };

  // Remove message block
  const removeMessageBlock = (id: string) => {
    const filtered = messageBlocks.filter((block) => block.id !== id);
    // Reorder remaining blocks
    const reordered = filtered.map((block, index) => ({
      ...block,
      blockOrder: index + 1,
    }));
    setMessageBlocks(reordered);
  };

  // Update message block
  const updateMessageBlock = (id: string, updates: Partial<MessageBlock>) => {
    setMessageBlocks(
      messageBlocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      )
    );
  };

  // Resolve target value based on type
  const getTargetValue = (block: MessageBlock): string => {
    switch (block.targetType) {
      case 'STATUS':
        return block.targetValue || 'APPLIED';
      case 'MANUAL_SELECTED':
        return JSON.stringify(selectedStudentIds);
      case 'MANUAL_REMAINING':
        return JSON.stringify(selectedStudentIds);
      case 'MANUAL_ALL':
        return '';
      default:
        return '';
    }
  };

  // Resolve recipients count
  const resolveRecipientCount = async (block: MessageBlock) => {
    try {
      const targetValue = getTargetValue(block);
      const response = await apiPost<{ count: number }>(
        `/admin/drives/${driveId}/resolve-recipients`,
        {
          targetType: block.targetType,
          targetValue,
        }
      );
      if (response.success && response.data) {
        updateMessageBlock(block.id, { recipientCount: response.data.count });
      }
    } catch (error) {
      console.error('Error resolving recipient count:', error);
    }
  };

  // Preview email
  const handlePreview = async (blockIndex: number) => {
    setIsLoading(true);
    setError(null);
    setPreviewBlockIndex(blockIndex);

    try {
      const block = messageBlocks[blockIndex];
      const response = await apiPost<{ preview: PreviewData }>(
        `/admin/drives/${driveId}/preview-email`,
        {
          subject: block.subject,
          body: block.body,
        }
      );

      if (response.success && response.data) {
        setPreviewData(response.data.preview);
        setCurrentStep('preview');
      } else {
        setError('Failed to generate preview');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to preview email');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate campaign
  const validateCampaign = (): boolean => {
    if (!campaignName.trim()) {
      setError('Campaign name is required');
      return false;
    }

    if (messageBlocks.length === 0) {
      setError('At least one message block is required');
      return false;
    }

    for (const block of messageBlocks) {
      if (!block.subject.trim()) {
        setError(`Message ${block.blockOrder}: Subject is required`);
        return false;
      }
      if (!block.body.trim()) {
        setError(`Message ${block.blockOrder}: Body is required`);
        return false;
      }
    }

    return true;
  };

  // Create and send campaign
  const handleSend = async () => {
    if (!validateCampaign()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create campaign
      const createResponse = await apiPost<{ campaignId: string }>(
        `/admin/drives/${driveId}/campaigns`,
        {
          name: campaignName,
          messageBlocks: messageBlocks.map((block) => ({
            blockOrder: block.blockOrder,
            targetType: block.targetType,
            targetValue: getTargetValue(block),
            subject: block.subject,
            body: block.body,
          })),
        }
      );

      if (!createResponse.success || !createResponse.data) {
        throw new Error('Failed to create campaign');
      }

      const { campaignId } = createResponse.data;

      // Send campaign
      const sendResponse = await apiPost(
        `/admin/campaigns/${campaignId}/send`,
        { confirmSend: true }
      );

      if (!sendResponse.success) {
        throw new Error('Failed to send campaign');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Failed to send campaign');
    } finally {
      setIsLoading(false);
    }
  };

  // Close modal
  const handleClose = () => {
    setCampaignName('');
    setMessageBlocks([]);
    setCurrentStep('compose');
    setPreviewData(null);
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Calculate total recipients
  const totalRecipients = messageBlocks.reduce(
    (sum, block) => sum + (block.recipientCount || 0),
    0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-4xl">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Send Bulk Message
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
{companyName} • {totalApplicants} applicants
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-blue-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center gap-4 mt-4">
                <StepIndicator
                  number={1}
                  label="Compose"
                  isActive={currentStep === 'compose'}
                  isCompleted={currentStep !== 'compose'}
                />
                <div className="flex-1 h-px bg-blue-400" />
                <StepIndicator
                  number={2}
                  label="Preview"
                  isActive={currentStep === 'preview'}
                  isCompleted={currentStep === 'confirm'}
                />
                <div className="flex-1 h-px bg-blue-400" />
                <StepIndicator
                  number={3}
                  label="Confirm"
                  isActive={currentStep === 'confirm'}
                  isCompleted={false}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Display */}
              {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Success!</p>
                    <p className="text-sm text-green-700 mt-1">
                      Emails are being sent. This may take a few minutes.
                    </p>
                  </div>
                </div>
              )}

              {/* Step: Compose */}
              {currentStep === 'compose' && (
                <div className="space-y-6">
                  {/* Campaign Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g., Shortlist Notifications - Round 1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Message Blocks */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
<h3 className="text-lg font-semibold text-gray-900">Message Blocks</h3>
                      <button
                        onClick={addMessageBlock}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        <Plus className="w-4 h-4" />
                        Add Message
                      </button>
                    </div>

                    {messageBlocks.map((block, index) => (
                      <MessageBlockEditor
                        key={block.id}
                        block={block}
                        blockNumber={index + 1}
                        selectedCount={selectedStudentIds.length}
                        totalApplicants={totalApplicants}
                        onUpdate={(updates) => updateMessageBlock(block.id, updates)}
                        onRemove={() => removeMessageBlock(block.id)}
                        onPreview={() => handlePreview(index)}
                        onResolveCount={() => resolveRecipientCount(block)}
                        canRemove={messageBlocks.length > 1}
                      />
                    ))}
                  </div>

                  {/* Template Variables Help */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Available Template Variables
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <code className="text-blue-700">{'{{student_name}}'}</code>
                      <code className="text-blue-700">{'{{company_name}}'}</code>
                      <code className="text-blue-700">{'{{round_name}}'}</code>
                      <code className="text-blue-700">{'{{date}}'}</code>
                      <code className="text-blue-700">{'{{student_email}}'}</code>
                      <code className="text-blue-700">{'{{student_branch}}'}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Preview */}
              {currentStep === 'preview' && previewData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Email Preview - Message {previewBlockIndex + 1}
                    </h3>
                    <button
                      onClick={() => setCurrentStep('compose')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      ← Back to Edit
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Email Header */}
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500">To:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {previewData.recipient}
                      </p>
                    </div>

                    {/* Email Subject */}
                    <div className="bg-white px-4 py-3 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Subject:</p>
                      <p className="text-base font-semibold text-gray-900">
                        {previewData.subject}
                      </p>
                    </div>

                    {/* Email Body */}
                    <div
                      className="bg-white px-4 py-6"
                      dangerouslySetInnerHTML={{ __html: previewData.body }}
                    />
                  </div>

                  <button
                    onClick={() => setCurrentStep('confirm')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    Continue to Confirmation
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step: Confirm */}
              {currentStep === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center py-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                      <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Confirm Bulk Email Send
                    </h3>
                    <p className="text-gray-600">
                      You are about to send emails to multiple recipients. This action
                      cannot be undone.
                    </p>
                  </div>

                  {/* Campaign Summary */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Campaign Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Campaign Name:</span>
                        <span className="font-medium text-gray-900">{campaignName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Message Blocks:</span>
                        <span className="font-medium text-gray-900">
                          {messageBlocks.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Recipients:</span>
                        <span className="font-medium text-blue-600 text-lg">
                          {totalRecipients}
                        </span>
                      </div>
                    </div>

                    {/* Message Block Breakdown */}
                    <div className="mt-6 pt-6 border-t border-gray-300">
                      <h5 className="text-sm font-medium text-gray-700 mb-3">
                        Message Breakdown:
                      </h5>
                      {messageBlocks.map((block) => (
                        <div
                          key={block.id}
                          className="flex items-center justify-between py-2"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {block.blockOrder}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {block.subject}
                              </p>
                              <p className="text-xs text-gray-500">
                                {getTargetTypeLabel(block.targetType)}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {block.recipientCount || 0} recipients
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentStep('compose')}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      disabled={isLoading}
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Confirm & Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface StepIndicatorProps {
  number: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}

function StepIndicator({ number, label, isActive, isCompleted }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
          isActive
            ? 'bg-white text-blue-600'
            : isCompleted
            ? 'bg-blue-400 text-white'
            : 'bg-blue-500 text-blue-200'
        }`}
      >
        {isCompleted ? <CheckCircle className="w-5 h-5" /> : number}
      </div>
      <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-blue-100'}`}>
        {label}
      </span>
    </div>
  );
}

interface MessageBlockEditorProps {
  block: MessageBlock;
  blockNumber: number;
  selectedCount: number;
  totalApplicants: number;
  onUpdate: (updates: Partial<MessageBlock>) => void;
  onRemove: () => void;
  onPreview: () => void;
  onResolveCount: () => void;
  canRemove: boolean;
}

function MessageBlockEditor({
  block,
  blockNumber,
  selectedCount,
  totalApplicants,
  onUpdate,
  onRemove,
  onPreview,
  onResolveCount,
  canRemove,
}: MessageBlockEditorProps) {
  useEffect(() => {
    onResolveCount();
  }, [block.targetType, block.targetValue]);

  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded text-sm">
            {blockNumber}
          </span>
          Message Block {blockNumber}
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {canRemove && (
            <button
              onClick={onRemove}
              className="text-red-600 hover:text-red-700"
              title="Remove message block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Recipients <span className="text-red-500">*</span>
        </label>
        <select
          value={block.targetType}
          onChange={(e) =>
            onUpdate({ targetType: e.target.value as MessageBlock['targetType'] })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="STATUS">By Application Status</option>
          <option value="MANUAL_ALL">All Applicants ({totalApplicants})</option>
          {selectedCount > 0 && (
            <>
              <option value="MANUAL_SELECTED">
                Selected Applicants ({selectedCount})
              </option>
              <option value="MANUAL_REMAINING">
                Remaining Applicants ({totalApplicants - selectedCount})
              </option>
            </>
          )}
        </select>

        {/* Status Selection (if target type is STATUS) */}
        {block.targetType === 'STATUS' && (
          <select
            value={block.targetValue}
            onChange={(e) => onUpdate({ targetValue: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mt-2"
          >
            <option value="APPLIED">Applied</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="SELECTED">Selected</option>
            <option value="REJECTED">Rejected</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        )}

        {/* Recipient Count Display */}
        {block.recipientCount !== undefined && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            {block.recipientCount} recipient{block.recipientCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Subject <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={block.subject}
          onChange={(e) => onUpdate({ subject: e.target.value })}
          placeholder="e.g., Congratulations! You've been shortlisted for {{company_name}}"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Body <span className="text-red-500">*</span>
        </label>
        <textarea
          value={block.body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder={`Dear {{student_name}},\n\nWe are pleased to inform you...\n\nUse template variables like {{company_name}}, {{date}}, etc.`}
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm"
        />
      </div>
    </div>
  );
}

// Helper function for target type labels
function getTargetTypeLabel(targetType: string): string {
  const labels: Record<string, string> = {
    STATUS: 'By Status',
    MANUAL_ALL: 'All Applicants',
    MANUAL_SELECTED: 'Selected Applicants',
    MANUAL_REMAINING: 'Remaining Applicants',
  };
  return labels[targetType] || targetType;
}
