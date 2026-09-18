import { useState } from 'react';
import Button from "@/components/common/Button/Button";
import Input from "@/components/forms/Input/Input";
import "./Cadastro.css";

export default function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    pergunta1: '',
    pergunta2: '',
    pergunta3: ''
  });

  const [erroForm, setErroForm] = useState('');
  const [statusForm, setStatusForm] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);
  const [etapa, setEtapa] = useState(1);

  function clearMessages() {
    setErroForm('');
    setStatusForm('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearMessages();
  }

  function handleProximaEtapa() {
    clearMessages();

    // Validação básica da Etapa 1
    if (!form.nome || !form.email || !form.whatsapp) {
      setErroForm("Preencha os campos obrigatórios antes de continuar.");
      return;
    }

    setEtapa(2);
  }

  function handleEtapaAnterior() {
    clearMessages();
    setEtapa(1);
  }

  function handleSubmit(e, pular = false) {
    if (e) e.preventDefault();
    clearMessages();

    // Validação da Etapa 2
    if (!pular && (!form.pergunta1 || !form.pergunta2 || !form.pergunta3)) {
      setErroForm(
        "Por favor, responda todas as perguntas ou escolha 'Pular por agora'."
      );
      return;
    }

    setLoadingAction("submit");

    // Simulação de envio para a API
    window.setTimeout(() => {
      setStatusForm("Conta criada com sucesso!");
      setLoadingAction(null);
      console.log("Dados finais enviados:", form);
    }, 1000);
  }

  // Opções das perguntas da Etapa 2
  const opcoesP1 = [
    "Entender para onde meu dinheiro está indo",
    "Controlar melhor meus gastos",
    "Organizar minhas contas",
    "Criar uma reserva",
    "Alcançar uma meta",
    "Ainda não sei"
  ];

  const opcoesP2 = [
    "Anoto tudo",
    "Uso planilha",
    "Uso algum aplicativo",
    "Vou acompanhando de cabeça",
    "Não tenho uma organização definida"
  ];

  const opcoesP3 = [
    "Saber quanto posso gastar",
    "Entender meus gastos",
    "Economizar",
    "Planejar meus objetivos",
    "Manter minhas contas organizadas",
    "Ter alguém para me ajudar a entender"
  ];

  return (
    <form
      className="login-form__fields"
      onSubmit={(e) => handleSubmit(e, false)}
      noValidate
    >
      {/* ================= ETAPA 1: DADOS BÁSICOS ================= */}
      {etapa === 1 && (
        <div className="form-etapa-1">
          <div
            className="cadastro-header"
            style={{ marginBottom: '24px' }}
          >
            <h2 style={{ margin: '0 0 8px 0' }}>
              Vamos começar?
            </h2>

            <p style={{ margin: 0, color: '#666' }}>
              Crie sua conta e conheça o Junta.ai.
            </p>
          </div>

          <Input
            id="cadastro-nome"
            name="nome"
            label="Nome"
            type="text"
            value={form.nome}
            onChange={handleChange}
            placeholder="Como podemos chamar você?"
            disabled={loadingAction !== null}
            required
          />

          <Input
            id="cadastro-email"
            name="email"
            label="E-mail"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="seu@email.com"
            disabled={loadingAction !== null}
            required
          />

          <Input
            id="cadastro-whatsapp"
            name="whatsapp"
            label="WhatsApp"
            type="tel"
            value={form.whatsapp}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            disabled={loadingAction !== null}
            required
          />

          <Button
            type="button"
            size="lg"
            className="login-form__submit"
            onClick={handleProximaEtapa}
            style={{ marginTop: '20px', width: '100%' }}
          >
            Continuar
          </Button>

          <div
            style={{
              marginTop: '16px',
              fontSize: '14px',
              color: '#555',
              textAlign: 'center'
            }}
          >
            🔐 Seus dados são tratados com cuidado desde o desenvolvimento do Junta.ai.
          </div>
        </div>
      )}

      {/* ================= ETAPA 2: PERFIL DO USUÁRIO ================= */}
      {etapa === 2 && (
        <div className="form-etapa-2">
          <div
            className="cadastro-header"
            style={{ marginBottom: '24px' }}
          >
            <h2 style={{ margin: '0 0 8px 0' }}>
              Agora, conta pra gente um pouquinho sobre você.
            </h2>

            <p
              style={{
                margin: 0,
                color: '#666',
                fontSize: '14px'
              }}
            >
              Essas respostas ajudam o Junta.ai a entender seu contexto.
              Não precisa ser perfeito. Você pode mudar suas respostas depois.
            </p>
          </div>

          {/* PERGUNTA 1 */}
          <div
            className="pergunta-grupo"
            style={{ marginBottom: '20px' }}
          >
            <p
              style={{
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              1. O que você mais quer organizar hoje?
            </p>

            {opcoesP1.map((opcao, idx) => (
              <label
                key={idx}
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="pergunta1"
                  value={opcao}
                  checked={form.pergunta1 === opcao}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                {opcao}
              </label>
            ))}
          </div>

          {/* PERGUNTA 2 */}
          <div
            className="pergunta-grupo"
            style={{ marginBottom: '20px' }}
          >
            <p
              style={{
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              2. Como você costuma cuidar das suas finanças?
            </p>

            {opcoesP2.map((opcao, idx) => (
              <label
                key={idx}
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="pergunta2"
                  value={opcao}
                  checked={form.pergunta2 === opcao}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                {opcao}
              </label>
            ))}
          </div>

          {/* PERGUNTA 3 */}
          <div
            className="pergunta-grupo"
            style={{ marginBottom: '24px' }}
          >
            <p
              style={{
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              3. O que você gostaria que fosse mais fácil?
            </p>

            {opcoesP3.map((opcao, idx) => (
              <label
                key={idx}
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="pergunta3"
                  value={opcao}
                  checked={form.pergunta3 === opcao}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                {opcao}
              </label>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <Button
              type="submit"
              size="lg"
              className="login-form__submit"
              disabled={loadingAction !== null}
            >
              {loadingAction === "submit"
                ? "Finalizando..."
                : "Continuar"}
            </Button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loadingAction !== null}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '10px'
              }}
            >
              Pular por agora
            </button>

            <button
              type="button"
              onClick={handleEtapaAnterior}
              disabled={loadingAction !== null}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '10px',
                marginTop: '-5px'
              }}
            >
              Voltar aos dados
            </button>
          </div>
        </div>
      )}

      {(erroForm || statusForm) && (
        <Message
          error={erroForm}
          status={statusForm}
        />
      )}
    </form>
  );
}

function Message({ error, status }) {
  return (
    <div
      className={`login-form__message ${
        error ? "is-error" : "is-success"
      }`}
      aria-live="polite"
      role={error ? "alert" : "status"}
      style={{ marginTop: '18px' }}
    >
      {error || status}
    </div>
  );
}