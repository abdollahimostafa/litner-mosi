'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const STEPS = [1, 3, 7, 14, 30]; // فاصله‌های جعبه لایتنر بر حسب روز

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function createCard(topic: string, chapter: string, readDate: Date, stepDays: number) {
  const idx = Math.max(0, STEPS.indexOf(stepDays));
  const nextReview = addDays(readDate, STEPS[idx]);

  await prisma.cardItem.create({
    data: {
      topic,
      chapter,
      createdAt: readDate,
      stepIndex: idx,
      nextReview,
      cycleCount: 0,
      history: {
        create: [{ date: readDate, action: 'created', stepDays: STEPS[idx] }],
      },
    },
  });

  revalidatePath('/');
}

export async function markCardDone(id: string) {
  const card = await prisma.cardItem.findUniqueOrThrow({ where: { id } });
  const isLast = card.stepIndex >= STEPS.length - 1;
  const nextIdx = isLast ? 0 : card.stepIndex + 1;
  const today = new Date();

  await prisma.cardItem.update({
    where: { id },
    data: {
      stepIndex: nextIdx,
      nextReview: addDays(today, STEPS[nextIdx]),
      cycleCount: isLast ? { increment: 1 } : undefined,
      history: {
        create: [{ date: today, action: isLast ? 'restarted' : 'done', stepDays: STEPS[card.stepIndex] }],
      },
    },
  });

  revalidatePath('/');
}

export async function postponeCard(id: string) {
  const card = await prisma.cardItem.findUniqueOrThrow({ where: { id } });
  const today = new Date();

  await prisma.cardItem.update({
    where: { id },
    data: {
      nextReview: addDays(today, 1),
      history: {
        create: [{ date: today, action: 'postponed', stepDays: STEPS[card.stepIndex] }],
      },
    },
  });

  revalidatePath('/');
}

export async function deleteCard(id: string) {
  await prisma.cardItem.delete({ where: { id } });
  revalidatePath('/');
}