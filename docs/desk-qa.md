# 스꾸깃 검증 기록

최종 갱신: 2026-09-19

## 확인 완료

- 데스크톱과 모바일 반응형 화면
- 온보딩, 오늘의 미션, 제출, 도감, 옆자리, 프로필, 로컬 그룹 대화
- 44개 미션의 평일 순환과 기존 `m1`~`m8` 기록 호환
- 사진 원본 저장과 선택적 로컬 누끼, 취소·오류 시 원본 fallback
- `궁금증` 클릭 시에만 Channel Talk SDK를 불러오고 Messenger 열기
- 기본 Channel 버튼과 자동 추적 비활성화
- 정적 내보내기에서 Channel Talk 키와 개인 데이터 제외
- 공개 `web-directory/` 파일 40개 원격 조회 성공
- GitHub Actions CI #16 성공, 커밋 `392e6a7`

## 실행한 검사

- 앱·미션·Messenger 관련 테스트 123개 통과
- WAM TypeScript typecheck
- ESLint
- Vite 및 Cloudflare 정적 빌드
- 독립 정적 사이트 실행과 누끼 모델·WASM 경로 확인
- JavaScript MIME, 파일 해시, ZIP CRC 확인

## 데이터 경계

사진, 프로필, 메모, 그룹 대화는 브라우저 로컬 저장소에만 남습니다. 현재 미션 제출은 사진과 메모를 기록할 뿐 내용의 진위를 자동 판정하지 않습니다. 누끼 처리도 브라우저에서 수행하며 원본을 항상 유지합니다.

`web-directory/`에는 Plugin Key와 Access Secret이 없습니다. 따라서 독립본의 `궁금증`은 키 누락 안내를 표시하고, 실제 Channel Messenger는 연결된 WAM 빌드에서만 동작합니다.

## 아직 별도 확인이 필요한 항목

- 최종 Cloudflare 배포 SHA와 운영진 배포 로그
- 실제 행사 계정 여러 명을 사용한 동시 사용·부하 시험
- 브라우저 저장소 삭제·기기 변경 시 데이터 이전

## 과거 SDK 기반 검증

2026-09-17 초기 team1 파일럿에서는 `/tutorial` 표시, WAM 열기·닫기, manager/bot 메시지 각 1회 전송, Worker HTTP 200을 확인했습니다. 이 기록은 SDK와 배포 경로 검증이며 현재 스꾸깃 UI의 최종 기능 검증과는 구분합니다.
