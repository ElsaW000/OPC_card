# 一期数据架构草案

## 当前策略

一期小程序先采用 `services + 本地持久化仓库` 继续完成核心功能，页面层不直接依赖微信云开发。
后续正式上线时，替换 `services` 底层实现为自有后端 API，即可同时支持小程序与 App。

## 推荐正式架构

- 小程序前端：负责页面、分享、扫码、微信登录入口
- 自有后端：负责用户体系、名片、联系人、访客、交换记录
- 正式数据库：推荐 `PostgreSQL` 或 `MySQL`
- 对象存储：头像、名片封面、作品图、视频封面

## 统一数据表

### `users`
- `id`: 主键
- `wechat_openid`: 小程序唯一身份
- `union_id`: 可选，跨端打通时使用
- `nickname`: 用户昵称
- `avatar_url`: 头像
- `phone`: 手机号
- `source`: 注册来源
- `app_user_id`: App 账号映射
- `created_at`
- `updated_at`
- `last_login_at`

### `cards`
- `id`: 主键
- `user_id`: 归属用户
- `template`: 名片模板
- `type`: 名片类型
- `title`: 名片标题
- `is_default`: 是否默认名片
- `name`
- `name_en`
- `role`
- `bio`
- `company`
- `business`
- `cooperation`
- `location_country`
- `location_city`
- `wechat`
- `phone`
- `email`
- `github_url`
- `twitter_url`
- `banner_url`
- `avatar_url`
- `years`
- `tech_stack`
- `products`
- `users_count`
- `footer_title`
- `footer_desc`
- `created_at`
- `updated_at`

### `card_projects`
- `id`
- `card_id`
- `title`
- `description`
- `thumbnail_url`
- `link_url`
- `github_url`
- `sort_order`
- `created_at`
- `updated_at`

### `card_project_tags`
- `id`
- `project_id`
- `tag_name`

### `card_videos`
- `id`
- `card_id`
- `title`
- `thumbnail_url`
- `link_url`
- `views_text`
- `duration_text`
- `sort_order`
- `created_at`
- `updated_at`

### `card_custom_blocks`
- `id`
- `card_id`
- `title`
- `content`
- `sort_order`
- `created_at`
- `updated_at`

### `contacts`
- `id`
- `owner_user_id`
- `contact_user_id`
- `source_card_id`
- `target_card_id`
- `status`: `pending / pending_sent / active / rejected`
- `starred`
- `has_update`
- `note`
- `latest_interaction_text`
- `created_at`
- `updated_at`

### `contact_tags`
- `id`
- `contact_id`
- `tag_name`

### `visitors`
- `id`
- `owner_user_id`
- `visitor_user_id`
- `card_id`
- `source`: 微信分享 / 二维码 / 链接打开
- `visit_count`
- `first_visit_at`
- `last_visit_at`
- `created_at`
- `updated_at`

### `exchange_records`
- `id`
- `requester_user_id`
- `target_user_id`
- `requester_card_id`
- `target_card_id`
- `status`
- `channel`
- `created_at`
- `updated_at`

## 页面层改造原则

- 页面只调用 `services`
- `services` 负责屏蔽本地存储 / 微信云开发 / 自有后端差异
- 后续切换正式后端时，优先保持页面参数和返回结构不变

## 下一步建议

1. 补齐 `exchangeconfirm / contactdetail` 到 `services`
2. 增加 API Adapter 骨架，为后端联调预留接口
3. 再决定最终落地技术栈：`FastAPI + PostgreSQL` 或 `Node.js + PostgreSQL`