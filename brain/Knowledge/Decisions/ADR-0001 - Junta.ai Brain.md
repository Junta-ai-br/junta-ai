---
title: Establish the Junta.ai Brain
owner: Dani Dutra
status: Approved
created: 2026-07-25
updated:
domains:
tags:
---
## Context

A Junta.ai evoluiu de um projeto experimental para um produto em desenvolvimento contínuo.

A documentação encontrava-se distribuída entre arquivos Markdown, documentação técnica e notas de projeto, dificultando:

- localizar informações;
- registrar decisões arquiteturais;
- manter histórico das evoluções;
- fornecer contexto consistente para agentes de IA;
- preservar conhecimento do produto ao longo do tempo.

Era necessário estabelecer uma estrutura única para centralizar o conhecimento do projeto.

---

## Decision

Adotar oficialmente a **Knowledge Vault Architecture** como sistema de gestão do conhecimento da Junta.ai.

Foi criada a pasta `brain/` na raiz do repositório para concentrar toda a documentação interna do projeto.

A partir desta decisão:

- `brain/` torna-se a fonte oficial de conhecimento da Junta.ai;
- `docs/` permanece destinada à documentação pública e técnica voltada aos desenvolvedores;
- decisões arquiteturais passam a ser registradas como ADRs;
- pesquisas, estudos, referências e documentação de produto passam a ser organizados dentro do Brain.

---

## Consequences

### Positivas

- Centralização do conhecimento.
- Histórico das decisões do projeto.
- Melhor contexto para agentes de IA.
- Facilidade para onboarding de novos colaboradores.
- Separação clara entre documentação pública e conhecimento interno.

### Negativas

- Necessidade de manter o Brain atualizado.
- Maior disciplina na documentação das decisões.

---

## Related

- [[Knowledge Index]]
- [[Vision]]
- [[Architecture]]

---

## Notes

O Brain deve evoluir continuamente junto com o produto, tornando-se a memória institucional da Junta.ai.