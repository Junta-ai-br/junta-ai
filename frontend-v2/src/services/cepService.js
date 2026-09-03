import axios from 'axios';

export async function buscarCep(cep) {
  const cepLimpo = cep.replace(/\D/g, '');

  if (cepLimpo.length !== 8) {
    throw new Error('O CEP deve ter 8 dígitos');
  }

  const { data } = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);

  if (data.erro) {
    throw new Error('CEP não encontrado');
  }

  return data;
}