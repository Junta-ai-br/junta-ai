# Conversa e metas: escolhas e saldo disponivel

Base: frontend 581ad1f. Requer os incrementos correspondentes do backend (base 783e33b) e AI Service (base 46dbb39).

A conversa preserva texto livre. As escolhas de origem existentes passam a usar rotulos cotidianos; confirmacao, cancelamento e metas reais usam o mesmo transporte quickReply. Os IDs, pendencia e conversa continuam vinculados. display_label serve apenas para mostrar o nome da meta, nunca para autorizar uma operacao. Cliques repetidos compartilham o bloqueio de envio e a identidade da tentativa; opcoes antigas ou com mais de dez minutos ficam inativas. O backend continua sendo a autoridade.

O painel Guardado consome, na mesma consulta ja existente, saved, availableBalance, totalTracked e reservationInconsistent. Os novos valores preservam os lexemas decimais e sao conferidos em centavos inteiros. Dados ausentes nao viram zero. O saldo do periodo, receitas, despesas e Health Score mantem as regras anteriores. A consulta e invalidada apos movimentacoes confirmadas ou de resultado incerto, alteracoes de metas e respostas do chat, respeitando o dono da sessao.

Exemplo: receita acumulada de 2000, reserva de 150, disponivel de 1850 e total acompanhado de 2000. Reservas antigas acima dos registros aparecem com aviso; nao ha ajuste automatico de historico. Dinheiro ainda nao registrado exige registrar a entrada e depois solicitar a reserva separadamente.

Validacao: testes de contrato, teclado, escolhas antigas, cliques repetidos, isolamento de sessao, atualizacao financeira e precisao monetaria. A inspecao visual usa componentes reais com dados sinteticos em desktop/mobile e temas claro/escuro; nao e um teste ponta a ponta em producao.
