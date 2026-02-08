/**
 * Bulk Communication Controller
 * 
 * Handles HTTP requests for bulk messaging campaigns
 */

import { Request, Response } from 'express';
import * as bulkCommService from '../services/bulk-communication.service';

// Define TargetType enum locally if not available from @prisma/client
enum TargetType {
  STATUS = 'STATUS',
  MANUAL_ALL = 'MANUAL_ALL',
  MANUAL_SELECTED = 'MANUAL_SELECTED',
  MANUAL_REMAINING = 'MANUAL_REMAINING'
}

// ==================== CAMPAIGN MANAGEMENT ====================

/**
 * Create a new bulk message campaign
 * POST /admin/drives/:driveId/campaigns
 */
export async function createCampaign(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const { name, messageBlocks, scheduledAt } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Validate input
    if (!name || !messageBlocks || !Array.isArray(messageBlocks)) {
      return res.status(400).json({
        success: false,
        message: 'Campaign name and message blocks are required',
      });
    }

    if (messageBlocks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one message block is required',
      });
    }

    // Validate each message block
    for (const block of messageBlocks) {
      if (!block.targetType || !block.subject || !block.body) {
        return res.status(400).json({
          success: false,
          message: 'Each message block must have targetType, subject, and body',
        });
      }

      if (!Object.values(TargetType).includes(block.targetType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid target type: ${block.targetType}`,
        });
      }
    }

    const result = await bulkCommService.createCampaign({
      name,
      driveId,
      createdBy: userId,
      messageBlocks,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json({
      success: true,
      data: { campaignId: result.campaignId },
      message: result.message,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error creating campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create campaign',
    });
  }
}

/**
 * Get campaign details
 * GET /admin/campaigns/:campaignId
 */
export async function getCampaignDetails(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;

    const campaign = await bulkCommService.getCampaignDetails(campaignId);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    return res.status(200).json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error fetching campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch campaign',
    });
  }
}

/**
 * Get campaign statistics
 * GET /admin/campaigns/:campaignId/stats
 */
export async function getCampaignStats(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;

    const stats = await bulkCommService.getCampaignStats(campaignId);

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error fetching campaign stats:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch campaign stats',
    });
  }
}

/**
 * Get all campaigns for a drive
 * GET /admin/drives/:driveId/campaigns
 */
export async function getDriveCampaigns(req: Request, res: Response) {
  try {
    const { driveId } = req.params;

    const campaigns = await bulkCommService.getDriveCampaigns(driveId);

    return res.status(200).json({
      success: true,
      campaigns,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error fetching drive campaigns:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch campaigns',
    });
  }
}

// ==================== SENDING ====================

/**
 * Send a campaign immediately
 * POST /admin/campaigns/:campaignId/send
 */
export async function sendCampaign(req: Request, res: Response) {
  try {
    const { campaignId } = req.params;
    const { confirmSend } = req.body;

    // Safety check: require explicit confirmation
    if (!confirmSend) {
      return res.status(400).json({
        success: false,
        message: 'Campaign send must be explicitly confirmed. Set confirmSend: true',
      });
    }

    console.log(`[BULK-COMM-CTRL] Starting to send campaign ${campaignId}`);

    // Send campaign (this is a long-running operation)
    const result = await bulkCommService.sendCampaign(campaignId);

    if (!result.success) {
      return res.status(500).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error sending campaign:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send campaign',
    });
  }
}

// ==================== PREVIEW & VALIDATION ====================

/**
 * Preview email with sample data
 * POST /admin/drives/:driveId/preview-email
 */
export async function previewEmail(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const { subject, body, sampleStudentId } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Subject and body are required',
      });
    }

    const preview = await bulkCommService.previewEmail(
      driveId,
      subject,
      body,
      sampleStudentId
    );

    return res.status(200).json({
      success: true,
      data: { preview },
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error previewing email:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to preview email',
    });
  }
}

/**
 * Resolve recipients for preview (count only, no actual email addresses)
 * POST /admin/drives/:driveId/resolve-recipients
 */
export async function resolveRecipients(req: Request, res: Response) {
  try {
    const { driveId } = req.params;
    const { targetType, targetValue } = req.body;

    if (!targetType) {
      return res.status(400).json({
        success: false,
        message: 'targetType is required',
      });
    }

    const recipients = await bulkCommService.resolveRecipients(
      driveId,
      targetType,
      targetValue || ''
    );

    return res.status(200).json({
      success: true,
      data: {
        count: recipients.length,
        recipients: recipients.map((r) => ({
          name: r.name,
          email: r.email,
          branch: r.branch,
        })),
      },
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error resolving recipients:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to resolve recipients',
    });
  }
}

// ==================== TEMPLATES ====================

/**
 * Get default templates
 * GET /admin/message-templates
 */
export async function getDefaultTemplates(req: Request, res: Response) {
  try {
    const templates = await bulkCommService.getDefaultTemplates();

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error fetching templates:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch templates',
    });
  }
}

/**
 * Create or update a template
 * POST /admin/message-templates
 */
export async function upsertTemplate(req: Request, res: Response) {
  try {
    const { status, subject, body } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!status || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Status, subject, and body are required',
      });
    }

    const template = await bulkCommService.upsertTemplate(
      status,
      subject,
      body,
      userId
    );

    return res.status(200).json({
      success: true,
      template,
    });
  } catch (error: any) {
    console.error('[BULK-COMM-CTRL] Error upserting template:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save template',
    });
  }
}
