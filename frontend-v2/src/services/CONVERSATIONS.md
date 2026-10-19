# Conversa real — checkpoint frontend

Usa o cliente HTTP autenticado existente. Não chama IA/MCP diretamente nem cria
transações, metas, categorias ou persistência local a partir de texto.

- GET /conversations: lista ordenada pelo backend; abre a conversa mais recente.
- POST /conversations com {}: cria somente ao primeiro envio de uma conversa nova.
- GET /conversations/{uuid}/messages: histórico persistido; USER/ASSISTANT são
  exibidos, SYSTEM não é apresentado como resposta do assistente.
- POST /conversations/{uuid}/messages com {message}: texto literal até 2000
  unidades UTF-16, Idempotency-Key UUID v4, resposta ChatReplyResponse.

Somente actionExecuted=true gera o aviso de execução confirmada. false não prova
rollback: pode ser composição/recuperação de uma operação anterior. O texto da
IA nunca dispara outra gravação. O histórico não inclui esse booleano e não
reconstrói confirmação financeira a partir de palavras.

O envio tem trava síncrona. Timeout é 65s para comportar as duas chamadas IA e a
janela padrão de processamento de 60s do backend. Não há retry automático. Uma
resposta perdida mantém chave, conversa e corpo somente em memória, por geração;
“Retomar envio anterior” reutiliza os três. Novo envio intencional usa nova chave.
Falha terminal message_processing_failed permite corrigir/submeter explicitamente.
Resultado incerto bloqueia novas intenções até a retomada; histórico pode ser
reconsultado sem escrita. Criação perdida exige reconciliação da lista antes de
outro POST de criação. Recarregar a página perde a chave em memória: consultar o
histórico antes de repetir intenção; não se promete idempotência entre reloads.

Logout, nova geração (mesmo token) e unmount abortam a lease. Callbacks antigos
não publicam mensagens/rascunhos nem enviam como outro usuário. Sem logs de
tokens, chaves ou conteúdo. Os cartões/metas do Assistente continuam como dados
locais de demonstração, explicitamente separados do chat e da Visão do mês real.

Disponibilidade verificada neste checkpoint: VITE_API_URL local aponta para
http://localhost:8080; backend espera IA em http://localhost:8000 por padrão.
GET /actuator/health e GET /health não conectaram. Nenhum endpoint publicado foi
identificado na configuração consultada; não houve comprovação em produção ou
teste autenticado ponta a ponta com Gemini. CORS do backend permite Authorization,
Content-Type e Idempotency-Key; origem padrão é http://localhost:5173.

O runtime MCP experimental existente bloqueia ActionRequest financeira por gate
normativo; contribuição a meta/recorrência e os fluxos sem definição semântica
seguem as limitações da SPEC 002. O frontend não altera esse gate nem o contorna.
É necessário subir/configurar backend, banco e IA/credenciais e validar o perfil
habilitado antes de afirmar disponibilidade de execução financeira no ambiente.
