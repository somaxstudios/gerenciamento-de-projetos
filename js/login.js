import { supabase } from './supabase-config.js';

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

const btnLogin = document.getElementById('btn-login');
const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');

const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const authMessage = document.getElementById('auth-message');
const confirmPasswordWrapper = document.getElementById('confirm-password-wrapper');
const rememberWrapper = document.getElementById('remember-wrapper');
const forgotPasswordLink = document.getElementById('forgot-password-link');

let isRegisterMode = false;

function showMessage(message, type = 'error') {
  authMessage.textContent = message;
  authMessage.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'border', 'border-red-200', 'bg-green-50', 'text-green-700', 'border-green-200');

  if (type === 'success') {
    authMessage.classList.add('bg-green-50', 'text-green-700', 'border', 'border-green-200');
  } else {
    authMessage.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
  }
}

function clearMessage() {
  authMessage.textContent = '';
  authMessage.classList.add('hidden');
}

function updateMode() {
  clearMessage();

  if (isRegisterMode) {
    formTitle.textContent = 'Criar cadastro';
    formSubtitle.textContent = 'Preencha seus dados para criar um novo acesso no sistema.';
    btnLogin.textContent = 'Criar Conta';
    toggleAuthModeBtn.textContent = 'Já tem conta? Entrar';
    confirmPasswordWrapper.classList.remove('hidden');
    forgotPasswordLink.classList.add('hidden');
    rememberWrapper.classList.add('hidden');
    confirmPasswordInput.required = true;
  } else {
    formTitle.textContent = 'Acessar sistema';
    formSubtitle.textContent = 'Entre com suas credenciais para acessar o painel administrativo.';
    btnLogin.textContent = 'Entrar no Sistema';
    toggleAuthModeBtn.textContent = 'Não tem conta? Criar cadastro';
    confirmPasswordWrapper.classList.add('hidden');
    forgotPasswordLink.classList.remove('hidden');
    rememberWrapper.classList.remove('hidden');
    confirmPasswordInput.required = false;
    confirmPasswordInput.value = '';
  }
}

function setLoading(isLoading, label = 'Processando...') {
  btnLogin.disabled = isLoading;
  btnLogin.textContent = isLoading ? label : (isRegisterMode ? 'Criar Conta' : 'Entrar no Sistema');
}

toggleAuthModeBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  updateMode();
});

forgotPasswordLink.addEventListener('click', async (e) => {
  e.preventDefault();
  clearMessage();

  const email = emailInput.value.trim();

  if (!email) {
    showMessage('Digite seu e-mail para receber o link de redefinição de senha.');
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    if (error) {
      showMessage('Erro ao solicitar redefinição: ' + error.message);
      return;
    }

    showMessage('Link de redefinição enviado para seu e-mail.', 'success');
  } catch (err) {
    showMessage('Erro inesperado ao solicitar redefinição de senha.');
    console.error(err);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!email || !password) {
    showMessage('Preencha e-mail e senha.');
    return;
  }

  if (isRegisterMode) {
    if (password.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showMessage('As senhas não conferem.');
      return;
    }

    setLoading(true, 'Criando conta...');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        showMessage('Erro ao criar conta: ' + error.message);
        return;
      }

      if (data?.user) {
        showMessage(
          'Cadastro realizado com sucesso. Verifique seu e-mail para confirmar a conta, se a confirmação estiver habilitada no Supabase.',
          'success'
        );
        loginForm.reset();
      } else {
        showMessage('Conta criada, mas não foi possível confirmar o retorno do usuário.', 'success');
      }
    } catch (err) {
      console.error(err);
      showMessage('Erro inesperado ao criar conta.');
    } finally {
      setLoading(false);
    }

    return;
  }

  setLoading(true, 'Verificando...');

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showMessage('Erro no login: ' + error.message);
      return;
    }

    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error(err);
    showMessage('Erro inesperado ao fazer login.');
  } finally {
    setLoading(false);
  }
});

updateMode();