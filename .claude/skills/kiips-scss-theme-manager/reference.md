# SCSS Theme Manager - 상세 레퍼런스

## 전체 Design Tokens (_variables.scss)

### Color Tokens
```scss
// Primary Colors
$primary: #007bff;
$secondary: #6c757d;
$success: #28a745;
$danger: #dc3545;
$warning: #ffc107;
$info: #17a2b8;

// Grayscale
$white: #ffffff;
$gray-100: #f8f9fa;
$gray-200: #e9ecef;
$gray-300: #dee2e6;
$gray-400: #ced4da;
$gray-500: #adb5bd;
$gray-600: #6c757d;
$gray-700: #495057;
$gray-800: #343a40;
$gray-900: #212529;
$black: #000000;

// Semantic Colors
$text-primary: $gray-900;
$text-secondary: $gray-600;
$text-muted: $gray-500;
$bg-body: $white;
$bg-surface: $gray-100;
```

### Typography
```scss
$font-family-base: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
$font-family-mono: SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;

$font-size-base: 1rem;      // 16px
$font-size-sm: 0.875rem;    // 14px
$font-size-lg: 1.125rem;    // 18px

$font-weight-light: 300;
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-bold: 700;

$line-height-base: 1.5;
$line-height-sm: 1.25;
$line-height-lg: 1.75;
```

### Spacing
```scss
$spacer: 1rem;
$spacers: (
  0: 0,
  1: $spacer * 0.25,  // 4px
  2: $spacer * 0.5,   // 8px
  3: $spacer,         // 16px
  4: $spacer * 1.5,   // 24px
  5: $spacer * 3      // 48px
);
```

### Borders & Radius
```scss
$border-width: 1px;
$border-color: $gray-300;
$border-radius: 0.25rem;      // 4px
$border-radius-sm: 0.2rem;    // 3.2px
$border-radius-lg: 0.3rem;    // 4.8px
$border-radius-pill: 50rem;
```

### Shadows
```scss
$box-shadow-sm: 0 0.125rem 0.25rem rgba($black, 0.075);
$box-shadow: 0 0.5rem 1rem rgba($black, 0.15);
$box-shadow-lg: 0 1rem 3rem rgba($black, 0.175);
```

### Z-Index
```scss
$zindex-dropdown: 1000;
$zindex-sticky: 1020;
$zindex-fixed: 1030;
$zindex-modal-backdrop: 1040;
$zindex-modal: 1050;
$zindex-popover: 1060;
$zindex-tooltip: 1070;
```

### Transitions
```scss
$transition-base: all 0.2s ease-in-out;
$transition-fade: opacity 0.15s linear;
$transition-collapse: height 0.35s ease;
```

---

## 전체 Mixins (_mixins.scss)

### Responsive Mixins
```scss
@mixin media-breakpoint-up($breakpoint) {
  @if $breakpoint == xs {
    @content;
  } @else if $breakpoint == sm {
    @media (min-width: 576px) { @content; }
  } @else if $breakpoint == md {
    @media (min-width: 768px) { @content; }
  } @else if $breakpoint == lg {
    @media (min-width: 992px) { @content; }
  } @else if $breakpoint == xl {
    @media (min-width: 1200px) { @content; }
  }
}

@mixin media-breakpoint-down($breakpoint) {
  @if $breakpoint == xs {
    @media (max-width: 575.98px) { @content; }
  } @else if $breakpoint == sm {
    @media (max-width: 767.98px) { @content; }
  } @else if $breakpoint == md {
    @media (max-width: 991.98px) { @content; }
  } @else if $breakpoint == lg {
    @media (max-width: 1199.98px) { @content; }
  } @else if $breakpoint == xl {
    @content;
  }
}

// Usage:
// .sidebar {
//   width: 100%;
//   @include media-breakpoint-up(md) {
//     width: 250px;
//   }
// }
```

### Flexbox Mixins
```scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}
```

### Typography Mixins
```scss
@mixin text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-clamp($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@mixin font-smoothing {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Transition Mixins
```scss
@mixin transition($properties...) {
  $transitions: ();
  @each $property in $properties {
    $transitions: append($transitions, $property 0.2s ease-in-out, comma);
  }
  transition: $transitions;
}
// Usage: @include transition(color, background-color);
```

### Shadow Mixins
```scss
@mixin card-shadow {
  box-shadow: $box-shadow;
  &:hover {
    box-shadow: $box-shadow-lg;
  }
}
```

### Button Mixins
```scss
@mixin button-variant($background, $border, $color: $white) {
  color: $color;
  background-color: $background;
  border-color: $border;

  &:hover {
    background-color: darken($background, 7.5%);
    border-color: darken($border, 10%);
  }

  &:active,
  &.active {
    background-color: darken($background, 10%);
    border-color: darken($border, 12.5%);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}
```

---

## Component Example: Card (BEM)

### components/_cards.scss
```scss
@import '../abstracts/variables';
@import '../abstracts/mixins';

.card {
  background-color: $white;
  border: $border-width solid $border-color;
  border-radius: $border-radius;
  @include card-shadow;
  @include transition(box-shadow);

  &__header {
    padding: $spacer;
    border-bottom: $border-width solid $border-color;
    background-color: $gray-100;
    @include media-breakpoint-down(sm) {
      padding: $spacer * 0.75;
    }
  }

  &__body {
    padding: $spacer;
    @include media-breakpoint-down(sm) {
      padding: $spacer * 0.75;
    }
  }

  &__footer {
    padding: $spacer;
    border-top: $border-width solid $border-color;
    background-color: $gray-100;
  }

  &__title {
    margin-bottom: $spacer * 0.75;
    font-size: $font-size-lg;
    font-weight: $font-weight-medium;
    @include text-truncate;
  }

  &--hoverable {
    cursor: pointer;
    &:hover {
      transform: translateY(-2px);
      box-shadow: $box-shadow-lg;
    }
  }
}
```

### HTML Usage
```html
<div class="card card--hoverable">
    <div class="card__header">
        <h3 class="card__title">펀드 상세</h3>
    </div>
    <div class="card__body">
        <!-- Content -->
    </div>
    <div class="card__footer">
        <button class="btn btn-primary">저장</button>
    </div>
</div>
```

---

## Theme Switching (Optional)

### themes/_light.scss
```scss
$theme-light: (
  text-primary: $gray-900,
  text-secondary: $gray-600,
  bg-body: $white,
  bg-surface: $gray-100,
  border-color: $gray-300
);
```

### themes/_dark.scss
```scss
$theme-dark: (
  text-primary: $gray-100,
  text-secondary: $gray-400,
  bg-body: $gray-900,
  bg-surface: $gray-800,
  border-color: $gray-700
);
```

### Theme Application
```scss
@mixin apply-theme($theme) {
  --color-text-primary: #{map-get($theme, text-primary)};
  --color-text-secondary: #{map-get($theme, text-secondary)};
  --color-bg-body: #{map-get($theme, bg-body)};
  --color-bg-surface: #{map-get($theme, bg-surface)};
  --color-border: #{map-get($theme, border-color)};
}

body {
  @include apply-theme($theme-light);

  &.theme-dark {
    @include apply-theme($theme-dark);
  }
}

// Usage in components
.card {
  color: var(--color-text-primary);
  background-color: var(--color-bg-surface);
  border-color: var(--color-border);
}
```

---

## Maven Plugin Configuration

```xml
<plugin>
    <groupId>com.github.warmuuh</groupId>
    <artifactId>libsass-maven-plugin</artifactId>
    <version>0.2.29</version>
    <executions>
        <execution>
            <goals>
                <goal>compile</goal>
            </goals>
        </execution>
    </executions>
    <configuration>
        <inputPath>${basedir}/src/main/resources/static/scss</inputPath>
        <outputPath>${basedir}/src/main/resources/static/css</outputPath>
        <outputStyle>compressed</outputStyle>
        <generateSourceMap>true</generateSourceMap>
    </configuration>
</plugin>
```
