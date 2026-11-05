# Planejador e metas financeiras

## 1. Objetivo e benefício

Permitir que o usuário explore um objetivo financeiro, estime um ritmo de contribuição e acompanhe suas metas.

## 2. Descrição funcional

O planejador permite informar nome, valor e prazo do objetivo e explorar cenários com ou sem histórico financeiro. Uma simulação salva pode ser posteriormente adicionada às metas do usuário.

## 3. Principais capacidades existentes

- Simular objetivos com base no mês atual, nos últimos 30 dias, na média dos últimos três meses ou sem histórico.
- Explorar o valor mensal e o prazo estimado para alcançar o objetivo.
- Salvar simulações, consultar seus detalhes no histórico e excluí-las.
- Criar uma meta a partir de uma simulação salva, mediante ação do usuário.
- Criar metas, consultar valores e progresso e acompanhar sua situação e prazo, quando informado.

## 4. Regras e comportamentos relevantes

Simulação, meta e aporte são conceitos distintos. Salvar uma simulação não cria automaticamente uma meta nem movimenta dinheiro. A criação de uma meta a partir da simulação exige uma ação própria; os prazos apresentados são estimativas, não garantias de resultado.

## 5. Limitações e estados ainda não validados

Cenários baseados em histórico dependem das movimentações disponíveis. As estimativas não garantem capacidade futura de poupança. A integração completa e o funcionamento em produção não foram validados neste levantamento; não foram executados testes nesta revisão documental.

## 6. Estado atual

**Implementado** para simulação, histórico, criação de meta a partir de simulação e acompanhamento observados no código.

[Voltar ao índice de funcionalidades](README.md).
