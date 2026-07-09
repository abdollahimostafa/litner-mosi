import { prisma } from '@/lib/prisma';
import LeitnerApp from './leitner-app';

export default async function Page() {
  const items = await prisma.cardItem.findMany({
    include: { history: { orderBy: { date: 'asc' } } },
    orderBy: { nextReview: 'asc' },
  });

  return <LeitnerApp items={items} />;
}