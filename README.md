# GitHub Lens — 초급 GitHub 사용자 분석기

HTML/CSS/vanilla JavaScript로 만든 정적 웹 프로젝트입니다. Flask, 서버 운영, npm 설치, 빌드, API 토큰이 필요 없습니다. 브라우저가 GitHub REST API의 공개 데이터를 직접 조회합니다.

## 실행

압축을 풀고 `index.html`을 브라우저로 열어 사용자 이름을 검색하세요. 인터넷 연결과 JavaScript가 필요합니다. 로컬 파일의 네트워크 접근을 제한하는 브라우저에서는 아래 GitHub Pages 배포 후 사용하세요. 별도 개발 서버는 필수가 아닙니다.

## GitHub Pages 배포 — 웹 화면만 사용

1. GitHub에 로그인하고 **New repository**를 눌러 `github-user-analyzer` 같은 이름의 **Public** 저장소를 만듭니다. README 추가를 선택하면 초기 브랜치가 생성됩니다.
2. **Add file → Upload files**에서 이 폴더 안의 `index.html`, `styles.css`, `app.js`, `README.md`, `.nojekyll`을 업로드하고 **Commit changes**를 누릅니다. 폴더 자체나 ZIP을 올리지 마세요. 저장소 최상위에 `index.html`이 보여야 합니다.
3. 숨김 파일 `.nojekyll`이 보이지 않으면 **Add file → Create new file**에서 파일명을 `.nojekyll`로 입력하고 빈 파일을 커밋합니다. 정적 파일을 그대로 제공하기 위한 파일입니다.
4. 저장소의 **Settings → Pages → Build and deployment**로 이동합니다.
5. **Source: Deploy from a branch**, **Branch: main**, **Folder: /(root)**를 선택하고 **Save**를 누릅니다. 기본 브랜치 이름이 다르면 실제 브랜치를 선택하세요.
6. 배포가 끝나면 Pages에 표시되는 **Visit site**를 누릅니다. 일반적인 주소는 `https://본인아이디.github.io/github-user-analyzer/`입니다. **Actions** 탭에서 배포 진행 상황을 확인할 수 있습니다.
7. 이후 같은 브랜치의 파일을 수정하고 커밋하면 자동으로 다시 배포됩니다.

설정에서 Pages가 보이지 않으면 저장소 관리자 권한과 조직 정책을 확인하세요. 배포 404는 `index.html`의 위치, 선택한 브랜치/폴더, Actions의 배포 결과를 확인합니다. 사용자 검색 404는 배포 오류가 아니라 해당 아이디가 없다는 뜻입니다.

## 기능과 파일

- 사용자 검색 및 octocat/torvalds 예시 검색
- 사진, 이름, 소개, 팔로워·팔로잉·공개 저장소 수
- 소유한 공개 저장소 목록, 설명, 언어, 스타 수, 포크/보관 표시
- 최근 업데이트순 30개 단위 페이지 탐색. `Link` 응답 헤더로 다음 페이지 여부 확인
- 로딩, 빈 목록, 404, 403, 429, 서버 오류, 네트워크 실패, 15초 시간 초과 처리
- 저장소만 실패하면 프로필과 기존 목록을 유지하고 실패 페이지 재시도
- 새 검색 시 이전 요청 취소 및 오래된 응답 무시
- 모바일 레이아웃, 키보드 포커스, 입력 레이블, 상태 안내

| 파일 | 역할 |
| --- | --- |
| `index.html` | 검색 폼과 결과 영역 |
| `styles.css` | 색상, 카드, 반응형 레이아웃 |
| `app.js` | API 요청, 오류 처리, 안전한 DOM 생성 |
| `.nojekyll` | Jekyll 처리 없이 정적 파일 제공 |

## API 및 요청 제한

사용하는 공개 엔드포인트:

```text
GET https://api.github.com/users/{username}
GET https://api.github.com/users/{username}/repos?type=owner&sort=updated&direction=desc&per_page=30&page=1
```

최초 검색은 프로필과 저장소에 각각 한 번씩, 보통 2회 요청합니다. 더 보기는 1회입니다. 입력하는 동안에는 요청하지 않습니다. 전체 저장소를 한꺼번에 가져오지 않으므로 프로필의 전체 저장소 수와 현재 불러온 개수는 다를 수 있습니다. 스타 수는 각 저장소 기준이며 전체 스타 합계는 계산하지 않습니다.

인증 없는 REST API는 일반적으로 **IP 기준 시간당 60회**로 제한됩니다. 같은 네트워크에서 한도를 공유할 수 있으며 별도의 보조 제한도 있습니다. `403`/`429`, `x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after`를 확인하고 재시도 시각을 안내합니다. 시각 정보가 없으면 최소 1분 대기합니다. 대기 중에는 이 페이지에서 새 API 요청을 보내지 않으며 자동 재시도하지 않습니다. 안내 시각이 지나면 검색 또는 재시도 버튼을 눌러 주세요.

## 안전한 DOM과 개인정보

- 사용자 이름은 형식을 검사하고 URL 경로에 `encodeURIComponent`로 넣습니다.
- API의 이름/소개/설명은 `textContent`로 표시합니다. `innerHTML`, `eval`, 외부 스크립트를 사용하지 않습니다.
- 링크는 HTTPS `github.com`, 사진은 HTTPS `avatars.githubusercontent.com` 또는 `github.com`만 허용합니다. 새 창 링크에는 `noopener noreferrer`를 적용합니다.
- API 토큰, 인증 헤더, 로그인, 쿠키 전송, 브라우저 저장소를 사용하지 않습니다.
- 검색 시 GitHub에 사용자 이름과 일반 네트워크 정보가 전달됩니다. 데이터는 페이지 메모리에만 보관하고 새로고침하면 초기화됩니다.
- CSS/JS는 `./styles.css`, `./app.js` 상대 경로여서 프로젝트 하위 경로 배포에서도 동작합니다. 외부 폰트나 라이브러리 의존성은 없습니다.

## 직접 확인하기

1. `octocat` 검색: 프로필/저장소/스타/링크 확인.
2. 공백·잘못된 기호: 요청 없이 입력 오류 확인.
3. 존재하지 않는 아이디: 404 안내 확인.
4. 저장소 30개 초과 계정: 더 보기와 목록 유지 확인.
5. 빠르게 다른 사용자 검색: 마지막 사용자의 결과만 표시되는지 확인.
6. 개발자 도구에서 오프라인으로 바꾼 뒤 검색: 연결 오류 확인.
7. 모바일 너비(360px), 키보드 Tab/Enter로 검색과 링크 사용 확인.

실제 요청을 반복해서 제한에 도달시키지는 마세요. 제한 동작은 개발 시 모의 응답으로 검사하는 편이 좋습니다.

## 학습 순서

`index.html`의 id → `app.js`의 이벤트 연결 → `request()`의 fetch → `renderProfile()`/`renderRepository()`의 DOM 생성 순으로 읽어 보세요. 색상은 `styles.css`의 `:root`에서 변경할 수 있습니다.

## 공식 문서

- [사용자 API](https://docs.github.com/en/rest/users/users#get-a-user)
- [사용자 저장소 API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [REST API 요청 제한](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub Pages 배포 설정](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

이 프로젝트는 GitHub와 제휴하지 않은 학습용 프로젝트입니다.
