---
name: kiips-a11y-checker
description: "웹 접근성 (WCAG 2.1 AA) 검증 및 자동 수정. Use when: 접근성, WCAG, ARIA, 스크린 리더, 키보드 네비게이션, 색상 대비"
---

# KiiPS Accessibility Checker

WCAG 2.1 AA 표준 기반 웹 접근성 자동 검증 및 수정 Skill입니다.

## 📋 Purpose

### What This Skill Does
- **ARIA 속성 검증**: role, label, describedby 자동 추가
- **색상 대비 검증**: 4.5:1 이상 (본문), 3:1 이상 (제목)
- **키보드 네비게이션**: Tab, Enter, Space, Arrow keys
- **폼 레이블 검증**: label-input 연결, required 표시
- **RealGrid 접근성**: ARIA grid role, keyboard support
- **의미있는 HTML**: semantic tags (header, nav, main, article)

## 🎯 When to Use

### Keywords
```
"접근성", "WCAG", "ARIA", "스크린 리더", "키보드 네비게이션",
"색상 대비", "웹 표준"
```

## 🚀 WCAG 2.1 AA Checklist

### Level A (필수)

#### ✅ 1. Text Alternatives
- [ ] 모든 이미지에 `alt` 속성 (장식 이미지는 `alt=""`)
- [ ] 아이콘에 `aria-label` 또는 visually-hidden 텍스트

```html
<!-- ✅ Good -->
<img src="logo.png" alt="KiiPS 로고">
<i class="bi bi-search" aria-label="검색"></i>
<button class="icon-btn">
    <i class="bi bi-save" aria-hidden="true"></i>
    <span class="visually-hidden">저장</span>
</button>

<!-- ❌ Bad -->
<img src="logo.png">
<i class="bi bi-search"></i>
```

#### ✅ 2. Keyboard Accessible
- [ ] 모든 인터랙티브 요소 키보드 접근 가능 (Tab)
- [ ] Focus 시각적 표시 (.focus-visible)
- [ ] Skip to content 링크

```html
<a href="#main-content" class="skip-link">본문 바로가기</a>

<style>
.skip-link {
    position: absolute;
    left: -9999px;
}

.skip-link:focus {
    position: static;
}

button:focus-visible {
    outline: 2px solid #007bff;
    outline-offset: 2px;
}
</style>
```

#### ✅ 3. Form Labels
- [ ] 모든 입력 요소에 `<label>` 연결
- [ ] Required 필드 명시 (`required`, `aria-required`)
- [ ] 에러 메시지 `aria-describedby` 연결

```html
<!-- ✅ Good -->
<div class="mb-3">
    <label for="fundName" class="form-label">
        펀드명 <span class="text-danger" aria-label="필수">*</span>
    </label>
    <input type="text" class="form-control" id="fundName" name="fundName"
           required aria-required="true" aria-describedby="fundNameHelp">
    <small id="fundNameHelp" class="form-text text-muted">
        펀드명을 입력하세요
    </small>
</div>

<!-- ❌ Bad -->
<div>
    <span>펀드명*</span>
    <input type="text" name="fundName">
</div>
```

---

### Level AA (권장)

#### ✅ 4. Color Contrast
- [ ] 본문: 4.5:1 이상
- [ ] 제목 (18pt 이상 또는 bold 14pt): 3:1 이상
- [ ] UI 컴포넌트: 3:1 이상

```scss
// ✅ Good - 7:1 ratio
$text-color: #212529;      // 진한 회색
$bg-color: #ffffff;        // 흰색

// ✅ Good - 4.6:1 ratio
$link-color: #0056b3;      // 진한 파랑
$bg-color: #ffffff;

// ❌ Bad - 2.5:1 ratio
$text-color: #999999;      // 연한 회색 (불충분)
$bg-color: #ffffff;
```

**Test Tool**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

#### ✅ 5. Resize Text
- [ ] 200% 확대 시 콘텐츠 유실 없음
- [ ] 상대 단위 사용 (rem, em)

```scss
// ✅ Good
body {
    font-size: 1rem;  // 16px (기본)
}

h1 {
    font-size: 2.5rem;  // 40px
}

// ❌ Bad
body {
    font-size: 16px;  // 고정 크기
}
```

#### ✅ 6. Multiple Ways
- [ ] 사이트맵
- [ ] 검색 기능
- [ ] 네비게이션 메뉴

---

## 🎨 ARIA Roles & Attributes

### Common Patterns

#### Pattern 1: 버튼
```html
<!-- Native button (best) -->
<button type="button">저장</button>

<!-- Custom button (requires ARIA) -->
<div role="button" tabindex="0"
     onkeydown="if(event.key==='Enter'||event.key===' '){save()}">
    저장
</div>
```

#### Pattern 2: 모달
```html
<div class="modal" role="dialog" aria-labelledby="modalTitle"
     aria-describedby="modalDesc" aria-modal="true">
    <div class="modal-content">
        <h2 id="modalTitle">펀드 상세</h2>
        <p id="modalDesc">펀드 상세 정보를 표시합니다.</p>
        <button type="button" class="close" aria-label="닫기">
            <span aria-hidden="true">&times;</span>
        </button>
    </div>
</div>
```

#### Pattern 3: Tab Panel
```html
<div role="tablist" aria-label="펀드 정보 탭">
    <button role="tab" aria-selected="true" aria-controls="panel1"
            id="tab1" tabindex="0">
        기본 정보
    </button>
    <button role="tab" aria-selected="false" aria-controls="panel2"
            id="tab2" tabindex="-1">
        투자 현황
    </button>
</div>

<div role="tabpanel" id="panel1" aria-labelledby="tab1">
    <!-- 기본 정보 내용 -->
</div>

<div role="tabpanel" id="panel2" aria-labelledby="tab2" hidden>
    <!-- 투자 현황 내용 -->
</div>
```

#### Pattern 4: Form Validation
```html
<div class="mb-3">
    <label for="email" class="form-label">이메일</label>
    <input type="email" class="form-control is-invalid" id="email"
           aria-invalid="true" aria-describedby="emailError">
    <div id="emailError" class="invalid-feedback" role="alert">
        올바른 이메일 주소를 입력하세요
    </div>
</div>
```

---

## 🔊 Screen Reader Optimization

### Visually Hidden Text
```html
<style>
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
}
</style>

<button>
    <i class="bi bi-trash" aria-hidden="true"></i>
    <span class="visually-hidden">삭제</span>
</button>
```

### ARIA Live Regions
```html
<!-- 동적 콘텐츠 업데이트 알림 -->
<div aria-live="polite" aria-atomic="true" class="visually-hidden">
    <span id="statusMessage"></span>
</div>

<script>
function showMessage(message) {
    document.getElementById('statusMessage').textContent = message;
}

// 사용
showMessage('펀드가 성공적으로 저장되었습니다.');
</script>
```

---

## 🎹 Keyboard Navigation

### Required Shortcuts
- **Tab**: 다음 요소로 이동
- **Shift + Tab**: 이전 요소로 이동
- **Enter**: 링크/버튼 활성화
- **Space**: 버튼/체크박스 활성화
- **Arrow Keys**: 라디오 버튼, 탭, 드롭다운
- **Esc**: 모달/드롭다운 닫기

### Implementation
```javascript
// 모달 키보드 트랩
function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    modal.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        } else if (e.key === 'Escape') {
            closeModal();
        }
    });
}
```

---

## 🧪 Automated Testing

### axe-core (Best)
```javascript
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('Accessibility check', async ({ page }) => {
    await page.goto('/fund/fund-list.jsp');

    const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

    expect(results.violations).toEqual([]);
});
```

### Manual Test (NVDA/JAWS)
```
1. Install NVDA (Windows) or VoiceOver (Mac)
2. Navigate with Tab
3. Listen to announcements
4. Verify all content is readable
```

---

## 🛠️ Auto-Fix Examples

### Issue 1: Missing Alt Text
```javascript
// Auto-fix
document.querySelectorAll('img:not([alt])').forEach(img => {
    const filename = img.src.split('/').pop().split('.')[0];
    img.setAttribute('alt', filename.replace(/[-_]/g, ' '));
    console.warn('Auto-added alt:', img.src);
});
```

### Issue 2: Low Contrast
```scss
// ❌ Before (contrast: 2.8:1)
.btn-secondary {
    color: #6c757d;
    background-color: #f8f9fa;
}

// ✅ After (contrast: 4.6:1)
.btn-secondary {
    color: #495057;  // 더 어둡게
    background-color: #e9ecef;  // 약간 어둡게
}
```

### Issue 3: Missing Form Labels
```javascript
// Auto-fix
document.querySelectorAll('input:not([id])').forEach((input, index) => {
    const id = input.name || `input_${index}`;
    input.setAttribute('id', id);

    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = input.placeholder || id;
    label.classList.add('form-label');

    input.parentNode.insertBefore(label, input);
});
```

---

## 📚 Related Skills

| Skill | Usage |
|-------|-------|
| **kiips-ui-component-builder** | 컴포넌트 생성 시 접근성 자동 적용 |
| **kiips-responsive-validator** | 터치 타겟 크기 검증 |

---

## 📊 Success Metrics
- ✅ ARIA 레이블 적용률: 100%
- ✅ 색상 대비 준수율: > 95%
- ✅ 키보드 네비게이션: 100%
- ✅ 폼 레이블 연결률: 100%
- ✅ axe-core violations: 0

---

**Version**: 1.0.0
**Last Updated**: 2026-01-04
**WCAG Version**: 2.1 AA
