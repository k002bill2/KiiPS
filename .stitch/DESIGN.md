# KiiPS Design System

> Generated for KiiPS (Korea Investment Information Processing System)
> Use this design system in every Stitch/Pencil prompt for visual consistency.

## 1. Visual Theme & Atmosphere

Clean, professional, and structured enterprise financial application. The aesthetic prioritizes clarity and readability with a corporate blue palette, generous whitespace, and structured data presentation. The interface is functional-first with subtle depth through light shadows.

## 2. Color Palette & Roles

| Color Name | Hex | Role |
|------------|-----|------|
| Primary Dark | #2c3e50 | Headers, navigation, sidebar |
| Primary Blue | #3498db | Links, active buttons, selected states |
| Success Green | #27ae60 | Positive status, approval indicators |
| Warning Orange | #f39c12 | Warning messages, pending status |
| Danger Red | #e74c3c | Error messages, delete buttons |
| Background | #f5f6fa | Page background |
| Surface White | #ffffff | Cards, panels, modals |
| Text Primary | #2c3e50 | Headings, important text |
| Text Secondary | #7f8c8d | Labels, captions, descriptions |
| Border | #dcdde1 | Dividers, table borders, input borders |
| Hover | #ecf0f1 | Row hover, button hover background |

## 3. Typography Rules

- **Headings**: Noto Sans KR, Bold, 16-20px
- **Body**: Noto Sans KR, Regular, 14px, line-height 1.5
- **Grid cells**: Noto Sans KR, Regular, 13px
- **Labels**: Noto Sans KR, Medium, 13px
- **Captions**: Noto Sans KR, Regular, 12px, color #7f8c8d

## 4. Component Styles

- **Buttons**: 4px border-radius, 8px 16px padding, subtle hover darkening
- **Cards**: 4px border-radius, 1px solid #dcdde1 border, white background
- **Inputs**: 4px border-radius, 1px solid #dcdde1 border, blue glow on focus (#3498db)
- **Tables**: RealGrid 2.6.3 - header bg #f8f9fa, zebra striping, 1px borders
- **Modals**: Centered overlay, 600-800px width, header/body/footer sections
- **Tabs**: Horizontal with bottom border indicator, active tab blue

## 5. Layout Principles

- **Grid**: Bootstrap 12-column grid
- **Spacing**: 8px base unit (8, 16, 24, 32, 48)
- **Page structure**: Search filter (top) → Button toolbar → Data grid (main)
- **Breakpoints**: Desktop-first (min-width: 1200px primary)

## 6. Design System Notes for Stitch Generation

**Copy this entire section into every Stitch prompt:**

- Platform: Web, Desktop-first
- Theme: Light, professional, corporate
- Background: Soft Gray (#f5f6fa)
- Surface: White (#ffffff) for panels and cards
- Primary: Corporate Blue (#3498db) for actions and links
- Primary Dark: Dark Slate (#2c3e50) for headers
- Text Primary: Dark Slate (#2c3e50)
- Text Secondary: Gray (#7f8c8d) for labels
- Success: Green (#27ae60), Warning: Orange (#f39c12), Danger: Red (#e74c3c)
- Borders: Light Gray (#dcdde1)
- Buttons: 4px radius, solid background, subtle shadow on hover
- Cards: 4px radius, 1px border, white background
- Inputs: 4px radius, 1px border, blue focus glow
- Font: Noto Sans KR, 14px body, 13px grid
