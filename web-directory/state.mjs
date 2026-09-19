import { validateRoomMessages, appendRoomMessage, appendSampleReply } from './room.mjs';

// 스꾸깃 (skkugit) local demo — pure state module. No deps, no network, no I/O.
// Dates are always 'YYYY-MM-DD' strings (calendar dates, not timestamps).

export const CAMPUSES = ['자연과학캠퍼스', '인문사회과학캠퍼스'];

// Field length caps shared by the SET_PROFILE reducer and validateState's
// restore-time check, so a hand-edited/corrupted localStorage blob can never
// sneak in an overlong string that the reducer itself would have rejected.
const FIELD_MAX = { nickname: 20, campus: 20, name: 40 };
function maxForField(key) {
  return FIELD_MAX[key] ?? 80;
}

export const REVEAL_FIELDS = [
  { key: 'nickname', label: '별명' },
  { key: 'interests', label: '관심사' },
  { key: 'hobbies', label: '취미' },
  { key: 'personality', label: '성격' },
  { key: 'frequentPlace', label: '자주 가는 곳' },
  { key: 'campus', label: '캠퍼스' },
  { key: 'year', label: '학년' },
  { key: 'college', label: '단과대' },
  { key: 'department', label: '학과' },
  { key: 'name', label: '이름' },
];

export const SAMPLE_MEMBERS = [
  { id: 's1', profile: { nickname: '해든', interests: '보드게임', hobbies: '자전거', personality: 'ENFP', frequentPlace: '학생회관 식당', campus: '자연과학캠퍼스', year: '2학년', college: '소프트웨어융합대학', department: '소프트웨어학과', name: '김도윤' } },
  { id: 's2', profile: { nickname: '모카', interests: '카페 탐방', hobbies: '드로잉', personality: 'INFP', frequentPlace: '경영관 카페', campus: '인문사회과학캠퍼스', year: '1학년', college: '경영대학', department: '경영학과', name: '이서연' } },
  { id: 's3', profile: { nickname: '루트', interests: '알고리즘 문제풀이', hobbies: '헬스', personality: 'ISTJ', frequentPlace: '중앙학술정보관', campus: '자연과학캠퍼스', year: '3학년', college: '소프트웨어융합대학', department: '컴퓨터공학과', name: '박지훈' } },
  { id: 's4', profile: { nickname: '별', interests: '천문학 동아리', hobbies: '별사진 찍기', personality: 'INTJ', frequentPlace: '자연과학캠퍼스 잔디광장', campus: '자연과학캠퍼스', year: '2학년', college: '자연과학대학', department: '물리학과', name: '최하은' } },
  { id: 's5', profile: { nickname: '수요일', interests: '넷플릭스', hobbies: '요가', personality: 'ISFJ', frequentPlace: '인문관 라운지', campus: '인문사회과학캠퍼스', year: '1학년', college: '인문대학', department: '국어국문학과', name: '정유진' } },
  { id: 's6', profile: { nickname: '탄산수', interests: '밴드 음악', hobbies: '기타', personality: 'ESFP', frequentPlace: '600주년기념관', campus: '인문사회과학캠퍼스', year: '4학년', college: '사회과학대학', department: '행정학과', name: '한지민' } },
  { id: 's7', profile: { nickname: '유클리드', interests: '수학 퍼즐', hobbies: '체스', personality: 'INTP', frequentPlace: '자연과학캠퍼스 도서관', campus: '자연과학캠퍼스', year: '2학년', college: '자연과학대학', department: '수학과', name: '오세훈' } },
  { id: 's8', profile: { nickname: '봄날', interests: '사진', hobbies: '필름카메라', personality: 'ISFP', frequentPlace: '인문사회과학캠퍼스 벚꽃길', campus: '인문사회과학캠퍼스', year: '3학년', college: '예술대학', department: '디자인학과', name: '윤채린' } },
  { id: 's9', profile: { nickname: '피펫', interests: '생명과학 실험', hobbies: '식물 키우기', personality: 'ESTJ', frequentPlace: '자연과학캠퍼스 실험동', campus: '자연과학캠퍼스', year: '1학년', college: '자연과학대학', department: '생명과학과', name: '장민서' } },
  { id: 's10', profile: { nickname: '레퍼런스', interests: '독서모임', hobbies: '필사', personality: 'INFJ', frequentPlace: '중앙학술정보관 열람실', campus: '인문사회과학캠퍼스', year: '2학년', college: '문과대학', department: '영어영문학과', name: '서지우' } },
  { id: 's11', profile: { nickname: '코드', interests: '오픈소스', hobbies: '토이프로젝트', personality: 'ENTP', frequentPlace: '소프트웨어융합대학관', campus: '자연과학캠퍼스', year: '3학년', college: '소프트웨어융합대학', department: '소프트웨어학과', name: '임태양' } },
  { id: 's12', profile: { nickname: '리듬', interests: '댄스 동아리', hobbies: '스트릿댄스', personality: 'ESTP', frequentPlace: '학생회관 공연장', campus: '인문사회과학캠퍼스', year: '1학년', college: '사회과학대학', department: '미디어커뮤니케이션학과', name: '강도경' } },
];

// User-provided mission catalog. IDs intentionally skip Q21–Q23 and Q34.
export const MISSION_CATALOG = Object.freeze([
  {
    "id": "Q01",
    "title": "캠퍼스 첫 사진",
    "prompt": "학교 이름과 캠퍼스 입구가 함께 보이는 장소에서 새내기 첫 방문 사진 찍기",
    "proof": "장소 사진",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q02",
    "title": "대표 건물 정면샷",
    "prompt": "운영자가 지정한 캠퍼스 대표 건물을 정면에서 찍기",
    "proof": "건물 사진",
    "theme": "대표 장소",
    "note": "대표 건물은 운영 안내에서 지정한 장소를 확인해 주세요."
  },
  {
    "id": "Q03",
    "title": "학교 상징 찾기",
    "prompt": "교목, 교화, 조형물, 학교 상징 중 하나를 찾아 사진과 이름 남기기",
    "proof": "사진 + 이름",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q04",
    "title": "가장 넓은 곳",
    "prompt": "캠퍼스에서 가장 넓어 보이는 광장·운동장·잔디 공간을 찾아 한 문장으로 설명하기",
    "proof": "공간 사진 + 문장",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q05",
    "title": "가장 오래된 느낌",
    "prompt": "오래된 건물이나 역사 안내판을 찾아 ‘왜 오래돼 보이는지’ 적기",
    "proof": "사진 + 이유",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q06",
    "title": "가장 새 건물",
    "prompt": "신축 또는 현대적인 느낌의 건물을 찾아 대표적인 외관 요소 1개 기록하기",
    "proof": "사진 + 관찰",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q07",
    "title": "학교 이름이 있는 곳 3개",
    "prompt": "건물명판, 현판, 안내판 등 학교명이 표시된 장소 3개 찾기",
    "proof": "사진 3장",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q08",
    "title": "하늘이 보이는 장소",
    "prompt": "건물 사이에서 하늘이 가장 크게 보이는 지점을 찾기",
    "proof": "사진",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q09",
    "title": "앉을 곳 찾기",
    "prompt": "쉬어갈 수 있는 벤치·계단·광장 가장자리 중 한 곳을 찾아 ‘새내기 휴식처’로 선정하기",
    "proof": "장소 사진 + 선정 이유",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q10",
    "title": "비 오는 날의 장소",
    "prompt": "비가 와도 이동하기 좋은 처마·연결통로·실내 휴식 공간을 찾아 기록하기",
    "proof": "사진 + 위치",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q11",
    "title": "캠퍼스의 색",
    "prompt": "캠퍼스를 대표한다고 생각하는 색 3개를 건물이나 조경에서 찾아 색상표 만들기",
    "proof": "사진 3장 + 색상표",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q12",
    "title": "창문 프레임",
    "prompt": "건물 창문 너머로 보이는 캠퍼스 풍경을 액자처럼 찍기",
    "proof": "사진",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q13",
    "title": "계단의 발견",
    "prompt": "평소 지나치기 쉬운 계단을 찾아 위·아래 중 한 방향의 풍경을 찍기",
    "proof": "사진",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q14",
    "title": "밤이 되면 달라질 곳",
    "prompt": "낮에 본 장소 중 밤에 분위기가 달라질 것 같은 곳을 고르고 이유 적기",
    "proof": "장소 사진 + 이유",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q15",
    "title": "나만의 메인 장소",
    "prompt": "운영자가 지정하지 않은 장소 중 새내기에게 추천하고 싶은 곳을 직접 선정하기",
    "proof": "사진 + 추천 문장",
    "theme": "대표 장소",
    "note": ""
  },
  {
    "id": "Q16",
    "title": "학식당 입구 찾기",
    "prompt": "캠퍼스 안 학식당 한 곳을 찾아 입구와 운영 공간을 확인하기",
    "proof": "입구 사진",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q17",
    "title": "오늘의 메뉴 확인",
    "prompt": "학식 메뉴가 표시된 게시판·모니터·메뉴표를 찾아 오늘의 메뉴 한 가지 기록하기",
    "proof": "메뉴판 사진 + 메뉴명",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q18",
    "title": "천원학식 탐색",
    "prompt": "저렴한 식사나 학생 지원 메뉴가 표시된 안내가 있는지 찾아보기",
    "proof": "안내판 사진 또는 ‘없음’ 기록",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q19",
    "title": "학식당 좌석 지도",
    "prompt": "학식당에서 출입구, 배식대, 퇴식구, 혼밥하기 좋은 좌석 위치를 손그림으로 표시하기",
    "proof": "손그림 지도",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q20",
    "title": "혼밥 자리 찾기",
    "prompt": "혼자 식사하기 편해 보이는 자리 하나를 찾아 이유를 적기",
    "proof": "좌석 사진 또는 위치 기록",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q24",
    "title": "학생회관 탐색",
    "prompt": "학생회관 또는 이에 해당하는 학생생활 중심 건물에서 학생 지원 기능 3개 찾기",
    "proof": "사진 3장",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q25",
    "title": "도서관 입구 인증",
    "prompt": "도서관 외관 또는 입구를 찾아 이용시간·층수·출입 안내 중 하나 확인하기",
    "proof": "사진 + 정보",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q26",
    "title": "도서관 좌석 상상",
    "prompt": "도서관에서 공부하고 싶은 자리를 고르고 집중하기 좋은 이유를 적기",
    "proof": "공간 사진 + 이유",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q27",
    "title": "셔틀 정류장 찾기",
    "prompt": "캠퍼스 셔틀 또는 주요 버스 정류장을 찾아 노선·출발 정보 확인하기",
    "proof": "정류장 사진 + 정보",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q28",
    "title": "증명·행정 위치 찾기",
    "prompt": "증명서, 행정실, 안내데스크 등 새내기가 언젠가 찾을 장소 하나를 미리 알아두기",
    "proof": "위치 사진",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q29",
    "title": "편의시설 3종 세트",
    "prompt": "식수대, 화장실, 휴게공간 등 생활 편의시설 3곳의 위치를 기록하기",
    "proof": "위치 3개",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q30",
    "title": "무료로 할 수 있는 것 찾기",
    "prompt": "캠퍼스에서 돈을 쓰지 않고 할 수 있는 활동 3개를 찾아 적기",
    "proof": "목록 3개",
    "theme": "학생생활",
    "note": "음식을 사거나 먹지 않아도 돼요. 메뉴판·입구·안내판을 확인해 보세요."
  },
  {
    "id": "Q31",
    "title": "캠퍼스 외곽 걷기",
    "prompt": "공개된 안전한 동선으로 캠퍼스 외곽을 따라 걸으며 방향이 바뀌는 지점 3개 기록하기",
    "proof": "경로 캡처 + 사진 3장",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q32",
    "title": "건물 사이 지름길",
    "prompt": "두 건물 사이의 가장 편한 공개 동선을 찾아 지도에 표시하기",
    "proof": "지도 표시",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q33",
    "title": "가장 긴 계단 또는 오르막",
    "prompt": "캠퍼스에서 만난 오르막·계단 구간을 기록하고 체감 난이도 평가하기",
    "proof": "사진 + 1~5점",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q35",
    "title": "빛과 그림자",
    "prompt": "건물 그림자나 나뭇잎 그림자가 예쁜 장소를 찾아 촬영하기",
    "proof": "사진",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q36",
    "title": "계절 찾기",
    "prompt": "꽃, 낙엽, 새순, 햇빛 등 계절을 보여주는 요소 2개 찾기",
    "proof": "사진 2장",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q37",
    "title": "숫자 수집",
    "prompt": "건물 번호, 층수, 게시판 번호 등 캠퍼스에서 숫자 5개 찾기",
    "proof": "사진 5장",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q38",
    "title": "글자 수집",
    "prompt": "한글, 한자, 영어가 각각 표시된 장소를 하나씩 찾기",
    "proof": "사진 3장",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q39",
    "title": "방향표지판 따라가기",
    "prompt": "안내표지판만 보고 목적지까지 이동해보기",
    "proof": "출발·도착 사진",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q40",
    "title": "모르는 건물 하나",
    "prompt": "이름을 처음 본 건물을 찾아 이름의 의미를 추측하고 확인하기",
    "proof": "건물 사진 + 추측/정답",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q41",
    "title": "연결통로 미션",
    "prompt": "비를 피하거나 이동 시간을 줄여주는 연결통로를 찾아 시작과 끝을 기록하기",
    "proof": "시작·끝 사진",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q42",
    "title": "캠퍼스 전망 찾기",
    "prompt": "가장 멀리 보이는 장소를 찾아 무엇이 보이는지 3개 적기",
    "proof": "전망 사진 + 목록",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q43",
    "title": "작은 자연 찾기",
    "prompt": "큰 조경이 아닌 작은 식물·곤충·이끼·나무껍질 같은 요소를 찾아 관찰하기",
    "proof": "사진 + 관찰 한 줄",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q44",
    "title": "조용한 곳과 활기찬 곳",
    "prompt": "서로 분위기가 다른 장소 2곳을 찾아 비교하기",
    "proof": "사진 2장 + 비교",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q45",
    "title": "사라질 것 같은 풍경",
    "prompt": "공사나 계절 변화로 바뀔 것 같은 장소를 기록하고 지금의 모습을 남기기",
    "proof": "사진 + 제목",
    "theme": "캠퍼스 산책",
    "note": ""
  },
  {
    "id": "Q46",
    "title": "오늘의 수업 동선",
    "prompt": "실제 수업 건물 2곳을 연결해 다음 수업 이동 경로를 직접 걸어보기",
    "proof": "건물 사진 2장 + 경로",
    "theme": "새내기 준비",
    "note": ""
  },
  {
    "id": "Q47",
    "title": "강의실 층수 미리보기",
    "prompt": "다음 수업이 있는 건물의 층과 계단·엘리베이터 위치를 확인하기",
    "proof": "층 안내 사진",
    "theme": "새내기 준비",
    "note": ""
  },
  {
    "id": "Q48",
    "title": "첫 질문 장소 찾기",
    "prompt": "길을 잃었을 때 물어볼 수 있는 안내데스크·경비실·학생지원 장소를 찾아두기",
    "proof": "위치 사진",
    "theme": "새내기 준비",
    "note": ""
  }
].map(mission => Object.freeze(mission)));

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateStr(date) {
  if (typeof date !== 'string' || !DATE_RE.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  if (y < 1900 || y > 2200) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function assertDate(date, label = 'date') {
  if (!isValidDateStr(date)) throw new Error(`invalid ${label}: ${date}`);
}

export function todaySeoul(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isWeekday(date) {
  assertDate(date);
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return dow >= 1 && dow <= 5;
}

export function addDays(date, n) {
  assertDate(date);
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function nextWeekday(date) {
  let d = addDays(date, 1);
  while (!isWeekday(d)) d = addDays(d, 1);
  return d;
}

function previousWeekday(date) {
  let d = addDays(date, -1);
  while (!isWeekday(d)) d = addDays(d, -1);
  return d;
}

export function weekDates(date) {
  assertDate(date);
  const [y, m, d] = date.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(date, mondayOffset);
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

export function weekdayDistance(from, to) {
  assertDate(from, 'from');
  assertDate(to, 'to');
  if (to <= from) return 0;
  let count = 0;
  let cur = from;
  while (cur < to) {
    cur = addDays(cur, 1);
    if (isWeekday(cur)) count++;
  }
  return count;
}

export function missionForDate(date, campus) {
  assertDate(date);
  // One deterministic mission per weekday, without repeats within 44 weekdays.
  const days = Math.floor((Date.parse(date+'T00:00:00Z')-Date.UTC(2026,8,21))/86400000);
  const weekdays = Math.floor(days/7)*5 + Math.min(((days%7)+7)%7,4);
  const idx = ((weekdays + hashStr(campus ?? '')) % MISSION_CATALOG.length + MISSION_CATALOG.length) % MISSION_CATALOG.length;
  return MISSION_CATALOG[idx];
}

export function createState(date) {
  assertDate(date);
  return { version: 1, today: date, demoDate: null, profile: null, entries: [], groups: [] };
}

// Accept legacy IDs for already saved scrapbook entries; never assign them again.
const MISSION_IDS = new Set([...MISSION_CATALOG.map(m => m.id), ...Array.from({length:8},(_,i)=>`m${i+1}`)]);
const SAMPLE_IDS = new Set(SAMPLE_MEMBERS.map((m) => m.id));
const GROUP_STATUSES = ['active', 'ended', 'left'];

function validateProfile(profile) {
  if (profile === null) return;
  if (typeof profile !== 'object') throw new Error('invalid state: profile');
  if (typeof profile.nickname !== 'string' || !profile.nickname.trim() || profile.nickname.length > FIELD_MAX.nickname) {
    throw new Error('invalid state: profile.nickname');
  }
  if (!CAMPUSES.includes(profile.campus)) throw new Error('invalid state: profile.campus');
  for (const { key } of REVEAL_FIELDS) {
    if (key === 'nickname' || key === 'campus') continue;
    const v = profile[key];
    if (v == null) continue;
    if (typeof v !== 'string' || v.length > maxForField(key)) throw new Error(`invalid state: profile.${key}`);
  }
}

function validateEntry(entry, index) {
  if (!entry || typeof entry !== 'object') throw new Error(`invalid state: entries[${index}]`);
  if (typeof entry.id !== 'string') throw new Error(`invalid state: entries[${index}].id`);
  if (!isValidDateStr(entry.date)) throw new Error(`invalid state: entries[${index}].date`);
  if (!MISSION_IDS.has(entry.missionId)) throw new Error(`invalid state: entries[${index}].missionId`);
  if (typeof entry.title !== 'string') throw new Error(`invalid state: entries[${index}].title`);
  if (typeof entry.photoId !== 'string' || !entry.photoId || entry.photoId.length > 200) {
    throw new Error(`invalid state: entries[${index}].photoId`);
  }
  if (entry.memoryName !== null && (typeof entry.memoryName !== 'string' || entry.memoryName.length > 40)) {
    throw new Error(`invalid state: entries[${index}].memoryName`);
  }
  if (entry.caption !== null && (typeof entry.caption !== 'string' || entry.caption.length > 200)) {
    throw new Error(`invalid state: entries[${index}].caption`);
  }
  if (typeof entry.groupId !== 'string') throw new Error(`invalid state: entries[${index}].groupId`);
  if (typeof entry.groupName !== 'string') throw new Error(`invalid state: entries[${index}].groupName`);
}

function validateGroup(group, index) {
  if (!group || typeof group !== 'object') throw new Error(`invalid state: groups[${index}]`);
  if (typeof group.id !== 'string') throw new Error(`invalid state: groups[${index}].id`);
  if (typeof group.name !== 'string') throw new Error(`invalid state: groups[${index}].name`);
  if (!isValidDateStr(group.createdAt)) throw new Error(`invalid state: groups[${index}].createdAt`);
  if (!isValidDateStr(group.lastAdvancedAt)) throw new Error(`invalid state: groups[${index}].lastAdvancedAt`);
  if (!Number.isInteger(group.stage) || group.stage < 1 || group.stage > 10) throw new Error(`invalid state: groups[${index}].stage`);
  if (!Number.isInteger(group.daysTogether) || group.daysTogether < 1) throw new Error(`invalid state: groups[${index}].daysTogether`);
  if (typeof group.keep !== 'boolean') throw new Error(`invalid state: groups[${index}].keep`);
  if (!GROUP_STATUSES.includes(group.status)) throw new Error(`invalid state: groups[${index}].status`);
  if (!Array.isArray(group.memberIds) || group.memberIds.length !== 6 || group.memberIds[0] !== 'self') {
    throw new Error(`invalid state: groups[${index}].memberIds`);
  }
  if (new Set(group.memberIds).size !== group.memberIds.length) throw new Error(`invalid state: groups[${index}].memberIds duplicate`);
  for (const id of group.memberIds.slice(1)) {
    if (!SAMPLE_IDS.has(id)) throw new Error(`invalid state: groups[${index}].memberIds unknown sample id`);
  }
  if (
    !Array.isArray(group.activeMemberIds) ||
    group.activeMemberIds.length < 2 ||
    group.activeMemberIds.length > 6 ||
    group.activeMemberIds[0] !== 'self'
  ) {
    throw new Error(`invalid state: groups[${index}].activeMemberIds`);
  }
  if (new Set(group.activeMemberIds).size !== group.activeMemberIds.length) {
    throw new Error(`invalid state: groups[${index}].activeMemberIds duplicate`);
  }
  for (const id of group.activeMemberIds) {
    if (!group.memberIds.includes(id)) throw new Error(`invalid state: groups[${index}].activeMemberIds unknown member`);
  }
}

export function validateState(value) {
  if (!value || typeof value !== 'object') throw new Error('invalid state: not an object');
  if (value.version !== 1) throw new Error('invalid state: version');
  if (!isValidDateStr(value.today)) throw new Error('invalid state: today');
  if (value.demoDate !== null && (!isValidDateStr(value.demoDate) || value.demoDate !== value.today)) {
    throw new Error('invalid state: demoDate');
  }
  validateProfile(value.profile);
  if (!Array.isArray(value.entries)) throw new Error('invalid state: entries');
  value.entries.forEach(validateEntry);
  const entryDates = value.entries.map((e) => e.date);
  if (new Set(entryDates).size !== entryDates.length) throw new Error('invalid state: duplicate entry date');
  if (!Array.isArray(value.groups)) throw new Error('invalid state: groups');
  value.groups.forEach(validateGroup);
  value.groups.forEach(validateRoomMessages);
  const groupIds = value.groups.map((g) => g.id);
  if (new Set(groupIds).size !== groupIds.length) throw new Error('invalid state: duplicate group id');
  return value;
}

export function revealedProfile(profile, stage) {
  if (!profile) return {};
  const n = Math.max(0, Math.min(REVEAL_FIELDS.length, stage));
  const out = {};
  for (const { key } of REVEAL_FIELDS.slice(0, n)) {
    if (profile[key] != null && profile[key] !== '') out[key] = profile[key];
  }
  return out;
}

export function streak(state) {
  const dates = new Set(state.entries.map((e) => e.date));
  let cursor = dates.has(state.today) ? state.today : previousWeekday(state.today);
  let count = 0;
  while (dates.has(cursor)) {
    count++;
    cursor = previousWeekday(cursor);
  }
  return count;
}

function capForDays(daysTogether) {
  if (daysTogether >= 10) return 2;
  if (daysTogether >= 7) return 3;
  if (daysTogether >= 4) return 5;
  return 6;
}

function boundedString(value, label, max, required = false) {
  if (value == null) {
    if (required) throw new Error(`${label} is required`);
    return null;
  }
  if (typeof value !== 'string') throw new Error(`invalid ${label}: not a string`);
  const trimmed = value.trim().slice(0, max);
  if (required && !trimmed) throw new Error(`${label} is required`);
  return trimmed;
}

function setProfile(state, profile) {
  if (!profile || typeof profile !== 'object') throw new Error('invalid profile');
  const nickname = boundedString(profile.nickname, 'nickname', FIELD_MAX.nickname, true);
  const campus = boundedString(profile.campus, 'campus', FIELD_MAX.campus, true);
  if (!CAMPUSES.includes(campus)) throw new Error('invalid campus');
  const clean = { nickname, campus };
  for (const { key } of REVEAL_FIELDS) {
    if (key === 'nickname' || key === 'campus') continue;
    if (profile[key] == null) continue;
    const v = boundedString(profile[key], key, maxForField(key), false);
    if (v) clean[key] = v;
  }
  return { ...state, profile: clean };
}

function advanceDate(state, date, demo) {
  assertDate(date);
  if (date < state.today) throw new Error('cannot move date backward');

  // demo:true is the persisted Demo-menu time-travel clock: it advances
  // today/groups exactly like a real advance and also records demoDate so
  // the UI can show "rehearsing day N". A non-demo advance clears demoDate.
  const ticks = weekdayDistance(state.today, date);
  let groups = state.groups;
  if (ticks > 0) {
    groups = state.groups.map((g) => {
      if (g.status !== 'active') return g; // 'ended'/'left' groups never tick again
      if (g.keep) {
        const daysTogether = g.daysTogether + ticks;
        const stage = Math.min(10, g.stage + ticks);
        return {
          ...g,
          daysTogether,
          stage,
          lastAdvancedAt: date,
          // slice from the CURRENT roster, never the original full one, so an
          // earlier departure can never be re-added later.
          activeMemberIds: g.activeMemberIds.slice(0, capForDays(daysTogether)),
        };
      }
      return { ...g, status: 'ended', lastAdvancedAt: date };
    });
  }
  return { ...state, today: date, demoDate: demo ? date : null, groups };
}

function pickSamples(seed, count) {
  return SAMPLE_MEMBERS.map((m) => ({ id: m.id, h: hashStr(`${m.id}|${seed}`) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, count)
    .map((x) => x.id);
}

function completeMission(state, action) {
  if (!state.profile) throw new Error('profile is required');
  if (!isWeekday(state.today)) throw new Error('not a weekday');
  const photoId = boundedString(action.photoId, 'photoId', 200, true);
  const memoryName = boundedString(action.memoryName, 'memoryName', 40, false);
  const caption = boundedString(action.caption, 'caption', 200, false);
  if (state.entries.some((e) => e.date === state.today)) return state; // idempotent duplicate

  const mission = missionForDate(state.today, state.profile.campus);
  const seed = `${state.today}|${state.groups.length}`;
  const memberIds = ['self', ...pickSamples(seed, 5)];
  const group = {
    id: `g-${state.today}-${state.groups.length}`,
    name: `${mission.theme} ${state.groups.length + 1}조`,
    createdAt: state.today,
    lastAdvancedAt: state.today,
    stage: 1,
    daysTogether: 1,
    keep: false,
    status: 'active',
    memberIds,
    activeMemberIds: memberIds.slice(0, capForDays(1)),
  };
  const entry = {
    id: `e-${state.today}`,
    date: state.today,
    missionId: mission.id,
    title: mission.title,
    photoId,
    memoryName,
    caption,
    groupId: group.id,
    groupName: group.name,
  };
  return { ...state, entries: [...state.entries, entry], groups: [...state.groups, group] };
}

function setKeep(state, groupId, keep) {
  if (typeof keep !== 'boolean') throw new Error('keep must be boolean');
  return {
    ...state,
    groups: state.groups.map((g) => (g.id === groupId && g.status === 'active' ? { ...g, keep } : g)),
  };
}

function leaveGroup(state, groupId) {
  // status:'left' (not just a flag) so advanceDate's upkeep loop skips it forever.
  return {
    ...state,
    groups: state.groups.map((g) => (g.id === groupId ? { ...g, status: 'left', left: true } : g)),
  };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'SET_PROFILE':
      return setProfile(state, action.profile);
    case 'ADVANCE_DATE':
      return advanceDate(state, action.date, !!action.demo);
    case 'COMPLETE_MISSION':
      return completeMission(state, action);
    case 'SEND_GROUP_MESSAGE':
      return appendRoomMessage(state, action);
    case 'ADD_SAMPLE_REPLY':
      return appendSampleReply(state, action);
    case 'SET_KEEP':
      return setKeep(state, action.groupId, action.keep);
    case 'LEAVE_GROUP':
      return leaveGroup(state, action.groupId);
    case 'RESET':
      return createState(action.date);
    default:
      throw new Error(`unknown action: ${action.type}`);
  }
}

// Fake per-member completion status for the demo (self is real, samples are deterministic fixtures).
// self is true whenever ANY entry exists on that date — a kept older group must also
// show today's mission as done, since only one mission/group is created per day.
export function memberCompleted(group, memberId, date, state) {
  if (memberId === 'self') return state.entries.some((e) => e.date === date);
  return hashStr(`${memberId}|${date}`) % 2 === 0;
}
