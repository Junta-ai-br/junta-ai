# SEC-02 · Autenticação 

| Campo                  | Valor          |
| :--------------------- | :------------- |
| **Documento**          | SEC-02         |
| **Título**             | Authentication |
| **Versão**             | 1.0            |
| **Status**             | Em Validação técnica |
| **Última atualização** | 13/08/2026     |
| **Responsável**        | Larissa Gama Alecrim      |

---
## 1. Visão geral

A autenticação tem como objetivo garantir que o sistema consiga identificar de forma segura o usuário que está acessando o Junta.ai.

Como o produto trabalha com informações pessoais e financeiras, cada conta deve possuir uma identidade única e seus dados devem estar associados exclusivamente a essa identidade.

A experiência do usuário deve permanecer simples e intuitiva, mantendo os mecanismos de segurança preferencialmente nos bastidores, sem comprometer os controles necessários no backend.

> **Nota:** autenticação, sessão e autorização são controles relacionados, mas distintos. A autenticação verifica **quem é o usuário**; a sessão mantém o estado autenticado; a autorização verifica **o que esse usuário pode acessar ou executar**.

## 2. Princípios de segurança

### 2.1 Identidade única do usuário

Cada usuário deve possuir um identificador interno único (`user_id`).

O nome não deve ser utilizado como identificador, pois nomes não são necessariamente únicos e podem ser alterados.

O `user_id` deve ser definido e controlado pelo backend ou pelo provedor de identidade adotado. O cliente não deve poder escolher ou alterar o identificador utilizado para acessar recursos.

O identificador deve ser utilizado para associar:

- Dados financeiros;
- Metas;
- Histórico de conversas, quando aplicável;
- Preferências;
- Configurações;
- Demais informações pertencentes ao usuário.

Quando um identificador precisar ser exposto ao cliente, recomenda-se utilizar um identificador não previsível, como UUID, sem depender da imprevisibilidade do ID como mecanismo de autorização.

### 2.2 Onboarding não é autenticação

As informações coletadas durante o onboarding, como:

- Como você se chama?
- Qual sua renda mensal?
- Qual seu objetivo?

servem para personalizar a experiência, mas não comprovam a identidade do usuário.

O onboarding deve ser tratado como etapa de cadastro e personalização, e não como mecanismo de autenticação ou autorização.

### 2.3 Sessão vinculada ao usuário autenticado

Cada sessão deve estar vinculada a uma identidade de usuário específica.

As requisições realizadas durante uma sessão devem ser associadas ao usuário autenticado a partir de uma credencial de sessão validada pelo backend.

O sistema **não deve confiar em um `user_id` enviado livremente pelo frontend** para determinar a identidade do usuário.

O backend deve:

1. Validar a sessão ou token de autenticação;
2. Identificar o usuário autenticado;
3. Aplicar as regras de autorização;
4. Acessar somente os recursos pertencentes ao usuário autorizado.

Após o login, a sessão deve ser renovada ou estabelecida de forma segura, evitando reutilização de identificadores de sessão anteriores.

### 2.4 O chatbot não deve ser responsável pela autenticação

O modelo de IA não deve determinar a identidade do usuário.

A identificação e a autenticação devem ser realizadas por componentes confiáveis da aplicação antes que informações protegidas sejam disponibilizadas ao chatbot.

O chatbot deve receber somente o contexto e os dados que a aplicação já autorizou para aquela sessão e para aquele usuário.

### 2.5 O chatbot não deve possuir autoridade sobre acesso aos dados

A IA não deve decidir se um usuário possui ou não permissão para acessar determinado dado.

A autorização deve ocorrer em uma camada controlada da aplicação, preferencialmente no backend e junto à camada de acesso aos dados.

A aplicação deve tratar o modelo como um componente **não confiável para decisões de segurança**.

Uma instrução enviada ao chatbot, mesmo que tente alterar regras, assumir outra identidade ou solicitar dados de outro usuário, não pode conceder acesso que o usuário autenticado não possui.

### 2.6 Princípio do menor privilégio

Cada componente deve possuir somente as permissões necessárias para executar sua função.

Isso inclui o chatbot, o serviço de IA, APIs, banco de dados e demais serviços internos.

O serviço de IA não deve possuir acesso direto e irrestrito ao banco de dados. Quando precisar consultar ou alterar informações, deve utilizar funções ou endpoints controlados pela aplicação, com escopo e autorização definidos no backend.

## 3. Autenticação, autorização e fluxo de dados

O fluxo conceitual recomendado é:

```text
┌──────────────┐
│   Frontend   │
│   React/UI   │
└──────┬───────┘
       │ credencial de sessão
       ▼
┌─────────────────────────┐
│      Backend / API      │
│                         │
│ AuthN → AuthZ → regras  │
└──────┬───────────┬──────┘
       │           │
       │           ▼
       │     ┌──────────────┐
       │     │ Banco de     │
       │     │ dados        │
       │     └──────────────┘
       │
       ▼
┌─────────────────────────┐
│ Serviço de IA / CrewAI  │
│                         │
│ contexto autorizado     │
│ + ferramentas limitadas │
└─────────────────────────┘
```

### Regra fundamental

O caminho de acesso aos dados deve ser controlado pelo backend.

**Frontend → Backend → Autorização → Dados**

e, quando houver IA:

**Frontend → Backend → Autorização → Contexto permitido → Serviço de IA**

O serviço de IA não deve contornar a camada de autorização para acessar dados diretamente.

## 4. Proteção dos dados financeiros

Os dados financeiros devem receber proteção elevada devido ao seu caráter pessoal e ao potencial impacto de um acesso ou alteração indevida.

### 4.1 Confidencialidade

Um usuário não deve conseguir visualizar:

- Informações financeiras de outro usuário;
- Metas de outro usuário;
- Histórico de conversas de outro usuário;
- Preferências ou configurações privadas de outra conta;
- Qualquer outro recurso protegido pertencente a outra identidade.

As verificações de autorização devem ocorrer no servidor para cada operação protegida.

### 4.2 Integridade

O sistema deve impedir alterações não autorizadas nos dados financeiros.

As informações apresentadas ao usuário devem corresponder aos dados efetivamente registrados pelo sistema.

Operações de criação, alteração e exclusão devem possuir autorização explícita e validação server-side.

### 4.3 Disponibilidade

O usuário deve conseguir acessar seus próprios dados, histórico e metas dentro da disponibilidade esperada pelo produto.

Falhas de autenticação ou autorização não devem resultar em exposição de dados ou em comportamento de `fail open`. Em caso de dúvida sobre a autorização, o acesso deve ser negado.

## 5. Mecanismo de autenticação

O mecanismo de autenticação ainda deve ser definido com o time responsável pelo produto e pela arquitetura.

Possibilidades a serem avaliadas:

- Login com Google;
- Login com Apple;
- Autenticação por e-mail e senha;
- Login por link mágico (magic link);
- Outro provedor de identidade adequado à arquitetura escolhida.

A decisão deve considerar:

- Segurança;
- Experiência do usuário;
- Recuperação de conta;
- Gerenciamento de sessão;
- Privacidade;
- Proteção contra abuso e ataques automatizados;
- Complexidade de implementação e manutenção;
- Integração com o backend e com os demais serviços.

**Status: A definir com o time.**

> **Recomendação:** sempre que possível, utilizar um provedor ou solução de autenticação madura em vez de implementar do zero o gerenciamento de credenciais, recuperação de conta e sessões.

## 6. Gestão de sessão

A estratégia de sessão deve ser definida junto com o mecanismo de autenticação.

Devem ser especificados, no mínimo:

- Como a sessão será criada após a autenticação;
- Como a sessão será armazenada no cliente;
- Expiração por inatividade;
- Expiração absoluta, quando aplicável;
- Renovação da sessão;
- Invalidação no logout;
- Invalidação após eventos críticos, como alteração de credenciais;
- Tratamento de múltiplas sessões/dispositivos, quando aplicável.

Se forem utilizados cookies para sessão, devem ser avaliados os atributos `HttpOnly`, `Secure` e `SameSite`, além da proteção contra CSRF quando aplicável.

Se forem utilizados tokens, devem ser definidos:

- Assinatura e validação;
- Expiração;
- Emissor (`iss`);
- Audiência (`aud`), quando aplicável;
- Escopos/permissões;
- Estratégia de renovação e revogação.

O identificador de sessão ou token não deve conter dados pessoais ou informações sensíveis desnecessárias.

## 7. Recuperação de conta e proteção contra abuso

O fluxo de recuperação de conta deve ser tratado como parte do modelo de segurança e não apenas como funcionalidade de UX.

Devem ser definidos:

- Método de recuperação;
- Expiração e uso único dos tokens de recuperação;
- Invalidação após alteração de credenciais;
- Proteção contra enumeração de contas;
- Limitação de tentativas;
- Proteção contra ataques automatizados;
- Registro de eventos relevantes de segurança.

Mensagens de erro de autenticação e recuperação devem evitar revelar informações que permitam descobrir se determinada conta existe.

## 8. MFA e autenticação adicional

A necessidade de MFA (Multi-Factor Authentication) deve ser avaliada pelo time considerando o risco do produto e a sensibilidade das operações disponíveis.

Caso seja adotado, devem ser definidos:

- Quais usuários/operações exigem MFA;
- Método utilizado;
- Recuperação do segundo fator;
- Tratamento de perda do dispositivo;
- Fatores de contingência sem criar um bypass inseguro.

## 9. Transporte e proteção de credenciais

Toda comunicação envolvendo autenticação, sessão ou dados protegidos deve ocorrer por canal seguro utilizando HTTPS/TLS.

Credenciais não devem ser armazenadas em texto puro.

Quando a aplicação utilizar autenticação baseada em senha, o armazenamento das senhas deve ser realizado por mecanismo de hashing apropriado para senhas, nunca por criptografia reversível ou texto puro.

Segredos de aplicação, chaves de API e credenciais de serviços não devem ser armazenados no frontend, no repositório ou em arquivos públicos.

## 10. Autorização e prevenção de acesso indevido

A autenticação não concede automaticamente acesso a todos os recursos.

A autorização deve:

- Ser aplicada no backend;
- Utilizar o usuário autenticado como contexto de segurança;
- Validar o acesso ao recurso solicitado;
- Adotar princípio de menor privilégio;
- Negar acesso por padrão;
- Ser executada a cada requisição protegida;
- Impedir acesso horizontal entre contas;
- Impedir alterações de identificadores para acessar recursos de terceiros.

Exemplo de regra:

```text
GET /api/users/{user_id}/goals

Não basta verificar:
"usuário está autenticado?"

Também é necessário verificar:
"o recurso solicitado pertence ao usuário autenticado
ou o usuário possui explicitamente permissão para acessá-lo?"
```

O sistema não deve depender apenas de IDs difíceis de adivinhar como proteção. Mesmo com UUIDs, a autorização do recurso deve ser validada no servidor.

## 11. Segurança do chatbot e da IA

Como o Junta.ai utiliza IA para interpretar mensagens e apoiar operações relacionadas a dados financeiros, o modelo deve ser tratado como um componente não confiável para decisões de segurança.

A arquitetura deve considerar:

- Prompt injection;
- Tentativas de extração de informações de outros usuários;
- Manipulação de instruções;
- Acesso excessivo a ferramentas;
- Execução de operações sem autorização;
- Vazamento de contexto entre usuários;
- Exposição indevida de dados financeiros.

As ferramentas disponibilizadas ao agente devem possuir permissões mínimas e validações no backend.

Exemplo:

```text
Usuário autenticado
        │
        ▼
Backend identifica user_id
        │
        ▼
Backend valida autorização
        │
        ▼
Backend consulta dados permitidos
        │
        ▼
Contexto mínimo enviado à IA
        │
        ▼
IA interpreta / responde
```

A IA não deve receber mais dados do que os necessários para executar a tarefa solicitada.

## 12. Logs e auditoria

Eventos relevantes de autenticação e segurança devem ser registrados para permitir investigação de incidentes.

Devem ser considerados, no mínimo:

- Tentativas de login bem-sucedidas;
- Falhas de autenticação;
- Logout;
- Recuperação de conta;
- Alterações de credenciais;
- Falhas de autorização;
- Tentativas de acesso a recursos não permitidos;
- Eventos relevantes relacionados à sessão.

Logs não devem armazenar senhas, tokens de sessão, chaves de API ou dados financeiros desnecessários.

## 13. Pontos a validar com o time

- [ ] Qual mecanismo de autenticação será utilizado?
- [ ] O projeto utilizará provedor de identidade externo?
- [ ] Google, Apple, e-mail, magic link ou outra solução?
- [ ] Como os usuários serão identificados internamente?
- [ ] Qual será o formato do `user_id`?
- [ ] O `user_id` será gerado pelo provedor de identidade ou pela aplicação?
- [ ] Como as sessões serão gerenciadas?
- [ ] Cookie ou token?
- [ ] Qual será o tempo de expiração da sessão?
- [ ] Haverá renovação de sessão?
- [ ] Como será realizado o logout e a invalidação da sessão?
- [ ] Como será feita a recuperação de conta?
- [ ] Haverá MFA?
- [ ] Como serão protegidas as tentativas de login e recuperação?
- [ ] Quais dados estarão disponíveis para o chatbot?
- [ ] Quais ferramentas/funções o agente poderá executar?
- [ ] Como o backend fará a autorização por recurso?
- [ ] Onde serão implementadas as verificações de autorização?
- [ ] Como serão registrados eventos de segurança?
- [ ] Quais dados poderão aparecer nos logs?
- [ ] Como serão armazenados e protegidos os segredos da aplicação?

## 14. Critérios mínimos de aceitação

Antes de considerar a autenticação implementada, o sistema deve demonstrar que:

1. Um usuário autenticado não consegue acessar dados pertencentes a outro usuário;
2. Alterar um `user_id` enviado pelo cliente não permite acessar outra conta;
3. A IA não consegue obter dados de outro usuário por meio de prompt ou instrução maliciosa;
4. O backend realiza as verificações de autorização;
5. O logout invalida a sessão conforme a estratégia adotada;
6. Sessões expiradas não permitem acesso a recursos protegidos;
7. Credenciais e tokens não são expostos no frontend ou em logs;
8. Falhas de autenticação e autorização são registradas de forma adequada;
9. Operações protegidas possuem validação server-side;
10. Os testes de autorização cobrem, pelo menos, cenários de acesso entre usuários.

## 15. Observação

As definições acima representam os requisitos e princípios iniciais de segurança do Junta.ai.

As decisões relacionadas à implementação devem ser validadas com a arquitetura e com o restante do time antes de serem consideradas definitivas.

Este documento deve ser atualizado quando o mecanismo de autenticação, a estratégia de sessão, o provedor de identidade ou a arquitetura de acesso aos dados forem definidos.

## 16. Referências

As recomendações deste documento foram alinhadas principalmente às boas práticas da OWASP:

- OWASP Authentication Cheat Sheet
- OWASP Session Management Cheat Sheet
- OWASP Authorization Cheat Sheet
- OWASP Insecure Direct Object Reference Prevention Cheat Sheet
- OWASP Top 10:2025
- OWASP GenAI Security Project — LLM01:2025 Prompt Injection

## Histórico de versões

| Versão                 |Dados          |   	Alterações     | 
| :--------------------- | :------------- | :-------------     | 
| **1.0**          | 13/08/2026	         | 	Criação inicial do documento.   | 
	

