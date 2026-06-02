# Modelo Estilo "Dark Elegante Dinâmico" 🌌🎨

Este guia documenta o estilo **Dark Elegante Dinâmico** utilizado nas páginas de **Contratos & Propostas** e **Ordem de Serviço**. Este modelo se destaca pelo uso de cores semânticas ativas (Roxo, Verde, Azul, Amarelo), frames e cabeçalhos dinâmicos baseados no contexto ativo, e botões estilizados que acompanham essa mudança de cor.

---

## 🎭 1. O Conceito: Identidade Visual Dinâmica por Contexto

O layout escuro se adapta ao contexto ativo da página (geralmente alternado por abas ou filtros). Por exemplo:
- **Contexto "Proposta"**: Utiliza o tema **Roxo/Azul** (Gradients Purple/Blue).
- **Contexto "Contrato"**: Utiliza o tema **Verde/Azul** (Gradients Green/Blue).
- **Contexto Geral**: Fontes coloridas e bordas de status indicando o estado de cada card.

---

## 🎛️ 2. Alternador de Abas Dinâmico (Tabs List)

As abas mudam de cor conforme a aba ativa (`data-[state=active]`):

```tsx
<TabsList className="grid w-full grid-cols-2 p-1 bg-muted dark:bg-slate-900/60 border border-border">
  {/* Aba Roxo/Azul para Propostas */}
  <TabsTrigger
    value="propostas"
    className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
  >
    Propostas de Contratos
  </TabsTrigger>
  
  {/* Aba Verde/Azul para Contratos */}
  <TabsTrigger
    value="contratos"
    className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
  >
    Contratos Ativos
  </TabsTrigger>
</TabsList>
```

---

## 🖼️ 3. Cabeçalho da Lista / Tabela com Frame Colorido (Header Frame)

O topo das tabelas e listas recebe um background degradê (Frame) que acompanha a cor do contexto ativo:

### Frame Roxo (Contexto Propostas)
```tsx
<CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-blue-900/50 dark:to-purple-900/50 dark:border-b dark:border-border">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
        <FileText className="h-5 w-5" />
        Propostas de Contratos
      </CardTitle>
      <CardDescription className="text-blue-100 text-sm">
        21 propostas encontradas
      </CardDescription>
    </div>
    {/* Botão em harmonia com o Frame */}
    <Button className="bg-white text-blue-600 hover:bg-blue-50 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800">
      Nova Proposta
    </Button>
  </div>
</CardHeader>
```

### Frame Verde (Contexto Contratos)
```tsx
<CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-green-900/50 dark:to-blue-900/50 dark:border-b dark:border-border">
  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
    <div>
      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
        <FileCheck className="h-5 w-5" />
        Contratos Ativos
      </CardTitle>
      <CardDescription className="text-green-100 text-sm">
        14 contratos ativos encontrados
      </CardDescription>
    </div>
    {/* Botão em harmonia com o Frame */}
    <Button className="bg-white text-green-600 hover:bg-green-50 dark:bg-slate-900 dark:text-green-400 dark:hover:bg-slate-800">
      Novo Contrato
    </Button>
  </div>
</CardHeader>
```

---

## 📇 4. Cards de Estatísticas com Cores Semânticas e Bordas Ativas

Diferente do Dashboard tradicional que usa fontes brancas/cinzas, no estilo dinâmico, os títulos dos cards, números e bordas acompanham as cores das variáveis ativas:

### Card Azul (Totalizadores)
```tsx
<Card className="border border-border shadow-xs hover:border-blue-500/30 transition-all duration-200 bg-card cursor-pointer select-none ring-2 ring-blue-500/40">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-blue-600 dark:text-blue-400 text-xs lg:text-sm font-medium">Total Propostas</p>
        <p className="text-lg lg:text-2xl font-bold text-foreground">21</p>
      </div>
      <FileText className="h-8 w-8 text-blue-500" />
    </div>
  </CardContent>
</Card>
```

### Card Amarelo (Rascunhos / Alertas Intermediários)
```tsx
<Card className="border border-border shadow-xs hover:border-yellow-500/30 transition-all duration-200 bg-card cursor-pointer select-none">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-yellow-600 dark:text-yellow-400 text-xs lg:text-sm font-medium">Rascunhos</p>
        <p className="text-lg lg:text-2xl font-bold text-foreground">5</p>
      </div>
      <Edit className="h-8 w-8 text-yellow-500" />
    </div>
  </CardContent>
</Card>
```

### Card Roxo (Ações / Enviados)
```tsx
<Card className="border border-border shadow-xs hover:border-purple-500/30 transition-all duration-200 bg-card cursor-pointer select-none">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-purple-600 dark:text-purple-400 text-xs lg:text-sm font-medium">Enviadas</p>
        <p className="text-lg lg:text-2xl font-bold text-foreground">2</p>
      </div>
      <Calendar className="h-8 w-8 text-purple-500" />
    </div>
  </CardContent>
</Card>
```

### Card Verde (Sucesso / Ativos)
```tsx
<Card className="border border-border shadow-xs hover:border-green-500/30 transition-all duration-200 bg-card cursor-pointer select-none">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-green-600 dark:text-green-400 text-xs lg:text-sm font-medium">Contratos Ativos</p>
        <p className="text-lg lg:text-2xl font-bold text-foreground">14</p>
      </div>
      <CheckCircle className="h-8 w-8 text-green-500" />
    </div>
  </CardContent>
</Card>
```

---

## 🗂️ 5. Campos de Filtro Integrados

O card de filtros possui um título gradiente correspondente ao contexto:

```tsx
<Card className="border border-border shadow-md bg-card">
  <CardHeader className="p-6 pb-3">
    {/* Título com degradê sutil do contexto */}
    <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
      Buscar e Filtrar Propostas
    </CardTitle>
  </CardHeader>
  {/* Conteúdo */}
</Card>
```
