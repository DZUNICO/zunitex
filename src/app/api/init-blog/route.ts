// app/api/init-blog/route.ts
import { createSampleBlogPost } from '@/lib/firebase/init-data';
import { NextResponse } from 'next/server';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Only available in development' },
      { status: 403 }
    );
  }

  try {
    const postId = await createSampleBlogPost();
    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to create sample post' },
      { status: 500 }
    );
  }
}