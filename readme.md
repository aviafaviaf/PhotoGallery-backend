# Photo Gallery - Backend API

Серверная часть приложения для управления фотогалереей с возможностью загрузки изображений, комментирования и добавления в избранное.

## Основные технологии
- Node.js
- Express.js
- PostgreSQL
- JWT аутентификация
- Cloudinary для хранения изображений

## Деплой
Проект доступен по url:
https://photogallery-backend-2s77.onrender.com

## Установка
1. Клонировать репозиторий:
`git clone https://github.com/aviafaviaf/PhotoGallery-backend.git`
`cd PhotoGallery-backend`

2. Установить зависимости:
`npm install`

3. Создать файл `.env` со следующими переменными:
PORT=5000
DB_HOST=db_host
DB_PORT=db_port
DB_USER=db_user
DB_PASSWORD=db_password
DB_NAME=db_name
CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret

4. Запустить сервер:
`npm run dev` или
`npm start` 

## API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Авторизация пользователя

### Операции с фотографиями
- `POST /api/photos/upload` - Загрузка новой фотографии (требуется аутентификация)
- `DELETE /api/photos/:id` - Удаление фотографии (требуется аутентификация)
- `GET /api/photos/` - Получение всех фотографий
- `GET /api/photos/my` - Получение фотографий текущего пользователя (требуется аутентификация)
- `GET /api/photos/user/:id` - Получение фотографий по ID пользователя
- `PATCH /api/photos/:id/publish` - Изменение статуса публикации (требуется аутентификация)

### Избранное
- `POST /api/photos/:photoId/favorite` - Добавить в избранное (требуется аутентификация)
- `DELETE /api/photos/:photoId/favorite` - Удалить из избранного (требуется аутентификация)
- `GET /api/photos/favorites` - Получить избранные фотографии (требуется аутентификация)

### Комментарии
- `POST /api/photos/:photoId/comments` - Добавить комментарий (требуется аутентификация)
- `GET /api/photos/:photoId/comments` - Получить комментарии к фотографии
- `DELETE /api/photos/comments/:id` - Удалить комментарий (требуется аутентификация)

## Структура проекта
BACKEND/
├── src/ # Исходный код
│ ├── controllers/ # Контроллеры
│ │ ├── authController.ts
│ │ └── photoController.ts
│ ├── middleware/ # Промежуточное ПО
│ │ ├── authMiddleware.ts
│ │ └── cloudinaryUpload.ts
│ ├── routes/ # Маршруты
│ │ ├── authRoutes.ts
│ │ └── photoRoutes.ts
│ ├── utils/ # Вспомогательные утилиты
│ │ └── cloudinary.ts
│ ├── db.ts # Подключение к БД
│ └── index.ts # Точка входа
├── package.json
└── tsconfig.json