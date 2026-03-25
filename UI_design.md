# OPC Business Card Mini-program - UI Design Document (v2.0)

> Design Philosophy: Modern Minimalism, Minimalist Fluidity, Soft Shadows
> Core Goal: Highlight "Multi-Identity Management" convenience and "Center Exchange Button" visual focus

---

## 1. Global Design System

### 1.1 Color Palette

| Category | Variable | Hex | Use Case |
|---------|----------|-----|----------|
| Primary | Color-Primary | #2563EB | Active state, main button, progress |
| Background | Color-BG | #F8F9FA | Page background |
| Surface | Color-Surface | #FFFFFF | Cards, popups |
| Text Main | Text-Main | #000000 | Title, name, body |
| Text Sub | Text-Sub | #666666 | Job title, company, info |
| Gold | Color-Gold | #FFD700 | PRO badge, star |

### 1.2 Spacing & Radius

**Corner Radius**:
- XL: 32rpx (Card, popup)
- L: 24rpx (List items, grid)
- M: 16rpx (Button, tag)

**Shadow**:
- Soft: `0 8rpx 24rpx rgba(0,0,0,0.06)`
- Float: `0 16rpx 48rpx rgba(47,101,238,0.3)`

---

## 2. Tab Structure (4 Tabs)

| Tab | Page | Label |
|-----|------|-------|
| 1 | pages/mycards/mycards | My Cards |
| 2 | pages/contacts/contacts | Contacts |
| 3 | pages/home/home | Workbench |
| 4 | pages/management/management | Manage |

---

## 3. Workbench Page Design Prompts

### Prompt 1: Workbench Top Section
```
UI design of a mobile Mini-program "Workbench" page, white background, modern minimalism style.
Top Section: A floating premium business card preview with rounded corners (32rpx), light blue gradient background, displaying name "Independent Chen", title "Founder", and a square rounded avatar on the right.
Middle Section: A 2x2 grid layout of shortcut icons. Icons are clean and colorful, labeled "My Cards", "Visitor Records", "Exchange History", and "Data Analytics".
Visual Style: Soft shadows (0 8rpx 24rpx rgba(0,0,0,0.06)), Helvetica font, plenty of white space.
TabBar: Bottom navigation bar with 5 slots: 4 text-based tabs and a prominent, elevated circular blue button in the center for "Exchange".
High-fidelity, 8k resolution, UX/UI, clean interface --ar 9:16
```

### Prompt 2: Workbench Bottom Section (Scrolled)
```
UI design of the scrolled-down part of a mobile Mini-program "Workbench" page.
AI Section: A full-width card with a subtle blue glow effect labeled "AI Assistant", featuring "One-click Card Generation" and "Smart Tag Recommendation".
Visitor List: A vertical list titled "Recent Visitors". Each row shows a rounded avatar, name, active time (e.g., "2 mins ago"), and a small source icon (e.g., QR code icon).
Member Section: A "PRO Member" banner with gold accents and a shield icon, saying "Upgrade to view all visitor details".
Visual Style: Glassmorphism elements, Radius-L (24rpx) for cards, light gray background (#F8F9FA).
Bottom: The same sticky TabBar with the central blue circular button.
High-fidelity, mobile app UI, professional dashboard --ar 9:16
```

---

## 4. My Cards Page Design

### Layout
- Vertical scroll card flow
- Each card is independent rounded rectangle
- 3 example cards:
  - Tech: Blue gradient, "Chen Xiao Duli", "Full-stack Developer", "CODEFLOW AI STUDIO"
  - Biz: Dark gray-blue, "Independent Chen", "Founder & CEO"
  - Social: Green gradient

### Card Features
- Default badge (top right)
- Avatar (right side)
- Action buttons: Set Default, Edit, Share, Delete
- Add button: Blue circle "+" (bottom right)

---

## 5. Contacts Page Design

### Layout
- Search bar
- Tag filters (Pills): All, AI, B2B, Oversea, Flutter
- Recent Exchange section
- All Contacts list

### Contact Card
- Avatar (left)
- Name + Time (top)
- Job title + Company
- Tags
- Actions: Chat, Call

---

## 6. Management Page Design

### Layout
- Profile card (avatar, name, phone)
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

## 7. Other Pages

- Visitor Page (from Workbench)
- Analytics Page (from Workbench)
- Member Page (from Workbench)
- AI Features Page (from Workbench)
- Card Detail Page (from My Cards)
- QR Code Page
- Exchange Page

---

*Last Updated: 2026-03-25*
*Version: v2.0*
