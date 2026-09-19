# 스꾸깃 개발·배포 가이드

## 준비

- Node.js 24
- pnpm 11.24.0
- 팀 GitHub 레포 권한
- 실제 Channel 연동 시 `SKKU 2026 Team3` 앱 권한

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm build:cloudflare
```

## 로컬 실행

루트에 Git에서 제외되는 `.dev.vars`를 만듭니다. 아래 값은 로컬 빌드와 D1 확인용 가짜 값이며 실제 Channel API 호출에는 사용할 수 없습니다.

```dotenv
APP_ID=local-test-app
APP_SECRET=local-test-secret
SIGNING_KEY=1111111111111111111111111111111111111111111111111111111111111111
APP_STORE_URL=https://app-store-api.channel.io
```

```sh
corepack pnpm db:migrate:local
corepack pnpm dev:cloudflare
```

- `/api/health`: Worker 상태
- `/api/ready`: D1 연결 확인
- `/resource/wam/tutorial`: WAM 정적 리소스

공유 배포 앱의 Endpoint를 개인 localhost나 터널 주소로 바꾸지 않습니다.

## 변경 위치

| 작업                | 위치                     |
| ------------------- | ------------------------ |
| 스꾸깃 화면·상태    | `wam/public/skkugit/`    |
| Channel WAM 셸      | `wam/src/`               |
| Function·Command    | `server/src/`            |
| 공용 스키마         | `packages/shared/src/`   |
| D1 변경             | `cloudflare/migrations/` |
| 키 없는 정적 배포본 | `web-directory/`         |

`web-directory/`는 독립 산출물입니다. Channel Talk 키와 개인 데이터는 넣지 않습니다.

## 검사

```sh
corepack pnpm format:check
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build:vercel
corepack pnpm test:vercel
corepack pnpm build:cloudflare
corepack pnpm exec wrangler deploy --dry-run --outdir cloudflare/bundle
corepack pnpm db:migrate:local
```

필요하면 로컬 Worker를 실행한 뒤 `corepack pnpm test:cloudflare`를 추가로 실행합니다.

## DB 변경

적용된 SQL은 수정하지 않고 새 마이그레이션을 추가합니다.

```sh
corepack pnpm exec wrangler d1 migrations create DB add_feature
corepack pnpm db:migrate:local
```

새 스키마에 의존하는 코드를 `main`에 합치기 전에 운영진에게 원격 적용을 요청합니다. 코드 배포는 D1 마이그레이션을 자동 적용하지 않습니다.

## 배포

1. 작업 브랜치에서 검사
2. PR 승인 및 `main` 반영
3. `main` GitHub Actions CI 성공 확인
4. 운영진 웹훅의 Cloudflare 배포 완료 확인
5. `/tutorial`로 실제 Desk 동작 확인

Function 스키마, Extension, Command 메타데이터를 바꿨다면 배포 후 등록 갱신도 요청합니다. 키 변경, 원격 DB 작업, 유료 설정은 운영진과 진행합니다.

## 데이터·보안 원칙

- `APP_SECRET`, `SIGNING_KEY`, `.dev.vars`, `.env`를 커밋하지 않습니다.
- 사진·프로필·메모·로컬 대화를 서버나 그룹 채팅으로 자동 전송하지 않습니다.
- 사용자 입력은 SQL 문자열에 붙이지 않고 D1 `.bind()`를 사용합니다.
- 누끼 실패나 취소 시 원본 사진을 유지합니다.
- 테스트 fixture를 실제 AI나 실제 사용자 검증 결과로 표현하지 않습니다.

팀 주소와 운영 정보는 [TEAM.md](TEAM.md), 검증 결과는 [docs/desk-qa.md](docs/desk-qa.md)를 확인하세요.
