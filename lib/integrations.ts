export function normalizePhoneBR(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export function whatsappFallbackUrl(phone: string, message: string) {
  return `https://wa.me/${normalizePhoneBR(phone)}?text=${encodeURIComponent(message)}`;
}

export async function sendWhatsAppTemplate(input: { phone: string; template: string; language?: string; bodyParameters?: string[] }) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { configured: false as const };
  const components = input.bodyParameters?.length ? [{ type:'body', parameters: input.bodyParameters.map(text => ({ type:'text', text })) }] : undefined;
  const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
    method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ messaging_product:'whatsapp', to: normalizePhoneBR(input.phone), type:'template', template:{ name:input.template, language:{ code:input.language || 'pt_BR' }, components } })
  });
  const data = await response.json().catch(() => ({}));
  return { configured: true as const, ok: response.ok, data };
}
