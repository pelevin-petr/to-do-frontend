<script setup lang="ts">
import {ref, computed, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {ITask} from '../interfaces/ITask.ts';

const newTaskTitle = ref('');
const tasks = ref<ITask[]>([]);
const statusFilter = ref('');
const sortOption = ref('date');
const editingTaskId = ref<number | null>(null);
const editingTaskTitle = ref('');
const newTaskDescription = ref('');
const editingTaskDescription = ref('');

const router = useRouter();

function getAuthToken() {
  return localStorage.getItem('token');
}

async function createTask() {
  const token = getAuthToken();
  if (!token) {
    await router.push('/login');
    return;
  }
  
  const response = await fetch('http://localhost:8000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: newTaskTitle.value,
      description: newTaskDescription.value, // добавлено описание
      status: 'incomplete',
    }),
  });
  
  if (response.ok) {
    newTaskTitle.value = '';
    newTaskDescription.value = ''; // очистить описание
    await fetchTasks();
  }
}

async function deleteTask(taskId: number) {
  const token = getAuthToken();
  if (!token) {
    await router.push('/login');
    return;
  }
  
  const response = await fetch(`http://localhost:8000/tasks/${taskId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (response.ok) {
    await fetchTasks();
  }
}

function startEditing(task: ITask) {
  editingTaskId.value = task.id
  editingTaskTitle.value = task.title
  editingTaskDescription.value = task.description
}

function cancelEditing() {
  editingTaskId.value = null
  editingTaskTitle.value = ''
  editingTaskDescription.value = ''
}

async function fetchTasks() {
  const token = getAuthToken();
  if (!token) {
    await router.push('/login');
    return;
  }
  
  const response = await fetch('http://localhost:8000/tasks', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  if (response.ok) {
    tasks.value = await response.json();
  }
}


async function saveTask(task: ITask) {
  const token = getAuthToken();
  if (!token) {
    await router.push('/login');
    return;
  }
  if (!editingTaskTitle.value) {
    editingTaskTitle.value = task.title;
  }
  if (!editingTaskDescription.value) {
    editingTaskDescription.value = task.description;
  }
  const response = await fetch(`http://localhost:8000/tasks/${task.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: editingTaskTitle.value,
      description: editingTaskDescription.value, // обновляем описание
      status: task.status,
    }),
  });
  
  if (response.ok) {
    editingTaskId.value = null;
    editingTaskTitle.value = '';
    editingTaskDescription.value = ''; // очищаем описание
    await fetchTasks();
  }
}

function formatDate(dateString: Date): string {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })} в ${date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

onMounted(() => {
  fetchTasks();
});

const filteredAndSortedTasks = computed(() => {
  let filteredTasks = tasks.value;
  
  if (!filteredTasks) return [];
  
  if (statusFilter.value) {
    filteredTasks = filteredTasks.filter((task) =>
        statusFilter.value === 'completed' ? task.status === 'completed' : task.status !== 'completed'
    );
  }
  
  if (sortOption.value === 'date') {
    filteredTasks = filteredTasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (sortOption.value === 'status') {
    filteredTasks = filteredTasks.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') {
        return 1
      } else if (a.status !== 'completed' && b.status === 'completed') {
        return -1
      } else return 0
    });
  }
  return filteredTasks;
});

function handleKeyDown(event: KeyboardEvent, task: ITask) {
  if (event.key === 'Enter') {
    saveTask(task);
  } else if (event.key === 'Escape') {
    cancelEditing();
  }
}

</script>
<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center">📝 Список задач</h1>
    
    <form @submit.prevent="createTask" class="flex flex-col md:flex-row mb-4 space-y-2 md:space-y-0">
      <input
          v-model="newTaskTitle"
          type="text"
          placeholder="Введите название задачи"
          class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
      />
      <input
          v-model="newTaskDescription"
          placeholder="Введите описание задачи"
          class="flex-1 p-2 border border-gray-300 rounded-md mt-2 md:mt-0 md:ml-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
          type="submit"
          class="bg-indigo-500 text-white px-4 py-2 mt-2 md:mt-0 rounded-md md:rounded-r-md hover:bg-indigo-600 transition-colors"
      >
        Добавить
      </button>
    </form>
    
    <div class="flex flex-col md:flex-row justify-between mb-4 space-y-2 md:space-y-0">
      <select v-model="statusFilter" class="p-2 border border-gray-300 rounded-md w-full md:w-auto">
        <option value="">Все</option>
        <option value="completed">Выполнено</option>
        <option value="incomplete">Не выполнено</option>
      </select>
      
      <select v-model="sortOption" class="p-2 border border-gray-300 rounded-md w-full md:w-auto mt-2 md:mt-0">
        <option value="date">📅 По дате создания</option>
        <option value="status">🔍 По статусу</option>
      </select>
    </div>
    
    <transition-group name="task" tag="ul" class="space-y-2">
      <li
          v-for="task in filteredAndSortedTasks"
          :key="task.id"
          class="p-4 bg-white border border-gray-300 rounded-md flex flex-col md:flex-row justify-between items-start md:items-center task-item"
          :class="{ 'completed-task': task.status === 'completed' }"
      >
        <div class="break-words w-full  mr-0 md:mr-9 mb-2 md:mb-0">
          <div v-if="editingTaskId === task.id"
               class="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0">
            <input
                v-model="editingTaskTitle"
                class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @keydown="handleKeyDown($event, task)"
            />
            <input
                v-model="editingTaskDescription"
                class="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-2 md:mt-0"
                @keydown="handleKeyDown($event, task)"
            />
          </div>
          <div v-else :class="{ 'line-through text-gray-500': task.status === 'completed' }">
            <h3 class="font-semibold text-gray-800">
              {{ task.title }}
            </h3>
            <p class="text-gray-700 text-sm mt-1">{{ task.description }}</p>
          </div>
        </div>
        
        <div
            class="flex flex-row items-center justify-between md:justify-end w-full mt-2 md:mt-0 space-y-2 md:space-y-0">
          <span class="hidden md:block text-sm text-gray-500 mr-0 md:mr-6 min-w-8">
            {{ formatDate(task.created_at) }}
          </span>
          
          <select
              v-model="task.status"
              @change="saveTask(task)"
              class="mr-14 md:mr-1 p-2 border border-gray-300 rounded-md w-full  md:w-auto"
          >
            <option value="completed">Выполнено</option>
            <option value="incomplete">Не выполнено</option>
          </select>
          
          <div>
            <div v-if="editingTaskId === task.id" class="flex space-x-2">
              <button @click="saveTask(task)" class="text-green-500">💾</button>
              <button @click="cancelEditing" class="text-red-500">❌</button>
            </div>
            <div v-else class="flex space-x-2">
              <button @click="startEditing(task)" class="text-blue-500">✏️</button>
              <button @click="deleteTask(task.id)" class="text-red-500">🗑️</button>
            </div>
          </div>
        </div>
      </li>
    </transition-group>
  </div>
</template>

<style scoped>
.task-enter-active, .task-leave-active {
  transition: all 0.5s ease;
}

.task-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.task-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.task-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.task-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.break-words {
  word-break: break-word;
}

.completed-task {
  box-shadow: 0 4px 8px rgba(0, 128, 0, 0.3);
  border-color: #4caf50;
}
</style>
