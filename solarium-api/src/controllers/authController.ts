import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/pool';
import { UsuarioAuth, JwtPayload, LoginResponse } from '../types';

export async function login(req: Request, res: Response): Promise<void> {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    res.status(400).json({ error: 'Los campos usuario y password son requeridos' });
    return;
  }

  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('usuario', usuario)
      .query<UsuarioAuth>(`
        SELECT
          u.ID_USUARIO  AS id_usuario,
          u.NOMBRE      AS nombre,
          u.APELLIDO    AS apellido,
          u.CORREO      AS correo,
          u.USUARIO     AS usuario,
          u.PASSWORD    AS password,
          u.ESPECIALIDAD AS especialidad,
          r.NOMBRE      AS rol
        FROM USUARIOS u
        JOIN ROLES r ON u.ID_ROL = r.ID_ROL
        WHERE u.USUARIO = @usuario
          AND u.ESTADO = 'ACTIVO'
      `);

    if (result.recordset.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = result.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const payload: JwtPayload = {
      id_usuario: user.id_usuario,
      rol: user.rol,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '8h' });

    const response: LoginResponse = {
      token,
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellido: user.apellido,
      rol: user.rol,
      especialidad: user.especialidad,
    };

    res.status(200).json(response);
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
