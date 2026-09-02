import { useState } from 'react';
import Button from "@/components/common/Button/Button";
import Input from "@/components/forms/Input/Input";
import { buscarCep } from "@/services/cepService";
import "./Cadastro.css";

export default function Cadastro() {
  const [form, setForm] = useState({
    nome: '',
    username: '',
    email: '',
    cep: '',
    rua: '',
    bairro: '',
    cidade: '',
    uf: '',
    password: '',
    confirmPassword: ''
  });

  const [carregandoCep, setCarregandoCep] = useState(false);
  const [erroForm, setErroForm] = useState('');
  const [statusForm, setStatusForm] = useState('');
  const [loadingAction, setLoadingAction] = useState(null);

  function clearMessages() {
    setErroForm('');
    setStatusForm('');
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    clearMessages();
  }

  async function handleBuscarCep() {
    try {
      clearMessages();
      const cepLimpo = form.cep.replace(/\D/g, '');
      if (!cepLimpo) return;

      if (cepLimpo.length !== 8) {
        setErroForm('O CEP deve conter 8 dígitos.');
        return;
      }

      setCarregandoCep(true);
      const dados = await buscarCep(cepLimpo);

      setForm((prev) => ({
        ...prev,
        rua: dados.logradouro || '',
        bairro: dados.bairro || '',
        cidade: dados.localidade || '',
        uf: dados.uf || ''
      }));
    } catch (error) {
      setErroForm(error.message || 'Erro ao buscar CEP.');
    } finally {
      setCarregandoCep(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (form.password !== form.confirmPassword) {
      setErroForm("As senhas não coincidem.");
      return;
    }

    setLoadingAction("submit");

    window.setTimeout(() => {
      setStatusForm("Cadastro realizado com sucesso!");
      setLoadingAction(null);
      console.log("Dados enviados:", form);
    }, 1000);
  }

  return (
    <form className="login-form__fields" onSubmit={handleSubmit} noValidate>
      <Input
        id="cadastro-nome"
        name="nome"
        label="Nome Completo"
        type="text"
        value={form.nome}
        onChange={handleChange}
        placeholder="Seu nome"
        disabled={loadingAction !== null}
        required
      />

      <Input
        id="cadastro-username"
        name="username"
        label="Username"
        type="text"
        value={form.username}
        onChange={handleChange}
        placeholder="Seu usuário"
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
        placeholder="voce@exemplo.com"
        disabled={loadingAction !== null}
        required
      />

      <div className="login-form__divider">
        <span>Endereço</span>
      </div>

      <Input
        id="cadastro-cep"
        name="cep"
        label="CEP"
        type="text"
        value={form.cep}
        onChange={handleChange}
        onBlur={handleBuscarCep}
        placeholder="00000-000"
        maxLength={9}
        disabled={loadingAction !== null}
        required
      />

      {carregandoCep && (
        <div className="login-form__message is-success" style={{ display: 'block', marginTop: '-10px' }}>
          Buscando endereço...
        </div>
      )}

      <Input
        id="cadastro-rua"
        name="rua"
        label="Rua / Logradouro"
        type="text"
        value={form.rua}
        onChange={handleChange}
        disabled={loadingAction !== null}
        required
      />

      <Input
        id="cadastro-bairro"
        name="bairro"
        label="Bairro"
        type="text"
        value={form.bairro}
        onChange={handleChange}
        disabled={loadingAction !== null}
        required
      />

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 2 }}>
          <Input
            id="cadastro-cidade"
            name="cidade"
            label="Cidade"
            type="text"
            value={form.cidade}
            onChange={handleChange}
            disabled={loadingAction !== null}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            id="cadastro-uf"
            name="uf"
            label="UF"
            type="text"
            value={form.uf}
            onChange={handleChange}
            maxLength={2}
            disabled={loadingAction !== null}
            required
          />
        </div>
      </div>

      <div className="login-form__divider">
        <span>Segurança</span>
      </div>

      <Input
        id="cadastro-password"
        name="password"
        label="Senha"
        type="password"
        value={form.password}
        onChange={handleChange}
        placeholder="Sua senha"
        disabled={loadingAction !== null}
        required
      />

      <Input
        id="cadastro-confirm-password"
        name="confirmPassword"
        label="Confirme sua Senha"
        type="password"
        value={form.confirmPassword}
        onChange={handleChange}
        placeholder="Repita sua senha"
        disabled={loadingAction !== null}
        required
      />

      <Button
        type="submit"
        size="lg"
        className="login-form__submit"
        disabled={loadingAction !== null}
      >
        {loadingAction === "submit" ? "Cadastrando..." : "Criar conta"}
      </Button>

      <Message error={erroForm} status={statusForm} />
    </form>
  );
}

function Message({ error, status }) {
  return (
    <div
      className={`login-form__message ${error ? "is-error" : "is-success"}`}
      aria-live="polite"
      role={error ? "alert" : "status"}
    >
      {error || status}
    </div>
  );
}