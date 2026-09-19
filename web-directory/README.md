# skkugit web-directory

키·개인 브라우저 데이터 없이 실행되는 독립 정적 사이트입니다.

- 실행: Node 20 이상에서 `node server.mjs`, 이후 표시된 localhost 주소를 엽니다.
- 정적 호스팅: 이 폴더 전체를 그대로 올리세요. `vendor/cutout/data/`의 확장자 없는 SHA-256 파일을 빼거나 HTML fallback으로 rewrite하면 로컬 누끼가 동작하지 않습니다.
- 포함: Gaegu 글꼴, 44개 미션, 브라우저 로컬 도감·샘플 대화, IMG.LY 누끼 모델·WASM·라이선스 고지.
- 제외: 모든 Channel Talk 키, Access Secret, 사용자 사진·프로필·대화. 따라서 `궁금증`은 키를 넣기 전에는 안내만 표시합니다.
- 누끼 구성요소는 AGPL-3.0입니다. `vendor/cutout/SOURCES.txt`와 라이선스를 확인하세요.
