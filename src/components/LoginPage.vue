<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const password = ref('');
const isLogin = ref(true);
const error = ref('');

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{5,}$/;

function toggleAuthMode() {
  isLogin.value = !isLogin.value;
  error.value = '';
}

function validateInputs() {
  if (username.value.length < 5) {
    error.value = 'Имя пользователя должно содержать не менее 5 символов.';
    return false;
  }

  if (!passwordRegex.test(password.value)) {
    error.value = 'Пароль должен содержать не менее 5 символов, включая хотя бы одну латинскую букву и одну цифру.';
    return false;
  }

  error.value = '';
  return true;
}

async function handleSubmit() {

  if (!validateInputs()) {
    return;
  }

  const url = isLogin.value ? 'auth/login' : 'auth/register';
  const response = await fetch(`http://localhost:8000/${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: username.value,
      password: password.value
    }),
  });

  if (response.ok) {
    const data = await response.json();

    if (isLogin.value) {
      
      localStorage.setItem('token', data.access_token)
      await router.push({ name: 'TaskList' })
      
    } else {
      isLogin.value = true
      username.value = ''
      password.value = ''
      error.value = ''
    }
  } else if (response.status === 400 && !isLogin.value) {
    error.value = 'Это имя пользователя уже занято. Пожалуйста, выберите другое имя.';
  } else {
    error.value = 'Ошибка при ' + (isLogin.value ? 'входе' : 'регистрации');
  }
}
</script>
<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 class="text-2xl font-bold mb-4 text-center">
        {{ isLogin ? 'Вход' : 'Регистрация' }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="username" class="block text-gray-700">Имя пользователя</label>
          <input
              v-model="username"
              type="text"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div>
          <label for="password" class="block text-gray-700">Пароль</label>
          <input
              v-model="password"
              type="password"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <button
            type="submit"
            class="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors"
        >
          {{ isLogin ? 'Войти' : 'Зарегистрироваться' }}
        </button>
      </form>
      
      <p class="text-center mt-4 text-gray-600">
        {{ isLogin ? 'Нет аккаунта?' : 'Уже зарегистрированы?' }}
        <button @click="toggleAuthMode" class="text-indigo-500 hover:underline ml-1">
          {{ isLogin ? 'Регистрация' : 'Войти' }}
        </button>
      </p>
      
      <p v-if="error" class="mt-4 text-red-500 text-center">{{ error }}</p>
    </div>
  </div>
</template>
