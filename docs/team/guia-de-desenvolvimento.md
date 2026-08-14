# 🛠️ Guia de Desenvolvimento

Este documento reúne as principais práticas que vamos seguir durante o desenvolvimento do **Junta.ai**.

O objetivo não é criar burocracia, mas facilitar a colaboração da equipe, manter o projeto organizado e evitar conflitos de código.

---

# 🌳 Fluxo de trabalho

## Branch `main`

A branch `main` representa sempre a versão mais estável do projeto.

Ela deve conter apenas código validado, revisado e pronto para demonstrações ou deploy.

> **Nunca desenvolva diretamente na `main`.**

---

## Branchs de desenvolvimento

Cada funcionalidade deve ser desenvolvida em uma branch própria.

### Exemplos

```text
feature/login
feature/dashboard
feature/chat
feature/settings
feature/design-system
feature/problem-section
```

### Convenções

| Prefixo | Quando utilizar |
|----------|-----------------|
| `feature/` | Nova funcionalidade |
| `fix/` | Correção de bugs |
| `refactor/` | Reorganização ou melhoria de código |
| `docs/` | Documentação |
| `test/` | Testes |
| `hotfix/` | Correções urgentes |

---

# 🔄 Antes de começar

Sempre atualize sua branch antes de iniciar uma nova implementação.

```bash
git checkout main
git pull

git checkout sua-branch
git merge main
```

Assim você reduz a chance de conflitos futuros.

---

# ✅ Commits

Faça commits pequenos e frequentes.

Um commit deve representar uma pequena etapa concluída.

### Bons exemplos

- Criou um componente
- Ajustou um layout
- Corrigiu um bug
- Implementou uma funcionalidade
- Atualizou documentação

Evite trabalhar muitas horas sem realizar commits.

---

# 💬 Padrão de commits

Seguiremos o padrão **Conventional Commits**.

### Exemplos

```text
o-que-foi-feito(onde-foi): detalhe-o-que-foi-feito

feat(ui): adiciona componente Bubble

fix(navigation): corrige alinhamento do Header

style: ajusta espaçamento da Hero

refactor(components): reorganiza estrutura de componentes

docs(product): atualiza guia de desenvolvimento

test: adiciona testes do Hero

chore: atualiza dependências
```

---

# 📌 Checkpoints

Sempre que finalizar uma etapa importante do projeto, faça um commit antes de iniciar alterações maiores.

Exemplos:

- Estrutura da Landing pronta
- Hero finalizado
- Navbar concluída
- Design System implementado
- Dashboard funcional

Caso uma implementação futura apresente problemas, será muito mais fácil retornar ao último ponto estável.

---

# 📤 Push

Antes de enviar sua branch para o GitHub, confira:

- Projeto executa normalmente
- Não existem erros no console
- Código organizado
- Arquivos desnecessários removidos
- Commit realizado

Depois envie sua branch:

```bash
git push origin nome-da-branch
```

---

# 🔀 Pull Request

Quando sua funcionalidade estiver pronta, abra um **Pull Request (PR)** para solicitar a integração com a `main`.

Antes de criar o PR:

- Atualize sua branch com a `main`
- Resolva possíveis conflitos
- Verifique se tudo continua funcionando
- Revise seu próprio código

Ao abrir o Pull Request, escreva uma descrição simples informando:

- O que foi desenvolvido
- O que foi alterado
- O que deve ser testado (quando necessário)

Após a aprovação, o código poderá ser integrado à `main`.

---

# 🎨 Organização do projeto

Sempre que possível:

- Crie componentes pequenos e reutilizáveis
- Evite duplicação de código
- Utilize os componentes comuns existentes
- Utilize o Design System do projeto
- Mantenha uma estrutura de pastas organizada

---

# 🎯 CSS

Sempre que existir um token correspondente, utilize-o.

### Prefira

```css
padding: var(--spacing-6);
border-radius: var(--radius-xl);
color: var(--text-primary);
background: var(--surface);
```

### Evite

```css
padding: 18px;
border-radius: 12px;
color: #ffffff;
background: #181a22;
```

Isso mantém toda a interface consistente e facilita futuras alterações.

---

# 📱 Responsividade

Todo componente novo deve funcionar em diferentes tamanhos de tela.

Sempre teste pelo menos:

- Desktop
- Tablet
- Mobile

---

# 🤝 Comunicação

Caso uma alteração possa impactar outros integrantes da equipe, converse antes de modificar arquivos compartilhados.

Principalmente:

- Design System
- Componentes comuns
- Estrutura de pastas
- Rotas
- Configurações do projeto

Uma boa comunicação evita retrabalho.

---

# 🎯 Nosso objetivo

Mais importante do que escrever muito código é escrever um código que qualquer integrante da equipe consiga entender.

Vamos priorizar:

- Clareza
- Organização
- Reutilização
- Colaboração
- Aprendizado

Construir um bom projeto é um trabalho coletivo.

---

# 💜 Filosofia do projeto

Errar faz parte do processo.

Se tiver dúvidas, pergunte.

Se encontrar uma melhoria, compartilhe.

Se puder ajudar alguém da equipe, ajude.

Nosso objetivo é evoluir juntos enquanto construímos um produto bem estruturado.
