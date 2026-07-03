import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 전용 - service role 키를 쓰면 RLS 상관없이 읽기 가능 (읽기 전용 쿼리만 아래 함수에 하드코딩되어 있어 안전)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Groq: 카드 등록 없이 무료로 쓸 수 있는 티어 제공. console.groq.com 에서 키 발급.
// llama-3.3-70b-versatile: 무료 티어에서 tool(함수 호출)을 안정적으로 지원하는 모델.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Groq는 OpenAI 호환 함수 호출 포맷(tools: [{type:'function', function:{...}}])을 씁니다.
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_recent_formulas',
      description: '최근 등록/수정된 처방 목록을 가져옵니다.',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_materials',
      description: '최근 등록된 원료 목록을 가져옵니다.',
      parameters: {
        type: 'object',
        properties: { limit: { type: 'number' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_regulatory_alerts',
      description: '현재 열려있는(OPEN) 규제 알림 목록을 가져옵니다.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_formula_progress',
      description: '컨펌 전(진행 중)인 처방의 진행 단계 현황을 가져옵니다.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_raw_material',
      description: '원료명 또는 INCI명으로 원료를 검색합니다.',
      parameters: {
        type: 'object',
        properties: { keyword: { type: 'string' } },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_formula',
      description: '처방명 또는 처방코드로 처방을 검색합니다.',
      parameters: {
        type: 'object',
        properties: { keyword: { type: 'string' } },
        required: ['keyword'],
      },
    },
  },
];

async function runTool(name: string, input: any) {
  switch (name) {
    case 'get_recent_formulas': {
      const { data, error } = await supabase
        .from('v_home_recent_formulas')
        .select('*')
        .limit(input?.limit ?? 10);
      return error ? { error: error.message } : data;
    }
    case 'get_recent_materials': {
      const { data, error } = await supabase
        .from('v_home_recent_materials')
        .select('*')
        .limit(input?.limit ?? 10);
      return error ? { error: error.message } : data;
    }
    case 'get_regulatory_alerts': {
      const { data, error } = await supabase.from('v_home_regulatory_alerts').select('*');
      return error ? { error: error.message } : data;
    }
    case 'get_formula_progress': {
      const { data, error } = await supabase.from('v_home_formula_progress').select('*');
      return error ? { error: error.message } : data;
    }
    case 'search_raw_material': {
      const kw = `%${input.keyword}%`;
      const { data, error } = await supabase
        .from('plm_raw_materials')
        .select('raw_code, raw_name, inci_kr, inci_en, supplier, function_kr')
        .or(`raw_name.ilike.${kw},inci_kr.ilike.${kw},inci_en.ilike.${kw}`)
        .limit(15);
      return error ? { error: error.message } : data;
    }
    case 'search_formula': {
      const kw = `%${input.keyword}%`;
      const { data, error } = await supabase
        .from('plm_formulas')
        .select('formula_code, revision, formula_name, status, customer')
        .or(`formula_name.ilike.${kw},formula_code.ilike.${kw}`)
        .limit(15);
      return error ? { error: error.message } : data;
    }
    default:
      return { error: `unknown tool: ${name}` };
  }
}

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'GROQ_API_KEY가 설정되어 있지 않습니다.' }, { status: 500 });
  }

  const messages: any[] = [
    {
      role: 'system',
      content:
        '당신은 화장품 ODM 연구원 홈 대시보드의 AI 어시스턴트입니다. 제공된 도구로 실제 DB를 조회해서 한국어로 간결하게 답변하세요. 모르는 내용은 추측하지 말고 도구로 확인하세요.',
    },
    ...history,
    { role: 'user', content: message },
  ];

  for (let turn = 0; turn < 4; turn++) {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools,
        tool_choice: 'auto',
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.error?.message ?? 'AI 호출 실패' }, { status: 500 });
    }

    const choice = data.choices[0];
    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    const toolCalls = assistantMsg.tool_calls ?? [];
    if (toolCalls.length === 0) {
      return NextResponse.json({ reply: assistantMsg.content ?? '', history: messages.slice(1) });
    }

    for (const call of toolCalls) {
      const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
      const result = await runTool(call.function.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return NextResponse.json({ error: '응답 생성이 너무 길어졌습니다. 다시 시도해주세요.' }, { status: 500 });
}
