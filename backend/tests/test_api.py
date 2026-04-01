"""
壹席eSeat 后端 API 自动化测试
覆盖一期计划内的核心接口：
  - health (健康检查)
  - auth (登录)
  - cards (名片 CRUD + 默认设置)
  - visitors (访客记录)
  - contacts (联系人列表 + 交换 + 星标)
  - workbench (工作台)
  - qrcode (二维码生成)
  - ai (AI 生成接口)
"""

import io
import sys
import traceback
from typing import Any

# ---------- 依赖检测 ----------
try:
    import httpx
except ImportError:
    print("❌ 请先安装 httpx: pip install httpx")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:8001"

# 测试会话共享状态
_state: dict[str, Any] = {
    "user_id": None,
    "card_id": None,
    "contact_id": None,
}

PASS = "✅"
FAIL = "❌"
SKIP = "⏭ "

results: list[dict[str, Any]] = []


# ─────────────────────────────────────────────
# 工具函数
# ─────────────────────────────────────────────

def run_test(name: str, fn):
    try:
        fn()
        results.append({"name": name, "status": "pass"})
        print(f"  {PASS} {name}")
    except AssertionError as e:
        results.append({"name": name, "status": "fail", "reason": str(e)})
        print(f"  {FAIL} {name}: {e}")
    except Exception as e:
        results.append({"name": name, "status": "error", "reason": str(e)})
        print(f"  {FAIL} {name}: {type(e).__name__}: {e}")


def client() -> httpx.Client:
    headers = {}
    if _state["user_id"]:
        headers["X-User-Id"] = _state["user_id"]
    return httpx.Client(base_url=BASE_URL, headers=headers, timeout=10)


def assert_ok(resp: httpx.Response) -> dict:
    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text[:200]}"
    body = resp.json()
    return body


# ─────────────────────────────────────────────
# 测试分组
# ─────────────────────────────────────────────

def section(title: str):
    print(f"\n{'─' * 50}")
    print(f"  {title}")
    print(f"{'─' * 50}")


# ─── Health ───
def test_health():
    with client() as c:
        resp = c.get("/api/v1/health")
        body = assert_ok(resp)
        assert body.get("ok") is True, f"ok != True: {body}"


# ─── Auth ───
def test_auth_login():
    with client() as c:
        resp = c.post("/api/v1/auth/wechat/login", json={"code": "test_code_local"})
        body = assert_ok(resp)
        assert "user_id" in body, f"no user_id in: {body}"
        _state["user_id"] = body["user_id"]


def test_auth_missing_code():
    with client() as c:
        resp = c.post("/api/v1/auth/wechat/login", json={"code": ""})
        assert resp.status_code == 422, f"应返回 422，实际: {resp.status_code}"


# ─── Cards ───
def test_cards_list():
    with client() as c:
        resp = c.get("/api/v1/cards")
        body = assert_ok(resp)
        assert "items" in body, f"no items key: {body}"
        if body["items"]:
            _state["card_id"] = body["items"][0]["id"]


def test_cards_create():
    with client() as c:
        payload = {
            "template": "universal",
            "title": "测试名片",
            "name": "测试用户",
            "name_en": "Test User",
            "role": "独立开发者",
            "bio": "自动化测试生成的名片",
            "company": "",
            "business": "",
            "cooperation": "",
            "location_country": "中国",
            "location_city": "深圳",
            "wechat": "",
            "phone": "13800000000",
            "email": "test@example.com",
            "github_url": "https://github.com/test",
            "twitter_url": "",
            "banner_url": "",
            "avatar_url": "",
            "years": "5",
            "tech_stack": "Python, React",
            "products_count": "3",
            "users_count": "1k",
            "footer_title": "联系我",
            "footer_desc": "欢迎合作",
            "projects": [],
            "videos": [],
            "custom_cards": [],
        }
        resp = c.post("/api/v1/cards", json=payload)
        body = assert_ok(resp)
        assert "card_id" in body, f"no card_id: {body}"
        _state["card_id"] = body["card_id"]


def test_cards_get_detail():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        resp = c.get(f"/api/v1/cards/{card_id}/view")
        body = assert_ok(resp)
        assert body.get("data", {}).get("id") == card_id


def test_cards_update():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        payload = {
            "template": "developer",
            "title": "更新后名片",
            "name": "测试用户（更新）",
            "name_en": "",
            "role": "全栈工程师",
            "bio": "更新后的简介",
            "company": "",
            "business": "",
            "cooperation": "",
            "location_country": "中国",
            "location_city": "上海",
            "wechat": "",
            "phone": "13900000000",
            "email": "updated@example.com",
            "github_url": "",
            "twitter_url": "",
            "banner_url": "",
            "avatar_url": "",
            "years": "8",
            "tech_stack": "Go, Python",
            "products_count": "",
            "users_count": "",
            "footer_title": "",
            "footer_desc": "",
            "projects": [],
            "videos": [],
            "custom_cards": [],
        }
        resp = c.put(f"/api/v1/cards/{card_id}", json=payload)
        body = assert_ok(resp)
        assert body.get("card_id") == card_id


def test_cards_set_default():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        resp = c.post(f"/api/v1/cards/{card_id}/set-default")
        body = assert_ok(resp)
        assert body.get("card_id") == card_id


def test_cards_no_auth():
    """未带 X-User-Id 时应返回 401"""
    c = httpx.Client(base_url=BASE_URL, timeout=10)
    resp = c.get("/api/v1/cards")
    assert resp.status_code == 401, f"应返回 401，实际: {resp.status_code}"


# ─── Visitors ───
def test_visitors_list():
    with client() as c:
        resp = c.get("/api/v1/visitors")
        body = assert_ok(resp)
        assert "visitors" in body, f"no visitors key: {body}"


def test_visitors_record():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        resp = c.post("/api/v1/visitors/record", json={
            "card_id": card_id,
            "source": "qrcode",
        })
        body = assert_ok(resp)
        assert body.get("success") is True or "visitor_id" in body, f"unexpected: {body}"


# ─── Contacts ───
def test_contacts_list():
    with client() as c:
        resp = c.get("/api/v1/contacts")
        body = assert_ok(resp)
        assert "contacts" in body, f"no contacts key: {body}"
        if body["contacts"]:
            _state["contact_id"] = body["contacts"][0]["_id"]


def test_contacts_exchange():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        resp = c.post("/api/v1/contacts/exchange-request", json={"target_card_id": card_id})
        # 允许 200 或 400（自交换限制）
        assert resp.status_code in (200, 400), f"unexpected status: {resp.status_code}: {resp.text}"


def test_contacts_star():
    contact_id = _state.get("contact_id")
    if not contact_id:
        results.append({"name": "联系人星标", "status": "skip"})
        print(f"  {SKIP} 联系人星标：无联系人可用")
        return
    with client() as c:
        resp = c.post(f"/api/v1/contacts/{contact_id}/star")
        body = assert_ok(resp)
        assert "starred" in body, f"no starred: {body}"


# ─── Workbench ───
def test_workbench():
    with client() as c:
        resp = c.get("/api/v1/workbench")
        body = assert_ok(resp)
        assert "visitor_count" in body or "weeklyViews" in body or "weekly_views" in body, \
            f"no visitor stats: {body.keys()}"


# ─── QRCode ───
def test_qrcode_generate():
    with client() as c:
        resp = c.get("/api/v1/qrcode", params={"path": "/pages/mycards/mycards"})
        assert resp.status_code in (200, 503), f"unexpected: {resp.status_code}"
        if resp.status_code == 200:
            assert resp.headers.get("content-type", "").startswith("image/png"), \
                f"wrong content-type: {resp.headers.get('content-type')}"


# ─── AI ───
def test_ai_extract():
    with client() as c:
        resp = c.post("/api/v1/ai/generate", json={
            "type": "extract",
            "data": {"text": "我是一名全栈工程师，在深圳工作了8年，擅长Python和React"}
        })
        body = assert_ok(resp)
        assert body.get("success") is True, f"AI extract failed: {body}"
        result = body.get("result", {})
        assert isinstance(result, dict), f"result not dict: {result}"


def test_ai_optimize():
    with client() as c:
        resp = c.post("/api/v1/ai/generate", json={
            "type": "optimize",
            "data": {"bio": "我做过很多项目，技术比较好，擅长各种语言"}
        })
        body = assert_ok(resp)
        assert body.get("success") is True, f"AI optimize failed: {body}"


def test_ai_tags():
    with client() as c:
        resp = c.post("/api/v1/ai/generate", json={
            "type": "tags",
            "data": {"identity": "独立开发者和AI创业公司创始人"}
        })
        body = assert_ok(resp)
        assert body.get("success") is True, f"AI tags failed: {body}"
        assert isinstance(body.get("result"), list), f"result not list: {body}"


def test_ai_chat():
    with client() as c:
        resp = c.post("/api/v1/ai/generate", json={
            "type": "chat",
            "data": {"message": "帮我优化名片的简介"}
        })
        body = assert_ok(resp)
        assert body.get("success") is True, f"AI chat failed: {body}"
        assert "reply" in body.get("result", {}), f"no reply: {body}"


def test_ai_unknown_type():
    with client() as c:
        resp = c.post("/api/v1/ai/generate", json={
            "type": "not_exist",
            "data": {}
        })
        body = assert_ok(resp)
        assert body.get("success") is False, f"应返回 success=False: {body}"


# ─── Cards 删除（放最后）───
def test_cards_delete():
    card_id = _state.get("card_id")
    if not card_id:
        raise AssertionError("无可用 card_id，跳过")
    with client() as c:
        resp = c.delete(f"/api/v1/cards/{card_id}")
        assert resp.status_code in (200, 204, 400), \
            f"unexpected: {resp.status_code}: {resp.text}"


# ─────────────────────────────────────────────
# 主执行流程
# ─────────────────────────────────────────────

def main():
    print("\n" + "=" * 60)
    print("  壹席eSeat 后端 API 自动化测试")
    print(f"  服务地址: {BASE_URL}")
    print("=" * 60)

    section("1. 健康检查")
    run_test("服务健康检查", test_health)

    section("2. Auth 登录")
    run_test("微信登录（模拟）", test_auth_login)
    run_test("空 code 应返回 422", test_auth_missing_code)

    if not _state["user_id"]:
        print("\n⚠️  登录失败，无法继续后续测试，请确保后端服务正在运行")
        _print_summary()
        sys.exit(1)

    section("3. 名片 (Cards)")
    run_test("获取名片列表", test_cards_list)
    run_test("创建名片", test_cards_create)
    run_test("获取名片详情", test_cards_get_detail)
    run_test("更新名片", test_cards_update)
    run_test("设置默认名片", test_cards_set_default)
    run_test("未授权访问应返回 401", test_cards_no_auth)

    section("4. 访客记录 (Visitors)")
    run_test("获取访客列表", test_visitors_list)
    run_test("记录访客", test_visitors_record)

    section("5. 联系人 (Contacts)")
    run_test("获取联系人列表", test_contacts_list)
    run_test("发起名片交换", test_contacts_exchange)
    run_test("星标联系人", test_contacts_star)

    section("6. 工作台 (Workbench)")
    run_test("获取工作台数据", test_workbench)

    section("7. 二维码 (QRCode)")
    run_test("生成二维码", test_qrcode_generate)

    section("8. AI 生成接口")
    run_test("AI 信息提取 (extract)", test_ai_extract)
    run_test("AI 简介优化 (optimize)", test_ai_optimize)
    run_test("AI 标签推荐 (tags)", test_ai_tags)
    run_test("AI 对话 (chat)", test_ai_chat)
    run_test("AI 未知类型应返回 success=False", test_ai_unknown_type)

    section("9. 清理 - 删除测试名片")
    run_test("删除测试名片", test_cards_delete)

    _print_summary()


def _print_summary():
    passed = sum(1 for r in results if r["status"] == "pass")
    failed = sum(1 for r in results if r["status"] in ("fail", "error"))
    skipped = sum(1 for r in results if r["status"] == "skip")
    total = len(results)

    print("\n" + "=" * 60)
    print(f"  测试结果: {passed}/{total} 通过  {failed} 失败  {skipped} 跳过")
    print("=" * 60)

    if failed:
        print("\n  失败详情:")
        for r in results:
            if r["status"] in ("fail", "error"):
                print(f"    {FAIL} {r['name']}: {r.get('reason', '')}")

    if failed == 0:
        print(f"\n  🎉 全部测试通过！一期接口已就绪。")
    else:
        print(f"\n  ⚠️  有 {failed} 个测试未通过，请检查对应接口。")
    print()


if __name__ == "__main__":
    main()
