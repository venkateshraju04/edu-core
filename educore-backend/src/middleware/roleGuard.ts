import { Request, Response, NextFunction } from 'express';

export type Role = 'admin' | 'principal' | 'hod' | 'teacher';

/**
 * Factory function that returns middleware allowing only the specified roles.
 *
 * Usage:
 *   router.get('/students', jwtAuth, roleGuard(['admin', 'principal']), handler)
 */
export function roleGuard(allowed: Role[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const role = req.user?.role as Role | undefined;

    if (!role || !allowed.includes(role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowed.join(', ')}`,
      });
      return;
    }

    next();
  };
}
