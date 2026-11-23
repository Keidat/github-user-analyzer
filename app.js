/* 빌드 도구나 토큰 없이 브라우저에서 실행되는 JavaScript입니다. */
'use strict';
const $ = (id) => document.getElementById(id);
const state = { controller: null, generation: 0, user: '', page: 1, count: 0, busy: false, blockedUntil: 0 };
const number = (value) => new Intl.NumberFormat('ko-KR').format(Number(value) || 0);

// API에서 받은 문자열은 HTML로 해석하지 않고 항상 텍스트로 넣습니다.
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function message(id, text, kind = '') {
  $(id).textContent = text;
  $(id).className = `status ${kind}`;
}
function safeURL(value, hosts) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && hosts.includes(url.hostname) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
function externalLink(text, url) {
  const link = element('a', text);
  const safe = safeURL(url, ['github.com']);
  if (safe) { link.href = safe; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  return link;
}
function waitMessage() {
  return `GitHub API 요청 제한에 도달했습니다. ${new Date(state.blockedUntil).toLocaleString('ko-KR')} 이후 다시 시도해 주세요. 같은 네트워크의 사용자가 한도를 공유할 수 있습니다.`;
}
async function request(path, signal) {
  if (Date.now() < state.blockedUntil) throw new Error(waitMessage());
  const timeout = new AbortController();
  const onAbort = () => timeout.abort();
  signal.addEventListener('abort', onAbort, { once: true });
  if (signal.aborted) timeout.abort();
  const timer = setTimeout(() => timeout.abort(), 15000);
  try {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: { Accept: 'application/vnd.github+json' },
      credentials: 'omit', signal: timeout.signal
    });
    if (response.status === 404) throw new Error('사용자를 찾을 수 없습니다 (404). GitHub 사용자 이름을 확인해 주세요.');
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const limited = response.status === 429 || (response.status === 403 && (
        response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after') || /rate limit|abuse/i.test(body.message || '')
      ));
      if (limited) {
        const retry = response.headers.get('retry-after');
        const retryTime = retry ? (/^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry)) : 0;
        const resetTime = response.headers.get('x-ratelimit-remaining') === '0' ? Number(response.headers.get('x-ratelimit-reset')) * 1000 : 0;
        state.blockedUntil = Math.max(Date.now() + 60000, retryTime || 0, resetTime || 0);
        throw new Error(waitMessage());
      }
      if (response.status === 403) throw new Error('GitHub가 요청을 거부했습니다 (403). 잠시 후 다시 시도해 주세요.');
      throw new Error(`GitHub 응답 오류 (${response.status}). 잠시 후 다시 시도해 주세요.`);
    }
    return { data: await response.json(), hasNext: /rel="next"/.test(response.headers.get('link') || '') };
  } catch (error) {
    if (signal.aborted) throw error;
    if (error.name === 'AbortError') throw new Error('응답 시간이 초과되었습니다. 다시 검색해 주세요.');
    if (error instanceof TypeError) throw new Error('네트워크에 연결할 수 없습니다. 인터넷 연결을 확인하고 다시 시도해 주세요.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onAbort);
  }
}
function renderProfile(user) {
  const image = element('img', undefined, 'avatar');
  image.alt = `${user.login} 프로필 사진`;
  image.width = image.height = 92;
  image.referrerPolicy = 'no-referrer';
  const avatar = safeURL(user.avatar_url, ['avatars.githubusercontent.com', 'github.com']);
  if (avatar) image.src = avatar;
  image.addEventListener('error', () => { image.hidden = true; }, { once: true });
  const info = element('div');
  info.append(element('h2', user.name || user.login), externalLink(`@${user.login}`, user.html_url), element('p', user.bio || '아직 소개가 없습니다.', 'bio'));
  const stats = element('dl', undefined, 'stats');
  for (const [label, value] of [['팔로워', user.followers], ['팔로잉', user.following], ['공개 저장소', user.public_repos]]) {
    const item = element('div');
    item.append(element('dt', label), element('dd', number(value)));
    stats.append(item);
  }
  $('profile').replaceChildren(image, info, stats);
}
function renderRepository(repo) {
  const item = element('li', undefined, 'repo card');
  const title = element('h3');
  title.append(externalLink(repo.name, repo.html_url));
  const meta = element('div', undefined, 'repo-meta');
  meta.append(element('span', repo.language || '언어 미표시'), element('span', `☆ 스타 ${number(repo.stargazers_count)}`));
  if (repo.fork) meta.append(element('span', '포크'));
  if (repo.archived) meta.append(element('span', '보관됨'));
  item.append(title, element('p', repo.description || '등록된 설명이 없습니다.'), meta);
  return item;
}
async function loadRepositories(generation) {
  if (state.busy) return;
  state.busy = true;
  $('load-more').disabled = true;
  $('repo-list').setAttribute('aria-busy', 'true');
  message('repo-status', '공개 저장소를 불러오는 중입니다…', 'loading');
  try {
    const { data, hasNext } = await request(`/users/${encodeURIComponent(state.user)}/repos?type=owner&sort=updated&direction=desc&per_page=30&page=${state.page}`, state.controller.signal);
    if (generation !== state.generation) return;
    if (!Array.isArray(data)) throw new Error('저장소 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.');
    $('repo-list').append(...data.map(renderRepository));
    state.count += data.length;
    state.page += 1;
    $('repo-count').textContent = `${number(state.count)}개 불러옴 · 소유한 공개 저장소 (포크 포함)`;
    $('load-more').hidden = !hasNext;
    $('load-more').textContent = '저장소 더 보기';
    message('repo-status', state.count === 0 ? '공개 저장소가 없습니다.' : hasNext ? '더 보기로 다음 30개를 불러올 수 있습니다.' : '모든 공개 저장소를 불러왔습니다.');
  } catch (error) {
    if (generation !== state.generation) return;
    message('repo-status', `저장소를 불러오지 못했습니다. ${error.message}`, 'error');
    $('load-more').hidden = false;
    $('load-more').textContent = '저장소 다시 시도';
  } finally {
    if (generation === state.generation) {
      state.busy = false;
      $('load-more').disabled = false;
      $('repo-list').setAttribute('aria-busy', 'false');
    }
  }
}
async function search(event) {
  event.preventDefault();
  const username = $('username').value.trim();
  if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username) || username.includes('--')) {
    message('status', '1~39자의 GitHub 사용자 이름을 입력해 주세요. 영문, 숫자, 중간의 단일 하이픈(-)을 사용할 수 있습니다.', 'error');
    $('username').setAttribute('aria-invalid', 'true');
    $('username').focus();
    return;
  }
  $('username').removeAttribute('aria-invalid');
  state.controller?.abort();
  const generation = ++state.generation;
  state.controller = new AbortController();
  state.user = username;
  state.page = 1; state.count = 0; state.busy = false;
  $('results').hidden = true;
  $('empty').hidden = true;
  $('load-more').hidden = true;
  $('repo-list').replaceChildren();
  $('results').setAttribute('aria-busy', 'true');
  message('status', `${username} 프로필을 불러오는 중입니다…`, 'loading');
  try {
    const { data } = await request(`/users/${encodeURIComponent(username)}`, state.controller.signal);
    if (generation !== state.generation) return;
    renderProfile(data);
    $('results').hidden = false;
    message('status', `${data.login}님의 공개 프로필입니다.`);
    await loadRepositories(generation);
  } catch (error) {
    if (generation !== state.generation) return;
    message('status', error.message, 'error');
    $('empty').hidden = false;
  } finally {
    if (generation === state.generation) $('results').setAttribute('aria-busy', 'false');
  }
}
$('search-form').addEventListener('submit', search);
$('load-more').addEventListener('click', () => loadRepositories(state.generation));
document.querySelectorAll('[data-user]').forEach((button) => button.addEventListener('click', () => {
  $('username').value = button.dataset.user;
  $('search-form').requestSubmit();
}));
