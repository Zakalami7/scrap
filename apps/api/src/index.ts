import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

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
      location: location ? { contains: location, mode: 'insensitive' } : undefined,
      skills: skill ? { some: { skill: { name: { equals: skill, mode: 'insensitive' } } } } : undefined,
    },
    include: { user: true, skills: { include: { skill: true } } },
  });
  res.json(freelancers);
});

app.post('/freelancers/:id/skills', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ skills: z.array(z.string().min(1)).nonempty() });
    const { id } = paramsSchema.parse(req.params);
    const { skills } = bodySchema.parse(req.body);

    const profile = await prisma.freelancerProfile.findUnique({ where: { id }, include: { user: true } });
    if (!profile) return res.status(404).json({ error: 'Freelancer not found' });

    const skillRecords = [] as { id: number; name: string }[];
    for (const name of skills) {
      const s = await prisma.skill.upsert({ where: { name }, update: {}, create: { name } });
      skillRecords.push(s);
    }
    await prisma.freelancerSkill.createMany({
      data: skillRecords.map((s) => ({ freelancerId: id, skillId: s.id })),
      skipDuplicates: true,
    });

    const updated = await prisma.freelancerProfile.findUnique({
      where: { id },
      include: { user: true, skills: { include: { skill: true } } },
    });
    res.json(updated);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/projects', async (req, res) => {
  try {
    const { companyId, title, description, requiredSkills = [] } = req.body as {
      companyId: string; title: string; description: string; requiredSkills?: string[]
    };
    if (!companyId || !title || !description) return res.status(400).json({ error: 'companyId, title, description required' });
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

app.post('/projects/:id/applications', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ freelancerId: z.string().min(1), coverLetter: z.string().optional() });
    const { id } = paramsSchema.parse(req.params);
    const { freelancerId, coverLetter } = bodySchema.parse(req.body);

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

app.patch('/applications/:id', async (req, res) => {
  try {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const bodySchema = z.object({ status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']) });
    const { id } = paramsSchema.parse(req.params);
    const { status } = bodySchema.parse(req.body);

    const application = await prisma.application.update({ where: { id }, data: { status } });

    if (status === 'ACCEPTED') {
      // Create assignment if not exists and mark project as ASSIGNED
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