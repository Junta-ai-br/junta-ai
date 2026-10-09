import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from '@/contexts/UserContext';
import { useUser } from '@/contexts/useUser';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Cadastro from './Cadastro';

const api = vi.hoisted(() => ({ requestRegistrationCode: vi.fn(), verifyRegistration: vi.fn() }));
vi.mock('@/services/auth/auth.api', () => api);
const tokens = { accessToken: 'test-access', refreshToken: 'test-refresh', expiresInSeconds: 900 };

function Destination() {
  const { isAuthenticated, profile } = useUser();
  return <p>{isAuthenticated ? `Sessão confirmada para ${profile.nome}` : 'Sem sessão'}</p>;
}

function setup() {
  render(<MemoryRouter initialEntries={['/cadastro']}><UserProvider><Routes>
    <Route path="/cadastro" element={<Cadastro />} />
    <Route element={<ProtectedRoute />}><Route path="/assistente" element={<Destination />} /></Route>
    <Route path="/login" element={<p>Login</p>} />
  </Routes></UserProvider></MemoryRouter>);
}

function fillBasics() {
  fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: ' Ana Teste ' } });
  fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: ' ana@example.com ' } });
  fireEvent.change(screen.getByLabelText(/^WhatsApp/), { target: { value: ' (11) 99999-9999 ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

function answerQuestions() {
  for (const label of ['Criar uma reserva', 'Uso planilha', 'Economizar']) {
    fireEvent.click(screen.getByRole('radio', { name: label }));
  }
}

async function requestCode(skip = true) {
  fillBasics();
  if (!skip) answerQuestions();
  fireEvent.click(screen.getByRole('button', { name: skip ? 'Pular por agora' : 'Continuar' }));
  return screen.findByLabelText(/^Código de confirmação/);
}

function confirmCode(input, code = '012345') {
  fireEvent.change(input, { target: { value: code } });
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar e criar conta' }));
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.resetAllMocks();
  api.requestRegistrationCode.mockResolvedValue(undefined);
  api.verifyRegistration.mockResolvedValue(tokens);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('real email registration', () => {
  it('validates basics and uses Enter to advance without requesting or creating an account', () => {
    setup();
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }).closest('form'));
    expect(screen.getByRole('alert')).toHaveTextContent('campos obrigatórios');
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText(/^WhatsApp/), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('2 e 150');
    fireEvent.change(screen.getByLabelText(/^Nome/), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('e-mail válido');
    fireEvent.change(screen.getByLabelText(/^E-mail/), { target: { value: 'ana@example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Continuar' }).closest('form'));
    expect(screen.getByRole('button', { name: 'Pular por agora' })).toBeInTheDocument();
    expect(api.requestRegistrationCode).not.toHaveBeenCalled();
    expect(api.verifyRegistration).not.toHaveBeenCalled();
  });

  it('requires complete onboarding or an explicit skip', () => {
    setup(); fillBasics();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('responda todas');
    expect(api.requestRegistrationCode).not.toHaveBeenCalled();
  });

  it('waits for the request and blocks duplicate submissions and changes while pending', async () => {
    let resolve;
    api.requestRegistrationCode.mockReturnValue(new Promise((done) => { resolve = done; }));
    setup(); fillBasics(); answerQuestions();
    const form = screen.getByRole('button', { name: 'Continuar' }).closest('form');
    await act(async () => { fireEvent.submit(form); fireEvent.submit(form); });
    expect(api.requestRegistrationCode).toHaveBeenCalledExactlyOnceWith('ana@example.com');
    expect(screen.getByRole('button', { name: 'Enviando código...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Pular por agora' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Uso planilha' })).toBeDisabled();
    expect(screen.queryByLabelText(/^Código de confirmação/)).not.toBeInTheDocument();
    expect(api.verifyRegistration).not.toHaveBeenCalled();
    expect(sessionStorage.getItem('junta_auth_session')).toBeNull();
    await act(async () => { resolve(); });
    expect(screen.getByLabelText(/^Código de confirmação/)).toBeInTheDocument();
  });

  it.each([true, false])('maps data and establishes a real session only after confirmation (skip=%s)', async (skip) => {
    let resolve;
    api.verifyRegistration.mockReturnValue(new Promise((done) => { resolve = done; }));
    setup();
    const input = await requestCode(skip);
    confirmCode(input);
    fireEvent.submit(input.closest('form'));
    expect(api.verifyRegistration).toHaveBeenCalledExactlyOnceWith({
      name: 'Ana Teste', email: 'ana@example.com', whatsapp: '(11) 99999-9999', code: '012345',
      ...(!skip ? { question1: 'Criar uma reserva', question2: 'Uso planilha', question3: 'Economizar' } : {}),
    });
    expect(screen.getByRole('button', { name: 'Confirmando...' })).toBeDisabled();
    expect(sessionStorage.getItem('junta_auth_session')).toBeNull();
    await act(async () => { resolve(tokens); });
    expect(screen.getByText('Sessão confirmada para Ana Teste')).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem('junta_auth_session'))).toMatchObject(tokens);
    expect(JSON.parse(localStorage.getItem('junta_user_profile'))).toMatchObject({ nome: 'Ana Teste', email: 'ana@example.com' });
  });

  it('omits previously selected answers when skipping and preserves them when returning to data', async () => {
    setup(); fillBasics(); answerQuestions();
    fireEvent.click(screen.getByRole('button', { name: 'Pular por agora' }));
    await screen.findByLabelText(/^Código de confirmação/);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos dados' }));
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Ana Teste');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('radio', { name: 'Uso planilha' })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Pular por agora' }));
    confirmCode(await screen.findByLabelText(/^Código de confirmação/));
    await screen.findByText('Sessão confirmada para Ana Teste');
    expect(api.verifyRegistration.mock.calls[0][0]).not.toHaveProperty('question1');
    expect(api.verifyRegistration.mock.calls[0][0]).not.toHaveProperty('question2');
    expect(api.verifyRegistration.mock.calls[0][0]).not.toHaveProperty('question3');
  });

  it('rejects short codes and filters nonnumeric input', async () => {
    setup(); const input = await requestCode();
    confirmCode(input, 'a12b3');
    expect(input).toHaveValue('123');
    expect(screen.getByRole('alert')).toHaveTextContent('6 dígitos');
    expect(api.verifyRegistration).not.toHaveBeenCalled();
  });

  it.each([
    [{ response: { status: 401 } }, 'Código inválido ou expirado'],
    [{ response: { status: 409 } }, 'já está cadastrado'],
    [{ response: { status: 400 } }, 'Confira os dados'],
    [{ code: 'ERR_NETWORK' }, 'Verifique sua conexão'],
    [{ response: { status: 503 } }, 'serviço está indisponível'],
    [{ response: { status: 500 } }, 'serviço está indisponível'],
    [{ response: { status: 429 } }, 'Muitas tentativas'],
    [{ code: 'ECONNABORTED' }, 'Verifique sua conexão'],
    [{ request: {} }, 'Verifique sua conexão'],
    [{ code: 'ERR_AUTH_RESPONSE' }, 'Não foi possível confirmar'],
  ])('keeps all data and creates no session after verification failure %#', async (failure, message) => {
    api.verifyRegistration.mockRejectedValue(failure);
    setup(); const input = await requestCode(false); confirmCode(input);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(input).toHaveValue('012345');
    expect(sessionStorage.getItem('junta_auth_session')).toBeNull();
    expect(localStorage.getItem('junta_user_profile')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Voltar aos dados' }));
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Ana Teste');
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue('ana@example.com');
    expect(screen.getByLabelText(/^WhatsApp/)).toHaveValue('(11) 99999-9999');
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByRole('radio', { name: 'Uso planilha' })).toBeChecked();
  });

  it.each([
    [{ response: { status: 409 } }, 'já está cadastrado'],
    [{ response: { status: 400 } }, 'Confira os dados'],
    [{ response: { status: 503 } }, 'envio de e-mail está indisponível'],
    [{ response: { status: 500 } }, 'serviço está indisponível'],
    [{ response: { status: 429 } }, 'Muitas tentativas'],
    [{ code: 'ERR_NETWORK' }, 'Verifique sua conexão'],
    [{ code: 'ERR_AUTH_RESPONSE' }, 'Não foi possível enviar'],
  ])('preserves onboarding on request failure and allows retry %#', async (failure, message) => {
    api.requestRegistrationCode.mockRejectedValueOnce(failure);
    setup(); fillBasics(); answerQuestions();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('radio', { name: 'Uso planilha' })).toBeChecked();
    expect(screen.queryByLabelText(/^Código de confirmação/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('junta_auth_session')).toBeNull();
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeEnabled();
    expect(api.verifyRegistration).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(await screen.findByLabelText(/^Código de confirmação/)).toBeInTheDocument();
  });

  it.each([undefined, null, {}, { accessToken: 'incomplete' },
    { ...tokens, accessToken: '' }, { ...tokens, refreshToken: '' },
    { ...tokens, expiresInSeconds: 0 }, { ...tokens, expiresInSeconds: '900' },
  ])('rejects malformed tokens without redirecting or saving a profile %#', async (response) => {
    api.verifyRegistration.mockResolvedValue(response);
    setup(); confirmCode(await requestCode());
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível confirmar');
    expect(sessionStorage.getItem('junta_auth_session')).toBeNull();
    expect(localStorage.getItem('junta_user_profile')).toBeNull();
    expect(screen.getByRole('button', { name: 'Confirmar e criar conta' })).toBeEnabled();
  });

  it('resends only after cooldown, blocks duplicates and starts cooldown only on success', async () => {
    setup(); fillBasics(); vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pular por agora' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reenviar em 30s' }));
    expect(api.requestRegistrationCode).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 30; i++) await act(async () => { vi.advanceTimersByTime(1000); });
    api.requestRegistrationCode.mockRejectedValueOnce({ code: 'ERR_NETWORK' });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reenviar código' })); });
    expect(screen.getByRole('alert')).toHaveTextContent('Verifique sua conexão');
    expect(screen.getByRole('button', { name: 'Reenviar código' })).toBeEnabled();
    let resolve;
    api.requestRegistrationCode.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    fireEvent.change(screen.getByLabelText(/^Código de confirmação/), { target: { value: '012345' } });
    await act(async () => {
      const resend = screen.getByRole('button', { name: 'Reenviar código' });
      fireEvent.click(resend);
      fireEvent.click(resend);
    });
    expect(api.requestRegistrationCode).toHaveBeenCalledTimes(3);
    expect(api.requestRegistrationCode).toHaveBeenLastCalledWith('ana@example.com');
    expect(screen.getByRole('button', { name: 'Confirmar e criar conta' })).toBeDisabled();
    await act(async () => { resolve(); });
    expect(screen.getByRole('button', { name: 'Reenviar em 30s' })).toBeDisabled();
    expect(screen.getByLabelText(/^Código de confirmação/)).toHaveValue('012345');
    expect(api.verifyRegistration).not.toHaveBeenCalled();
  });
});
