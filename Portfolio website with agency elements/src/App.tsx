import React, { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Node { id: number; x: number; y: number; r: number; tier: number; label: string }
interface Link { a: number; b: number }

// ─── Data ────────────────────────────────────────────────────────────────────

const NETWORK_NODES: Node[] = [
  { id: 0, x: 220, y: 35,  r: 10, tier: 8, label: 'USER' },
  { id: 1, x: 220, y: 105, r: 8,  tier: 6, label: 'API' },
  { id: 2, x: 110, y: 185, r: 8,  tier: 7, label: 'LLM' },
  { id: 3, x: 330, y: 185, r: 7,  tier: 5, label: 'RAG' },
  { id: 4, x: 55,  y: 265, r: 5,  tier: 4, label: 'REDIS' },
  { id: 5, x: 220, y: 265, r: 9,  tier: 7, label: 'CHROMA' },
  { id: 6, x: 375, y: 265, r: 6,  tier: 5, label: 'BM25' },
  { id: 7, x: 220, y: 340, r: 7,  tier: 6, label: 'EVAL' },
  { id: 8, x: 110, y: 405, r: 5,  tier: 4, label: 'RAGAS' },
  { id: 9, x: 330, y: 405, r: 8,  tier: 7, label: 'SMITH' },
]

const LINKS: Link[] = [
  { a: 0, b: 1 },
  { a: 1, b: 2 }, { a: 1, b: 3 },
  { a: 2, b: 3 },
  { a: 2, b: 5 },
  { a: 3, b: 4 }, { a: 3, b: 5 }, { a: 3, b: 6 },
  { a: 4, b: 7 }, { a: 5, b: 7 }, { a: 6, b: 7 },
  { a: 7, b: 8 }, { a: 7, b: 9 },
  { a: 8, b: 9 },
]

const CLUSTERS = [
  [1, 2, 3],
  [3, 5, 6],
  [5, 6, 7],
  [7, 8, 9],
]

const PROJECTS = [
  {
    id: 'PRJ-001',
    name: 'WithBuddy',
    type: 'RAG / CONVERSATIONAL  //  TEAM PROJECT',
    desc: '복수 기업이 동시에 사용하는 멀티테넌트 RAG 기반 대화형 AI. company_code 기반 문서 격리로 각 기업의 사내 문서를 독립 운영하며, 벡터+BM25 하이브리드 검색으로 실시간 조회. SSE 스트리밍, Prompt Caching, intent·clarifying 단일 LLM 콜 통합으로 응답 지연 최소화. 팀 프로젝트 / AI 파트 담당.',
    tags: ['Claude Haiku', 'FastAPI', 'ChromaDB', 'BM25', 'RAGAS'],
    status: 'DEPLOYED',
  },
  {
    id: 'PRJ-002',
    name: 'LLM Eval Pipeline',
    type: 'EVALUATION',
    desc: 'RAG 파이프라인 품질을 자동으로 측정하는 평가 프레임워크. RAGAS + LLM-as-Judge로 답변 신뢰도·검색 정확도를 지속 모니터링. Self-Verifier로 no_result 응답의 관련성을 LLM이 재검증하고, 민감 도메인의 고위험 질문 답변을 사후 품질 검증.',
    tags: ['RAGAS', 'LangSmith', 'Self-Verifier', 'LLM-as-Judge'],
    status: 'INTERNAL',
  },
  {
    id: 'PRJ-003',
    name: 'Hybrid Search Engine',
    type: 'RETRIEVAL  //  TEAM PROJECT',
    desc: '밀도 벡터 검색과 BM25 희소 검색을 RRF 알고리즘으로 결합한 하이브리드 검색 엔진. 한국어 형태소 분석 기반 토크나이저 포함. RAG 검색 품질 개선 목적.',
    tags: ['ChromaDB', 'BM25', 'RRF', 'FastAPI'],
    status: 'DEPLOYED',
  },
  {
    id: 'PRJ-004',
    name: '미답변 감지 + Slack 알림',
    type: 'OBSERVABILITY  //  반복 패턴 자동 감지 → Slack 라우팅',
    desc: '반복 미답변 패턴을 자동 감지하고 운영팀 Slack으로 라우팅하는 시스템. 테넌트 기준 알림 분기, 청크 ID 추적, 주간 요약 리포트 포함. AI가 스스로 커버리지 공백을 보고하는 피드백 루프 구성.',
    tags: ['Python', 'FastAPI', 'Slack Webhook'],
    status: 'DEPLOYED',
  },
  {
    id: 'PRJ-005',
    name: 'SuperBuddy',
    type: 'FINE-TUNING / LOCAL LLM  //  PERSONAL PROJECT',
    desc: '비글 페르소나 기반 개인 AI 어시스턴트. Qwen2.5-7B를 LoRA로 파인튜닝(168개 예시, Colab T4)하고 GGUF Q4_K_M으로 변환해 Ollama 로컬 배포. BM25+벡터 하이브리드 RAG 파이프라인과 홀로그래픽 HUD UI 탑재.',
    tags: ['Qwen2.5-7B', 'LoRA', 'Unsloth', 'GGUF', 'Ollama', 'FastAPI'],
    status: 'PROTOTYPE',
    link: 'https://github.com/junsu22/super-buddy',
  },
  {
    id: 'PRJ-006',
    name: 'Minhwa AI Gallery',
    type: 'IMAGE GENERATION  //  PERSONAL PROJECT',
    desc: '한국 민화 스타일 이미지 생성 갤러리. 한국어 주제 입력 시 자동 번역 후 Gemini로 민화풍 이미지를 생성하고 뮤지엄 UI(목재 액자)로 전시. Cloudflare Tunnel 배포.',
    tags: ['Gemini Flash', 'Streamlit', 'Python', 'Pillow'],
    status: 'PROTOTYPE',
    link: 'https://github.com/junsu22/minhwa-ai-gallery',
  },
  {
    id: 'PRJ-007',
    name: 'COVID-19 Dashboard',
    type: 'DATA VISUALIZATION  //  EDA',
    desc: 'WHO 데이터(240개국, 6년치) 기반 코로나19 글로벌 트렌드 대시보드. 국가별 비교, 시계열 분석, 한국 전용 페이지 포함. 2022년 피크(4.24억 건) 등 인사이트 시각화.',
    tags: ['Pandas', 'Plotly', 'Streamlit', 'NumPy'],
    status: 'INTERNAL',
    link: 'https://github.com/junsu22/covid19-dashboard',
  },
  {
    id: 'PRJ-009',
    name: 'HanBeom',
    type: 'RAG / MULTILINGUAL  //  PERSONAL PROJECT',
    desc: '한국 방문 외국인을 위한 AI 어시스턴트. 6개 언어(KO·EN·JA·ZH·TH·VI) 자동 감지 응답, GPS 기반 주변 장소 검색, 메뉴 사진 번역. Claude API + ChromaDB RAG 기반 단독 설계·개발·배포. 🏆 Smol LaunchPad #1 Project of the Day (2026.08)',
    tags: ['Claude API', 'FastAPI', 'ChromaDB', 'Railway', 'Kakao Maps'],
    status: 'DEPLOYED',
    link: 'https://hanbeom.kr',
  },
  {
    id: 'PRJ-008',
    name: 'Travel Package Predictor',
    type: 'ML PIPELINE  //  CLASSIFICATION',
    desc: '여행 패키지 구매 여부 예측 ML 파이프라인. 전처리부터 모델 평가·직렬화까지 전체 워크플로우 구현. LightGBM이 최고 ROC-AUC 달성, 월 소득·나이·영업 시간이 주요 예측 변수.',
    tags: ['LightGBM', 'scikit-learn', 'Pandas', 'Plotly'],
    status: 'INTERNAL',
    link: 'https://github.com/junsu22/travel-pipeline',
  },
]

const STACK: Record<string, string[]> = {
  'FOUNDATION MODELS': ['Claude Haiku 4.5', 'GPT-4.1 mini', 'Gemini Embedding 2'],
  'FINE-TUNING': ['Qwen2.5-7B', 'LoRA', 'Unsloth', 'GGUF', 'Ollama'],
  'RETRIEVAL': ['ChromaDB', 'BM25', 'RRF', 'LangChain'],
  'ML / DATA': ['PyTorch', 'scikit-learn', 'LightGBM', 'Pandas', 'NumPy'],
  'AI SERVER': ['FastAPI', 'Python', 'Redis', 'SSE', 'Streamlit', 'Docker'],
  'EVALUATION': ['RAGAS', 'LangSmith', 'LLM-as-Judge'],
}

const LEARNING_PATH = [
  { phase: 'PHASE_01', period: '2026.01',    topic: 'Algorithms & DS',  tags: ['정렬', '그래프', 'DP', 'SQL'] },
  { phase: 'PHASE_02', period: '2026.02–04', topic: 'ML Foundations',   tags: ['회귀', '분류', '클러스터링', 'scikit-learn'] },
  { phase: 'PHASE_03', period: '2026.03–05', topic: 'Deep Learning',    tags: ['CNN', 'RNN', 'Transformer', 'PyTorch'] },
  { phase: 'PHASE_04', period: '2026.05–07', topic: 'LLM & GenAI',      tags: ['RAG', 'Agent', 'Fine-Tuning', 'LangChain'], outcome: 'SuperBuddy' },
]

const STATUS_COLOR: Record<string, string> = {
  DEPLOYED: '#00ff6e',
  PROTOTYPE: '#00c8ff',
  INTERNAL: '#ffb800',
}

const PROFILE_ROWS = [
  { label: 'HANDLE',         value: 'JUNSU_KIM' },
  { label: 'SPECIALIZATION', value: 'GENERATIVE AI' },
  { label: 'DOMAIN',         value: 'RAG / SEARCH / EVAL' },
  { label: 'STACK',          value: 'Python / FastAPI' },
  { label: 'LLM_PROVIDER',   value: 'Anthropic / Google' },
  { label: 'REGION',         value: 'Korea' },
]

// ─── Hex Grid Background ──────────────────────────────────────────────────────

function HexGrid() {
  const r = 26
  const w = r * Math.sqrt(3)
  const COLS = 32
  const ROWS = 28

  const hexPoints = (cx: number, cy: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
    }).join(' ')

  return (
    <svg
      className="fixed inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.055, zIndex: 0 }}
      viewBox={`0 0 ${COLS * w} ${ROWS * r * 1.5 + r}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const cx = col * w + (row % 2 === 0 ? 0 : w / 2)
          const cy = row * r * 1.5 + r
          return (
            <polygon
              key={`${row}-${col}`}
              points={hexPoints(cx, cy)}
              fill="none"
              stroke="#00ff6e"
              strokeWidth="0.6"
            />
          )
        })
      )}
    </svg>
  )
}

// ─── Node Network SVG ────────────────────────────────────────────────────────

function NodeNetwork() {
  const [activeNode, setActiveNode] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setActiveNode(n => (n + 1) % NETWORK_NODES.length)
      setTick(t => t + 1)
    }, 1400)
    return () => clearInterval(t)
  }, [])

  const n = NETWORK_NODES

  return (
    <svg viewBox="0 0 440 430" className="w-full h-full">
      {/* Layer bands */}
      {[
        { label: 'REQUEST',   y: 12,  h: 46  },
        { label: 'ROUTING',   y: 73,  h: 130 },
        { label: 'RETRIEVAL', y: 228, h: 72  },
        { label: 'EVAL',      y: 314, h: 110 },
      ].map(({ label, y, h }) => (
        <g key={label}>
          <rect
            x="0" y={y} width="440" height={h}
            fill="#00ff6e" fillOpacity="0.03"
            stroke="#00ff6e" strokeWidth="0.5" strokeOpacity="0.1"
            rx="2"
          />
          <text
            x="6" y={y + h / 2 + 2}
            fontSize="6" fill="#00ff6e" fillOpacity="0.28"
            fontFamily="Share Tech Mono, monospace"
          >
            {label}
          </text>
        </g>
      ))}

      {/* Links */}
      {LINKS.map((link, i) => {
        const na = n[link.a]
        const nb = n[link.b]
        const isActive = link.a === activeNode || link.b === activeNode
        return (
          <line
            key={i}
            x1={na.x} y1={na.y}
            x2={nb.x} y2={nb.y}
            stroke="#00ff6e"
            strokeWidth={isActive ? 1.2 : 0.5}
            strokeOpacity={isActive ? 0.7 : 0.18}
            strokeDasharray={isActive ? '4 2' : 'none'}
            style={{ transition: 'stroke-opacity 0.4s ease, stroke-width 0.4s ease' }}
          />
        )
      })}

      {/* Packets flowing along every link */}
      {LINKS.map((link, i) => {
        const na = n[link.a]
        const nb = n[link.b]
        const dur = 1.2 + (i % 5) * 0.35
        const begin = (i * 0.28) % 2
        return (
          <circle key={`pkt-${i}`} r="2" fill="#00ff6e" opacity="0.75">
            <animateMotion
              dur={`${dur}s`}
              begin={`${begin}s`}
              repeatCount="indefinite"
              path={`M ${na.x},${na.y} L ${nb.x},${nb.y}`}
            />
          </circle>
        )
      })}

      {/* Nodes */}
      {NETWORK_NODES.map(node => {
        const isActive = node.id === activeNode
        return (
          <g key={node.id}>
            <circle
              cx={node.x} cy={node.y}
              r={isActive ? node.r * 2.2 : node.r * 1.6}
              fill="none"
              stroke="#00ff6e"
              strokeWidth="0.5"
              strokeOpacity={isActive ? 0.4 : 0.1}
              style={{ transition: 'all 0.4s ease' }}
            />
            <circle
              cx={node.x} cy={node.y}
              r={isActive ? node.r + 2 : node.r}
              fill={isActive ? '#00ff6e' : '#0a0a0a'}
              stroke="#00ff6e"
              strokeWidth={isActive ? 1.5 : 0.8}
              strokeOpacity={isActive ? 0.9 : 0.4}
              style={{
                transition: 'all 0.4s ease',
                filter: isActive ? 'drop-shadow(0 0 6px #00ff6e)' : 'none',
              }}
            />
            <text
              x={node.x} y={node.y + 4}
              textAnchor="middle"
              fontSize="6"
              fill={isActive ? '#0a0a0a' : '#00ff6e'}
              fillOpacity={isActive ? 1 : 0.5}
              fontFamily="Share Tech Mono, monospace"
            >
              {node.label}
            </text>
          </g>
        )
      })}

      <text x="8" y="422" fontSize="8" fill="#00ff6e" fillOpacity="0.3" fontFamily="Share Tech Mono, monospace">
        NETWORK_MAP  //  {NETWORK_NODES.length} NODES  //  {LINKS.length} LINKS  //  LIVE
      </text>
    </svg>
  )
}

// ─── EP Counter ───────────────────────────────────────────────────────────────

function EPCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const step = Math.ceil(value / 40)
    const t = setInterval(() => {
      setDisplay(d => {
        if (d >= value) { clearInterval(t); return value }
        return Math.min(d + step, value)
      })
    }, 30)
    return () => clearInterval(t)
  }, [value])

  return <span>{display.toLocaleString()}</span>
}

// ─── Data Row ─────────────────────────────────────────────────────────────────

function DataRow({ label, value, bar }: { label: string; value: string; bar?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setAnimated(true) },
      { threshold: 0.5 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #0a2a14' }}>
      <span className="mono text-[10px] tracking-widest" style={{ color: '#4a9a60', minWidth: 160 }}>
        {label}
      </span>
      <span className="mono text-xs" style={{ color: '#00ff6e', flex: 1 }}>{value}</span>
      {bar !== undefined && (
        <div className="flex-1 h-px" style={{ background: '#0a2010', maxWidth: 80 }}>
          <div
            style={{
              height: '100%',
              width: animated ? `${bar}%` : '0%',
              background: '#00ff6e',
              boxShadow: '0 0 4px #00ff6e',
              transition: 'width 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </div>
      )}
    </div>
  )
}

// ─── Corner Deco ─────────────────────────────────────────────────────────────

function CornerDeco({ size = 12 }: { size?: number }) {
  const positions = ['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0']
  return (
    <>
      {positions.map((pos, i) => (
        <div
          key={i}
          className={`absolute ${pos}`}
          style={{
            width: size, height: size,
            borderTop: i < 2 ? '1px solid #00ff6e44' : 'none',
            borderBottom: i >= 2 ? '1px solid #00ff6e44' : 'none',
            borderLeft: i % 2 === 0 ? '1px solid #00ff6e44' : 'none',
            borderRight: i % 2 === 1 ? '1px solid #00ff6e44' : 'none',
          }}
        />
      ))}
    </>
  )
}

// ─── Terminal Profile Card ───────────────────────────────────────────────────

function TerminalProfile() {
  const [displayed, setDisplayed] = useState<string[]>(PROFILE_ROWS.map(() => ''))
  const [activeRow, setActiveRow] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        setActiveRow(0)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (activeRow < 0) return
    // 전체 완료 → 3.5초 후 처음부터 재시작
    if (activeRow >= PROFILE_ROWS.length) {
      const t = setTimeout(() => {
        setDisplayed(PROFILE_ROWS.map(() => ''))
        setActiveRow(0)
      }, 3500)
      return () => clearTimeout(t)
    }
    const target = PROFILE_ROWS[activeRow].value
    const current = displayed[activeRow]
    if (current.length >= target.length) {
      const t = setTimeout(() => setActiveRow(r => r + 1), 120)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setDisplayed(prev => {
        const next = [...prev]
        next[activeRow] = target.slice(0, current.length + 1)
        return next
      })
    }, 40)
    return () => clearTimeout(t)
  }, [activeRow, displayed])

  return (
    <div ref={ref} className="p-5" style={{ background: '#111111', border: '1px solid #2a6035' }}>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      <div className="mono text-[9px] tracking-widest mb-4" style={{ color: '#59a068' }}>
        ENGINEER_PROFILE
      </div>
      {PROFILE_ROWS.map((s, i) => (
        <div key={s.label} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #0a2010' }}>
          <span className="mono text-[9px] tracking-wider" style={{ color: '#59a068' }}>{s.label}</span>
          <span className="mono text-xs" style={{ color: '#00ff6e' }}>
            {displayed[i]}
            {activeRow === i && displayed[i].length < s.value.length && (
              <span style={{ animation: 'blink 0.8s step-end infinite' }}>_</span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Glitch Heading ──────────────────────────────────────────────────────────

const GLITCH_CHARS = '!<>-_\\/[]{}=+*^?#@$0123456789ABCDEF░▒▓'

function GlitchHeading() {
  const orig1 = '만들고, 측정하고,'
  const orig2 = '개선합니다.'
  const [text1, setText1] = useState(orig1)
  const [text2, setText2] = useState(orig2)
  const ref = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const runGlitch = (orig: string, setter: (s: string) => void) => {
      let step = 0
      const id = setInterval(() => {
        setter(
          orig.split('').map(c =>
            c === ' ' || c === ',' || c === '.' ? c
            : Math.random() > 0.45
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : c
          ).join('')
        )
        step++
        if (step >= 8) { clearInterval(id); setter(orig) }
      }, 45)
    }

    let loop: ReturnType<typeof setInterval>

    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        // 보이는 순간 즉시 첫 글리치, 이후 5초마다 반복
        runGlitch(orig1, setText1)
        setTimeout(() => runGlitch(orig2, setText2), 80)
        loop = setInterval(() => {
          runGlitch(orig1, setText1)
          setTimeout(() => runGlitch(orig2, setText2), 80)
        }, 5000)
      } else {
        clearInterval(loop)
      }
    }, { threshold: 0.3 })

    if (ref.current) obs.observe(ref.current)
    return () => { obs.disconnect(); clearInterval(loop) }
  }, [])

  return (
    <h2 ref={ref} className="text-3xl font-bold text-white mb-6" style={{ letterSpacing: '-0.01em', lineHeight: 1.2 }}>
      {text1}<br />
      <span style={{ color: '#00ff6e' }}>{text2}</span>
    </h2>
  )
}

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────

function useScrollReveal(threshold = 0.1) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

// ─── Terminal Contact ─────────────────────────────────────────────────────────

const CONTACT_FIELDS = [
  { k: 'HANDLE',   v: 'JUNSU_KIM' },
  { k: 'EMAIL',    v: 'hello@hanbeom.kr' },
  { k: 'GITHUB',   v: 'https://github.com/junsu22' },
  { k: 'LINKEDIN', v: 'https://www.linkedin.com/in/junsu-kim-0792a63b3' },
  { k: 'REGION',   v: 'Korea' },
]

function TerminalContact() {
  const [displayed, setDisplayed] = useState(CONTACT_FIELDS.map(() => ''))
  const [activeField, setActiveField] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        setActiveField(0)
      }
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (activeField < 0) return
    // 모든 필드 완료 → 3500ms 후 리셋
    if (activeField >= CONTACT_FIELDS.length) {
      const t = setTimeout(() => {
        setDisplayed(CONTACT_FIELDS.map(() => ''))
        setActiveField(0)
      }, 3500)
      return () => clearTimeout(t)
    }
    const target = CONTACT_FIELDS[activeField].v
    const current = displayed[activeField]
    if (current.length >= target.length) {
      const t = setTimeout(() => setActiveField(f => f + 1), 100)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      setDisplayed(prev => {
        const next = [...prev]
        next[activeField] = target.slice(0, current.length + 1)
        return next
      })
    }, 35)
    return () => clearTimeout(t)
  }, [activeField, displayed])

  return (
    <div ref={ref} className="space-y-6 pt-[52px]">
      {CONTACT_FIELDS.map(({ k }, i) => (
        <div key={k}>
          <div className="mono text-[9px] tracking-widest mb-1" style={{ color: '#59a068' }}>{k}</div>
          <div className="mono text-[9px] mb-1" style={{ color: '#00ff6e33' }}>//</div>
          <div className="mono text-sm" style={{ color: '#00ff6e' }}>
            {displayed[i]}
            {activeField === i && displayed[i].length < CONTACT_FIELDS[i].v.length && (
              <span style={{ animation: 'blink 0.8s step-end infinite' }}>_</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Custom Cursor ───────────────────────────────────────────────────────────

function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    document.body.style.cursor = 'none'
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    const down = () => setClicking(true)
    const up = () => setClicking(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
    }
  }, [])

  const s = clicking ? 14 : 18
  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 9999 }}>
      <svg width={s} height={s} viewBox="0 0 18 18">
        <line x1="0"  y1="9" x2="6"  y2="9" stroke="#00ff6e" strokeWidth="1.5" />
        <line x1="12" y1="9" x2="18" y2="9" stroke="#00ff6e" strokeWidth="1.5" />
        <line x1="9" y1="0"  x2="9" y2="6"  stroke="#00ff6e" strokeWidth="1.5" />
        <line x1="9" y1="12" x2="9" y2="18" stroke="#00ff6e" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="1.5" fill="#00ff6e" opacity="0.9" />
      </svg>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [systemTime, setSystemTime] = useState('')
  const [uptime, setUptime] = useState(0)
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const { ref: projectsRef, visible: projectsVisible } = useScrollReveal()
  const { ref: stackRef, visible: stackVisible } = useScrollReveal()

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setSystemTime(now.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }))
      setUptime(u => u + 1)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div style={{ fontFamily: "'Exo 2', system-ui, sans-serif", background: '#0a0a0a' }}>
      <CustomCursor />
      <HexGrid />
      <div className="scanlines" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, #000d04 100%)', zIndex: 1 }}
      />

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0"
        style={{
          background: 'rgba(3,13,7,0.88)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #2a6035',
          zIndex: 50,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="20" height="23" viewBox="0 0 20 23">
              <polygon
                points="10,1 19,6 19,17 10,22 1,17 1,6"
                fill="none" stroke="#00ff6e" strokeWidth="1"
                style={{ filter: 'drop-shadow(0 0 3px #00ff6e)' }}
              />
              <circle cx="10" cy="11.5" r="3" fill="#00ff6e"
                style={{ filter: 'drop-shadow(0 0 4px #00ff6e)' }} />
            </svg>
            <button
              onClick={() => scrollTo('hero')}
              className="mono text-sm tracking-widest glow-green"
              style={{ color: '#00ff6e' }}
            >
              JUNSU.AI
            </button>
            <span className="mono text-[9px] tracking-widest" style={{ color: '#4a9a60' }}>
              // AI_ENGINEER
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {[
              { label: 'PROFILE', id: 'profile' },
              { label: 'SYSTEMS', id: 'systems' },
              { label: 'LEARNING', id: 'learning' },
              { label: 'STACK', id: 'stack' },
              { label: 'CONNECT', id: 'connect' },
            ].map(({ label, id }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="mono text-[10px] tracking-[0.2em] transition-colors"
                style={{ color: '#4a9a60' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00ff6e'; e.currentTarget.style.textShadow = '0 0 8px #00ff6e' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#4a9a60'; e.currentTarget.style.textShadow = 'none' }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mono text-[9px]" style={{ color: '#2a6035' }}>
            {systemTime} KST
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="min-h-screen pt-14 flex items-center relative"
        style={{ zIndex: 2 }}
      >
        <div className="max-w-6xl mx-auto px-6 py-16 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            <div className="fade-up">
              <div className="mono text-[9px] tracking-[0.4em] mb-4 flex items-center gap-3" style={{ color: '#4a9a60' }}>
                <span style={{ color: '#00ff6e', animation: 'pulse-glow 2s ease infinite' }}>◆</span>
                SYSTEM_ONLINE  //  AGENT_ARCHITECT
              </div>

              <h1
                className="text-6xl lg:text-8xl font-bold text-white mb-2 leading-none"
                style={{ letterSpacing: '-0.02em', textShadow: '0 0 40px #00ff6e22' }}
              >
                KIM <span style={{ color: '#00ff6e', textShadow: '0 0 20px #00ff6e' }}>JUNSU</span>
              </h1>

              <div className="mono text-xl mb-6 mt-1" style={{ color: '#1e7a35', letterSpacing: '0.1em' }}>
                AI ENGINEER // GENERATIVE AI
              </div>

              <div
                className="p-4 mb-8"
                style={{ background: '#111111', border: '1px solid #2a6035', boxShadow: 'inset 0 0 20px #00ff6e08' }}
              >
                <p className="text-sm leading-relaxed" style={{ color: '#8ab89e' }}>
                  생성AI 서비스를 설계하고 프로덕션에 배포합니다.
                  RAG 파이프라인, 하이브리드 검색, LLM 평가 시스템을
                  실제 서비스로 구축한 경험을 갖고 있습니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => scrollTo('systems')}
                  className="mono text-xs tracking-widest px-6 py-3 font-semibold transition-all"
                  style={{ background: '#00ff6e', color: '#0a0a0a' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 20px #00ff6e44' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#00ff6e'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  VIEW_SYSTEMS →
                </button>
                <button
                  onClick={() => scrollTo('connect')}
                  className="mono text-xs tracking-widest px-6 py-3 transition-all"
                  style={{ border: '1px solid #2a6035', color: '#4a9a60' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff6e'; e.currentTarget.style.color = '#00ff6e'; e.currentTarget.style.boxShadow = '0 0 12px #00ff6e22' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a6035'; e.currentTarget.style.color = '#4a9a60'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  GET_IN_TOUCH
                </button>
              </div>
            </div>

            {/* Right — Node Network */}
            <div className="fade-up relative" style={{ animationDelay: '0.2s', minHeight: 400 }}>
              <div
                style={{
                  border: '1px solid #2a6035',
                  background: '#0d0d0d',
                  boxShadow: '0 0 40px #00ff6e08, inset 0 0 40px #00ff6e05',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <CornerDeco size={16} />

                <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #0a2010' }}>
                  <span className="mono text-[9px] tracking-widest" style={{ color: '#59a068' }}>
                    NETWORK_MAP  //  CLUSTER_A7
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff6e', animation: 'pulse-glow 1.5s ease infinite' }} />
                    <span className="mono text-[9px]" style={{ color: '#00ff6e' }}>LIVE</span>
                  </div>
                </div>

                <NodeNetwork />

                <div className="flex items-center justify-between px-4 py-2" style={{ borderTop: '1px solid #0a2010' }}>
                  <span className="mono text-[9px]" style={{ color: '#59a068' }}>
                    {NETWORK_NODES.length} NODES  //  {LINKS.length} LINKS  //  {CLUSTERS.length} CLUSTERS
                  </span>
                  <span className="mono text-[9px]" style={{ color: '#59a068' }}>
                    ENERGY: MAX
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFILE / ABOUT ──────────────────────────────────────────── */}
      <section
        id="profile"
        style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }}
        className="py-24"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="mono text-[10px] tracking-[0.4em] mb-12" style={{ color: '#59a068' }}>
            ◆  ENGINEER_PROFILE  //  SCAN_COMPLETE
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <GlitchHeading />
              <div className="space-y-4 text-sm leading-relaxed" style={{ color: '#7ab88e' }}>
                <p>
                  벡터 검색과 BM25를 결합한 하이브리드 RAG 파이프라인을
                  설계하고 프로덕션에 배포한 경험이 있습니다.
                </p>
                <p>
                  RAGAS와 LLM-as-Judge 기반 평가 시스템을 직접 구축해
                  답변 품질을 지속적으로 측정하고 개선해왔습니다.
                </p>
              </div>

              <div className="mt-8 p-4" style={{ background: '#111111', border: '1px solid #2a6035' }}>
                <div className="mono text-[9px] tracking-widest mb-3" style={{ color: '#59a068' }}>
                  FOCUS_AREAS
                </div>
                {[
                  'Multi-Agent Orchestration',
                  'RAG / Retrieval Systems',
                  'Hybrid Search (Vector + BM25)',
                  'LLM Evaluation & Quality',
                  'Prompt Engineering',
                  'Production AI Deployment',
                ].map(area => (
                  <div key={area} className="flex items-center gap-3 py-2" style={{ borderBottom: '1px solid #0a2a14' }}>
                    <span style={{ color: '#00ff6e55', fontSize: 8 }}>◆</span>
                    <span className="mono text-xs" style={{ color: '#3a7a50' }}>{area}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <TerminalProfile />
            </div>
          </div>
        </div>
      </section>

      {/* ── SYSTEMS / PROJECTS ───────────────────────────────────────── */}
      <section
        id="systems"
        style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }}
        className="py-24"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="mono text-[10px] tracking-[0.4em] mb-12" style={{ color: '#59a068' }}>
            ◆  SYSTEM_CLUSTER  //  {PROJECTS.length} SYSTEMS INDEXED
          </div>

          <div ref={projectsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROJECTS.map((p, i) => (
              <div
                key={p.id}
                className="p-6 cursor-default"
                style={{
                  background: '#111111',
                  border: `1px solid ${hoveredProject === p.id ? '#00ff6e44' : '#2a6035'}`,
                  position: 'relative', overflow: 'hidden',
                  boxShadow: hoveredProject === p.id ? '0 0 24px #00ff6e0c, inset 0 0 24px #00ff6e05' : 'none',
                  opacity: projectsVisible ? 1 : 0,
                  transform: projectsVisible ? 'translateY(0)' : 'translateY(24px)',
                  transition: `opacity 0.5s ease ${i * 0.12}s, transform 0.5s ease ${i * 0.12}s, border-color 0.2s, box-shadow 0.2s`,
                }}
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                {/* HUD 타겟팅 브라켓 */}
                {([
                  { top: -1, left: -1, borderWidth: '2px 0 0 2px' },
                  { top: -1, right: -1, borderWidth: '2px 2px 0 0' },
                  { bottom: -1, left: -1, borderWidth: '0 0 2px 2px' },
                  { bottom: -1, right: -1, borderWidth: '0 2px 2px 0' },
                ] as React.CSSProperties[]).map((s, i) => (
                  <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...s, borderColor: '#00ff6e', borderStyle: 'solid', opacity: hoveredProject === p.id ? 1 : 0, transition: 'opacity 0.15s ease' }} />
                ))}
                <svg className="absolute top-0 right-0 opacity-20" width="40" height="46" viewBox="0 0 40 46">
                  <polygon points="20,1 39,12 39,34 20,45 1,34 1,12" fill="none" stroke="#00ff6e" strokeWidth="0.8" />
                </svg>

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="mono text-[9px] tracking-widest mb-1.5" style={{ color: '#59a068' }}>
                      {p.id}  //  {p.type}
                    </div>
                    <h3 className="font-semibold text-white text-lg" style={{ lineHeight: 1.2 }}>
                      {p.name}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 ml-4 shrink-0">
                    <span
                      className="mono text-[9px] tracking-wider px-2 py-0.5"
                      style={{
                        color: STATUS_COLOR[p.status],
                        border: `1px solid ${STATUS_COLOR[p.status]}44`,
                        background: `${STATUS_COLOR[p.status]}10`,
                        textShadow: `0 0 6px ${STATUS_COLOR[p.status]}`,
                      }}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-5" style={{ color: '#82c498' }}>{p.desc}</p>

                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map(t => (
                    <span key={t} className="mono text-[9px] tracking-wide px-2 py-0.5" style={{ border: '1px solid #2a6035', color: '#59a068' }}>
                      {t}
                    </span>
                  ))}
                </div>
                {'link' in p && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid #0a2010' }}>
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono text-[9px] tracking-wide"
                      style={{ color: '#2a6035' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00ff6e' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#2a6035' }}
                    >
                      GITHUB →
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEARNING PATH ───────────────────────────────────────────── */}
      <section
        id="learning"
        style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }}
        className="py-24"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="mono text-[10px] tracking-[0.4em] mb-2" style={{ color: '#59a068' }}>
            ◆  LEARNING_PATH  //  SKILL_ACQUISITION_LOG
          </div>
          <div className="mono text-[9px] mb-12" style={{ color: '#2a6035' }}>
            REF →{' '}
            <a
              href="https://github.com/junsu22/GoormStudy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#00ff6e66' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#00ff6e' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#00ff6e66' }}
            >
              github.com/junsu22/GoormStudy
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {LEARNING_PATH.map((p, i) => (
              <div
                key={p.phase}
                className="p-5"
                style={{
                  background: '#111111',
                  border: '1px solid #2a6035',
                  position: 'relative',
                }}
              >
                <CornerDeco size={10} />
                <div className="mono text-[9px] tracking-widest mb-1" style={{ color: '#59a068' }}>
                  {p.phase}
                </div>
                <div className="mono text-[9px] mb-3" style={{ color: '#2a6035' }}>
                  {p.period}
                </div>
                <div className="font-semibold text-sm text-white mb-4" style={{ letterSpacing: '0.02em' }}>
                  {p.topic}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.tags.map(t => (
                    <span key={t} className="mono text-[9px] px-2 py-0.5" style={{ border: '1px solid #2a6035', color: '#59a068' }}>
                      {t}
                    </span>
                  ))}
                </div>
                {'outcome' in p && (
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid #0a2010' }}>
                    <span className="mono text-[9px]" style={{ color: '#00ff6e', textShadow: '0 0 6px #00ff6e' }}>
                      → {p.outcome}
                    </span>
                  </div>
                )}
                {i < LEARNING_PATH.length - 1 && (
                  <div
                    className="hidden md:block absolute top-1/2 -right-3"
                    style={{ color: '#2a6035', fontSize: 10, transform: 'translateY(-50%)', zIndex: 1 }}
                  >
                    ▶
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STACK ────────────────────────────────────────────────────── */}
      <section
        id="stack"
        style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }}
        className="py-24"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="mono text-[10px] tracking-[0.4em] mb-12" style={{ color: '#59a068' }}>
            ◆  TECH_STACK  //  CAPABILITIES_LOADED
          </div>

          <div ref={stackRef} className="space-y-5">
            {(() => {
              let badgeIdx = 0
              return Object.entries(STACK).map(([category, items]) => (
                <div key={category} className="grid grid-cols-1 md:grid-cols-5 gap-4 pb-5" style={{ borderBottom: '1px solid #0a2010' }}>
                  <div className="mono text-[9px] tracking-widest pt-1 flex items-start gap-2" style={{ color: '#59a068' }}>
                    <span style={{ color: '#00ff6e55' }}>◇</span>
                    {category}
                  </div>
                  <div className="md:col-span-4 flex flex-wrap gap-2">
                    {items.map(item => {
                      const delay = badgeIdx++ * 0.07
                      return (
                        <span
                          key={item}
                          className="mono text-xs px-3 py-1.5"
                          style={{
                            border: '1px solid #00ff6e55', color: '#00ff6e', background: '#061a0c',
                            opacity: stackVisible ? 1 : 0,
                            transform: stackVisible ? 'scale(1)' : 'scale(0.85)',
                            transition: `opacity 0.35s ease ${delay}s, transform 0.35s ease ${delay}s`,
                          }}
                        >
                          {item}
                        </span>
                      )
                    })}
                </div>
              </div>
            ))
            })()}
          </div>
        </div>
      </section>

      {/* ── CONNECT / CONTACT ────────────────────────────────────────── */}
      <section
        id="connect"
        style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }}
        className="py-24"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            {/* 왼쪽: 이름 헤딩 */}
            <div>
              <div className="mono text-[10px] tracking-[0.4em] mb-12" style={{ color: '#59a068' }}>
                ◆  ESTABLISH_CONNECTION  //  SECURE_CHANNEL
              </div>
              <h2 className="text-4xl font-bold" style={{ letterSpacing: '0.08em', lineHeight: 1.1, color: '#00ff6e' }}>
                KIM JUNSU
              </h2>
              <p className="mono text-[10px] mt-3 tracking-[0.4em]" style={{ color: '#59a068' }}>
                AI ENGINEER
              </p>
            </div>

            {/* 오른쪽: 타이핑 필드 */}
            <TerminalContact />
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #0a2010', zIndex: 2, position: 'relative' }} className="py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="mono text-[9px] tracking-widest" style={{ color: '#2a6035' }}>
            KIM JUNSU  //  AI ENGINEER  //  2026
          </span>
          <span className="mono text-[9px] tracking-widest" style={{ color: '#2a6035' }}>
            JUNSU_PORTFOLIO  //  v2.0.0
          </span>
        </div>
      </footer>
    </div>
  )
}
