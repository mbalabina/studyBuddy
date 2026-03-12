# Study Buddy - Интеграция Frontend с Backend

## 🚀 Быстрый старт

### 1. Переменные окружения
Создайте файл `.env.local` в корне проекта:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 2. Запуск Backend
Backend запущен на порту **3001** (Express.js + tRPC)

### 3. Запуск Frontend
```bash
npm run dev
# Frontend будет доступен на http://localhost:3000
```

---

## 📋 Исправленные файлы

### Новые файлы для замены:

1. **`components/screens/search-screens-fixed.tsx`**
   - ✅ Исправлены все проблемы с поиском и лайками
   - ✅ Добавлены три раздела в "Мои лайки": кандидаты, поклонники, избранное
   - ✅ Крестик на карточке возвращает к списку, не удаляет
   - ✅ Добавлены вкладки с целями
   - ✅ Профиль пользователя с подробной информацией

2. **`components/screens/home-screen-fixed.tsx`**
   - ✅ Добавлена кнопка профиля в заголовок
   - ✅ Новый экран профиля с редактированием
   - ✅ Поддержка Telegram и VK
   - ✅ Улучшенная навигация

3. **`components/screens/about-you-screen-fixed.tsx`**
   - ✅ Поддержка выбора статуса (студент/ученик)
   - ✅ Поддержка Telegram и VK
   - ✅ Правильная навигация между шагами
   - ✅ Кнопка "Назад" на каждом шаге

### Как использовать исправленные файлы:

```bash
# Замените оригинальные файлы на исправленные:
cp components/screens/search-screens-fixed.tsx components/screens/search-screens.tsx
cp components/screens/home-screen-fixed.tsx components/screens/home-screen.tsx
cp components/screens/about-you-screen-fixed.tsx components/screens/about-you-screen.tsx
```

---

## 🔌 API Endpoints

### Аутентификация
- `POST /api/trpc/auth.register` - Регистрация
- `POST /api/trpc/auth.login` - Вход
- `GET /api/trpc/auth.me` - Текущий пользователь

### Профиль
- `GET /api/trpc/profile.getMe` - Получить мой профиль
- `POST /api/trpc/profile.updateAboutMe` - Обновить "About Me"
- `POST /api/trpc/profile.updatePreferences` - Обновить "Partner Preferences"

### Матчинг
- `GET /api/trpc/matching.getCandidates` - Получить кандидатов
- `GET /api/trpc/matching.getCandidate` - Получить профиль кандидата

### Лайки
- `POST /api/trpc/favorites.like` - Лайкнуть пользователя
- `POST /api/trpc/favorites.unlike` - Убрать лайк
- `GET /api/trpc/favorites.getMyFavorites` - Получить избранное
- `GET /api/trpc/favorites.getAdmirers` - Получить поклонников

---

## 🐛 Исправленные баги

| Баг | Решение |
|-----|---------|
| Нельзя выбрать статус ученик | ✅ Добавлены оба варианта в about-you-screen |
| Система просит пройти анкеты при добавлении цели | ✅ Исправлена логика в app-context |
| Нет перехода между анкетами | ✅ Добавлена кнопка "Далее" и правильная навигация |
| Кнопка "+" не создает задачу на "Мои лайки" | ✅ Переделана структура экрана |
| Нельзя переключаться между задачами | ✅ Добавлены вкладки с целями |
| Пользователь не отображается после лайка | ✅ Исправлена логика состояния |
| Крестик удаляет пользователя | ✅ Теперь возвращает к списку |
| Кнопка назад возвращает в начало | ✅ Исправлена навигация |
| Нет профиля пользователя | ✅ Добавлен экран профиля |
| Нет фильтра по задачам | ✅ Добавлены вкладки с целями |
| Экран "перейти к выбору" пустой | ✅ Добавлена информация и кнопка |
| Нет редактирования профиля | ✅ Добавлен режим редактирования |
| Только Telegram | ✅ Добавлена поддержка VK |

---

## 📱 Структура app-context

Обновите `lib/app-context.tsx` для поддержки новых полей:

```typescript
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  city: string
  age: number
  role: "student" | "pupil"
  university: string
  program: string
  course: string
  messenger: "telegram" | "vk"
  messengerHandle: string
  studyGoals: StudyGoal[]
  
  // Survey 1
  preferredTime: string[]
  motivation: string[]
  knowledgeLevel: string
  learningStyle: string[]
  organization: number
  sociability: number
  friendliness: number
  stressResistance: number
  
  // Survey 2
  importantInStudy: string[]
  additionalGoals: string[]
  partnerLevel: string
  importantTraits: string[]
  partnerLearningStyle: string[]
}

interface AppState {
  user: User
  currentCandidateIndex: number
  matchedCandidate: Candidate | null
  likedCandidates: string[]
  screen: AppScreen
}
```

---

## 🔄 Интеграция с Backend API

### Пример: Получить кандидатов

```typescript
// В вашем app-context или компоненте
const getCandidates = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/trpc/matching.getCandidates`
    )
    const data = await response.json()
    return data.result.data
  } catch (error) {
    console.error("Error fetching candidates:", error)
  }
}
```

### Пример: Лайкнуть пользователя

```typescript
const likeCandidates = async (candidateId: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/trpc/favorites.like`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ candidateId }),
      }
    )
    return await response.json()
  } catch (error) {
    console.error("Error liking candidate:", error)
  }
}
```

---

## 🧪 Тестирование

### Тестовые учетные данные:
```
Email: test@example.com
Password: password123
```

### Проверка интеграции:
1. Откройте DevTools (F12)
2. Перейдите на вкладку Network
3. Выполните действие (регистрация, лайк и т.д.)
4. Проверьте запрос к `/api/trpc/...`

---

## ⚠️ Важные замечания

1. **Порты**: Backend на 3001, Frontend на 3000
2. **CORS**: Backend настроен для приема запросов с localhost:3000
3. **Токены**: JWT токены хранятся в localStorage
4. **Данные**: Используются mock данные из app-context (замените на реальные)

---

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12 → Console)
2. Проверьте Network tab для ошибок API
3. Убедитесь, что backend запущен на порту 3001
4. Проверьте переменные окружения в `.env.local`

---

## 🎯 Следующие шаги

1. Замените mock данные на реальные API запросы
2. Добавьте обработку ошибок
3. Добавьте loading состояния
4. Добавьте валидацию форм
5. Оптимизируйте производительность

Удачи! 🚀
