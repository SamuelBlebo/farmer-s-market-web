import { vi } from 'vitest';

// React's cache() is a Server Components runtime API that only exists inside
// Next.js's RSC bundler — outside of it, calling the import throws. A plain
// pass-through is fine for tests: no request-scoped memoization needed when
// each test calls the function directly and independently.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: <T,>(fn: T) => fn };
});

// redirect()/notFound() only work inside a real Next.js request/render —
// outside of one they'd just throw an unhelpful internal error. Standing in
// with something a test can assert on directly.
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

// revalidatePath touches Next's request-scoped cache, which doesn't exist
// outside a real request — a no-op here since no test asserts on it.
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
