# deploy/aliyun/README.md

# eSeat 阿里云部署说明

目标：

- 域名：`api.eseat.cn`
- 服务器：`47.238.138.180`
- 后端：`FastAPI + Uvicorn`
- 反向代理：`Nginx`

## 1. 服务器基础依赖

```bash
apt update
apt install -y python3 python3-venv python3-pip nginx git
```

## 2. 项目目录

建议部署到：

```bash
/opt/eseat
```

如果代码已在 Git 仓库：

```bash
cd /opt/eseat
git clone <YOUR_GIT_REPO_URL> OPC_card
```

如果暂时没有 Git 远程仓库，可以先用 `scp` 或阿里云工作台把仓库传到服务器。

## 3. Python 虚拟环境

```bash
cd /opt/eseat/OPC_card
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
```

## 4. 环境变量

在服务器创建文件：

```bash
/opt/eseat/OPC_card/backend/.env
```

参考：

```bash
cp /opt/eseat/OPC_card/deploy/aliyun/backend.env.example /opt/eseat/OPC_card/backend/.env
```

必填项：

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`
- `JWT_SECRET`
- `DASHSCOPE_API_KEY`
- `MINIMAX_API_KEY`

## 5. 本机先验证 FastAPI

```bash
cd /opt/eseat/OPC_card
source .venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8001 --app-dir backend
```

另开一个终端：

```bash
curl http://127.0.0.1:8001/api/v1/health
```

成功后会返回健康检查 JSON。

## 6. Nginx

复制模板：

```bash
cp /opt/eseat/OPC_card/deploy/aliyun/nginx/api.eseat.cn.conf /etc/nginx/sites-available/eseat-api
ln -sf /etc/nginx/sites-available/eseat-api /etc/nginx/sites-enabled/eseat-api
nginx -t
systemctl reload nginx
```

HTTP 打通后验证：

```bash
curl http://api.eseat.cn/api/v1/health
```

## 7. systemd

复制模板：

```bash
cp /opt/eseat/OPC_card/deploy/aliyun/systemd/eseat-api.service /etc/systemd/system/eseat-api.service
systemctl daemon-reload
systemctl enable eseat-api
systemctl start eseat-api
systemctl status eseat-api
```

日志查看：

```bash
journalctl -u eseat-api -f
```

## 8. HTTPS

HTTP 打通后，再申请证书并启用 `443`。

证书到位后建议：

- 小程序请求地址：`https://api.eseat.cn/api/v1`
- 微信后台合法域名：`https://api.eseat.cn`

## 9. 最小验收

按顺序检查：

1. `curl http://127.0.0.1:8001/api/v1/health`
2. `curl http://api.eseat.cn/api/v1/health`
3. `systemctl status eseat-api`
4. 小程序能完成 `/auth/wechat/login`
5. 小程序能读取 `/cards`
