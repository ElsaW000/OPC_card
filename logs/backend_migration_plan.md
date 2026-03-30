# 正式后端迁移计划

## 目标

把当前小程序从 `local-storage` 迁移到 `FastAPI + Supabase`，并为未来 App 共用同一套数据与接口。

## 当前现状

当前这些服务仍是本地存储版：

- `services/userService.js`
- `services/cardService.js`
- `services/contactService.js`
- `services/visitorService.js`
- `services/workbenchService.js`

## 已落地的后端底座

已新增：

- `backend/app/models.py`
- `backend/app/main.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/cards.py`
- `backend/app/routers/workbench.py`
- `backend/sql/001_init.sql`
- `services/apiConfig.js`
- `services/httpClient.js`

## 方案说明

当前正式方案不是“自建 PostgreSQL 优先”，而是：

- `FastAPI`：承接业务逻辑、微信登录、权限、交换规则、AI 调用
- `Supabase Postgres`：作为托管数据库起步方案
- `Supabase Storage`：后续承接头像、作品图、视频封面等资源

后续如果需要更强掌控或更低长期成本，可迁移到自建 PostgreSQL；因为底层仍然是 Postgres，迁移难度相对可控。

## 第一批真实接口

1. `POST /api/v1/auth/wechat/login`
2. `GET /api/v1/cards`
3. `POST /api/v1/cards`
4. `PUT /api/v1/cards/{card_id}`
5. `DELETE /api/v1/cards/{card_id}`
6. `POST /api/v1/cards/{card_id}/set-default`
7. `GET /api/v1/cards/{card_id}/view`
8. `GET /api/v1/workbench`

## 下一步切换顺序

1. 先完成 Supabase 项目与连接配置
2. `services/cardService.js` 继续完善 remote adapter
3. 切 `mycards`
4. 切 `edit`
5. 切 `cardDetail`
6. 再处理 `exchange / visitor / contacts / home`

## 迁移原则

- 一次只切一个页面
- 页面结构先不大改
- 先替换 `services`，再替换页面
- 小程序和未来 App 共用同一套 API
- 业务逻辑放在 FastAPI，不把前端深绑到 Supabase
