import { Request, Response, NextFunction } from 'express';

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user || !roles.includes(user.rol)) {
      res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
      return;
    }

    next();
  };
}
