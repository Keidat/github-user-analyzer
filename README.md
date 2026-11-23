# GitHub Lens

**GitHub API를 활용한 사용자 프로필 및 공개 저장소 조회 서비스**

GitHub 아이디를 검색하면 사용자의 프로필과 공개 저장소를 한눈에 볼 수 있는 웹페이지입니다. HTML, CSS, JavaScript로 제작했으며 별도 서버나 API 토큰 없이 GitHub Pages에서 사용할 수 있습니다.

## 주요 기능

- **사용자 검색**: GitHub 아이디로 검색하거나 예시 사용자를 선택합니다.
- **프로필 조회**: 사진, 이름, 소개, 팔로워, 팔로잉, 공개 저장소 수를 확인합니다.
- **저장소 탐색**: 저장소 이름, 설명, 언어, 스타 수, 포크·보관 여부를 확인하고 GitHub 원본 페이지로 이동합니다.
- **더 보기**: 최근 업데이트순으로 저장소를 30개씩 불러옵니다.
- **상태 안내**: 로딩, 사용자 없음(404), 네트워크 오류, API 요청 제한을 안내하고 저장소 조회를 재시도할 수 있습니다.
- **반응형 화면**: PC와 모바일 화면 크기에 맞춰 표시합니다.

## 사용 방법

1. 검색창에 GitHub 아이디를 입력합니다. 예: `octocat`
2. **사용자 검색** 버튼 또는 Enter 키를 누릅니다.
3. 프로필과 저장소를 확인하고, 필요하면 **저장소 더 보기**를 누릅니다.

프로필 주소 전체가 아닌 아이디만 입력하세요. 프로필의 공개 저장소 수는 전체 개수이며, 목록에는 현재 불러온 저장소가 표시됩니다.

## 실행 및 배포

### 내 컴퓨터에서 실행

압축을 풀고 `index.html`을 브라우저에서 엽니다. 인터넷 연결과 JavaScript가 필요합니다. 브라우저가 로컬 파일의 API 요청을 제한하면 GitHub Pages에 배포하여 사용하세요.

### GitHub Pages에 배포

1. GitHub에서 **Public** 저장소를 만듭니다.
2. **Add file → Upload files**로 프로젝트 폴더 안의 파일을 업로드하고 커밋합니다. ZIP이나 폴더 자체가 아니라 `index.html`이 저장소 최상위에 오도록 올립니다.
3. `.nojekyll`도 함께 올립니다. 보이지 않으면 **Add file → Create new file**에서 `.nojekyll`이라는 빈 파일을 만듭니다.
4. **Settings → Pages**로 이동합니다.
5. **Source: Deploy from a branch**, **Branch: main**, **Folder: /(root)**를 선택하고 **Save**를 누릅니다. 기본 브랜치 이름이 다르면 실제 브랜치를 선택합니다.
6. 배포 후 **Visit site**로 접속합니다. 진행 상황은 **Actions** 탭에서 확인할 수 있습니다.

주소 예시: `https://본인아이디.github.io/저장소이름/`

이후 같은 브랜치의 파일을 수정하고 커밋하면 자동으로 다시 배포됩니다. 배포 주소에서 404가 나오면 `index.html` 위치와 Pages의 브랜치·폴더 설정을 확인하세요.

## 사용한 API

GitHub REST API의 공개 엔드포인트를 사용합니다.

| API | 용도 |
| --- | --- |
| `GET /users/{username}` | 사용자 프로필 조회 |
| `GET /users/{username}/repos` | 소유한 공개 저장소 조회 (포크 포함) |

브라우저가 `https://api.github.com`에 요청하고, 응답받은 JSON 데이터를 화면에 표시합니다. 저장소는 최근 업데이트순으로 30개씩 조회합니다.

인증 없는 요청은 일반적으로 IP 기준 시간당 60회로 제한되며 같은 네트워크에서 한도를 공유할 수 있습니다. 최초 검색은 보통 2회, 더 보기는 1회 요청합니다. 제한에 도달하면 재시도 가능 시간을 안내하며 자동으로 반복 요청하지 않습니다.

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 검색창과 프로필·저장소 표시 영역 |
| `styles.css` | 디자인과 반응형 레이아웃 |
| `app.js` | API 요청, 화면 표시, 오류 처리 |
| `.nojekyll` | 정적 파일 배포 설정 |

외부 라이브러리나 빌드 도구를 사용하지 않습니다. CSS와 JavaScript는 상대 경로로 연결하여 GitHub Pages의 저장소 하위 주소에서도 사용할 수 있습니다.

## 데이터 처리

- API 키나 토큰 없이 공개 정보만 조회합니다.
- 검색한 아이디는 GitHub에 전송되며 별도의 검색 기록을 저장하지 않습니다.
- API의 문자열은 `textContent`로 표시하고 링크와 이미지 주소를 검사합니다.
- 새 검색 시 이전 요청을 취소하여 오래된 결과가 표시되지 않도록 처리합니다.

## 참고 문서

- [GitHub 사용자 API](https://docs.github.com/en/rest/users/users#get-a-user)
- [GitHub 저장소 API](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user)
- [API 요청 제한](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
- [GitHub Pages 배포 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

GitHub 공식 서비스가 아닌 API 활용 학습용 프로젝트입니다.
