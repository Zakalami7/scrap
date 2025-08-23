import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${PORT}`);
});