# Team 3 리소스

> 배포 안내 (2026-09-19): 서버는 Vercel Hobby, DB는 기존 팀 전용 Cloudflare D1을 사용합니다. PR을 main에 머지하고 CI가 통과하면 SQL 마이그레이션 후 자동 배포됩니다. Vercel 초대나 수동 배포는 필요 없습니다. 로컬 DB 개발은 기존 Wrangler 명령을 사용합니다.
> 운영 DB 연결은 팀별 키로 분리되며 `prepare/bind/run/first/all`을 지원합니다. HTTP 연결에서는 `.batch()`를 지원하지 않습니다.

| 항목        | 값                                                   |
| ----------- | ---------------------------------------------------- |
| GitHub      | https://github.com/skku-channel-hackathon-2026/team3 |
| Channel App | `SKKU 2026 Team3`                                    |
| App ID      | `6aab941b654f07d53314`                               |
| 검증 그룹   | https://channel.works/xd1l0/team-chat/groups/609235  |
| Worker      | https://skku-team3.vercel.app                        |
| D1          | `skku-team3`                                         |

공통 채널의 `/tutorial` 목록에서 **SKKU 2026 Team3**을 선택합니다. 팀별 앱·Worker·DB는 분리되어 있고 검증 그룹만 함께 사용합니다.

## 현재 상태

- 스꾸깃 전체 UI를 `wam/public/skkugit/`에 연결
- 온보딩, 44개 평일 미션, 도감, 옆자리, 로컬 대화 유지
- 선택적 로컬 누끼와 원본 fallback 포함
- 사용자가 누를 때만 Channel Talk Messenger 실행
- 키 없는 독립본을 `web-directory/`에 공개
- 2026-09-19 최종 `main` CI 통과

사진과 입력 데이터는 브라우저 로컬에 남고 팀 채팅으로 자동 전송되지 않습니다.

## 운영 경계

- `main` CI 성공 후 Cloudflare 자동 배포가 시작됩니다.
- CI 성공과 실제 배포 완료는 별도 확인이 필요합니다.
- 원격 D1 마이그레이션, 앱 비밀 키, Function·Extension 등록 갱신은 운영진에게 요청합니다.
- 공유 앱 Endpoint를 개인 개발 주소로 변경하지 않습니다.

개발 절차는 [HACKATHON.ko.md](HACKATHON.ko.md), 검증 결과는 [docs/desk-qa.md](docs/desk-qa.md)를 확인하세요.
