// 스꾸깃 (skkugit) local demo — group chat room module. Pure, no deps, no network, no I/O.
// Deliberately does NOT import state.mjs (avoid cycles); it only relies on the
// group/state object shapes state.mjs already produces. All photo/message
// content here is generic, clearly fictional demo filler — no real school or
// personal facts, and no sample content ever impersonates the self member.

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_ROOM_MESSAGES = 200;

// sprite index maps into the 2x2 assets/stickers.jpg collage: 0 top-left
// (coffee cup), 1 top-right (bench/lake), 2 bottom-left (path/leaf), 3
// bottom-right (ticket).
export const SAMPLE_PHOTOS = [
  { id: 'p1', title: '오늘의 커피', caption: '공강에 마신 커피 한 잔', sprite: 0 },
  { id: 'p2', title: '잠깐 앉은 벤치', caption: '수업 사이에 잠깐 쉬었던 자리', sprite: 1 },
  { id: 'p3', title: '산책길의 나뭇잎', caption: '길에서 주운 나뭇잎 한 장', sprite: 2 },
  { id: 'p4', title: '접어 둔 표', caption: '가방에서 다시 찾은 분홍색 표', sprite: 3 },
];

const PHOTO_CONVERSATIONS = [
 ['수업 끝나고 한 잔. 컵이 귀여워서 찍었어.','사진만 봐도 시원하다. 라테야?','응, 오늘은 아이스 라테로 마셨어.','나도 공강인데 커피 마시고 싶다.','다음에 시간 맞으면 같이 가자.'],
 ['수업 사이에 여기 잠깐 앉아 있었어.','그늘 있는 자리네. 사람 많았어?','아까는 조용했어. 쉬었다 가기 괜찮더라.','맨날 지나쳤는데 사진 보니까 가보고 싶다.','다음 공강 겹치면 같이 잠깐 걷자.'],
 ['걷다가 찾은 오늘의 조각.','색이 벌써 가을 같다.','맞아. 그냥 지나칠 뻔했어.','나는 바닥을 잘 안 보고 걸어서 못 찾았나 봐.','내일은 나도 하나 찾아볼게.'],
 ['가방에서 다시 찾았어. 벌써 조금 구겨졌다.','다녀온 표 모으는 편이야?','응, 버리기 아까워서 한 장씩 남겨 둬.','나도 책갈피로 쓰고 있어.','좋다. 다음엔 나도 버리지 말아야겠다.'],
];

const SAMPLE_REPLY_LINES = ['오 좋다 ㅎㅎ', '나도 비슷한 거 봤어!', '오늘 다들 고생했어요', '이거 인정', '나중에 같이 가보자'];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function validInstant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return year >= 1900 && year <= 2200 && new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value.slice(0, 10);
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Noon-ish KST (UTC+9) instant for a given 'YYYY-MM-DD' date, offset by
// offsetMinutes so seeded messages get distinct, increasing timestamps.
function kstNoonIso(dateStr, offsetMinutes = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const ms = Date.UTC(y, m - 1, d, 3, 0, 0) + offsetMinutes * 60000;
  return new Date(ms).toISOString();
}

function sampleMemberIds(group) {
  return Array.isArray(group?.memberIds) ? group.memberIds.filter((id) => id !== 'self') : [];
}

/**
 * Deterministic fictional photo for a group member. Uses the group's
 * ORIGINAL memberIds (not activeMemberIds) so a departed sample member's
 * photo history stays viewable. Never returns a photo for 'self' or for a
 * memberId that never belonged to the group. Does not mutate group.
 */
export function photoForMember(group, memberId) {
  if (!group || typeof group !== 'object' || !Array.isArray(group.memberIds)) return null;
  if (memberId === 'self') return null;
  if (!group.memberIds.includes(memberId)) return null;
  const idx = (hashStr(group.id) + group.memberIds.indexOf(memberId) - 1) % SAMPLE_PHOTOS.length;
  return SAMPLE_PHOTOS[idx];
}

/**
 * Room messages for a group. If group.messages already exists (persisted),
 * returns it as-is (legacy/compat passthrough). Otherwise deterministically
 * seeds 4-6 short friendly Korean messages from the group's original sample
 * members, dated at group.createdAt around KST noon, including exactly one
 * photo reference. Never seeds a self message. Does not mutate group.
 */
export function roomMessages(group) {
  if (group && Array.isArray(group.messages)) return group.messages;
  if (!group || typeof group !== 'object' || typeof group.id !== 'string' || !DATE_RE.test(group.createdAt)) return [];
  const samples = sampleMemberIds(group);
  if (samples.length === 0) return [];

  const seed = hashStr(`${group.id}|${group.createdAt}`);
  const first = samples[seed % samples.length];
  const others = samples.filter(id => id !== first);
  const senders = [first, others[0] || first, first, others[1] || first, others[0] || first];
  const lines = PHOTO_CONVERSATIONS[photoForMember(group, first).sprite];
  const messages = lines.map((text, i) => ({
    id: `${group.id}-seed-${i}`,
    senderId: senders[i], text,
    time: kstNoonIso(group.createdAt, i * 3), sample: true,
    photoMemberId: i === 0 ? first : null,
  }));
  return messages;
}

/**
 * Validates group.messages if present. Absent messages field is legacy-
 * compatible (no-op). Throws Error('invalid state: ...') on any malformed
 * entry, matching state.mjs's validateState error convention.
 */
export function validateRoomMessages(group) {
  if (!group || typeof group !== 'object') throw new Error('invalid state: group');
  const messages = group.messages;
  if (messages === undefined) return; // legacy-compatible: no messages field yet
  if (!Array.isArray(messages)) throw new Error('invalid state: group.messages');
  if (messages.length > MAX_ROOM_MESSAGES) throw new Error('invalid state: group.messages too long');

  const memberIds = Array.isArray(group.memberIds) ? group.memberIds : [];
  const sampleIds = new Set(memberIds.filter((id) => id !== 'self'));
  const seenIds = new Set();

  messages.forEach((m, i) => {
    if (!m || typeof m !== 'object') throw new Error(`invalid state: group.messages[${i}]`);
    if (typeof m.id !== 'string' || !m.id || m.id.length > 200) throw new Error(`invalid state: group.messages[${i}].id`);
    if (seenIds.has(m.id)) throw new Error(`invalid state: group.messages[${i}].id duplicate`);
    seenIds.add(m.id);
    if (typeof m.senderId !== 'string' || !memberIds.includes(m.senderId)) {
      throw new Error(`invalid state: group.messages[${i}].senderId`);
    }
    if (typeof m.sample !== 'boolean') throw new Error(`invalid state: group.messages[${i}].sample`);
    if (m.senderId === 'self' && m.sample !== false) throw new Error(`invalid state: group.messages[${i}].sample`);
    if (m.senderId !== 'self' && m.sample !== true) throw new Error(`invalid state: group.messages[${i}].sample`);
    if (m.photoMemberId !== null) {
      if (typeof m.photoMemberId !== 'string' || m.photoMemberId === 'self' || !sampleIds.has(m.photoMemberId)) {
        throw new Error(`invalid state: group.messages[${i}].photoMemberId`);
      }
    }
    if (typeof m.text !== 'string' || m.text.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`invalid state: group.messages[${i}].text`);
    }
    if (!m.text.trim() && m.photoMemberId === null) throw new Error(`invalid state: group.messages[${i}].text`);
    if (!validInstant(m.time)) throw new Error(`invalid state: group.messages[${i}].time`);
  });
}

// --- shared reducer-side helpers for the two append actions below ---

function requireActiveSelfGroup(state, groupId) {
  if (!state || !state.profile) throw new Error('profile is required');
  const groupIdx = Array.isArray(state.groups) ? state.groups.findIndex((g) => g.id === groupId) : -1;
  if (groupIdx === -1) throw new Error('group not found');
  const group = state.groups[groupIdx];
  if (group.status !== 'active') throw new Error('group is not active');
  if (!Array.isArray(group.activeMemberIds) || !group.activeMemberIds.includes('self')) {
    throw new Error('self is not an active member');
  }
  return { group, groupIdx };
}

function requireId(id) {
  if (typeof id !== 'string' || !id || id.length > 200) throw new Error('invalid message id');
}

function requireSentAt(sentAt) {
  if (!validInstant(sentAt)) throw new Error('invalid sentAt');
}

function nextMonotonicTime(existing, sentAt) {
  const lastTime = existing.length ? Math.max(...existing.map((m) => Date.parse(m.time))) : -Infinity;
  const providedTime = Date.parse(sentAt);
  return new Date(Math.max(providedTime, lastTime + 1)).toISOString();
}

// Returns { existing, alreadyPersisted } where existing is the message list
// to append onto (seeded from roomMessages() if group.messages is absent),
// and alreadyPersisted indicates the given id is already recorded.
function loadExisting(group, id) {
  const existing = Array.isArray(group.messages) ? group.messages : roomMessages(group);
  return { existing, alreadyPersisted: existing.some((m) => m.id === id) };
}

function commit(state, groupIdx, messages) {
  const groups = state.groups.map((g, i) => (i === groupIdx ? { ...g, messages } : g));
  return { ...state, groups };
}

/**
 * Reducer-style action: append a self-authored message to an active room the
 * self is currently in. Returns the entire next state; all other groups are
 * left untouched. Idempotent by id (a retry with the same id is a no-op).
 * Seeds group.messages from roomMessages() on first write so history is
 * never silently lost. Caps at MAX_ROOM_MESSAGES by rejecting, never
 * truncating existing history.
 */
export function appendRoomMessage(state, action) {
  if (!action || typeof action !== 'object') throw new Error('invalid action');
  const { groupId, id, text, sentAt, photoMemberId = null } = action;
  const { group, groupIdx } = requireActiveSelfGroup(state, groupId);
  requireId(id);
  requireSentAt(sentAt);

  if (typeof text !== 'string' || text.length > MAX_MESSAGE_LENGTH) throw new Error('invalid text');
  const trimmed = text.trim();

  let normalizedPhotoMemberId = null;
  if (photoMemberId != null) {
    if (typeof photoMemberId !== 'string' || photoMemberId === 'self' || !group.memberIds.includes(photoMemberId)) {
      throw new Error('invalid photoMemberId');
    }
    normalizedPhotoMemberId = photoMemberId;
  }
  if (!trimmed && !normalizedPhotoMemberId) throw new Error('text is required');

  const { existing, alreadyPersisted } = loadExisting(group, id);
  if (alreadyPersisted) {
    // Idempotent retry: ensure the (possibly still-unseeded) list is
    // persisted, but never insert a duplicate message.
    if (Array.isArray(group.messages)) return state;
    return commit(state, groupIdx, existing);
  }
  if (existing.length >= MAX_ROOM_MESSAGES) throw new Error('room message cap reached');

  const newMessage = {
    id,
    senderId: 'self',
    text: trimmed,
    time: nextMonotonicTime(existing, sentAt),
    sample: false,
    photoMemberId: normalizedPhotoMemberId,
  };
  return commit(state, groupIdx, [...existing, newMessage]);
}

/**
 * Reducer-style action: append a short predetermined sample reply from an
 * ACTIVE fictional member (never a departed one), only meant to be invoked
 * by an explicit demo '샘플 답장' button — never automatic, never claiming to
 * be a real person. Same active/self/cap/idempotency rules as
 * appendRoomMessage.
 */
export function appendSampleReply(state, action) {
  if (!action || typeof action !== 'object') throw new Error('invalid action');
  const { groupId, id, sentAt } = action;
  const { group, groupIdx } = requireActiveSelfGroup(state, groupId);
  requireId(id);
  requireSentAt(sentAt);

  const activeSamples = group.activeMemberIds.filter((mid) => mid !== 'self');
  if (activeSamples.length === 0) throw new Error('no active sample member available');

  const { existing, alreadyPersisted } = loadExisting(group, id);
  if (alreadyPersisted) {
    if (Array.isArray(group.messages)) return state;
    return commit(state, groupIdx, existing);
  }
  if (existing.length >= MAX_ROOM_MESSAGES) throw new Error('room message cap reached');

  const seed = hashStr(`${groupId}|${id}`);
  const newMessage = {
    id,
    senderId: activeSamples[seed % activeSamples.length],
    text: SAMPLE_REPLY_LINES[seed % SAMPLE_REPLY_LINES.length],
    time: nextMonotonicTime(existing, sentAt),
    sample: true,
    photoMemberId: null,
  };
  return commit(state, groupIdx, [...existing, newMessage]);
}
