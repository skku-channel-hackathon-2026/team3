# 스꾸깃 WAM

`wam/src/`는 Channel Talk WAM 셸이고, 실제 제품 화면은 `wam/public/skkugit/`에 있습니다.

- `App.tsx`: WAM 헤더, 닫기, 430×720 크기, 스꾸깃 iframe
- `site-entry.js`: 배포 경로와 관계없이 `skkugit/index.html`로 연결
- `public/skkugit/`: 온보딩, 미션, 도감, 옆자리, 로컬 대화, 누끼, 궁금증

```sh
corepack pnpm dev:wam
corepack pnpm build:cloudflare
```

일반 브라우저의 단독 WAM 실행에는 Channel host context가 없습니다. 최종 연결은 공통 해커톤 채널에서 `/tutorial`로 확인합니다. 사진과 텍스트는 자동으로 팀 채팅에 전송하지 않습니다.
