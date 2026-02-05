// lib/collections.ts
export interface CollectionConfig {
  id: string;           // ID para usar no banco (ex: "mega-evolucao")
  name: string;         // Nome para exibição (ex: "Mega Evolução")
}

export const POKEMON_COLLECTIONS: CollectionConfig[] = [
  { id: 'mega-evolucao', name: 'Mega Evolução' },
  { id: 'fogo-fantasmagorico', name: 'Fogo Fantasmagórico' },
  { id: 'fogo-branco', name: 'Fogo Branco' },
  { id: 'rivais-predestinados', name: 'Rivais Predestinados' },
  { id: 'coroa-estelar', name: 'Coroa Estelar' },
  { id: 'amigos-de-jornada', name: 'Amigos de Jornada' },
  { id: 'evolucoes-prismaticas', name: 'Evoluções Prismáticas' },
  { id: 'herois-excelsos', name: 'Heróis Excelsos' },
  { id: 'fagulhas-impetuosas', name: 'Fagulhas Impetuosas' },
  { id: 'dominio-draconico', name: 'Domínio Dracônico' }, // 🔥 SEM ACENTOS NO ID
];

// ✅ FUNÇÕES PARA O ADMIN
export const getPokemonCollectionsForAdmin = (): CollectionConfig[] => {
  return POKEMON_COLLECTIONS;
};

// ✅ FUNÇÃO PARA OS FILTROS DO SITE
export const getCollectionName = (id: string): string => {
  const collection = POKEMON_COLLECTIONS.find(c => c.id === id);
  return collection?.name || id;
};

// ✅ FUNÇÃO PARA ADICIONAR NOVAS COLECÕES (QUANDO LANÇAR)
export const addPokemonCollection = (id: string, name: string): boolean => {
  const exists = POKEMON_COLLECTIONS.find(c => c.id === id);
  if (!exists) {
    POKEMON_COLLECTIONS.push({ id, name });
    console.log(`✅ Coleção adicionada: ${name} (${id})`);
    return true;
  }
  console.log(`⚠️ Coleção já existe: ${name} (${id})`);
  return false;
};
export const normalizeCollectionId = (idOrName: string): string => {
  return idOrName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '-') // Espaços para hífens
    .trim();
};
// lib/collections.ts - ADICIONE ESTA FUNÇÃO
export const getBoardGameTypesForAdmin = () => {
  return [
    { id: 'tabuleiro', name: 'Tabuleiro' },
    { id: 'carta', name: 'Cartas' },
    { id: 'baralho', name: 'Baralhos' }
  ];
};