import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, metadata } = body;

    // Validation
    if (!type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, message' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['bug', 'feature', 'feedback', 'help', 'other'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid contact type' },
        { status: 400 }
      );
    }

    // Validate message length (max 500 chars as per FormWindow)
    if (message.length > 500) {
      return NextResponse.json(
        { error: 'Message exceeds maximum length of 500 characters' },
        { status: 400 }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        type,
        message,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting contact submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit contact form' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit contact form' },
      { status: 500 }
    );
  }
}
