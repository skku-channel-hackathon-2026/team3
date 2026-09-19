# 스꾸깃

> 배포 안내 (2026-09-19): 서버는 Vercel Hobby, DB는 기존 팀 전용 Cloudflare D1을 사용합니다. PR을 main에 머지하고 CI가 통과하면 SQL 마이그레이션 후 자동 배포됩니다. Vercel 초대나 수동 배포는 필요 없습니다. 로컬 DB 개발은 기존 Wrangler 명령을 사용합니다.
> 운영 DB 연결은 팀별 키로 분리되며 `prepare/bind/run/first/all`을 지원합니다. HTTP 연결에서는 `.batch()`를 지원하지 않습니다.

> 매일 한 장씩, 성균관대에서 함께 만드는 새내기 기억 도감

스꾸깃은 새내기가 평일 사진 미션을 수행하고, 친구들과 작은 기록을 쌓도록 돕는 Channel Talk 인앱입니다. 사진과 메모는 사용자의 브라우저에 저장되며, 자동으로 팀 채팅이나 서버에 전송되지 않습니다.

## 주요 기능

- **오늘의 미션**: 44개 미션을 평일마다 순환 제공
- **도감**: 제출한 대표 사진과 메모를 날짜별로 보관
- **옆자리**: 그룹별 멤버와 사진 기록 확인
- **로컬 대화**: 그룹 데모 채팅을 브라우저 안에서 사용
- **로컬 누끼**: IMG.LY 런타임을 이용한 선택적 배경 제거, 실패 시 원본 유지
- **궁금증**: 사용자가 직접 누르면 Channel Talk Messenger 열기

사진, 프로필, 메모, 그룹 대화는 브라우저 로컬 저장소에만 남습니다. 미션 제출은 대표 사진과 메모를 기록하는 방식이며 자동 판정 기능은 없습니다.

## 실행 방법

### Channel Talk에서 실행

공통 해커톤 채널의 `앱_개발_검증` 그룹에서 `/tutorial`을 실행하고 **SKKU 2026 Team3**을 선택합니다.

### 로컬 개발

Node.js 24와 pnpm 11.24.0을 사용합니다.

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm db:migrate:local
corepack pnpm dev:cloudflare
```

로컬 실행 전 루트에 `.dev.vars`가 필요합니다. 실제 키는 문서나 Git에 넣지 않습니다. 자세한 내용은 [개발·배포 가이드](HACKATHON.ko.md)를 참고하세요.

### 독립 정적 사이트

`web-directory/`는 서버와 키 없이 실행할 수 있는 정적 내보내기입니다.

```sh
cd web-directory
node server.mjs
```

이 내보내기에는 Channel Talk Plugin Key와 Access Secret이 없으므로 `궁금증` 버튼은 키가 없다는 안내만 표시합니다.

## 검증

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build:cloudflare
```

2026-09-19 기준 최종 GitHub Actions CI가 통과했습니다. 세부 검증 범위는 [QA 기록](docs/desk-qa.md)에 정리했습니다.

## 구조

```text
server/                    Channel App Function, 인증, D1 접근
packages/shared/           서버와 WAM의 공용 Zod 계약
wam/src/                   Channel WAM 셸
wam/public/skkugit/        실제 스꾸깃 정적 앱
web-directory/             키 없는 독립 정적 내보내기
cloudflare/                Workers 진입점과 D1 마이그레이션
```

## 배포

`main` CI 성공 후 운영진의 웹훅이 Cloudflare Workers 배포를 시작합니다. CI 성공과 실제 배포 완료는 별개입니다. DB 마이그레이션, Function 스키마 및 Extension 등록 갱신은 운영진에게 요청합니다.

- [팀 리소스](TEAM.md)
- [개발·배포 가이드](HACKATHON.ko.md)
- [QA 기록](docs/desk-qa.md)

## 라이선스

프로젝트 코드와 각 외부 자산의 라이선스는 저장소 내 고지 파일을 따릅니다. 로컬 누끼 런타임에는 IMG.LY의 AGPL-3.0 구성요소가 포함되며 관련 원문과 고지를 제거하지 않습니다. Gaegu 폰트는 SIL Open Font License를 따릅니다.
