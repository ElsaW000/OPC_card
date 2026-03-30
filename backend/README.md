# 壹席eSeat Backend

面向 `壹席eSeat` 小程序与未来 App 的统一后端骨架。

当前目标：

- 替代小程序里的 `local-storage` 数据层
- 统一用户、名片、联系人、访客、交换记录
- 为后续 App 直接复用同一套 API
- 先用 `Supabase` 作为托管 Postgres/Storage 起步方案

## 推荐技术栈

- Python 3.11+
- FastAPI
- SQLAlchemy 2.x
- Supabase Postgres
- Supabase Storage
- Alembic

## 目录结构

```text
backend/
  app/
    routers/
    main.py
    config.py
    database.py
    schemas.py
    models.py
  sql/
    001_init.sql
  requirements.txt
  .env.example
```

## 本地启动

1. 创建虚拟环境
2. 安装依赖
3. 配置 `.env`
4. 确认 Supabase 数据库连接串可用
5. 启动服务

示例命令：

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir backend
```

## 环境变量说明

- `DATABASE_URL`：Supabase Postgres 连接串
- `SUPABASE_URL`：Supabase 项目 URL
- `SUPABASE_ANON_KEY`：前端公开 Key
- `SUPABASE_SERVICE_ROLE_KEY`：后端服务角色 Key
- `WECHAT_APP_ID`：小程序 AppID
- `WECHAT_APP_SECRET`：小程序密钥
- `JWT_SECRET`：后端签名密钥

## 第一批真实接口

- `POST /api/v1/auth/wechat/login`
- `GET /api/v1/cards`
- `POST /api/v1/cards`
- `PUT /api/v1/cards/{card_id}`
- `DELETE /api/v1/cards/{card_id}`
- `POST /api/v1/cards/{card_id}/set-default`
- `GET /api/v1/cards/{card_id}/view`
- `GET /api/v1/workbench`

## 第二批接口

- `GET /api/v1/contacts`
- `POST /api/v1/contacts/{contact_id}/star`
- `POST /api/v1/contacts/{contact_id}/approve`
- `POST /api/v1/contacts/{contact_id}/reject`
- `GET /api/v1/visitors`
- `POST /api/v1/exchange/request`
- `POST /api/v1/exchange/accept`

## 架构原则

- 页面层不直接感知数据库
- 小程序和未来 App 共用同一套 API
- 业务逻辑优先放在 FastAPI，不直接把前端深绑到 Supabase
- 先替换 `services/*`，再逐页替换页面
- 迁移顺序优先：`mycards -> edit -> cardDetail -> exchange -> visitor -> contacts -> home`

## 为什么先用 Supabase

- 起步快：自带托管 Postgres、Storage、后台管理界面
- 适合一期内测快速落地
- 底层仍然是 PostgreSQL，后续可迁到自建 PostgreSQL
