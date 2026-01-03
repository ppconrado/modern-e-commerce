# React Suspense - Guia Completo

## 📖 O que é React Suspense?

**React Suspense** é uma funcionalidade do React que permite que você "suspenda" a renderização de um componente enquanto ele está carregando dados ou recursos assíncronos. Em vez de mostrar telas em branco ou estados de loading complexos, o Suspense mostra um **fallback** (geralmente um skeleton/loading) enquanto o conteúdo real está sendo carregado.

### Como Funciona?

```tsx
import { Suspense } from 'react';

<Suspense fallback={<LoadingComponent />}>
  <ComponenteThatLoadsData />
</Suspense>
```

**Fluxo:**
1. React começa a renderizar o componente filho
2. Se o componente precisar carregar dados (async), ele "suspende"
3. React mostra o `fallback` enquanto espera
4. Quando os dados chegam, React substitui o fallback pelo conteúdo real
5. Transição suave e automática

---

## 📍 Exemplos no Projeto

### Exemplo 1: Home Page - Product Grid

📁 **Arquivo:** `src/app/page.tsx`

```tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

// 1. Componente de Loading (Fallback)
function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton para o título/filtros */}
      <div className="h-10 bg-muted animate-pulse rounded-lg w-full max-w-md" />
      
      {/* Grid de skeletons (6 cards vazios animados) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// 2. Uso do Suspense
export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Featured Products</h1>
        <p className="text-muted-foreground">
          Discover our curated collection of premium products
        </p>
      </div>
      
      {/* Enquanto ProductGrid carrega dados, mostra ProductGridSkeleton */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
```

**O que acontece:**
- Usuário acessa a página
- Título e descrição aparecem **imediatamente**
- `ProductGridSkeleton` mostra 6 cards animados (pulse)
- Quando os produtos são carregados do banco, o skeleton é substituído pela grid real
- **Transição suave** sem "flash" de loading

---

### Exemplo 2: Página de Produto - Product Detail

📁 **Arquivo:** `src/app/products/[id]/page.tsx`

```tsx
import { Suspense } from 'react';

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        // Skeleton que imita o layout final
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            {/* Skeleton da imagem */}
            <div className="aspect-square bg-muted rounded-lg" />
            
            {/* Skeleton dos detalhes */}
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />      {/* Título */}
              <div className="h-6 bg-muted rounded w-1/4" />      {/* Preço */}
              <div className="h-20 bg-muted rounded" />           {/* Descrição */}
              <div className="h-10 bg-muted rounded w-full" />   {/* Botão */}
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
```

**O que acontece:**
- Usuário clica em um produto
- Skeleton aparece **instantaneamente** com o layout exato da página final
- Enquanto busca o produto no banco (usando o `id` da URL)
- Quando os dados chegam, substitui o skeleton pelo conteúdo real
- **UX muito melhor** que uma tela em branco ou spinner

---

## 🎯 Benefícios do React Suspense

### 1. Melhor Experiência do Usuário (UX)

```tsx
// ❌ SEM Suspense - Tela em branco ou loading genérico
{isLoading ? <Spinner /> : <ProductGrid products={data} />}

// ✅ COM Suspense - Skeleton que imita o layout final
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductGrid />
</Suspense>
```

**Vantagens:**
- Usuário vê algo imediatamente (não tela vazia)
- Skeleton imita o layout final (reduz surpresa visual)
- Transição suave entre loading e conteúdo

### 2. Código Mais Limpo

**Antes (sem Suspense):**
```tsx
function ProductList() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchProducts()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);
  
  if (isLoading) return <Spinner />;
  if (error) return <Error />;
  return <ProductGrid products={data} />;
}
```

**Depois (com Suspense):**
```tsx
async function ProductList() {
  const products = await fetchProducts(); // Suspende automaticamente
  return <ProductGrid products={products} />;
}

// Uso:
<Suspense fallback={<Spinner />}>
  <ProductList />
</Suspense>
```

**Benefícios:**
- Não precisa de estados `isLoading`, `isError` em cada componente
- Lógica de loading separada da lógica de dados
- Componentes mais focados em sua responsabilidade principal

### 3. Performance Percebida Melhor

**Psicologia do Usuário:**
- 🧠 Cérebro processa melhor "conteúdo carregando" do que "tela vazia"
- ⏱️ Sensação de espera reduzida com skeleton animado
- 👁️ Menos "flash" visual quando conteúdo aparece

**Métricas:**
- **Sem Suspense:** Tela vazia → Flash → Conteúdo (ruim)
- **Com Suspense:** Skeleton → Transição suave → Conteúdo (bom)

### 4. Streaming SSR (Server-Side Rendering)

No Next.js 15, Suspense permite **streaming HTML**:

```
Cliente recebe:
1. HTML inicial (layout, header, footer) → Renderiza AGORA ⚡
2. Suspense boundaries mostram skeletons
3. Quando dados chegam no servidor → Envia HTML dos produtos
4. React substitui skeletons automaticamente (hydration)
```

**Resultado:**
- ✅ Tempo para primeiro conteúdo (FCP) muito menor!
- ✅ Usuário vê a página progressivamente
- ✅ Não precisa esperar todos os dados no servidor

### 5. Granularidade de Loading

```tsx
<div>
  <Header />  {/* Sempre visível - não bloqueia */}
  
  <Suspense fallback={<UserSkeleton />}>
    <UserProfile />  {/* Suspende independentemente */}
  </Suspense>
  
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />  {/* Suspende independentemente */}
  </Suspense>
  
  <Suspense fallback={<ReviewsSkeleton />}>
    <RecentReviews />  {/* Suspende independentemente */}
  </Suspense>
  
  <Footer />  {/* Sempre visível - não bloqueia */}
</div>
```

**Benefícios:**
- Cada seção carrega independentemente
- Se `UserProfile` carregar rápido, mostra enquanto resto carrega
- Não bloqueia a página inteira
- Melhor progressão visual

---

## 🛠️ Como Usar React Suspense

### Passo 1: Criar um Fallback (Skeleton)

```tsx
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg mb-4" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}
```

**Dicas para bons skeletons:**
- ✅ Imitar o layout final (mesmo tamanho, posições)
- ✅ Usar `animate-pulse` do Tailwind para animação
- ✅ Cores neutras (`bg-muted`, `bg-gray-200`)
- ✅ Manter proporcionalidade com o conteúdo real
- ✅ Mesma estrutura de grid/flex do componente final

**Exemplo complexo:**
```tsx
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-10 bg-muted rounded w-32 animate-pulse" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
```

### Passo 2: Envolver o Componente com Suspense

```tsx
import { Suspense } from 'react';

export default function MyPage() {
  return (
    <div>
      <h1>Minha Página</h1>
      
      <Suspense fallback={<ProductCardSkeleton />}>
        <ProductCard id={123} />
      </Suspense>
    </div>
  );
}
```

### Passo 3: Componente Filho Precisa "Suspender"

#### A. Server Components (Next.js 15)

No Next.js 15 com Server Components, isso acontece **automaticamente** quando você faz `await`:

```tsx
// Este é um Server Component (padrão no Next.js 15)
async function ProductCard({ id }: { id: number }) {
  // await faz o componente "suspender" automaticamente
  const product = await prisma.product.findUnique({ 
    where: { id } 
  });
  
  if (!product) {
    return <div>Produto não encontrado</div>;
  }
  
  return (
    <div>
      <h2>{product.name}</h2>
      <p>${product.price}</p>
      <img src={product.imageUrl} alt={product.name} />
    </div>
  );
}
```

**React detecta o `await` e:**
1. Suspende a renderização
2. Mostra o fallback do Suspense
3. Quando a Promise resolve, renderiza o conteúdo real

#### B. Client Components (TanStack Query)

Para Client Components, use `useSuspenseQuery`:

```tsx
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

function ProductList() {
  // useSuspenseQuery automaticamente "suspende"
  const { data: products } = useSuspenseQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      return res.json();
    },
  });
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}

// Uso:
<Suspense fallback={<ProductGridSkeleton />}>
  <ProductList />
</Suspense>
```

**Nota:** Use `useSuspenseQuery` (não `useQuery`) para integração com Suspense.

---

## 🔥 Padrões Avançados

### 1. Suspense Aninhado (Nested Suspense)

```tsx
<Suspense fallback={<PageSkeleton />}>
  <Header />
  
  <div className="grid grid-cols-2 gap-8">
    <Suspense fallback={<UserSkeleton />}>
      <UserInfo />
    </Suspense>
    
    <Suspense fallback={<StatsSkeleton />}>
      <UserStats />
    </Suspense>
  </div>
  
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />
  </Suspense>
  
  <Footer />
</Suspense>
```

**Benefícios:**
- Loading granular (cada seção independente)
- Se `UserInfo` carregar rápido, mostra enquanto `ProductList` ainda carrega
- Melhor progressão visual
- Usuário vê conteúdo conforme fica pronto

**Quando usar:**
- Dashboard com múltiplas seções
- Página com dados de múltiplas APIs
- Partes da página com velocidades diferentes

### 2. Suspense com Error Boundary

```tsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="text-red-800 font-bold">Erro ao carregar</h3>
      <p className="text-red-600">{error.message}</p>
      <button onClick={resetErrorBoundary}>Tentar novamente</button>
    </div>
  );
}

export default function Page() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingSkeleton />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
```

**Fluxo completo:**
- Loading → `<LoadingSkeleton />`
- Sucesso → `<DataComponent />`
- Erro → `<ErrorFallback />`

### 3. Múltiplos Componentes no Mesmo Suspense

```tsx
<Suspense fallback={<DashboardSkeleton />}>
  <UserStats />      {/* Carrega em paralelo */}
  <RecentOrders />   {/* Carrega em paralelo */}
  <Analytics />      {/* Carrega em paralelo */}
</Suspense>
```

**Atenção:**
- ⚠️ Todos os 3 precisam terminar de carregar para substituir o skeleton
- ⚠️ O componente mais lento bloqueia os outros
- ✅ Se quiser loading independente, use Suspense separado para cada um

**Exemplo melhor:**
```tsx
{/* Cada um carrega independentemente */}
<Suspense fallback={<UserStatsSkeleton />}>
  <UserStats />
</Suspense>

<Suspense fallback={<OrdersSkeleton />}>
  <RecentOrders />
</Suspense>

<Suspense fallback={<AnalyticsSkeleton />}>
  <Analytics />
</Suspense>
```

### 4. Lazy Loading de Componentes

```tsx
import { lazy, Suspense } from 'react';

// Carrega componente apenas quando necessário
const HeavyChart = lazy(() => import('./HeavyChart'));
const AdminPanel = lazy(() => import('./AdminPanel'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Mostrar Gráfico
      </button>
      
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

**Benefícios:**
- Reduz bundle inicial
- Carrega código sob demanda
- Melhora performance inicial

### 5. Suspense com Transitions (useTransition)

```tsx
'use client';

import { useState, useTransition, Suspense } from 'react';

function ProductSearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  
  function handleSearch(e) {
    const newQuery = e.target.value;
    
    // Marca atualização como não-urgente
    startTransition(() => {
      setQuery(newQuery);
    });
  }
  
  return (
    <div>
      <input 
        type="text" 
        onChange={handleSearch}
        placeholder="Buscar produtos..."
        className={isPending ? 'opacity-50' : ''}
      />
      
      <Suspense fallback={<ProductsSkeleton />}>
        <ProductResults query={query} />
      </Suspense>
    </div>
  );
}
```

**Benefícios:**
- Input não trava durante busca
- Mostra indicador de loading (`isPending`)
- Melhor UX em buscas/filtros

---

## 📊 Comparação: Com vs Sem Suspense

| Aspecto | Sem Suspense | Com Suspense |
|---------|--------------|--------------|
| **Código** | `if (loading) return <Spinner />` | `<Suspense fallback={<Skeleton />}>` |
| **Estados** | Gerenciar `isLoading`, `isError` manualmente | Suspense gerencia automaticamente |
| **UX** | Spinner genérico ou tela vazia | Skeleton que imita layout final |
| **Performance** | Tela vazia até carregar tudo | Streaming progressivo |
| **Granularidade** | Difícil ter loading por seção | Fácil com Suspense aninhado |
| **SSR** | Bloqueia toda a página | Streaming HTML progressivo |
| **Bundle Size** | Todo código no bundle inicial | Lazy loading fácil com `React.lazy` |
| **Manutenção** | Lógica de loading espalhada | Centralizada nos boundaries |

---

## 🚀 Quando Usar Suspense?

### ✅ Use Suspense quando:

- **Carregando dados de API/banco de dados**
  ```tsx
  <Suspense fallback={<ProductsSkeleton />}>
    <ProductList />
  </Suspense>
  ```

- **Lazy loading de componentes**
  ```tsx
  const AdminPanel = lazy(() => import('./AdminPanel'));
  <Suspense fallback={<Spinner />}>
    <AdminPanel />
  </Suspense>
  ```

- **Quer melhor UX com skeletons**
  - Imitar layout final
  - Reduzir sensação de espera

- **Precisa de streaming SSR**
  - Next.js com Server Components
  - Conteúdo progressivo

- **Múltiplas seções que carregam independentemente**
  - Dashboard com várias partes
  - Página com múltiplas APIs

### ❌ Não use Suspense para:

- **Animações/transições CSS**
  ```tsx
  // ❌ Não use Suspense
  <div className="animate-fade-in">...</div>
  
  // ✅ Use CSS ou Framer Motion
  ```

- **Loading de imagens normais**
  ```tsx
  // ❌ Não use Suspense
  <Suspense fallback={...}>
    <img src="..." />
  </Suspense>
  
  // ✅ Use loading nativo
  <Image src="..." loading="lazy" />
  ```

- **Estados de formulário**
  ```tsx
  // ❌ Não use Suspense
  <Suspense fallback={...}>
    <ContactForm />
  </Suspense>
  
  // ✅ Use React Hook Form ou estado local
  const [isSubmitting, setIsSubmitting] = useState(false);
  ```

- **Loading de assets estáticos**
  - CSS, fontes → usar preload
  - Imagens → usar `<Image>` do Next.js

---

## 🎓 Exemplos Práticos do Projeto

### Exemplo Real 1: Home Page

**Arquivo:** `src/app/page.tsx`

```tsx
import { Suspense } from 'react';
import { ProductGrid } from '@/components/product-grid';

function ProductGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-muted animate-pulse rounded-lg w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Featured Products</h1>
        <p className="text-muted-foreground">
          Discover our curated collection of premium products
        </p>
      </div>
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductGrid />
      </Suspense>
    </div>
  );
}
```

**Por que funciona bem:**
- ✅ Título/descrição aparecem imediatamente (não bloqueados)
- ✅ Skeleton mostra 6 cards (mesmo número que aparecerá)
- ✅ Grid layout igual ao final
- ✅ Animação `animate-pulse` do Tailwind

### Exemplo Real 2: Product Detail Page

**Arquivo:** `src/app/products/[id]/page.tsx`

```tsx
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

async function ProductDetailContent({ id }: { id: string }) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="object-cover rounded-lg"
          />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-bold">${product.price}</p>
          <p className="text-muted-foreground">{product.description}</p>
          <button className="w-full bg-primary text-white py-3 rounded-lg">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 animate-pulse">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-20 bg-muted rounded" />
              <div className="h-10 bg-muted rounded w-full" />
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent id={params.id} />
    </Suspense>
  );
}
```

**Por que funciona bem:**
- ✅ Skeleton imita exatamente o layout final (2 colunas)
- ✅ Proporções corretas (imagem quadrada, botão cheio)
- ✅ Usuário vê estrutura antes dos dados
- ✅ Query de banco com `include` suspende automaticamente

---

## 🧪 Testing

### Como testar Suspense

```tsx
import { render, screen } from '@testing-library/react';
import { Suspense } from 'react';

test('shows fallback while loading', async () => {
  render(
    <Suspense fallback={<div>Loading...</div>}>
      <AsyncComponent />
    </Suspense>
  );
  
  // Verifica que fallback aparece
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  
  // Espera componente carregar
  await waitFor(() => {
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
```

---

## 📚 Recursos Adicionais

- [React Docs - Suspense](https://react.dev/reference/react/Suspense)
- [Next.js Docs - Loading UI](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [TanStack Query - Suspense](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

---

## 📝 Resumo

**React Suspense permite:**

1. ✅ **Declarar** onde mostrar loading (não gerenciar estados manualmente)
2. ✅ **Skeletons** profissionais que imitam o layout final
3. ✅ **Streaming SSR** no Next.js (FCP mais rápido)
4. ✅ **Loading granular** (cada seção independente)
5. ✅ **Código mais limpo** (sem `if (loading)` em todo lugar)
6. ✅ **Melhor UX** (conteúdo progressivo, menos tela vazia)
7. ✅ **Lazy loading** fácil com `React.lazy()`

**No projeto atual:**

- ✅ Home page usa Suspense para product grid
- ✅ Product detail page usa Suspense para detalhes do produto
- ✅ Skeletons com `animate-pulse` do Tailwind
- ✅ Server Components com `await` automático
- ✅ Streaming SSR habilitado automaticamente

**Próximos passos:**

1. Adicionar Suspense em mais páginas (admin dashboard, orders)
2. Criar biblioteca de skeletons reutilizáveis
3. Implementar Error Boundaries para tratamento de erros
4. Monitorar métricas de performance (FCP, LCP)

---

**Status:** ✅ Suspense implementado e funcionando
**Versão:** React 19 + Next.js 15
**Última atualização:** Janeiro 2026
