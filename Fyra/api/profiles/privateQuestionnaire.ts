/// file: privateQuestionnaire.ts
/// Jackson Hurley, Kaitlyn Maes, Cam Horine
/// API for private profile questionnaire. GET by user, POST upsert.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );
}

type QuestionnairePayload = {
  email: string;
  gender?: string;
  adaAccommodations?: string;
  animalAllergies?: string;
  varsitySport?: string;
  smoking?: string;
  cannabis?: string;
  alcohol?: string;
  roomTemp?: string;
  bedroomDescription?: string;
  sleepType?: string;
  weekdayBedtime?: string;
  freeTime?: string;
  campusActivity?: string;
  visitorFrequency?: string;
  weekendHomeFrequency?: string;
  firstClassTime?: string;
  musicPreference?: string;
  politicalViews?: string;
  religion?: string;
  studyEnvironment?: string;
  intendedMajor?: string;
  vehicleToCampus?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const email = (req.query.email as string)?.trim()?.toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    try {
      const q = await prisma.privateQuestionnaire.findUnique({
        where: { userEmail: email },
      });
      return res.status(200).json(q ?? null);
    } catch (e) {
      console.error('privateQuestionnaire GET error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body as QuestionnairePayload;
      const email = body?.email?.trim()?.toLowerCase();
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const existing = await prisma.users.findUnique({ where: { email } });
      if (!existing) {
        return res.status(404).json({ error: 'User not found' });
      }

      const data = {
        gender: body.gender ?? undefined,
        adaAccommodations: body.adaAccommodations ?? undefined,
        animalAllergies: body.animalAllergies ?? undefined,
        varsitySport: body.varsitySport ?? undefined,
        smoking: body.smoking ?? undefined,
        cannabis: body.cannabis ?? undefined,
        alcohol: body.alcohol ?? undefined,
        roomTemp: body.roomTemp ?? undefined,
        bedroomDescription: body.bedroomDescription ?? undefined,
        sleepType: body.sleepType ?? undefined,
        weekdayBedtime: body.weekdayBedtime ?? undefined,
        freeTime: body.freeTime ?? undefined,
        campusActivity: body.campusActivity ?? undefined,
        visitorFrequency: body.visitorFrequency ?? undefined,
        weekendHomeFrequency: body.weekendHomeFrequency ?? undefined,
        firstClassTime: body.firstClassTime ?? undefined,
        musicPreference: body.musicPreference ?? undefined,
        politicalViews: body.politicalViews ?? undefined,
        religion: body.religion ?? undefined,
        studyEnvironment: body.studyEnvironment ?? undefined,
        intendedMajor: body.intendedMajor ?? undefined,
        vehicleToCampus: body.vehicleToCampus ?? undefined,
      };

      const q = await prisma.privateQuestionnaire.upsert({
        where: { userEmail: email },
        create: { userEmail: email, ...data },
        update: data,
      });
      return res.status(200).json(q);
    } catch (e) {
      console.error('privateQuestionnaire POST error:', e);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
