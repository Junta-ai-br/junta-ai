# DS-07 · Shadows

| Campo | Valor |
|--------|-------|
| **Documento** | DS-07 |
| **Título** | Shadows |
| **Versão** | 1.0 |
| **Status** | Implemented |
| **Última atualização** | 01/08/2026 |
| **Responsável** | Equipe Junta.ai |

---

# Shadows

As sombras são utilizadas para comunicar profundidade, hierarquia e estados de interação.

Seu objetivo não é decorar a interface, mas ajudar o usuário a compreender a relação entre os diferentes elementos da aplicação.

---

# Objetivo

O Design System utiliza sombras de forma discreta e consistente.

Cada nível de sombra representa uma hierarquia visual específica, permitindo destacar componentes importantes sem comprometer a simplicidade da interface.

---

# Onde utilizamos Shadows

As sombras podem ser utilizadas em diferentes componentes da interface.

Exemplos:

- cartões;
- menus;
- modais;
- popovers;
- dropdowns;
- botões;
- elementos em destaque.

Nem todo componente precisa possuir sombra.

Sempre que possível, utilize sombras apenas quando houver necessidade de reforçar profundidade ou interação.

---

# Hierarquia visual

Quanto maior a sensação de elevação de um elemento, maior pode ser o nível de sombra utilizado.

Componentes posicionados diretamente sobre a interface normalmente utilizam sombras suaves.

Elementos temporários, como modais ou menus suspensos, podem utilizar níveis de profundidade maiores para destacar sua posição acima do restante da interface.

---

# Sombras e interação

As sombras também podem comunicar mudanças de estado.

Durante uma interação, como um hover ou foco, pequenas alterações na sombra ajudam o usuário a perceber que determinado elemento está pronto para ser utilizado.

Essas mudanças devem ser suaves e naturais.

---

# Como utilizar

Ao desenvolver um componente:

- utilize sempre os tokens de sombra definidos pelo Design System;
- mantenha consistência entre componentes semelhantes;
- utilize sombras apenas quando fizerem sentido para a experiência;
- evite criar novos níveis de profundidade sem necessidade.

---

# Boas práticas

✔ Utilize sombras para comunicar profundidade.

✔ Prefira sombras suaves.

✔ Utilize o mesmo nível de sombra para componentes semelhantes.

✔ Evite sombras exageradas.

✔ Não utilize sombras apenas como elemento decorativo.

---

# Onde encontrar os tokens

Os valores oficiais das sombras estão definidos nos arquivos de tokens do Design System.

A documentação explica quando utilizar cada nível de profundidade.

Os tokens representam a fonte oficial para implementação.

---

## Histórico de versões

| Versão | Data | Alterações |
|---------|------|------------|
| **1.0** | 01/08/2026 | Criação inicial do documento. |
