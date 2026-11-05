# Perfil e gerenciamento de conta

## 1. Objetivo e benefício

Permitir que o usuário personalize sua identificação e preferências e conheça o alcance atual das opções de gerenciamento da conta.

## 2. Descrição funcional

A área de configurações apresenta dados pessoais, imagem, preferências de comunicação e acesso ao fluxo de exclusão. Parte dessa experiência está implementada apenas localmente no navegador.

## 3. Principais capacidades existentes

- Editar nome e WhatsApp opcional.
- Alterar ou remover a imagem do perfil.
- Selecionar preferências de comunicação.
- Visualizar o e-mail vinculado ao acesso.
- Acessar e confirmar o fluxo de exclusão apresentado na interface.

## 4. Regras e comportamentos relevantes

O e-mail não é editável nessa tela. As alterações de perfil observadas são locais; não comprovam atualização da conta no servidor. Selecionar preferências não comprova que notificações sejam enviadas.

O fluxo de exclusão observado limpa o perfil local e encerra a sessão. Sua apresentação de conclusão não comprova exclusão da conta ou dos dados no servidor.

## 5. Limitações e estados ainda não validados

Não foi comprovada a sincronização das alterações locais com a conta no servidor, nem a exclusão efetiva da conta e dos dados mantidos pelo serviço. Essas capacidades exigem confirmação antes de serem anunciadas como completas. Não foram executados testes ou validação produtiva nesta revisão documental.

## 6. Estado atual

**Parcialmente implementado:** interface e alterações locais presentes; atualização e exclusão no servidor não comprovadas pelo inventário.

[Voltar ao índice de funcionalidades](README.md).
