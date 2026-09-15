# StudyBuddy

**A mobile-first web app that matches students into study pairs — built end-to-end by *vibe coding* with an AI coding agent (OpenAI Codex).**

Final project of the **UX-design minor** at HSE University. Next.js + Express/tRPC + MySQL, with a weighted multi-criteria compatibility model and an LLM-based semantic similarity component.

`TypeScript` · `Next.js 14` · `React 19` · `tRPC 11` · `Drizzle ORM` · `MySQL` · `Tailwind CSS` · `shadcn/ui` · `Groq / Llama 3.1` · `Vitest`

---

## 1. The problem

Finding a study partner is not a search problem — it is a **matching** problem. Subject and level are the easy, visible part; what actually determines whether two people can study together is invisible: when they are able to work, what motivates them, how they absorb material, and how tolerant they are of each other's tempo.

Generic social and messenger apps optimise for connection volume. StudyBuddy optimises for a small number of **high-compatibility** pairs, and makes the reasons for a match explicit to the user.

As a UX-design project, the artefact had to answer a design question, not just ship features: *how do you ask intrusive-sounding compatibility questions and still have users complete onboarding?* The answer implemented here is a progressive, chip-based, one-question-per-screen flow with visible progress, an explicit goal step, and a match card that explains itself.

---

## 2. What the app does

```
splash → sign up / sign in → about you (3 steps) → study goal → compatibility survey (2 screens)
       → home → search → candidate card → candidate profile → like → mutual match → chat
                                                          ↘ my likes / admirers / favourites
                                                          ↘ calendar · study plan · stats · reports
                                                          ↘ profile editing
```

* **Onboarding** — account creation, password recovery by a 6-digit e-mailed code, contact handle (Telegram / VK), university, programme and year of study.
* **Goal selection** — a user picks an active study goal (including language-specific goals such as IELTS or the Russian state exam), which scopes the entire matching pool.
* **Compatibility survey** — 8 items on screen 1 (schedule, motivation, proficiency level, learning style, and four 1–5 self-ratings: organisation, sociability, friendliness, stress resistance) and 5 more on screen 2 (what matters in joint study, additional goals to align, desired partner level, desired partner traits, desired partner learning style).
* **Search and matching** — candidate cards show a **compatibility score** plus the goal and level behind it; filters cover subject, time slot, level and study format.
* **Likes, admirers, favourites** — interest is tracked in three separate lists; a mutual like produces a match.
* **Chat** — conversation between matched users.
* **Calendar, study plan, statistics, reports** — planning layer for the pair's sessions.

---

## 3. How it was built — vibe coding

This project is deliberately presented as an **AI-assisted build**, because that is what it was.

| | |
| --- | --- |
| **AI coding agent** | OpenAI **Codex**, driven conversationally over ~2 months and **66 commits** (12 Mar – 5 May 2026), 63 of them by the author |
| **Initial scaffolding** | frontend scaffolded from a **v0 (Vercel)** starter; backend from a **Manus** project template (auth plumbing, tRPC wiring, dashboard shell) |
| **Author's own contribution** | product concept, UX flows and screens, the compatibility questionnaire, the weighted matching model and its weights, goal-scoping rules, LLM-similarity integration, analytics instrumentation, test scenarios, and all iteration on real user-visible bugs |

**What "vibe coding" meant in practice.** I specified behaviour in natural language, the agent produced the changes, and I ran the app, exercised the flow, compared it against the intended UX and sent the next instruction. The commit history is the trace of that loop: long stretches of feature commits followed by dense clusters of narrowly-scoped fixes (`fix onboarding screen inference…`, `fix: profile edit navigation`, `fix sameSite cookie for cross-site requests`, `Add local onboarding draft fallback for resume flow`).

**Why this is stated openly.** For an academic portfolio the interesting question is not "did you type every line", but *what did you design, and can you reason about what the machine produced*. The scaffolding (UI kit, auth plumbing) is not my code and is not claimed as such. The design decisions, the behavioural specification, the matching model and the debugging are.

---

## 4. The matching algorithm

Compatibility is a **weighted multi-criteria score**, implemented in [`SB_back/server/routers.ts`](SB_back/server/routers.ts).

| Criterion | Weight | Similarity measure |
| --- | --- | --- |
| Learning style | **25** | Jaccard index `\|A∩B\| / \|A∪B\|` over multi-select sets |
| Schedule | **25** | Overlap `\|A∩B\| / max(\|A\|,\|B\|)` |
| Motivation | **20** | Overlap `\|A∩B\| / max(\|A\|,\|B\|)` |
| Study goal (free text) | **15** | **LLM semantic similarity**, 0–1 (see below) |
| Proficiency level | **15** | Ordinal distance: identical `1.0`, adjacent `0.5`, otherwise `0` |
| Personality traits | **10** | `1 − mean(\|Δ\|) / 4` over four 1–5 self-ratings |

**Normalisation.** The source design specification's weights sum to 110, and any criterion can be missing for a given pair. The implementation therefore **renormalises over the criteria that are actually available**:

$$\text{compatibility} = \left\lfloor 100 \cdot \frac{\sum_k w_k s_k}{\sum_k w_k} \right\rceil, \quad k \in \{\text{criteria with data for both users}\}$$

with a neutral fallback of `50` when no criterion is computable. This gives graceful degradation: two users who answered nothing beyond their schedule are still comparable on a 0–100 scale, without pretending the missing dimensions were neutral.

**LLM goal similarity** ([`SB_back/server/groq.ts`](SB_back/server/groq.ts)). Free-text study goals ("pass IELTS for a master's abroad" vs. "prepare for IELTS to apply to a foreign university") are not comparable by string distance. The backend asks `llama-3.1-8b-instant` (Groq) to score semantic similarity on a 0–1 scale, with `temperature: 0`, a 5-token cap, strict parsing and clamping. Engineering details that make it fit for production: an **order-independent cache keyed on the sorted goal pair**, capped at 500 entries; a neutral `0.5` returned on any API failure so that a matching request can never fail because of the LLM; and exact-match short-circuiting before any call is made.

**Goal scoping.** Matching happens *within* the user's active goal: candidates must share the goal, and language goals are additionally scoped by language. This rule is protected by a dedicated Vitest regression suite.

---

## 5. Architecture

```
SB_front/   Next.js 14 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui (Radix)
            └── Vercel deployment
SB_back/    Express 4 + tRPC 11, Drizzle ORM + MySQL, Zod validation
            ├── jose-signed session cookies (SameSite/CORS configured for cross-site use)
            ├── Groq SDK  → LLM semantic similarity for study goals
            ├── Resend    → match and inactivity e-mail notifications
            └── Vitest    → matching and auth regression tests
```

**Data model** (`SB_back/drizzle/schema.ts`, 11 migrations): `users`, `profiles` (JSON-array multi-selects plus four 1–5 trait scales), `preferences`, `userStudyGoals`, `favorites`, `emailNotifications`.

**API surface** (tRPC, grouped): `auth` (register, login, password reset by code, logout, me) · `profile` (getMe, update, partner preferences) · `goals` (list, create, activate, complete) · `search` / `matching` (getCandidates, getCandidate) · `favorites` (like, unlike, list, admirers) · `admin` (users, stats).

**Background behaviour.** A scheduled job in `email-notifications.ts` notifies users about new matches and nudges those who have received no candidates, with idempotency enforced by a unique notification key.

---

## 6. Instrumentation and quality

* **Product analytics** — Yandex Metrika funnel goals are fired from the app for sign-up, onboarding steps, goal selection and match events, so the onboarding drop-off is measurable rather than guessed at.
* **Tests** — a Vitest regression suite for the strict goal-matching rules (`matching.strict-goal.test.ts`) plus an auth session test; `test-matching.sh` is an end-to-end smoke script that registers two synthetic users, fills both profiles and asserts that the API returns them as mutual candidates.

```bash
cd SB_back && pnpm test      # unit / regression
./test-matching.sh           # end-to-end match smoke test
```

---

## 7. Running locally

```bash
# backend  (Express + tRPC, port 3001)
cd SB_back
pnpm install
# .env: DATABASE_URL, JWT_SECRET, GROQ_API_KEY, RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL
pnpm db:push
pnpm dev

# frontend (Next.js, port 3000)
cd ../SB_front
npm install
cp env.local.example env.local   # NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

---

## 8. Limitations and what I would do next

* **The match score is unvalidated.** The weights come from the design specification, not from data. No pair in the system is labelled "this match worked", so there is no ground truth for precision or calibration. The obvious next step — and the most interesting one — is to instrument match outcomes (does the pair exchange messages? hold a session? keep meeting?) and **learn the weights** instead of asserting them, then report an offline evaluation against the current hand-set baseline.
* **Self-reported traits** on 1–5 scales are one-item measures: cheap to collect, noisy, and vulnerable to social desirability. A short validated instrument would cost completion rate but buy measurement quality.
* **The LLM similarity score is a heuristic** — an 8B model asked for a single number, with a hard-coded 0.5 fallback that is indistinguishable from a genuine mid-similarity judgement in the logs.
* **Matching is computed in application code** by loading and scoring the candidate pool in memory; this does not scale past a small user base and would need to move into SQL or a vector index.
* **Privacy and storage** — avatars are currently stored as base64 data URLs inside the profile row (the schema comment already flags S3 as the intended destination), and the app has no data-deletion flow.
* **Not a controlled UX study.** The interface was iterated on with real users, but no usability metrics, task-success rates or SUS scores were systematically collected — the strongest remaining gap relative to the UX-design brief.
* **The demo deployment is currently offline**, so the screenshots and the flow have to be reproduced locally.

---

## 9. Skills demonstrated

* **AI-assisted software development** — specifying, steering and debugging a coding agent; keeping a reviewable commit history while doing so.
* **Full-stack engineering** — typed end-to-end API (tRPC + Zod), relational schema and migrations, session auth, e-mail delivery, deployment configuration.
* **Applied matching / similarity modelling** — Jaccard and overlap similarity, ordinal distance, weighted normalisation with missing data, and no-regression fallbacks.
* **LLM integration engineering** — prompt design for a numeric judgement, determinism (`temperature: 0`), caching, fallback strategy and graceful degradation.
* **UX design as an artefact** — information architecture, onboarding funnel, questionnaire design, and analytics instrumentation to measure the funnel.
* **Quality assurance** — regression tests around the rules most likely to break, plus an end-to-end smoke test.

---

## 10. Repository layout

```
SB_front/            Next.js application (screens, app-context state machine, API client)
SB_back/             Express + tRPC backend, Drizzle schema and migrations, tests
test-matching.sh     end-to-end matching smoke test
```

---

## 11. Author

**Marina Balabina** — BA in Sociology, HSE University (2026).
UX-design minor final project, 2026.

---

## Краткое описание (по-русски)

**StudyBuddy** — веб-приложение для подбора учебных партнёров, финальный проект майнора «UX-дизайн» в НИУ ВШЭ. Приложение мобильное по компоновке, с русскоязычным интерфейсом: регистрация, онбординг в три шага, выбор учебной цели, анкета совместимости из 13 пунктов, поиск кандидатов с оценкой совместимости, лайки и поклонники, чат, календарь и учебный план пары.

**Про вайбкодинг.** Проект разработан методом вайбкодинга: я формулировала задачи естественным языком, а код писала нейросеть **OpenAI Codex** — всего 66 коммитов за два месяца (март–май 2026), из них 63 моих. Стартовые каркасы были взяты из шаблонов v0 (фронтенд) и Manus (бэкенд), и я не выдаю их за свой код. Моя часть — концепция продукта, UX-сценарии и экраны, анкета совместимости, взвешенная модель матчинга, правила фильтрации по цели, интеграция LLM-оценки семантической близости целей, аналитика и вся отладка.

**Алгоритм совместимости** — взвешенная сумма шести критериев: стиль обучения (25, индекс Жаккара), расписание (25), мотивация (20), семантическая близость учебных целей (15, оценка через LLM `llama-3.1-8b-instant` с кэшем и откатом), уровень подготовки (15, порядковая дистанция) и личностные черты (10, по четырём самооценкам от 1 до 5). Веса нормируются по фактически доступным критериям, поэтому оценка остаётся корректной при неполных анкетах.

**Стек:** Next.js 14, React 19, TypeScript, tRPC, Drizzle ORM, MySQL, Tailwind CSS, shadcn/ui, Groq SDK, Vitest.
