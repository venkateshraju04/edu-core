import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/db';
import { AppError } from '../middleware/errorHandler';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { userId, role } = req.user!;

    // Return notifications addressed to this user OR broadcast to their role
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .or(`user_id.eq.${userId},role_target.cs.{"${role}"}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new AppError(500, error.message);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) throw new AppError(404, 'Notification not found');

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
