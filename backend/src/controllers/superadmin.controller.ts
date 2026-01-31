import { Request, Response } from 'express';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import * as superadminService from '../services/superadmin.service';

const createAdminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const updateAdminSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export async function createAdmin(req: Request, res: Response) {
  const data = createAdminSchema.parse(req.body);
  const admin = await superadminService.createAdmin(data, req.user!.userId);

  res.status(201).json({
    success: true,
    data: { admin },
  });
}

export async function getAdmins(_req: Request, res: Response) {
  const admins = await superadminService.getAdmins();

  res.json({
    success: true,
    data: { admins },
  });
}

export async function getAdmin(req: Request, res: Response) {
  const admin = await superadminService.getAdminById(req.params.id);

  res.json({
    success: true,
    data: { admin },
  });
}

export async function updateAdmin(req: Request, res: Response) {
  const data = updateAdminSchema.parse(req.body);
  const admin = await superadminService.updateAdmin(
    req.params.id,
    data,
    req.user!.userId
  );

  res.json({
    success: true,
    data: { admin },
  });
}

export async function disableAdmin(req: Request, res: Response) {
  const admin = await superadminService.disableAdmin(
    req.params.id,
    req.user!.userId
  );

  res.json({
    success: true,
    data: { admin },
  });
}

export async function deleteAdmin(req: Request, res: Response) {
  const result = await superadminService.deleteAdmin(
    req.params.id,
    req.user!.userId
  );

  res.json({
    success: true,
    data: result,
  });
}

export async function getAuditLogs(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = await superadminService.getAuditLogs(limit);

  res.json({
    success: true,
    data: { logs },
  });
}
