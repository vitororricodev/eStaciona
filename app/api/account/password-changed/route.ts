import { NextRequest, NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/authz';
import { createAdminClient } from '@/lib/supabase/admin';
import { passwordChangeSchema } from '@/lib/passwordPolicy';
import { completeRequiredPasswordChange } from '@/lib/passwordChange';

export async function POST(request: NextRequest) {
  const parsed = passwordChangeSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: 'A nova senha precisa ter entre 8 e 72 caracteres.' }, { status: 400 });

  const { supabase, user, profile } = await getSessionContext();
  const admin = createAdminClient();
  const result = await completeRequiredPasswordChange(
    { userId: user?.id || null, profile },
    parsed.data.newPassword,
    {
      updateAuthPassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return { error };
      },
      completeProfileChange: async () => {
        if (!user) return { error: new Error('missing_user') };
        const { error } = await admin.rpc('complete_password_change', { p_user_id: user.id });
        return { error };
      },
    },
  );
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}
