# DS-03 · Colors

| Campo | Valor |
|--------|-------|
| **Documento** | DS-03 |
| **Título** | Colors |
| **Versão** | 1.0 |
| **Status** | Implemented |
| **Última atualização** | 01/08/2026 |
| **Responsável** | Equipe Junta.ai |

---

# Cores

As cores do Junta.ai foram organizadas para garantir consistência visual em toda a aplicação.

Em vez de utilizar valores diretamente (HEX, RGB ou HSL), a interface deve utilizar os tokens definidos pelo Design System.

Isso facilita manutenção, evolução e suporte aos temas Light e Dark.

---

# Estrutura das cores

As cores do sistema estão divididas em três grupos.

## Brand

Representam a identidade visual do Junta.ai.

São utilizadas para elementos que identificam o produto, como ações principais, destaques e componentes de maior importância.

Exemplos:

- botões primários;
- links principais;
- estados ativos;
- elementos de destaque.

---

## Neutral

São responsáveis pela maior parte da interface.

Incluem fundos, superfícies, textos, bordas e divisões entre elementos.

Essas cores garantem equilíbrio visual e devem representar a maior parte da aplicação.

---

## Semantic

Representam estados específicos da interface.

São utilizadas para comunicar informações importantes ao usuário.

Exemplos:

- sucesso;
- aviso;
- erro;
- informação.

Essas cores nunca devem ser utilizadas apenas por motivos estéticos.

---

# Utilização dos tokens

Sempre utilize os tokens definidos pelo Design System.

Evite utilizar valores fixos diretamente nos componentes.

✔ Correto

```css
color: var(--text-primary);

background: var(--surface);

border: var(--border);
```

❌ Evite

```css
color: #202124;

background: #FFFFFF;

border: #D9D9D9;
```

---

# Light e Dark Mode

Todos os componentes devem utilizar tokens semânticos.

Os temas Light e Dark são responsáveis por alterar os valores desses tokens automaticamente.

Isso permite que um mesmo componente funcione corretamente nos dois temas sem necessidade de alterações específicas.

---

# Boas práticas

- Utilize sempre tokens do Design System.
- Evite utilizar valores fixos.
- Utilize cores semânticas apenas para comunicar estados.
- Preserve o contraste entre textos e superfícies.
- Nunca utilize cor como único indicador de informação.

---

# Onde encontrar os tokens

Os valores das cores são mantidos nos arquivos de tokens do projeto.

A documentação explica quando utilizar cada grupo de cores.

Os arquivos de tokens são a fonte oficial dos valores utilizados pela aplicação.

---

## Histórico de versões

| Versão | Data | Alterações |
|---------|------|------------|
| **1.0** | 01/08/2026 | Criação inicial do documento. |
