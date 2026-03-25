# OPC Business Card Mini-program - UI Design Document (v3.0)

> Design Philosophy: Modern Minimalism → **Multi-Dimensional Breathing Sense**
> Core Goal: Simplicity, Atmosphere, Premium, Dynamic Vitality
> Key Transformation: From "Static Flat" to "Multi-Dimensional Breathing"

---

## 1. Global Design System (v3.0)

### 1.1 Color Palette - 灵动色彩 (Dynamic Palette)

| Category | Variable | Hex | Description |
|---------|----------|-----|-------------|
| Primary | Color-Primary | #2563EB | Brand Breathing Blue, Hue Shift on interaction |
| Deep Black | Color-Deep | #121212 | Deep neutral black (+2% blue tint) |
| Premium Gold | Color-Gold | #D4AF37 | Metallic brushed gold, PRO badges |
| Background | Color-BG | #F8F9FA | Page background |
| Surface | Color-Surface | rgba(255,255,255,0.85) | Frosted glass effect |
| Text Main | Text-Main | #121212 | Titles, names |
| Text Sub | Text-Sub | #64748B | Job titles, company info |

### 1.2 Spacing & Radius - 非线性圆角 (Squircle Curves)

| Name | Value | Use Case |
|------|-------|----------|
| XL | 32rpx | Core cards, popups (wrapped feel) |
| L | 24rpx | List cards (emphasis on order) |
| M | 16rpx | Buttons, tags |
| SM | 8rpx | Small elements |
| Full | 9999rpx | Pill buttons |

### 1.3 Shadow System

| Name | CSS | Use Case |
|------|-----|----------|
| Soft | `0 8rpx 24rpx rgba(0,0,0,0.06)` | Card floating |
| Float | `0 16rpx 48rpx rgba(47,101,238,0.3)` | Important elements |
| Inner Glow | `inset 0 0 20px rgba(255,255,255,0.1)` | Glass texture |

### 1.4 Glassmorphism 2.0 - 磨砂玻璃

```css
/* Surface - Frosted Glass */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(40px);
-webkit-backdrop-filter: blur(40px);

/* Micro Inner Glow - Precision Craft */
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
```

---

## 2. Motion & Animation

### 2.1 Staggered Animation - 交错位移

```css
/* Page Enter Animation */
animation: slideUp 0.4s ease-out forwards;

/* Staggered Delay: t = n × 40ms */
animation-delay: calc(var(--index) * 40ms);

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
```

### 2.2 Card 3D Parallax - 名片3D视差

```css
/* Card Tilt Based on Touch */
transform: rotateX(var(--rotateX)) rotateY(var(--rotateY));
transition: transform 0.3s ease;
```

### 2.3 Exchange Button Floating - 悬浮重力感

```css
/* Floating Animation */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}
animation: float 3s ease-in-out infinite;

/* Click Collapse + Ripple */
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

### 2.4 Dynamic Font Weight - 动态字重

```css
/* Selected State - Smooth Weight Transition */
transition: font-weight 0.3s ease;
font-weight: 400; /* Default */
font-weight: 500; /* Selected */
```

---

## 3. Typography - 字体排版

### 3.1 Type Scale

| Element | Size | Weight | Letter Spacing |
|---------|------|--------|----------------|
| H1 Title | 48rpx | 600 (Semibold) | -0.02em |
| H2 Page Title | 44rpx | 600 | -0.02em |
| H3 Card Title | 36rpx | 600 | -0.01em |
| Body | 28rpx | 400 (Regular) | 0.01em |
| Caption | 24rpx | 400 | 0 |
| Tag | 20rpx | 500 | 0 |

### 3.2 Font Family
- Primary: SF Pro Display, -apple-system, BlinkMacSystemFont
- Fallback: Inter, Helvetica Neue, sans-serif

---

## 4. Tab Structure (4 Tabs + Center Exchange)

| Position | Tab | Page | Label |
|----------|-----|------|-------|
| 1 | My Cards | pages/mycards/mycards | 我的名片 |
| 2 | Contacts | pages/contacts/contacts | 联系人 |
| 3 | Workbench | pages/home/home | 工作台 |
| Center | Exchange | pages/exchange/exchange | 🔄 交换 |
| 4 | Manage | pages/management/management | 管理 |

### TabBar Visual
- 4 text tabs on sides
- Prominent elevated circular blue button in center
- Floating animation with subtle vertical movement

---

## 5. Workbench Page Design

### 5.1 Top Section
- Floating premium business card preview (32rpx rounded)
- Light blue gradient background
- Name + Title + Square avatar
- Soft shadow floating effect

### 5.2 Middle Section (2x2 Grid)
- My Cards / Visitor Records / Exchange History / Data Analytics
- Colorful icons with glassmorphism background
- Labels below each icon

### 5.3 Bottom Section (Scrolled)
- AI Section: Blue glow card with "One-click Generation", "Smart Tags"
- Visitor List: Avatar + Name + Time + Source icon
- PRO Member Banner: Gold accents, shield icon

### Animation
- Cards slide up with stagger effect (40ms delay)
- Hover/tap micro-interactions

---

## 6. My Cards Page Design

### 6.1 Layout
- Vertical scroll card flow
- Each card: independent rounded rectangle (XL 32rpx)
- Card types:
  - Tech: Blue gradient
  - Biz: Dark gray-blue (#1e293b)
  - Social: Green gradient

### 6.2 Card Features
- Default badge (top right)
- Avatar (right side)
- Gradient background with shimmer effect
- Action buttons: Set Default, Edit, Share, Delete
- Add button: Blue circle "+" (bottom)

### 6.3 Card 3D Effect
- ±2° tilt based on touch position
- Slow moving light beam (Linear Gradient Shimmer)
- "Activated" state indication

---

## 7. Contacts Page Design

### 7.1 Layout
- Search bar (glassmorphism style)
- Tag filters: All, AI, B2B, Oversea, Flutter
- Recent Exchange section
- All Contacts list

### 7.2 Contact Card
- Avatar (left, rounded)
- Name + Active time (top)
- Job title + Company
- Tags (pill style)
- Actions: Chat, Call

---

## 8. Management Page Design

### 8.1 Layout
- Profile card: Avatar, Name, Phone
- Menu list:
  - My QR Code
  - Account Management
  - Bind Phone
  - Bind WeChat
  - Privacy
  - Notifications
  - PRO Member
  - FAQ
  - Terms
  - Privacy Policy
  - About
- Logout button

---

## 9. Feedback Mechanisms

| Action | Feedback | Animation |
|--------|----------|-----------|
| Page Switch | Cross-fade | 0.3s linear out + 0.3s elastic in |
| Success | Green Pulse | 2 rings expanding from icon |
| List Scroll | Damping | Stretch/squeeze at bottom |
| PRO Locked | Crystal Mask | Semi-transparent refraction |

---

## 10. Page List

| Page | File | Description |
|------|------|-------------|
| Home/Workbench | pages/home/home | Dashboard |
| My Cards | pages/mycards/mycards | Card management |
| Contacts | pages/contacts/contacts | Contact list |
| Visitor | pages/visitor/visitor | Visitor records |
| Analytics | pages/analytics/analytics | Data analysis |
| Management | pages/management/management | Settings |
| Edit | pages/edit/edit | Card editor |
| Exchange | pages/exchange/exchange | Exchange flow |
| Card Detail | pages/cardDetail/cardDetail | Card preview |
| Member | pages/member/member | PRO membership |

---

## 11. Responsive Design Rules

```css
/* Base */
width: 100%;
overflow-x: hidden;
box-sizing: border-box;

/* Safe Area */
padding-bottom: calc(100rpx + env(safe-area-inset-bottom));

/* Responsive Breakpoints */
@media (max-width: 375px) {
  /* Small screens */
}
@media (min-width: 400px) {
  /* Large screens */
}
```

---

*Last Updated: 2026-03-25*
*Version: 3.0*
