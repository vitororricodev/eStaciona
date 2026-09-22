import { describe, expect, it, vi } from 'vitest';
import { completeRequiredPasswordChange } from '@/lib/passwordChange';

function dependencies(authError: unknown = null, profileError: unknown = null) {
  return {
    updateAuthPassword: vi.fn(async () => ({ error: authError })),
    completeProfileChange: vi.fn(async () => ({ error: profileError })),
  };
}

describe('required password change workflow', () => {
  it('rejeita sessão ausente', async () => {
    const deps = dependencies();
    expect(
      (await completeRequiredPasswordChange({ userId: null, profile: null }, 'senha-segura', deps)).status,
    ).toBe(401);
    expect(deps.updateAuthPassword).not.toHaveBeenCalled();
  });

  it('rejeita perfil inativo/ausente', async () => {
    const deps = dependencies();
    expect(
      (await completeRequiredPasswordChange({ userId: 'user', profile: null }, 'senha-segura', deps)).status,
    ).toBe(403);
  });

  it('não permite limpar flag quando troca não está pendente', async () => {
    const deps = dependencies();
    expect(
      (
        await completeRequiredPasswordChange(
          { userId: 'user', profile: { must_change_password: false } },
          'senha-segura',
          deps,
        )
      ).status,
    ).toBe(409);
    expect(deps.completeProfileChange).not.toHaveBeenCalled();
  });

  it('não conclui perfil quando o Auth falha', async () => {
    const deps = dependencies(new Error('auth_failed'));
    expect(
      (
        await completeRequiredPasswordChange(
          { userId: 'user', profile: { must_change_password: true } },
          'senha-segura',
          deps,
        )
      ).status,
    ).toBe(502);
    expect(deps.completeProfileChange).not.toHaveBeenCalled();
  });

  it('mantém o bloqueio quando a atualização do perfil falha', async () => {
    const deps = dependencies(null, new Error('profile_failed'));
    expect(
      (
        await completeRequiredPasswordChange(
          { userId: 'user', profile: { must_change_password: true } },
          'senha-segura',
          deps,
        )
      ).status,
    ).toBe(500);
  });

  it('conclui troca válida na ordem Auth e perfil', async () => {
    const order: string[] = [];
    const result = await completeRequiredPasswordChange(
      { userId: 'user', profile: { must_change_password: true } },
      'senha-segura',
      {
        updateAuthPassword: async () => {
          order.push('auth');
          return { error: null };
        },
        completeProfileChange: async () => {
          order.push('profile');
          return { error: null };
        },
      },
    );
    expect(result).toEqual({ ok: true, status: 200 });
    expect(order).toEqual(['auth', 'profile']);
  });
});
