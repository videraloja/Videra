import { supabase } from './supabaseClient';

// Chamado pelo admin depois de salvar um produto com sucesso. Nunca deve
// quebrar o fluxo de salvar: qualquer falha aqui só vai pro console.
export async function revalidateProductPages(slug?: string | null, category?: string | null): Promise<void> {
  if (!slug && !category) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[revalidate] Sem sessão — pulando revalidação sob demanda (a página ainda atualiza sozinha em até 5 minutos).');
      return;
    }

    const res = await fetch('/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ slug, category }),
    });

    if (!res.ok) {
      console.warn('[revalidate] Endpoint respondeu com erro:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('[revalidate] Falha ao chamar /api/revalidate (não bloqueante):', err);
  }
}
