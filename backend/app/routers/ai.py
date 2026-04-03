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


def extract_with_ai(
    text: str,
    provider: str | None = None,
    trace: dict[str, Any] | None = None,
    self_context: str = '',
    contacts_context: str = '',
) -> dict[str, Any]:
    context_block = ''
    if self_context:
        context_block += f'{self_context}\n\n如果用户当前输入缺少部分字段，可以参考上面的本人资料补全，但用户这次明确输入的内容优先。\n\n'
    if contacts_context:
        context_block += f'{contacts_context}\n\n联系人摘要只可用于推断标签、合作方向，不要把联系人身份误写成用户自己的资料。\n\n'
    prompt = f'''{context_block}请从以下文本中提取名片信息，并以 JSON 格式返回：

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


def optimize_with_ai(
    text: str,
    provider: str | None = None,
    trace: dict[str, Any] | None = None,
    self_context: str = '',
) -> str:
    context_block = f'{self_context}\n\n' if self_context else ''
    prompt = f'''{context_block}请优化以下自我介绍，使其更简洁、更有吸引力：

原始内容：{text}

只返回优化后的文本。'''
    response = call_llm(prompt, '你是一个名片文案优化助手。', provider, trace=trace)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '').strip()
        if content:
            return content
    return '优化后的自我介绍：' + text


def generate_intro(data: dict[str, Any], self_profile: dict[str, Any] | None = None) -> dict[str, str]:
    profile = self_profile if isinstance(self_profile, dict) else {}
    role = data.get('role') or profile.get('role') or '创作者'
    location_city = data.get('locationCity') or data.get('location') or profile.get('locationCity') or ''
    tech_stack = data.get('techStack') or data.get('keywords') or profile.get('techStack') or ''
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


def _to_text(value: Any) -> str:
    if value is None:
        return ''
    return str(value).strip()


def get_self_profile_snapshot(
    x_user_id: str | None,
    db: Session | None,
    draft: dict[str, Any] | None = None,
) -> dict[str, Any]:
    profile: dict[str, Any] = {}
    if x_user_id and db is not None and hasattr(db, 'scalar'):
        default_card = db.scalar(select(Card).where(Card.user_id == x_user_id, Card.is_default.is_(True)))
        if not default_card:
            default_card = db.scalar(select(Card).where(Card.user_id == x_user_id).order_by(Card.updated_at.desc()))
        if default_card:
            profile = {
                'name': _to_text(default_card.name),
                'role': _to_text(default_card.role),
                'company': _to_text(default_card.company),
                'bio': _to_text(default_card.bio),
                'locationCountry': _to_text(default_card.location_country),
                'locationCity': _to_text(default_card.location_city),
                'years': _to_text(default_card.years),
                'techStack': _to_text(default_card.tech_stack),
                'business': _to_text(default_card.business),
                'cooperation': _to_text(default_card.cooperation),
                'projects': [
                    {
                        'title': _to_text(project.title),
                        'description': _to_text(project.description),
                        'tags': [_to_text(tag.tag_name) for tag in project.tags if _to_text(tag.tag_name)],
                    }
                    for project in (default_card.projects or [])[:3]
                ],
                'customCards': [
                    {
                        'title': _to_text(block.title),
                        'content': _to_text(block.content),
                    }
                    for block in (default_card.custom_blocks or [])[:3]
                ],
            }

    draft_data = draft if isinstance(draft, dict) else {}
    for field in ['name', 'role', 'company', 'bio', 'locationCountry', 'locationCity', 'years', 'techStack', 'business', 'cooperation']:
        draft_value = _to_text(draft_data.get(field))
        if draft_value:
            profile[field] = draft_value

    if isinstance(draft_data.get('projects'), list) and draft_data.get('projects'):
        profile['projects'] = [
            {
                'title': _to_text(item.get('title')),
                'description': _to_text(item.get('description')),
                'tags': item.get('tags') if isinstance(item.get('tags'), list) else [tag.strip() for tag in _to_text(item.get('tags')).replace('，', ',').split(',') if tag.strip()],
            }
            for item in draft_data.get('projects', [])[:3]
            if isinstance(item, dict)
        ]

    if isinstance(draft_data.get('customCards'), list) and draft_data.get('customCards'):
        profile['customCards'] = [
            {
                'title': _to_text(item.get('title')),
                'content': _to_text(item.get('content')),
            }
            for item in draft_data.get('customCards', [])[:3]
            if isinstance(item, dict)
        ]

    return profile


def build_self_profile_context(self_profile: dict[str, Any] | None) -> str:
    profile = self_profile if isinstance(self_profile, dict) else {}
    if not profile:
        return ''

    lines: list[str] = []
    for label, key in [
        ('姓名', 'name'),
        ('角色', 'role'),
        ('公司', 'company'),
        ('所在地', 'locationCity'),
        ('经验', 'years'),
        ('技术栈', 'techStack'),
        ('业务方向', 'business'),
        ('合作诉求', 'cooperation'),
        ('简介', 'bio'),
    ]:
        value = _to_text(profile.get(key))
        if not value:
            continue
        suffix = ' 年' if key == 'years' and value.isdigit() else ''
        lines.append(f'{label}: {value}{suffix}')

    projects = profile.get('projects') if isinstance(profile.get('projects'), list) else []
    for index, project in enumerate(projects[:3], start=1):
        if not isinstance(project, dict):
            continue
        title = _to_text(project.get('title'))
        description = _to_text(project.get('description'))
        tags = project.get('tags') if isinstance(project.get('tags'), list) else []
        parts = [f'项目{index}: {title or "未命名项目"}']
        if description:
            parts.append(description[:60])
        if tags:
            parts.append('标签: ' + '、'.join([_to_text(tag) for tag in tags if _to_text(tag)][:4]))
        lines.append(' | '.join(parts))

    custom_cards = profile.get('customCards') if isinstance(profile.get('customCards'), list) else []
    for index, item in enumerate(custom_cards[:3], start=1):
        if not isinstance(item, dict):
            continue
        title = _to_text(item.get('title'))
        content = _to_text(item.get('content'))
        if title or content:
            lines.append(f'补充资料{index}: {title or "补充信息"} | {content[:60]}')

    if not lines:
        return ''

    return '用户自己的名片资料（默认可供 AI 助手使用，仅用于当前对话或名片润色，不得凭空补造隐私字段）：\n' + '\n'.join(lines)


def is_contacts_context_authorized(x_user_id: str | None, db: Session | None) -> bool:
    if not x_user_id or db is None:
        return False
    from ..models import Setting

    setting = db.scalar(select(Setting).where(Setting.user_id == x_user_id))
    if not setting:
        return False
    raw = setting.blacklist_json or '[]'
    try:
        parsed = json.loads(raw)
    except Exception:
        return False
    if isinstance(parsed, dict):
        return bool(parsed.get('allow_ai_contacts_context', False))
    if isinstance(parsed, list):
        return False
    return False


def is_contact_recommendation_query(message: str) -> bool:
    lower = (message or '').lower()
    keywords = [
        '推荐',
        '合作人',
        '联系人',
        '适合联系',
        '找人',
        'ai方向',
        'ai ',
        '谁合适',
    ]
    return any(keyword in message or keyword in lower for keyword in keywords)


def extract_contacts_from_context(contacts_context: str) -> list[dict[str, str]]:
    contacts: list[dict[str, str]] = []
    if not contacts_context:
        return contacts

    for raw_line in contacts_context.splitlines():
        line = raw_line.strip()
        if not line or line.startswith('联系人资料摘要'):
            continue
        parts = [part.strip() for part in line.split('|') if part.strip()]
        if not parts:
            continue
        name_part = parts[0]
        name = re.sub(r'^\d+\.\s*', '', name_part).strip()
        if not name:
            continue
        detail_parts = [part for part in parts[1:] if part]
        contacts.append(
            {
                'name': name,
                'reason': '，'.join(detail_parts[:2]) if detail_parts else '当前联系人摘要里可见',
            }
        )
    return contacts


def build_contact_recommendation_fallback(contacts_context: str) -> str | None:
    contacts = extract_contacts_from_context(contacts_context)
    if not contacts:
        return None

    selected = contacts[:3]
    suggestions = [f"{contact['name']}：{contact['reason']}" for contact in selected]
    return '基于当前已授权联系人资料，优先可联系 ' + '；'.join(suggestions) + '。'


def is_self_profile_query(message: str) -> bool:
    lower = (message or '').lower()
    keywords = [
        '我的名片',
        '我的资料',
        '我的介绍',
        '我的简介',
        '对我的名片',
        '优化我的',
        '建议',
    ]
    return any(keyword in message or keyword in lower for keyword in keywords)


def build_self_profile_advice_fallback(self_profile: dict[str, Any] | None) -> str | None:
    profile = self_profile if isinstance(self_profile, dict) else {}
    if not profile:
        return None

    suggestions: list[str] = []
    role = _to_text(profile.get('role'))
    bio = _to_text(profile.get('bio'))
    tech_stack = _to_text(profile.get('techStack'))
    projects = profile.get('projects') if isinstance(profile.get('projects'), list) else []

    if role and tech_stack:
        suggestions.append(f'把“{role} + {tech_stack.split(",")[0].strip()}”放到开头，定位会更清晰')
    elif role:
        suggestions.append(f'先把“{role}”放在名片最前面，让别人一眼知道你做什么')
    if bio:
        suggestions.append('简介里再补一个结果或代表项目，会比单纯描述方向更有说服力')
    else:
        suggestions.append('建议补一段 30 到 60 字简介，包含定位、擅长方向和代表成果')
    if not projects:
        suggestions.append('再补一个代表项目或案例，名片说服力会明显提升')

    if not suggestions:
        return None
    return '结合你当前的名片资料，建议先做这几处优化：' + '；'.join(suggestions[:3]) + '。'


def chat_with_ai(
    message: str,
    provider: str | None = None,
    trace: dict[str, Any] | None = None,
    self_context: str = '',
    self_profile: dict[str, Any] | None = None,
    contacts_context: str = '',
) -> dict[str, Any]:
    context_block = ''
    if self_context:
        context_block += f'\n\n{self_context}\n\n如果用户在询问“我的名片怎么样、该怎么优化、该怎么写简介/标签/展示”，优先基于上面的本人资料回答。'
    if contacts_context:
        context_block += (
            f'\n\n{contacts_context}\n\n'
            '如果用户在询问推荐合作人、按标签找人、适合联系谁，必须优先基于上面的联系人摘要回答。'
            '回答时优先给出 1 到 3 个具体联系人姓名，并分别说明匹配理由。'
            '不要捏造联系人，不要推荐摘要里不存在的人。'
            '如果摘要信息不足，要明确说明你是基于当前可见联系人资料做出的有限推荐。'
        )
    prompt = f'''你是 eSeat 名片应用的 AI 助手，帮助用户优化个人名片内容、提升个人品牌展示。
请用简洁、友好的中文回答以下问题（100字以内）：
{context_block}

用户：{message}'''
    response = call_llm(prompt, '你是一个智能名片与个人品牌顾问。', provider, trace=trace)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '').strip()
        if content:
            return {
                'reply': content,
                'reply_source': 'model',
                'model_answered': True,
            }
    if self_profile and is_self_profile_query(message):
        self_advice = build_self_profile_advice_fallback(self_profile)
        if self_advice:
            return {
                'reply': self_advice,
                'reply_source': 'fallback_rule',
                'model_answered': False,
            }
    if contacts_context and is_contact_recommendation_query(message):
        recommendation = build_contact_recommendation_fallback(contacts_context)
        if recommendation:
            return {
                'reply': recommendation,
                'reply_source': 'fallback_rule',
                'model_answered': False,
            }
    # keyword fallback
    lower = message.lower()
    if '简介' in message or 'bio' in lower or '介绍' in message:
        return {
            'reply': '建议你的简介突出三个要素：职业定位、核心能力、代表成果。例如："5 年全栈开发经验，专注 AI + SaaS 产品，本眼上线 3 款多人使用的工具。"',
            'reply_source': 'fallback_rule',
            'model_answered': False,
        }
    if '标签' in message or 'tag' in lower:
        return {
            'reply': '根据您的职业方向，推荐标签：AI、全栈、SaaS、独立开发、小程序。可以在编辑页直接填入。',
            'reply_source': 'fallback_rule',
            'model_answered': False,
        }
    if '吸引' in message or '让' in message or '更好' in message:
        return {
            'reply': '名片吸引力来自三点：\n1. 清晰的定位（你是谁、做什么）\n2. 真实的展示（项目、数据、成果）\n3. 明确的行动入口（联系方式、交换按钮）',
            'reply_source': 'fallback_rule',
            'model_answered': False,
        }
    return {
        'reply': '我明白你的需求！建议可以在"编辑名片"页面使用 AI 一键填充，把你的个人介绍粘贴进去，我会自动提取关键字段。',
        'reply_source': 'fallback_rule',
        'model_answered': False,
    }


def generate_tags(identity: str, self_profile: dict[str, Any] | None = None) -> list[str]:
    profile = self_profile if isinstance(self_profile, dict) else {}
    text = identity or _to_text(profile.get('role')) or _to_text(profile.get('techStack'))
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
    chat_meta: dict[str, Any] = {}
    self_profile = get_self_profile_snapshot(x_user_id, db, data.get('selfProfileDraft'))
    self_context = build_self_profile_context(self_profile)
    contacts_context = ''
    if data.get('allowContactsContext') and is_contacts_context_authorized(x_user_id, db):
        contacts_context = build_contacts_context(x_user_id, db)
    try:
        if task_type == 'extract':
            result: Any = extract_with_ai(
                data.get('text', ''),
                provider,
                trace=trace,
                self_context=self_context,
                contacts_context=contacts_context,
            )
        elif task_type == 'optimize':
            result = {
                'optimizedText': optimize_with_ai(
                    data.get('bio') or data.get('text') or '',
                    provider,
                    trace=trace,
                    self_context=self_context,
                )
            }
        elif task_type in {'generateIntro', 'intro'}:
            result = generate_intro(data, self_profile=self_profile)
        elif task_type == 'tags':
            result = generate_tags(data.get('identity', ''), self_profile=self_profile)
        elif task_type == 'fetchGitHub':
            result = {'projects': fetch_github_projects(data.get('username', ''))}
        elif task_type == 'fetchProjectReadme':
            result = fetch_project_readme(data.get('owner', ''), data.get('repo', ''))
        elif task_type == 'chat':
            chat_result = chat_with_ai(
                data.get('message', ''),
                provider,
                trace=trace,
                self_context=self_context,
                self_profile=self_profile,
                contacts_context=contacts_context,
            )
            result = {'reply': chat_result['reply']}
            chat_meta = {
                'replySource': chat_result.get('reply_source', 'unknown'),
                'modelAnswered': bool(chat_result.get('model_answered', False)),
                'selfProfileUsed': bool(self_context),
                'contactsContextUsed': bool(contacts_context),
            }
        else:
            mark_trace_time(trace, 'backendReturnedAtMs')
            return {'success': False, 'error': '未知类型', 'meta': {'trace': finalize_trace(trace)}}
        mark_trace_time(trace, 'backendReturnedAtMs')
        finalized_trace = finalize_trace(trace)
        logger.info('ai trace %s', json.dumps(finalized_trace, ensure_ascii=False))
        return {'success': True, 'result': result, 'meta': {'trace': finalized_trace, **chat_meta}}
    except urllib_error.HTTPError as error:
        mark_trace_time(trace, 'backendReturnedAtMs')
        return {'success': False, 'error': f'HTTP {error.code}', 'meta': {'trace': finalize_trace(trace)}}
    except Exception as error:
        mark_trace_time(trace, 'backendReturnedAtMs')
        return {'success': False, 'error': str(error), 'meta': {'trace': finalize_trace(trace)}}
