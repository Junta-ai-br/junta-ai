# Política de segurança

O Junta.ai é um projeto de curso em desenvolvimento que lida com dados financeiros pessoais. Levamos a segurança a sério e agradecemos relatos feitos de forma responsável.

## Como reportar uma vulnerabilidade

Use o **reporte privado do GitHub**:

1. Abra a aba **Security** deste repositório.
2. Clique em **Report a vulnerability**.
3. Descreva o problema (veja abaixo o que incluir).

Por favor, **não** abra issues ou pull requests públicos, nem divulgue detalhes da falha em redes sociais ou fóruns antes de ela ser corrigida. O relato fica visível só para a equipe responsável pela segurança.

## O que incluir no relato

- Descrição do problema e do impacto possível.
- Passos para reproduzir (URL, tela ou chamada envolvida).
- Evidência (captura de tela ou trecho de requisição), **sem dados pessoais reais** e sem senhas, tokens ou chaves.

## O que esperar

Somos uma equipe pequena. Buscamos confirmar o recebimento em até 5 dias úteis e manter você informado sobre a análise e a correção. Não temos programa de recompensa financeira.

## Escopo

**Dentro do escopo:** o aplicativo web publicado do Junta.ai, o código deste repositório e a API do Junta.ai usada por ele.

**Fora do escopo:**

- Ataques de volume (negação de serviço) e testes que degradem o serviço.
- Engenharia social, phishing e testes físicos.
- Falhas em serviços de terceiros (Vercel, Azure, Google e outros): reporte ao fornecedor.
- Relatórios automatizados sem demonstração de impacto.

## Boas práticas esperadas de quem testa

- Teste apenas com contas suas ou de teste.
- Não acesse, altere nem apague dados de outras pessoas. Se encontrar dados pessoais, pare e reporte.
- Não degrade a disponibilidade do serviço.

## Versões suportadas

Apenas a versão publicada a partir da branch `main`.

---

## English

**Reporting a vulnerability:** please use GitHub's private vulnerability reporting (Security tab > Report a vulnerability). Do not open public issues or pull requests with details of a vulnerability. Include steps to reproduce and the potential impact, without real personal data or secrets. Test only with your own or test accounts, and do not access or modify other people's data. Denial-of-service, social engineering and third-party service issues are out of scope. We are a small team; we aim to acknowledge reports within 5 business days. There is no bug bounty program.
