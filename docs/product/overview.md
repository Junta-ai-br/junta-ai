# Product-01 · Overview

| Campo | Valor |
|--------|-------|
| **Documento** | Product-01 |
| **Título** | Overview |
| **Versão** | 1.1 |
| **Status** | Visão de produto com escopo do MVP explicitado |
| **Última atualização** | 05/11/2026 |
| **Responsável** | Equipe Junta.ai |

---

# Visão Geral

O Junta.ai é uma plataforma de organização financeira que utiliza inteligência artificial para transformar conversas em ações práticas.

Em vez de depender de planilhas complexas ou aplicativos difíceis de utilizar, a proposta é permitir que o usuário converse naturalmente com um assistente que o ajude a registrar movimentações, compreender sua situação financeira, acompanhar metas e construir hábitos mais conscientes ao longo do tempo.

Nosso objetivo não é apenas organizar informações financeiras, mas tornar essa experiência mais simples, acessível e tranquila para qualquer pessoa.

---

# Nossa proposta

O Junta.ai foi criado para tornar a organização financeira mais humana.

Acreditamos que conversar sobre dinheiro pode ser mais simples do que aprender a utilizar ferramentas complexas. Por isso, colocamos a conversa no centro da experiência e utilizamos a inteligência artificial como uma facilitadora, nunca como uma substituta das decisões do usuário.

A tecnologia existe para reduzir barreiras, não para criar novas.

---

# O problema que queremos resolver

Muitas pessoas desejam organizar melhor suas finanças, mas acabam desistindo por diferentes motivos.

Algumas consideram planilhas complicadas.

Outras se sentem sobrecarregadas por aplicativos cheios de gráficos e funcionalidades difíceis de compreender.

Também existem usuários que simplesmente não sabem por onde começar.

O Junta.ai busca oferecer uma alternativa mais simples: transformar uma conversa em um ponto de partida para desenvolver uma relação mais consciente com o próprio dinheiro.

---

# Como o Junta.ai funciona

No fluxo conversacional do MVP, é necessário distinguir:

1. **Mensagem:** o usuário informa o que deseja organizar ou consultar.
2. **Interpretação:** o assistente busca compreender a solicitação e pode pedir esclarecimentos.
3. **Confirmação:** quando necessário, o usuário complementa ou confirma as informações da operação.
4. **Registro:** uma operação só deve ser apresentada como concluída após a confirmação de que foi efetivamente registrada.

Nem toda mensagem financeira resulta em uma operação persistida. A experiência conversacional depende das integrações disponíveis e pode apresentar falhas. Sua validação completa no ambiente implantado permanece a confirmar.

## Escopo atual e evolução

O código do MVP contempla conversas e histórico, receitas e despesas por categoria, metas financeiras, dashboard, relatórios e gerenciamento de conta. A presença desses recursos no código não comprova disponibilidade integral em produção.

Recomendações contínuas, lembretes proativos e automações abrangentes permanecem como evolução de produto, sem validação operacional consolidada nesta revisão. O MVP não depende de Open Finance. O estado das tecnologias de IA é descrito na [visão geral de IA](../ai/ai-overview.md).

O usuário continua sendo responsável por suas escolhas. O papel do Junta.ai é oferecer apoio, contexto e organização.

---

# Público-alvo

O Junta.ai foi pensado para pessoas que desejam organizar melhor sua vida financeira, independentemente do seu nível de conhecimento sobre finanças.

O produto prioriza usuários que procuram uma experiência simples, intuitiva e acolhedora, sem exigir conhecimentos técnicos ou financeiros avançados.

---

# O papel da Inteligência Artificial

A inteligência artificial é parte da experiência, mas não o centro do produto.

Seu papel é auxiliar a interpretação das conversas e a organização das informações, respeitando os fluxos suportados. Respostas contextualizadas não comprovam acompanhamento contínuo ou recomendações proativas já validadas.

As decisões continuam sendo do usuário.

---

# O que você encontrará nesta documentação

A documentação do Junta.ai está organizada para facilitar o entendimento do produto e do projeto.

Cada documento responde a uma pergunta específica, evitando informações repetidas e tornando a navegação mais simples para toda a equipe.

Nos próximos documentos você encontrará informações sobre:

- Visão do produto
- Filosofia do Junta.ai
- Princípios que orientam as decisões
- Público-alvo
- Jornada do usuário
- Escopo e limites do MVP, descritos nesta visão geral

Consulte o [índice de funcionalidades](features/README.md) para as capacidades detalhadas, o [estado do MVP](mvp-status.md) para a fotografia de implementação e validação e o [roadmap](roadmap.md) para as direções de evolução. A [jornada do usuário](user-journey.md) distingue a experiência desejada das capacidades atuais.

---

## Histórico de versões

| Versão | Data | Alterações |
|---------|------|------------|
| **1.0** | 01/08/2026 | Criação inicial do documento. |
| **1.1** | 05/11/2026 | Distinção entre experiência desejada, MVP implementado e validações pendentes. |
