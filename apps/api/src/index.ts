import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();

// Auth helpers
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

type AuthPayload = { sub: string; role: string };

function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role } as AuthPayload, JWT_SECRET, { expiresIn: '7d' });
}

function getAuthPayload(req: express.Request): AuthPayload | null {
  const auth = req.headers.authorization || '';
  const [scheme, token] = auth.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    return { sub: String(decoded.sub), role: String((decoded as any).role) };
  } catch {
    return null;
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const payload = getAuthPayload(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  (req as any).auth = payload;
  next();
}

function requireRole(role: 'COMPANY' | 'FREELANCER') {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const payload = getAuthPayload(req);
    if (!payload) return res.status(401).json({ error: 'Unauthorized' });
    if (payload.role !== role) return res.status(403).json({ error: 'Forbidden' });
    (req as any).auth = payload;
    next();
  };
}

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/auth/register', async (req, res) => {
  try {
    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
      role: z.enum(['FREELANCER', 'COMPANY'])
    });
    const { email, password, name, role } = bodySchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, name, role, passwordHash } });
    if (role === 'COMPANY') {
      await prisma.company.create({ data: { userId: user.id, name: name || email } });
    } else {
      await prisma.freelancerProfile.create({ data: { userId: user.id } });
    }
    const full = await prisma.user.findUnique({ where: { id: user.id }, include: { company: true, freelancerProfile: true } });
    const token = signToken(user.id, role);
    res.status(201).json({ token, user: full });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const bodySchema = z.object({ email: z.string().email(), password: z.string().min(6) });
    const { email, password } = bodySchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user.id, user.role);
    const full = await prisma.user.findUnique({ where: { id: user.id }, include: { company: true, freelancerProfile: true } });
    res.json({ token, user: full });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err) });
  }
});

app.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({ include: { freelancerProfile: true, company: true } });
  res.json(users);
});

app.post('/users', async (req, res) => {
  try {
    const { email, name, role, companyName } = req.body;
    if (!email || !role) {
      return res.status(400).json({ error: 'email and role are required' });
    }
    const user = await prisma.user.create({ data: { email, name, role } });
    if (role === 'COMPANY') {
      await prisma.company.create({ data: { userId: user.id, name: companyName || name || email } });
    } else if (role === 'FREELANCER') {
      await prisma.freelancerProfile.create({ data: { userId: user.id } });
    }
    const created = await prisma.user.findUnique({ where: { id: user.id }, include: { freelancerProfile: true, company: true } });
    res.status(201).json(created);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/skills', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const skill = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
    res.status(201).json(skill);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/freelancers', async (req, res) => {
  const skill = (req.query.skill as string) || undefined;
  const location = (req.query.location as string) || undefined;
  const freelancers = await prisma.freelancerProfile.findMany({
    where: {
      location: location ? { contains: location } : undefined,
      skills: skill ? { some: { skill: { name: { equals: skill } } } } : undefined,
    },
    include: { user: true, skills: { include: { skill: true } } },
  });
  res.json(freelancers);
});

// Protect selected routes
// Add auth check to add freelancer skills
app.post('/freelancers/:id/skills', requireAuth, async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ skills: z.array(z.string().min(1)).nonempty() });
    const { id } = paramsSchema.parse(req.params);
    const { skills } = bodySchema.parse(req.body);

    const auth = (req as any).auth as AuthPayload;
    if (auth.role === 'FREELANCER') {
      const me = await prisma.freelancerProfile.findFirst({ where: { userId: auth.sub } });
      if (!me || me.id !== id) return res.status(403).json({ error: 'Forbidden' });
    }

    const profile = await prisma.freelancerProfile.findUnique({ where: { id }, include: { user: true } });
    if (!profile) return res.status(404).json({ error: 'Freelancer not found' });

    const skillRecords = [] as { id: number; name: string }[];
    for (const name of skills) {
      const s = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
      skillRecords.push(s);
    }
    for (const s of skillRecords) {
      try { await prisma.freelancerSkill.create({ data: { freelancerId: id, skillId: s.id } }); } catch {}
    }

    const updated = await prisma.freelancerProfile.findUnique({
      where: { id },
      include: { user: true, skills: { include: { skill: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Require auth to create projects; default to company of authenticated user if not provided
app.post('/projects', requireAuth, async (req, res) => {
  try {
    const { companyId: bodyCompanyId, title, description, requiredSkills = [] } = req.body as {
      companyId?: string; title: string; description: string; requiredSkills?: string[]
    };
    if (!title || !description) return res.status(400).json({ error: 'title, description required' });

    let companyId = bodyCompanyId;
    const auth = (req as any).auth as AuthPayload;
    if (!companyId) {
      const comp = await prisma.company.findFirst({ where: { userId: auth.sub } });
      if (!comp) return res.status(400).json({ error: 'companyId required' });
      companyId = comp.id;
    }

    const project = await prisma.project.create({ data: { companyId, title, description } });
    if (Array.isArray(requiredSkills) && requiredSkills.length) {
      for (const skillName of requiredSkills) {
        const skill = await prisma.skill.upsert({ where: { name: skillName }, update: {}, create: { name: skillName } });
        await prisma.projectRequiredSkill.create({ data: { projectId: project.id, skillId: skill.id } });
      }
    }
    const full = await prisma.project.findUnique({ where: { id: project.id }, include: { requiredSkills: { include: { skill: true } } } });
    res.status(201).json(full);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/projects', async (_req, res) => {
  const projects = await prisma.project.findMany({ include: { company: { include: { user: true } }, requiredSkills: { include: { skill: true } } } });
  res.json(projects);
});

app.get('/projects/:id/recommendations', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const querySchema = z.object({ limit: z.coerce.number().int().positive().max(100).optional() });
    const { id } = paramsSchema.parse(req.params);
    const { limit = 10 } = querySchema.parse(req.query);

    const project = await prisma.project.findUnique({
      where: { id },
      include: { requiredSkills: { include: { skill: true } } },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const requiredSkillIds = project.requiredSkills.map((rs) => rs.skillId);

    const candidates = await prisma.freelancerProfile.findMany({
      where: requiredSkillIds.length ? { skills: { some: { skillId: { in: requiredSkillIds } } } } : {},
      include: { user: true, skills: { include: { skill: true } } },
    });

    const serviceUrl = process.env.RECO_SERVICE_URL;
    if (serviceUrl) {
      try {
        const payload = {
          project: {
            id: project.id,
            title: project.title,
            description: project.description,
            location: project.location,
            requiredSkills: project.requiredSkills.map((rs) => ({ id: rs.skillId, name: rs.skill.name })),
          },
          candidates: candidates.map((f) => ({
            id: f.id,
            title: f.title,
            location: f.location,
            ratingAvg: f.ratingAvg,
            skills: f.skills.map((fs) => ({ id: fs.skillId, name: fs.skill.name })),
          })),
          limit,
        };
        const r = await fetch(`${serviceUrl}/recommend`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          const data = await r.json();
          const items: Array<{ freelancerId: string; score: number }> = data.recommendations || [];
          const byId = new Map(candidates.map((c) => [c.id, c] as const));
          const mapped = items
            .map((it) => ({ freelancer: byId.get(it.freelancerId), score: it.score }))
            .filter((m) => m.freelancer)
            .slice(0, limit);
          return res.json(mapped);
        }
        // fallthrough to heuristic on non-OK
      } catch (_) {
        // ignore and fallback
      }
    }

    const recos = candidates
      .map((f) => {
        const freelancerSkillIds = f.skills.map((fs) => fs.skillId);
        const overlap = requiredSkillIds.filter((id) => freelancerSkillIds.includes(id)).length;
        const locationBoost = project.location && f.location && project.location === f.location ? 0.5 : 0;
        const score = overlap * 2 + (f.ratingAvg || 0) + locationBoost;
        return { freelancer: f, score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    res.json(recos);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Applications: auth required; freelancers can only apply as themselves
app.post('/projects/:id/applications', requireAuth, async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ freelancerId: z.string().optional(), coverLetter: z.string().optional() });
    const { id } = paramsSchema.parse(req.params);
    const { coverLetter } = bodySchema.parse(req.body);

    const auth = (req as any).auth as AuthPayload;
    let freelancerId = (req.body && req.body.freelancerId) || undefined;
    if (auth.role === 'FREELANCER') {
      const me = await prisma.freelancerProfile.findFirst({ where: { userId: auth.sub } });
      if (!me) return res.status(400).json({ error: 'No freelancer profile' });
      if (freelancerId && freelancerId !== me.id) return res.status(403).json({ error: 'Forbidden' });
      freelancerId = me.id;
    }
    if (!freelancerId) return res.status(400).json({ error: 'freelancerId required' });

    const [project, freelancer] = await Promise.all([
      prisma.project.findUnique({ where: { id } }),
      prisma.freelancerProfile.findUnique({ where: { id: freelancerId } }),
    ]);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!freelancer) return res.status(404).json({ error: 'Freelancer not found' });

    const existing = await prisma.application.findFirst({ where: { projectId: id, freelancerId } });
    let application;
    if (existing) {
      application = await prisma.application.update({
        where: { id: existing.id },
        data: { coverLetter, status: 'PENDING' },
        include: { freelancer: { include: { user: true, skills: { include: { skill: true } } } } },
      });
    } else {
      application = await prisma.application.create({
        data: { projectId: id, freelancerId, coverLetter, status: 'PENDING' },
        include: { freelancer: { include: { user: true, skills: { include: { skill: true } } } } },
      });
    }

    res.status(201).json(application);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/projects/:id/applications', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const { id } = paramsSchema.parse(req.params);

    const apps = await prisma.application.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' },
      include: { freelancer: { include: { user: true } } },
    });
    res.json(apps);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Accept/Reject: company only
app.patch('/applications/:id', requireRole('COMPANY'), async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']) });
    const { id } = paramsSchema.parse(req.params);
    const { status } = bodySchema.parse(req.body);

    const application = await prisma.application.update({ where: { id }, data: { status } });

    if (status === 'ACCEPTED') {
      const existing = await prisma.assignment.findFirst({ where: { projectId: application.projectId } });
      if (!existing) {
        await prisma.assignment.create({ data: { projectId: application.projectId, freelancerId: application.freelancerId, status: 'ACTIVE' } });
      }
      await prisma.project.update({ where: { id: application.projectId }, data: { status: 'ASSIGNED' } });
    }

    res.json(application);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${PORT}`);
});