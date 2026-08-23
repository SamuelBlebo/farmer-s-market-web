import { NextResponse } from 'next/server';
import { getCategories } from '@/server/queries';

export async function GET() {
  return NextResponse.json(await getCategories());
}
