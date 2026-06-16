# 테트리스 (학습용 프로젝트)

HTML, CSS, JavaScript만으로 만든 브라우저 테트리스 게임입니다.  
빌드 도구나 외부 라이브러리 없이 동작하며, 입문자가 프론트엔드 기초를 학습하기 위한 프로젝트입니다.

## 프로젝트 소개

| 항목 | 내용 |
|------|------|
| 기술 스택 | HTML, CSS, JavaScript (Vanilla) |
| 보드 크기 | 10열 × 20행 |
| 블록 종류 | I, O, T, S, Z, J, L (7종) |
| 배포 형태 | 정적 사이트 (GitHub Pages 호환) |

## 실행 방법

### 로컬에서 실행

1. 저장소를 클론하거나 프로젝트 폴더를 연다.
2. `index.html`을 더블 클릭하거나 브라우저로 드래그한다.

또는 에디터의 **Live Server** 확장을 사용해도 됩니다.

### 온라인에서 실행 (GitHub Pages)

게임 주소:

**https://cs5-oh.github.io/tetris/**

## 조작법

| 키 | 동작 |
|----|------|
| `ArrowLeft` | 왼쪽 이동 |
| `ArrowRight` | 오른쪽 이동 |
| `ArrowDown` | 한 칸 빠르게 내리기 (soft drop) |
| `ArrowUp` | 시계 방향 회전 |
| `Space` | 즉시 낙하 (hard drop) |

| 버튼 | 동작 |
|------|------|
| 시작 | 게임 시작 |
| 재시작 | 보드·점수·타이머·상태 초기화 후 새 게임 |

모든 이동·회전은 `canMove()` 충돌 판정을 통과할 때만 적용됩니다.

## 구현 기능

- 10×20 CSS Grid 게임 보드
- 7종 테트로미노 정의 및 렌더링
- 자동 낙하 (`requestAnimationFrame` 기반)
- 충돌 판정 (`canMove`) 및 보드 밖 이동 차단
- 블록 고정 및 lock delay (착지 후 0.5초 대기)
- 가득 찬 줄 삭제 및 점수 반영
- 게임 오버 (스폰 불가 시)
- 재시작 (전체 상태 초기화)
- 키보드 조작 (이동, 회전, soft/hard drop)

### 점수 규칙

| 한 번에 삭제한 줄 | 점수 |
|------------------|------|
| 1줄 | 100 |
| 2줄 | 300 |
| 3줄 | 500 |
| 4줄 | 800 |

### 게임 오버 조건

새 블록을 보드 상단 스폰 위치에 놓을 수 없을 때 게임이 종료됩니다.

## 파일 구성

| 파일 | 설명 |
|------|------|
| `index.html` | 페이지 구조 |
| `style.css` | 스타일 |
| `script.js` | 게임 로직 |
| `README.md` | 프로젝트 문서 |

## 품질 점검 방법

배포 전 아래 항목을 순서대로 확인합니다.

### 1. 리소스 연결

1. 브라우저에서 `index.html`을 연다.
2. 개발자 도구(F12) → **Network** 탭을 연다.
3. 새로고침 후 `style.css`, `script.js`가 **200** 상태로 로드되는지 확인한다.

### 2. 콘솔 에러

1. 개발자 도구 → **Console** 탭을 연다.
2. 페이지 로드 직후 빨간 에러가 없는지 확인한다.
3. **시작** 클릭 후 게임 플레이 중에도 에러가 없는지 확인한다.

### 3. 게임플레이

| # | 확인 항목 | 기대 결과 |
|---|----------|----------|
| 1 | 시작 버튼 | 블록 낙하 시작 |
| 2 | 방향키 이동 | 충돌 없을 때만 이동 |
| 3 | 회전 | 벽·블록 충돌 시 취소 |
| 4 | 줄 삭제 | 가득 찬 줄 제거, 점수 증가 |
| 5 | 게임 오버 | 상단까지 차면 종료, 입력 무시 |
| 6 | 재시작 | 보드·점수·줄 수 0, 낙하 재개 |

### 4. GitHub Pages 배포 후

1. 배포 URL에 접속해 게임이 로드되는지 확인한다.
2. CSS가 적용된 화면(다크 테마, 컬러 블록)이 보이는지 확인한다.
3. `file://`이 아닌 `https://` URL에서 정상 동작하는지 확인한다.

## GitHub Pages 배포 방법

### 1. Git 저장소 준비

```bash
cd tetris
git init
git add index.html style.css script.js README.md .gitignore
git commit -m "Add Tetris learning project"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소-이름>.git
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub에서 해당 저장소를 연다.
2. **Settings** → **Pages**로 이동한다.
3. **Build and deployment** → **Source**에서 **GitHub Actions**를 선택한다.
4. `main` 브랜치에 푸시되면 `.github/workflows/deploy-pages.yml` 워크플로가 자동 배포한다.
5. 1~2분 후 https://cs5-oh.github.io/tetris/ 에서 확인한다.

### 3. 배포 구조 요구사항

- `index.html`이 저장소 **루트**에 있어야 합니다.
- `style.css`, `script.js`는 `index.html`과 같은 경로에 두세요.
- 별도 빌드 단계는 필요 없습니다.

## 라이선스

학습용 프로젝트입니다. 자유롭게 참고·수정해 사용할 수 있습니다.
