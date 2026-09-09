import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabaseClient';

// Chamado pelo admin depois de salvar um produto, pra não depender só do
// revalidate=300 da página — sem isso, uma edição podia demorar até 5 minutos
// pra aparecer no site (ou até 1h, antes desta fase).
//
// Duas formas de autorizar a chamada:
//  1) Authorization: Bearer <access_token> — a própria sessão do Supabase do
//     admin logado (é o que o formulário de produto usa). Não precisa de
//     nenhum segredo exposto ao navegador: o token já existe na sessão dele.
//  2) x-revalidate-secret — pensado pra uma chamada servidor-a-servidor no
//     futuro (ex.: um webhook), sem sessão de usuário disponível.
const CATEGORY_PATHS: Record<string, string> = {
  pokemon: '/pokemontcg',
  'board-games': '/jogosdetabuleiro',
  acessorios: '/acessorios',
  'hot-wheels': '/hotwheels',
};

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const secretHeader = request.headers.get('x-revalidate-secret');
  if (process.env.REVALIDATE_SECRET && secretHeader === process.env.REVALIDATE_SECRET) {
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ revalidated: false, message: 'Não autorizado' }, { status: 401 });
  }

  let body: { slug?: string; category?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ revalidated: false, message: 'Corpo da requisição inválido' }, { status: 400 });
  }

  const paths: string[] = [];
  if (body.slug) paths.push(`/produto/${body.slug}`);
  if (body.category && CATEGORY_PATHS[body.category]) paths.push(CATEGORY_PATHS[body.category]);

  if (paths.length === 0) {
    return NextResponse.json({ revalidated: false, message: 'Nenhum path pra revalidar (informe slug e/ou category)' }, { status: 400 });
  }

  paths.forEach((path) => revalidatePath(path));

  return NextResponse.json({ revalidated: true, paths });
}
