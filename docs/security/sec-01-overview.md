# SEC-01 · Overview

| Campo | Valor |
|--------|-------|
| **Documento** | SEC-01 |
| **Título** | Overview |
| **Versão** | 1.1 |
| **Status** | Controles implementados; validação operacional pendente |
| **Última atualização** | 05/11/2026 |
| **Responsável** | Equipe Junta.ai |

---

# Visão Geral

A segurança faz parte do desenvolvimento do Junta.ai desde o início do projeto.

Mesmo durante as primeiras versões da aplicação, buscamos adotar boas práticas que contribuam para proteger os usuários, seus dados e a própria plataforma.

Este documento apresenta princípios, controles observáveis no código e limites das evidências disponíveis. A revisão documental não equivale a auditoria, teste de invasão ou validação do ambiente implantado.

---

# Nosso compromisso

O Junta.ai busca desenvolver uma aplicação que seja:

- segura;
- confiável;
- transparente;
- respeitosa com os dados dos usuários.

A segurança não deve ser tratada como uma etapa final do desenvolvimento, mas como uma preocupação presente em todas as fases do projeto.

---

# Categorias de proteção

O código consultado apresenta controles nas seguintes áreas:

- autenticação e controle de acesso;
- validação de entradas e regras de negócio;
- gerenciamento de sessões;
- integridade das operações financeiras, incluindo prevenção de duplicidade em fluxos específicos;
- proteção dos formulários públicos contra uso indevido;
- separação entre interpretação por IA e execução financeira autoritativa no backend.

Essas categorias descrevem controles implementados em escopos específicos. Não constituem garantia de proteção integral da aplicação. Configurações e mecanismos operacionais não fazem parte desta visão pública.

## Estados de validação

| Estado | O que esta revisão permite afirmar |
|---|---|
| Implementado | Foram observadas evidências no código para as categorias acima. |
| Testado | Há cenários automatizados relacionados a esses controles; sua existência não comprova aprovação. Não foram executados testes nesta revisão documental. |
| Validado em ambiente implantado | Não confirmado nesta revisão. Exige evidências do ambiente e dos fluxos avaliados. |
| Planejado ou pendente | Consolidação das evidências de testes e da validação operacional, além da evolução contínua dos controles. |

As referências a boas práticas, incluindo OWASP e privacidade, não representam declaração de conformidade integral com OWASP, LGPD, WCAG ou qualquer certificação.

---

# Como utilizaremos esta documentação

A pasta **Security** será utilizada como referência para decisões relacionadas à proteção da aplicação.

Seu objetivo é registrar as práticas adotadas pelo projeto e orientar futuras implementações relacionadas à segurança.

---

## Histórico de versões

| Versão | Data | Alterações |
|---------|------|------------|
| **1.0** | 01/08/2026 | Criação inicial do documento. |
| **1.1** | 05/11/2026 | Categorias gerais de proteção, estados de validação e revisão da divulgação pública. |
