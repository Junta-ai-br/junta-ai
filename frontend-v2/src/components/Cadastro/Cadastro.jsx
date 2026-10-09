import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/useUser';
import { isValidEmail } from '@/services/auth/auth.mock';
import { requestRegistrationCode, verifyRegistration } from '@/services/auth/auth.api';
import { getEmailAuthError } from '@/services/auth/auth.errors';
import Button from "@/components/common/Button/Button";
import Input from "@/components/forms/Input/Input";
import "./Cadastro.css";

export default function Cadastro() {
  const navigate = useNavigate();
  const { establishSession, updateProfile } = useUser();
  const pending = useRef(false);
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
  const [code, setCode] = useState('');
  const [skipOnboarding, setSkipOnboarding] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown === 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

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
    if (pending.current) return;
    clearMessages();

    // Validação básica da Etapa 1
    if (!form.nome.trim() || !form.email.trim() || !form.whatsapp.trim()) {
      setErroForm("Preencha os campos obrigatórios antes de continuar.");
      return;
    }

    if (form.nome.trim().length < 2 || form.nome.trim().length > 150) {
      setErroForm('O nome deve ter entre 2 e 150 caracteres.');
      return;
    }
    if (!isValidEmail(form.email.trim())) {
      setErroForm('Informe um endereço de e-mail válido.');
      return;
    }
    if (form.whatsapp.trim().length > 20) {
      setErroForm('Número de WhatsApp inválido. Use até 20 caracteres.');
      return;
    }

    setForm((current) => ({ ...current, nome: current.nome.trim(), email: current.email.trim(), whatsapp: current.whatsapp.trim() }));

    setEtapa(2);
  }

  function handleEtapaAnterior() {
    if (pending.current) return;
    clearMessages();
    setCode('');
    setEtapa(1);
  }

  async function handleSubmit(e, pular = false) {
    if (e) e.preventDefault();
    if (pending.current) return;
    if (etapa === 1) {
      handleProximaEtapa();
      return;
    }
    if (etapa === 3) {
      await handleConfirm();
      return;
    }
    clearMessages();

    // Validação da Etapa 2
    if (!pular && (!form.pergunta1 || !form.pergunta2 || !form.pergunta3)) {
      setErroForm(
        "Por favor, responda todas as perguntas ou escolha 'Pular por agora'."
      );
      return;
    }

    pending.current = true;
    setLoadingAction('request');
    try {
      await requestRegistrationCode(form.email);
      setSkipOnboarding(pular);
      setCode('');
      setEtapa(3);
      setCooldown(30);
      setStatusForm('Enviamos um código de confirmação para o seu e-mail.');
    } catch (error) {
      setErroForm(getEmailAuthError(error, { registration: true }).message);
    } finally {
      pending.current = false;
      setLoadingAction(null);
    }
  }

  async function handleConfirm() {
    if (pending.current) return;
    clearMessages();
    if (!/^\d{6}$/.test(code)) {
      setErroForm('Digite o código de 6 dígitos recebido por e-mail.');
      return;
    }
    pending.current = true;
    setLoadingAction('verify');
    try {
      const tokens = await verifyRegistration({
        name: form.nome,
        email: form.email,
        whatsapp: form.whatsapp,
        code,
        ...(!skipOnboarding ? {
          question1: form.pergunta1,
          question2: form.pergunta2,
          question3: form.pergunta3,
        } : {}),
      });
      establishSession(tokens);
      updateProfile({ nome: form.nome, email: form.email, whatsapp: form.whatsapp, avatarUrl: '' });
      navigate('/assistente');
    } catch (error) {
      setErroForm(getEmailAuthError(error, { registration: true, verifying: true }).message);
    } finally {
      pending.current = false;
      setLoadingAction(null);
    }
  }

  async function handleResend() {
    if (pending.current || cooldown > 0) return;
    clearMessages();
    pending.current = true;
    setLoadingAction('resend');
    try {
      await requestRegistrationCode(form.email);
      setCooldown(30);
      setStatusForm('Um novo código de confirmação foi enviado para o seu e-mail.');
    } catch (error) {
      setErroForm(getEmailAuthError(error, { registration: true }).message);
    } finally {
      pending.current = false;
      setLoadingAction(null);
    }
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
      aria-busy={loadingAction !== null}
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
            type="submit"
            size="lg"
            className="login-form__submit"
            disabled={loadingAction !== null}
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
                  disabled={loadingAction !== null}
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
                  disabled={loadingAction !== null}
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
                  disabled={loadingAction !== null}
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
              {loadingAction === "request"
                ? "Enviando código..."
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

      {etapa === 3 && (
        <div className="cadastro-form__fields">
          <div className="cadastro-form__heading">
            <h2>Confirme seu e-mail</h2>
            <p>Enviamos um código de 6 dígitos para {form.email}. Sua conta será criada após a confirmação.</p>
          </div>
          <Input
            id="cadastro-code"
            label="Código de confirmação"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              clearMessages();
            }}
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            disabled={loadingAction !== null}
            required
          />
          <Button type="submit" size="lg" disabled={loadingAction !== null}>
            {loadingAction === 'verify' ? 'Confirmando...' : 'Confirmar e criar conta'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleResend} disabled={cooldown > 0 || loadingAction !== null}>
            {loadingAction === 'resend' ? 'Enviando...' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleEtapaAnterior} disabled={loadingAction !== null}>
            Voltar aos dados
          </Button>
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
      className={`cadastro-form__message ${
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
