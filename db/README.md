# Локальная база данных (разработка)

Это **локальная** база PostgreSQL на ноутбуке — только для разработки и тестов.
Сайт на Vercel и Telegram Mini App к ней подключиться не могут. Боевая база
будет отдельной: персональные данные граждан РФ нужно хранить в базе на территории РФ
(см. раздел «Перед публичным запуском» в корневом `README.md`).

## Где что лежит

| Что | Где |
|---|---|
| Программа PostgreSQL 16 | `C:\Program Files\PostgreSQL\16\` |
| **Сами данные базы** | `C:\Program Files\PostgreSQL\16\data\` — **не трогать руками**, ими управляет служба |
| Служба Windows | `postgresql-x64-16` (запускается сама вместе с Windows) |
| База проекта | `mystara_dev`, пользователь `mystara_app` |
| Доступ приложения | `DATABASE_URL` в файле `.env.local` в корне проекта (в git не попадает) |
| Резервные копии | `db\backups\` (в git не попадают) |
| Пароль администратора `postgres` | его знает только установщик; нужен лишь для создания баз и пользователей |

## Команды

Посмотреть базу глазами (таблицы, схема связей, SQL-консоль) — откроется Prisma Studio на http://localhost:5555:

```powershell
powershell -ExecutionPolicy Bypass -File db\studio.ps1
```

Сделать резервную копию:

```powershell
powershell -ExecutionPolicy Bypass -File db\backup.ps1
```

Восстановить (заменяет текущее содержимое базы, поэтому нужен флаг `-Yes`):

```powershell
powershell -ExecutionPolicy Bypass -File db\restore.ps1 -File db\backups\ИМЯ.dump -Yes
```

Применить миграции (после изменения `prisma/schema.prisma`): сначала
`npx prisma migrate dev --name что_изменилось`, на боевой базе — `npx prisma migrate deploy`.

Остановить / запустить службу (в PowerShell от имени администратора):

```powershell
Stop-Service postgresql-x64-16
Start-Service postgresql-x64-16
```

## Правила

- Не удалять и не перемещать папку `data` — это потеря всех данных.
- Не использовать эту базу как боевую и не вносить в неё настоящих пользователей.
- Перед рискованными изменениями схемы — сначала `backup.ps1`.
