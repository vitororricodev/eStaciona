type PasswordChangeActor = {
  userId: string | null;
  profile: { must_change_password: boolean } | null;
};

type PasswordChangeDependencies = {
  updateAuthPassword: (password: string) => Promise<{ error: unknown | null }>;
  completeProfileChange: () => Promise<{ error: unknown | null }>;
};

export type PasswordChangeResult = { ok: true; status: 200 } | { ok: false; status: number; error: string };

export async function completeRequiredPasswordChange(
  actor: PasswordChangeActor,
  newPassword: string,
  dependencies: PasswordChangeDependencies,
): Promise<PasswordChangeResult> {
  if (!actor.userId) return { ok: false, status: 401, error: 'Não autenticado.' };
  if (!actor.profile) return { ok: false, status: 403, error: 'Perfil inativo ou não configurado.' };
  if (!actor.profile.must_change_password)
    return { ok: false, status: 409, error: 'A troca obrigatória não está pendente.' };

  const auth = await dependencies.updateAuthPassword(newPassword);
  if (auth.error) return { ok: false, status: 502, error: 'Não foi possível alterar a senha.' };

  const profile = await dependencies.completeProfileChange();
  if (profile.error) {
    return {
      ok: false,
      status: 500,
      error: 'A senha foi alterada, mas o acesso continua bloqueado. Tente concluir novamente.',
    };
  }
  return { ok: true, status: 200 };
}
