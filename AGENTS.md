# Project: yangpaMarket Frontend

## 개요

이 프로젝트는 Vite + React + TypeScript + React Router 기반의 프론트엔드입니다.
현재 핵심 플로우는 경매 목록/상세, 경매 등록, 인증, 마이페이지, 결제입니다.
데이터는 인메모리 앱 스토어와 mock repository 레이어로 동작합니다.

## 기술 스택

- 프레임워크: React 18, Vite 6
- 언어: TypeScript
- 라우팅: react-router (`createBrowserRouter`, `RouterProvider`)
- 스타일링: Tailwind CSS v4 + CSS 변수(`src/styles/theme.css`)
- 상태 관리: `useSyncExternalStore` 기반 커스텀 스토어(`src/app/state/appStore.ts`)
- UI 라이브러리: lucide-react, Radix UI 기반 컴포넌트

## 실행 명령어

- `npm i` - 의존성 설치
- `npm run dev` - 개발 서버 실행
- `npm run build` - 프로덕션 빌드

## 프로젝트 구조

```txt
src/
  main.tsx
  styles/
    index.css
    fonts.css
    tailwind.css
    theme.css
  app/
    App.tsx
    routes.tsx
    components/
      auctionHome/
      auctionDetail/
      auctionRegister/
      payment/
      login/
      myPage/
      common/
      figma/
      ui/
    hooks/
      useAuth.ts
      useAuctions.ts
      usePayment.ts
    domain/
      types.ts
    repositories/
      contracts.ts
      mockRepository.ts
      httpRepository.ts
      index.ts
    state/
      appStore.ts
      initialState.ts
    utils/
      format.ts
```

## 아키텍처 규칙

- 데이터 흐름은 `components -> hooks -> repositories`를 유지합니다.
- 도메인 타입의 기준은 `src/app/domain/types.ts` 하나로 통일합니다.
- 현재 활성 모드는 mock 데이터입니다(`src/app/repositories/index.ts`, `ACTIVE_MODE = "mock"`).
- 실제 API 연동 시 `httpRepository.ts`를 `contracts.ts`에 맞게 구현한 뒤 `ACTIVE_MODE`를 전환합니다.
- 상태는 `useAppSelector`로 조회하고, 변경은 repository 로직과 `setAppState`를 통해서만 수행합니다.

## UI/UX 규칙

- 모바일 우선 레이아웃을 유지하고 화면 컨테이너는 `max-w-[390px]` 패턴을 따릅니다.
- 색상은 현재 테마(`theme.css`) 기준(화이트, 라이트 그레이, 오렌지 포인트)을 유지합니다.
- 라운드 값은 카드 약 12px, 입력/버튼 약 8px 컨벤션을 따릅니다.
- 원격/사용자 이미지 렌더링은 `ImageWithFallback` 재사용을 우선합니다.
- 사용자 노출 문구는 기존 한국어 톤과 일관되게 작성합니다.

## 코딩 컨벤션

- 컴포넌트: PascalCase 파일/내보내기 (예: `AuctionHome.tsx`)
- 훅: `use` 접두사 + camelCase (예: `useAuth.ts`)
- 유틸 함수: camelCase (예: `formatPrice`)
- domain/contract 레이어는 명시적 타입/인터페이스 선언을 우선합니다.
- 기존 코드 스타일(함수형 컴포넌트, 로컬 상태 훅, early return 렌더링)을 유지합니다.

## 변경 체크리스트

- [ ] 라우트 추가/변경 시 `src/app/routes.tsx`를 함께 수정한다.
- [ ] 새 화면이 탭 동선에 영향이 있으면 `BottomNav` 동작을 확인한다.
- [ ] 비즈니스 로직 추가 시 `contracts.ts`와 repository 구현을 함께 동기화한다.
- [ ] 금액/시간 표시는 `src/app/utils/format.ts`를 재사용한다.
- [ ] 한글 깨짐 방지를 위해 파일은 UTF-8로 저장한다.

## 참고 사항

- `vite.config.ts`의 `figma:asset/*` resolver 동작을 유지합니다.
- React/Tailwind Vite 플러그인은 현재 구성에서 필수입니다.
- 현재 `package.json`에는 `dev`, `build` 스크립트만 있고 lint/test 스크립트는 없습니다.

## 절대 하지 말아야 할 것들

- 내 허락 없이 파일 삭제 금지
- 모르면 추측하지않고 물어보기
- 작업 중간에 임의로 다른 방향으로 바꾸지마
  처음부터 완성본을 만들려고하지말고 AGENTS.md 는 에이전트가 실수할때마다 잔 줄씩 쌇가는 문서이다
