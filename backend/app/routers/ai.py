import json
import logging
import re
import time
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from fastapi import APIRouter, Depends, Header
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..config import settings
from ..database import get_db
from ..models import Card, Contact

router = APIRouter(prefix='/ai', tags=['ai'])
logger = logging.getLogger(__name__)


def now_ms() -> int:
    return int(time.time() * 1000)


def ensure_trace(payload: dict[str, Any] | None) -> dict[str, Any]:
    client_trace = payload if isinstance(payload, dict) else {}
    trace_id = str(client_trace.get('traceId') or f'ai-trace-{now_ms()}')
    trace: dict[str, Any] = {
        'traceId': trace_id,
        'backendReceivedAtMs': now_ms(),
    }
    frontend_clicked_at_ms = client_trace.get('frontendClickedAtMs')
    if frontend_clicked_at_ms is not None:
        trace['frontendClickedAtMs'] = frontend_clicked_at_ms
    return trace


def mark_trace_time(trace: dict[str, Any] | None, key: str) -> None:
    if trace is None or trace.get(key) is not None:
        return
    trace[key] = now_ms()


def finalize_trace(trace: dict[str, Any]) -> dict[str, Any]:
    def diff(end_key: str, start_key: str) -> int | None:
        end_value = trace.get(end_key)
        start_value = trace.get(start_key)
        if end_value is None or start_value is None:
            return None
        return int(end_value) - int(start_value)

    enriched = dict(trace)
    enriched['frontendToBackendMs'] = diff('backendReceivedAtMs', 'frontendClickedAtMs')
    enriched['backendPrepareMs'] = diff('modelRequestStartedAtMs', 'backendReceivedAtMs')
    enriched['modelFirstByteMs'] = diff('modelFirstByteAtMs', 'modelRequestStartedAtMs')
    enriched['backendReturnMs'] = diff('backendReturnedAtMs', 'modelFirstByteAtMs')
    enriched['backendTotalMs'] = diff('backendReturnedAtMs', 'backendReceivedAtMs')
    return enriched


def parse_json_block(text: str) -> dict[str, Any] | None:
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r'```json\s*([\s\S]*?)\s*```', text)
        if not match:
            return None
        try:
            return json.loads(match.group(1))
        except Exception:
            return None


def post_json(
    url: str,
    payload: dict[str, Any],
    headers: dict[str, str] | None = None,
    trace: dict[str, Any] | None = None,
) -> Any:
    data = json.dumps(payload).encode('utf-8')
    req = urllib_request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json', **(headers or {})},
        method='POST',
    )
    mark_trace_time(trace, 'modelRequestStartedAtMs')
    with urllib_request.urlopen(req, timeout=15) as resp:
        mark_trace_time(trace, 'modelFirstByteAtMs')
        return json.loads(resp.read().decode('utf-8'))


def get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    req = urllib_request.Request(url, headers=headers or {}, method='GET')
    with urllib_request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def normalize_llm_text_response(text: str) -> dict[str, Any]:
    return {
        'choices': [
            {
                'message': {
                    'content': text,
                }
            }
        ]
    }


def parse_anthropic_message_text(response: dict[str, Any]) -> str:
    content = response.get('content') or []
    if not isinstance(content, list):
        return ''
    text_parts = []
    for item in content:
        if isinstance(item, dict) and item.get('type') == 'text' and item.get('text'):
            text_parts.append(str(item['text']))
    return ''.join(text_parts).strip()


def call_minimax(prompt: str, trace: dict[str, Any] | None = None) -> dict[str, Any] | None:
    if settings.anthropic_api_key:
        try:
            base_url = (settings.anthropic_base_url or 'https://api.minimaxi.com/anthropic').rstrip('/')
            response = post_json(
                base_url + '/v1/messages',
                {
                    'model': settings.minimax_model,
                    'max_tokens': 1024,
                    'system': '你是一个名片信息提取与文案优化助手。',
                    'messages': [
                        {'role': 'user', 'content': prompt},
                    ],
                },
                headers={
                    'Authorization': 'Bearer ' + settings.anthropic_api_key,
                    'x-api-key': settings.anthropic_api_key,
                    'anthropic-version': '2023-06-01',
                },
                trace=trace,
            )
            text = parse_anthropic_message_text(response)
            if text:
                return normalize_llm_text_response(text)
        except Exception:
            return None
    if not settings.minimax_api_key:
        return None
    try:
        return post_json(
            'https://api.minimax.chat/v1/text/chatcompletion_v2',
            {
                'model': settings.minimax_model,
                'messages': [
                    {'role': 'system', 'content': '你是一个名片信息提取与文案优化助手。'},
                    {'role': 'user', 'content': prompt},
                ],
            },
            headers={'Authorization': "Bearer " + settings.minimax_api_key},
            trace=trace,
        )
    except Exception:
        return None


def call_qwen(prompt: str, system_prompt: str, trace: dict[str, Any] | None = None) -> dict[str, Any] | None:
    api_key = settings.dashscope_api_key
    base_url = (settings.dashscope_base_url or 'https://dashscope.aliyuncs.com/compatible-mode/v1').rstrip('/')
    if not api_key:
        return None
    try:
        return post_json(
            base_url + '/chat/completions',
            {
                'model': settings.qwen_model,
                'messages': [
                    {'role': 'system', 'content': system_prompt},
                    {'role': 'user', 'content': prompt},
                ],
            },
            headers={'Authorization': 'Bearer ' + api_key},
            trace=trace,
        )
    except Exception:
        return None


def call_llm(
    prompt: str,
    system_prompt: str,
    provider: str | None = None,
    trace: dict[str, Any] | None = None,
) -> dict[str, Any] | None:
    target = (provider or settings.ai_provider or 'minimax').lower()
    if target == 'qwen':
        return call_qwen(prompt, system_prompt, trace=trace) or call_minimax(prompt, trace=trace)
    return call_minimax(prompt, trace=trace) or call_qwen(prompt, system_prompt, trace=trace)


def extract_with_rules(text: str) -> dict[str, Any]:
    result = {
        'name': '',
        'role': '',
        'locationCountry': '',
        'locationCity': '',
        'bio': text or '',
        'years': '',
        'techStack': '',
        'tags': [],
        'projects': [],
    }
    if not text:
        return result

    year_match = re.search(r'(\d+)\s*年', text, re.I)
    if year_match:
        result['years'] = year_match.group(1)

    tech_keywords = [
        'Python', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Node', 'Java', 'Go', 'Rust',
        'AI', 'GPT', 'LLM', '机器学习', '深度学习', 'Flutter', 'iOS', 'Android',
        '小程序', '前端', '后端', '全栈', '算法', '数据分析', '区块链',
    ]
    found = [tech for tech in tech_keywords if tech.lower() in text.lower()]
    result['techStack'] = ', '.join(found)

    role_keywords = [
        ('独立开发者', '独立开发者'),
        ('全栈工程师', '全栈工程师'),
        ('前端工程师', '前端工程师'),
        ('后端工程师', '后端工程师'),
        ('产品经理', '产品经理'),
        ('设计师', '设计师'),
        ('创始人', '创始人'),
        ('CEO', 'CEO'),
    ]
    for keyword, role in role_keywords:
        if keyword in text:
            result['role'] = role
            break

    cn_cities = ['北京', '上海', '深圳', '广州', '杭州', '成都', '武汉', '南京']
    for city in cn_cities:
        if city in text:
            result['locationCity'] = city
            result['locationCountry'] = '中国'
            break

    tags: list[str] = []
    if '独立' in text or '一人公司' in text:
        tags.append('独立开发者')
    if 'AI' in text or 'GPT' in text:
        tags.append('AI')
    if '开源' in text:
        tags.append('开源')
    if '创业' in text:
        tags.append('创业')
    result['tags'] = tags

    intro_parts = []
    if result['role']:
        intro_parts.append(result['role'])
    if result['locationCity']:
        intro_parts.append(result['locationCity'])
    if result['techStack']:
        intro_parts.append('擅长' + result['techStack'].split(', ')[0])
    result['bio'] = '，'.join(intro_parts) or text[:50]
    return result


def extract_with_ai(text: str, provider: str | None = None, trace: dict[str, Any] | None = None) -> dict[str, Any]:
    prompt = f'''请从以下文本中提取名片信息，并以 JSON 格式返回：

文本：{text}

请返回以下格式的 JSON：
{{
  "name": "姓名",
  "role": "职业/职位",
  "locationCountry": "国家",
  "locationCity": "城市",
  "bio": "一句话介绍",
  "years": "工作年限，如：5",
  "techStack": "技术栈，用逗号分隔",
  "tags": ["标签1", "标签2"],
  "projects": []
}}

只返回 JSON，不要其他内容。'''
    response = call_llm(prompt, '你是一个名片信息提取助手。', provider, trace=trace)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '')
        parsed = parse_json_block(content)
        if parsed:
            parsed.setdefault('projects', [])
            parsed.setdefault('tags', [])
            return parsed
    return extract_with_rules(text)


def optimize_with_ai(text: str, provider: str | None = None, trace: dict[str, Any] | None = None) -> str:
    prompt = f'''请优化以下自我介绍，使其更简洁、更有吸引力：

原始内容：{text}

只返回优化后的文本。'''
    response = call_llm(prompt, '你是一个名片文案优化助手。', provider, trace=trace)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '').strip()
        if content:
            return content
    return '优化后的自我介绍：' + text


def generate_intro(data: dict[str, Any]) -> dict[str, str]:
    role = data.get('role') or '创作者'
    location_city = data.get('locationCity') or data.get('location') or ''
    tech_stack = data.get('techStack') or data.get('keywords') or ''
    intro = ''.join([
        role,
        f'，位于{location_city}' if location_city else '',
        f'，擅长{tech_stack}' if tech_stack else '',
    ])
    return {'intro': intro}


def build_contacts_context(x_user_id: str | None, db: Session | None) -> str:
    if not x_user_id or db is None or not hasattr(db, 'scalars'):
        return ''

    contacts = db.scalars(
        select(Contact)
        .options(selectinload(Contact.tags))
        .where(Contact.owner_user_id == x_user_id, Contact.status == 'active')
        .order_by(Contact.starred.desc(), Contact.updated_at.desc())
    ).all()
    if not contacts:
        return ''

    lines: list[str] = []
    for index, contact in enumerate(contacts[:12], start=1):
        card = db.get(Card, contact.target_card_id) if contact.target_card_id else None
        if card is None and contact.source_card_id:
            card = db.get(Card, contact.source_card_id)
        tags = [tag.tag_name for tag in contact.tags if tag.tag_name]
        parts = [f'{index}. {card.name if card and card.name else "联系人"}']
        if card and card.role:
            parts.append(card.role)
        if card and card.company:
            parts.append(card.company)
        if tags:
            parts.append('标签: ' + '、'.join(tags[:5]))
        if contact.note:
            parts.append('备注: ' + contact.note[:40])
        if contact.latest_interaction_text:
            parts.append('最近互动: ' + contact.latest_interaction_text[:40])
        if card and card.bio:
            parts.append('简介: ' + card.bio[:60])
        lines.append(' | '.join(parts))

    if not lines:
        return ''

    return '联系人资料摘要（用户已明确授权，仅限当前对话用于推荐，不得捏造缺失信息，不输出手机号/邮箱/微信等隐私字段）：\n' + '\n'.join(lines)


def chat_with_ai(
    message: str,
    provider: str | None = None,
    trace: dict[str, Any] | None = None,
    contacts_context: str = '',
) -> str:
    context_block = f'\n\n{contacts_context}\n\n如果用户在询问推荐合作人、按标签找人、适合联系谁，优先基于上面的联系人摘要回答；如果信息不足，要明确说明。' if contacts_context else ''
    prompt = f'''你是 eSeat 名片应用的 AI 助手，帮助用户优化个人名片内容、提升个人品牌展示。
请用简洁、友好的中文回答以下问题（100字以内）：
{context_block}

用户：{message}'''
    response = call_llm(prompt, '你是一个智能名片与个人品牌顾问。', provider, trace=trace)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '').strip()
        if content:
            return content
    # keyword fallback
    lower = message.lower()
    if '简介' in message or 'bio' in lower or '介绍' in message:
        return '建议你的简介突出三个要素：职业定位、核心能力、代表成果。例如："5 年全栈开发经验，专注 AI + SaaS 产品，本眼上线 3 款多人使用的工具。"'
    if '标签' in message or 'tag' in lower:
        return '根据您的职业方向，推荐标签：AI、全栈、SaaS、独立开发、小程序。可以在编辑页直接填入。'
    if '吸引' in message or '让' in message or '更好' in message:
        return '名片吸引力来自三点：\n1. 清晰的定位（你是谁、做什么）\n2. 真实的展示（项目、数据、成果）\n3. 明确的行动入口（联系方式、交换按钮）'
    return '我明白你的需求！建议可以在"编辑名片"页面使用 AI 一键填充，把你的个人介绍粘贴进去，我会自动提取关键字段。'


def generate_tags(identity: str) -> list[str]:
    text = identity or ''
    tags: list[str] = []
    mapping = [
        ('开发', ['技术', 'AI', '全栈']),
        ('工程师', ['技术', '产品', '效率']),
        ('设计', ['设计', '品牌', '创意']),
        ('老板', ['创业', '合作', '商业']),
        ('创始人', ['创业', '产品', '增长']),
    ]
    for keyword, values in mapping:
        if keyword in text:
            tags.extend(values)
    if not tags:
        tags = ['个人品牌', '合作', 'AI']
    return list(dict.fromkeys(tags))[:5]


def fetch_github_projects(username: str) -> list[dict[str, Any]]:
    if not username:
        return []
    data = get_json(
        'https://api.github.com/users/' + urllib_parse.quote(username) + '/repos?sort=updated&per_page=10',
        headers={'User-Agent': 'OPC-Card-MiniApp'},
    )
    if not isinstance(data, list):
        return []
    projects = [
        {
            'name': repo.get('name', ''),
            'description': repo.get('description') or '',
            'url': repo.get('html_url', ''),
            'topics': (repo.get('topics') or [])[:3],
            'stars': repo.get('stargazers_count', 0),
        }
        for repo in data[:5]
    ]
    projects.sort(key=lambda item: item.get('stars', 0), reverse=True)
    return projects


def fetch_project_readme(owner: str, repo: str) -> dict[str, Any]:
    if not owner or not repo:
        return {}
    data = get_json(
        'https://api.github.com/repos/' + urllib_parse.quote(owner) + '/' + urllib_parse.quote(repo),
        headers={'User-Agent': 'OPC-Card-MiniApp'},
    )
    return {
        'name': data.get('name', ''),
        'description': data.get('description') or '',
        'topics': (data.get('topics') or [])[:5],
        'url': data.get('html_url', ''),
        'stars': data.get('stargazers_count', 0),
    }


@router.post('/generate')
def generate(
    payload: dict[str, Any],
    x_user_id: str | None = Header(default=None, alias='X-User-Id'),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    task_type = payload.get('type', '')
    data = payload.get('data') or {}
    provider = payload.get('provider') or data.get('provider') or None
    trace = ensure_trace(data.get('trace'))
    try:
        if task_type == 'extract':
            result: Any = extract_with_ai(data.get('text', ''), provider, trace=trace)
        elif task_type == 'optimize':
            result = {'optimizedText': optimize_with_ai(data.get('bio') or data.get('text') or '', provider, trace=trace)}
        elif task_type in {'generateIntro', 'intro'}:
            result = generate_intro(data)
        elif task_type == 'tags':
            result = generate_tags(data.get('identity', ''))
        elif task_type == 'fetchGitHub':
            result = {'projects': fetch_github_projects(data.get('username', ''))}
        elif task_type == 'fetchProjectReadme':
            result = fetch_project_readme(data.get('owner', ''), data.get('repo', ''))
        elif task_type == 'chat':
            contacts_context = ''
            if data.get('allowContactsContext'):
                contacts_context = build_contacts_context(x_user_id, db)
            reply = chat_with_ai(data.get('message', ''), provider, trace=trace, contacts_context=contacts_context)
            result = {'reply': reply}
        else:
            mark_trace_time(trace, 'backendReturnedAtMs')
            return {'success': False, 'error': '未知类型', 'meta': {'trace': finalize_trace(trace)}}
        mark_trace_time(trace, 'backendReturnedAtMs')
        finalized_trace = finalize_trace(trace)
        logger.info('ai trace %s', json.dumps(finalized_trace, ensure_ascii=False))
        return {'success': True, 'result': result, 'meta': {'trace': finalized_trace}}
    except urllib_error.HTTPError as error:
        mark_trace_time(trace, 'backendReturnedAtMs')
        return {'success': False, 'error': f'HTTP {error.code}', 'meta': {'trace': finalize_trace(trace)}}
    except Exception as error:
        mark_trace_time(trace, 'backendReturnedAtMs')
        return {'success': False, 'error': str(error), 'meta': {'trace': finalize_trace(trace)}}
