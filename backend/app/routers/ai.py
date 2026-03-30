import json
import re
from typing import Any
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from fastapi import APIRouter

from ..config import settings

router = APIRouter(prefix='/ai', tags=['ai'])


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


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str] | None = None) -> Any:
    data = json.dumps(payload).encode('utf-8')
    req = urllib_request.Request(
        url,
        data=data,
        headers={'Content-Type': 'application/json', **(headers or {})},
        method='POST',
    )
    with urllib_request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def get_json(url: str, headers: dict[str, str] | None = None) -> Any:
    req = urllib_request.Request(url, headers=headers or {}, method='GET')
    with urllib_request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))


def call_minimax(prompt: str) -> dict[str, Any] | None:
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
        )
    except Exception:
        return None


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


def extract_with_ai(text: str) -> dict[str, Any]:
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
    response = call_minimax(prompt)
    if response and response.get('choices'):
        content = response['choices'][0].get('message', {}).get('content', '')
        parsed = parse_json_block(content)
        if parsed:
            parsed.setdefault('projects', [])
            parsed.setdefault('tags', [])
            return parsed
    return extract_with_rules(text)


def optimize_with_ai(text: str) -> str:
    prompt = f'''请优化以下自我介绍，使其更简洁、更有吸引力：

原始内容：{text}

只返回优化后的文本。'''
    response = call_minimax(prompt)
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
def generate(payload: dict[str, Any]) -> dict[str, Any]:
    task_type = payload.get('type', '')
    data = payload.get('data') or {}
    try:
        if task_type == 'extract':
            result: Any = extract_with_ai(data.get('text', ''))
        elif task_type == 'optimize':
            result = {'optimizedText': optimize_with_ai(data.get('bio') or data.get('text') or '')}
        elif task_type in {'generateIntro', 'intro'}:
            result = generate_intro(data)
        elif task_type == 'tags':
            result = generate_tags(data.get('identity', ''))
        elif task_type == 'fetchGitHub':
            result = {'projects': fetch_github_projects(data.get('username', ''))}
        elif task_type == 'fetchProjectReadme':
            result = fetch_project_readme(data.get('owner', ''), data.get('repo', ''))
        else:
            return {'success': False, 'error': '未知类型'}
        return {'success': True, 'result': result}
    except urllib_error.HTTPError as error:
        return {'success': False, 'error': f'HTTP {error.code}'}
    except Exception as error:
        return {'success': False, 'error': str(error)}
