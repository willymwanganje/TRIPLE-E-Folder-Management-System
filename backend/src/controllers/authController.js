import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { getUserPermissions } from '../services/rbacService.js';
import { audit } from '../services/auditService.js';

function sign(user) { return jwt.sign({ id:user.id, email:user.email }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }); }
export async function login(req,res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({message:'Email and password are required.'});
  const user = await prisma.user.findUnique({ where:{ email:email.toLowerCase().trim() }, include:{role:true} });
  if (!user || !user.isActive || !(await bcrypt.compare(password,user.passwordHash))) return res.status(401).json({message:'Incorrect email or password.'});
  const permissions = await getUserPermissions(user.id); await audit({userId:user.id,action:'LOGIN',entity:'User',entityId:user.id});
  res.json({ token:sign(user), user:{ id:user.id,fullName:user.fullName,email:user.email,phone:user.phone,profilePhotoUrl:user.profilePhotoUrl,isSuperAdmin:user.isSuperAdmin,role:user.role,permissions } });
}
export async function me(req,res) { res.json({ user:req.user }); }
