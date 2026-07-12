# With Buddy AI — 사내 HR AI 어시스턴트

![RAG](https://img.shields.io/badge/RAG-Hybrid%20Search-6366f1?style=flat-square)
![Multi-Agent](https://img.shields.io/badge/Multi--Agent-LangGraph-8b5cf6?style=flat-square)
![Async](https://img.shields.io/badge/asyncio-FastAPI%20SSE-0ea5e9?style=flat-square)
![LLM](https://img.shields.io/badge/LLM-Claude%20Haiku-f59e0b?style=flat-square)

> **RAG + Multi-Agent + asyncio** 기반 사내 HR 질의응답 AI.  
> 임직원이 인사 규정·복지·계약 내용을 자연어로 질문하면 하이브리드 검색으로 관련 문서를 찾아 근거 있는 답변을 SSE 스트리밍으로 실시간 제공합니다.

**담당**: AI 파트 전담 설계·구현 (RAG 파이프라인, Multi-Agent 오케스트레이션, 비동기 API 서버)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 언어 모델 | Claude Haiku (Anthropic) |
| 임베딩 | Google Gemini Embedding 2 · 3072차원 |
| 벡터 DB | ChromaDB |
| 키워드 검색 | BM25 (rank-bm25) + kiwipiepy 형태소 분석 |
| Multi-Agent 오케스트레이션 | LangGraph, LangChain |
| 비동기 API 서버 | FastAPI (asyncio) + SSE 스트리밍 |
| 캐싱 | Anthropic Prompt Caching |
| 알림 | Slack SDK |
| 모니터링 | Prometheus |
| 평가 | RAGAS, LangSmith |

---

## 아키텍처

```
임직원 질문 (채팅 UI)
        │
        ▼
┌─────────────────────────┐
│  Intent 분류             │  LangGraph Orchestrator
│  RAG / chitchat /        │  1회 LLM 호출 (JSON 출력)
│  out_of_scope / sensitive│
└────────────┬────────────┘
             │ RAG 경로
             ▼
┌─────────────────────────┐
│  하이브리드 검색          │  BM25 + 벡터 병렬 실행
│  쿼리 정규화·동의어 확장  │  복합 질문 자동 분리 검색
│  dedup 후처리            │  법령 / 사규 컬렉션 분리
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  답변 생성               │  Claude Haiku
│  SSE 스트리밍            │  Prompt Caching 적용
│  선행 버퍼 no_result 감지│
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  품질 검증               │  Self-Verifier (문서 관련성)
│                          │  LLM Judge (고위험 질문)
│                          │  미답변 감지 → Slack 알림
└────────────┬────────────┘
             │
             ▼
     SSE 스트리밍 응답
```

---

## 주요 구현

### RAG — 하이브리드 검색 (BM25 + 벡터)
- BM25와 ChromaDB 벡터 검색을 ThreadPoolExecutor로 병렬 실행 후 점수 병합
- kiwipiepy로 한국어 형태소 분석(조사 제거)하여 BM25 색인 품질 개선
- 복합 질문("연차랑 병가 차이가 뭐야?") 자동 분리 → 서브질문별 병렬 검색 후 dedup 병합
- 쿼리 정규화, 동의어 확장, 후속 질문 컨텍스트 rewrite 전처리

### 멀티테넌트 문서 격리
- `company_code` 메타데이터 기반으로 회사별 문서 공간 완전 분리
- 법령 문서(공통, `company_code=""`) / 사규 문서(회사 전용) 구분 저장 및 검색
- 검색 시 회사 전용 + 공통 문서 자동 병합 (우선순위: 사규 > 법령)

### PRE 온보딩 — 입사 전 신입사원 지원
- `account_status == "PRE"` 유저는 `pre_onboarding_tag: true` 문서만 검색 (격리된 문서 세트)
- 빠른질문 퀵탭 4개 제공: 첫 출근 장소, 제출 서류, 출근 시간, 담당자 문의처
- PRE 전용 답변 분기: no_result 시 `out_of_scope_pre` 처리, 입사 전 안내 문구 제공

### Multi-Agent — 품질 검증 레이어
- **Self-Verifier**: 검색된 문서가 질문에 실제로 답할 수 있는지 LLM으로 판정, 2회 연속 NO일 때만 no_result 처리 (오탐 방지)
- **LLM Judge**: 해고예고·임금체불 등 고위험 키워드 질문은 스트리밍 억제 후 답변 전체를 검증, 문서 내용과 모순되면 차단
- **미답변 감지**: 15개 키워드 패턴으로 실시간 감지 → 미답변 DB 저장 → Slack 자동 알림 → 관리자 확인 루프

### asyncio — 비동기 SSE 스트리밍
- 첫 120자 선행 버퍼링으로 no_result 조기 감지 후 고정 문구로 교체 (불필요한 스트리밍 차단)
- `\n\n` 경계 청크 분할로 Markdown 렌더링 호환
- `\x00` 스왑 방식으로 스트리밍 완료 후 최종 텍스트 단일 교체 (중복 출력 방지)

### Prompt Caching
- 시스템 프롬프트 정적 블록(규칙·페르소나·응답 형식)에 `cache_control: ephemeral` 적용
- 날짜·사용자명·검색 컨텍스트 등 동적 부분은 캐시 제외
- 동일 사용자 반복 질문 시 캐시 재사용 → 입력 토큰 비용 절감

### 미답변 질문 관리
- 미답변 질문 저장 → Greedy cosine similarity(임계값 0.85)로 의미 군집화
- 관리자 대시보드: 군집별 TOP 보강 영역 AI 요약 제공

---

## API 주요 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| `POST /internal/ai/answer/stream` | SSE 스트리밍 답변 (메인 연동) |
| `POST /internal/ai/answer` | 동기 답변 (10초 타임아웃) |
| `GET /knowledge/no-result` | 미답변 질문 목록 |
| `GET /knowledge/no-result/clusters` | 미답변 의미 군집화 |
| `POST /admin/ingest` | 문서 인덱싱 트리거 |
| `GET /metrics` | Prometheus 메트릭 |

---

## 성능 지표

| 지표 | 수치 | 비고 |
|------|------|------|
| E2E 정답률 (40문항) | 97.5% | 39/40, 강화 엣지케이스 기준 |
| E2E 정답률 (100문항) | 99~100% | 전체 통합 테스트셋 기준 |
| BM25 도입 효과 | 82.5% → 87.5% | 키워드+의미 하이브리드 |
| TTFT | 평균 0.7초 | Time-To-First-Token |

---

## 평가 시스템

### RAGAS 자동 평가
- **지표**: Answer Relevancy, Faithfulness, AspectCritic(4종) 자동 측정
- **연동**: LangSmith 트레이싱으로 질문별 체인 전체 흐름(검색 → 생성) 기록
- 평가 결과를 HTML 리포트로 시각화, 스프린트 단위 비교 가능

### E2E 회귀 테스트
- **고정 테스트셋**: 100문항(전체 통합) + 40문항(강화 엣지케이스) + 50문항(IN SCOPE 전용)
- 기능 변경 전 반드시 회귀 테스트 실행 → 정답률 유지 여부 확인
- 테스트 결과 JSON 자동 저장 → 회차별 비교·추이 추적

---

## 디렉토리 구조

```
ai/
├── chains/
│   ├── rag_chain.py        # 메인 RAG 체인 (품질 검증 통합)
│   ├── retriever.py        # 하이브리드 검색 (BM25 + 벡터)
│   └── generator.py        # 답변 생성 (SSE 스트리밍)
├── agents/
│   └── orchestrator.py     # Intent 분류 (LangGraph)
├── core/
│   ├── llm.py              # Claude Haiku (3가지 구성)
│   ├── embeddings.py       # Gemini Embedding 2 (싱글톤)
│   └── vectorstore.py      # ChromaDB 관리 + BM25 캐시
├── routers/
│   ├── chat.py             # /chat, /internal/ai/answer(/stream)
│   └── knowledge.py        # 미답변 관리
├── utils/
│   ├── prompts.py          # 시스템 프롬프트 + Prompt Caching
│   └── question_clusterer.py # 미답변 의미 군집화
└── tasks/
    └── slack_notifier.py   # 미답변 Slack 자동 알림
```
