# 壹席 eSeat - 设计规范 (v3.0 升级版)

> 核心理念：简约、大气、高级、动态生命力
> 设计哲学：从"静态扁平"转向"多维呼吸感"

---

## 一、色彩系统 (Fluid Design System)

### 1.1 灵动色彩 (Dynamic Palette)

| 用途 | 变量名 | 色值 | 说明 |
|------|--------|------|------|
| 主色 | Color-Primary | #2563EB | 品牌呼吸蓝，交互时产生色相偏移 |
| 深色 | Color-Deep | #121212 | 深邃中性黑（替代纯黑，+2%蓝色调） |
| 高级金 | Color-Gold | #D4AF37 | 金属质感拉丝金，PRO 勋章用 |
| 背景 | Color-BG | #F8F9FA | 页面背景 |
| 表面 | Color-Surface | rgba(255,255,255,0.85) | 磨砂玻璃效果 |

### 1.2 磨砂玻璃 2.0 (Glassmorphism 2.0)

```css
/* 卡片/表面 */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(40px);
-webkit-backdrop-filter: blur(40px);

/* 微光描边 - 模拟精密工艺品 */
border: 1px solid rgba(255, 255, 255, 0.1);
box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.1);
```

---

## 二、圆角系统 (Squircle Curves)

> 摒弃常规圆角，采用 iOS 风格的曲率连续圆角

| 名称 | 数值 | 用途 |
|------|------|------|
| XL | 32rpx | 核心名片、弹窗（包裹感） |
| L | 24rpx | 列表卡片（强调秩序） |
| M | 16rpx | 按钮、标签 |
| SM | 8rpx | 小元素 |

---

## 三、阴影系统

| 名称 | CSS | 用途 |
|------|-----|------|
| 柔和 | `0 8rpx 24rpx rgba(0,0,0,0.06)` | 卡片悬浮 |
| 强调 | `0 16rpx 48rpx rgba(47,101,238,0.3)` | 重要元素 |
| 内发光 | `inset 0 0 20px rgba(255,255,255,0.1)` | 玻璃质感 |

---

## 四、动态效果 (Motion & Layout)

### 4.1 交错位移动画 (Staggered Animation)

```css
/* 页面进入动画 */
animation: slideUp 0.4s ease-out forwards;

/* 交错延迟 - 每个元素延迟 40ms */
animation-delay: calc(var(--index) * 40ms);

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 4.2 名片 3D 视差

```css
/* 名片倾斜 */
transform: rotateX(var(--rotateX)) rotateY(var(--rotateY));
transition: transform 0.3s ease;
```

### 4.3 交换按钮悬浮重力感

```css
/* 悬浮动画 */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4rpx); }
}
animation: float 3s ease-in-out infinite;

/* 点击坍塌 + 波纹 */
@keyframes press {
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
}
```

---

## 五、字体系统 (Typography)

### 5.1 字阶系统

| 元素 | 字号 | 字重 | 字间距 |
|------|------|------|--------|
| H1 标题 | 48rpx | 600 (Semibold) | -0.02em |
| H2 页面标题 | 44rpx | 600 | -0.02em |
| H3 卡片标题 | 36rpx | 600 | -0.01em |
| Body 正文 | 28rpx | 400 (Regular) | 0.01em |
| Caption | 24rpx | 400 | 0 |
| Tag | 20rpx | 500 | 0 |

### 5.2 动态字重

```css
/* 选中状态 - 字重平滑过渡 */
transition: font-weight 0.3s ease;
font-weight: 500;  /* 默认 */
font-weight: 600;  /* 选中态 */
```

---

## 六、页面模块清单

| 序号 | 页面 | 英文 | 优先级 | 状态 |
|------|------|------|--------|------|
| 1 | TabBar | Navigation | P0 | 待优化 |
| 2 | 工作台 | Workbench | P0 | 待优化 |
| 3 | 我的名片 | My Cards | P0 | 待优化 |
| 4 | 联系人 | Contacts | P1 | 待优化 |
| 5 | 访客记录 | Visitors | P1 | 待优化 |
| 6 | 数据分析 | Analytics | P2 | 待优化 |
| 7 | 管理 | Management | P2 | 待优化 |
| 8 | 名片编辑 | Edit | P1 | 待优化 |

---

## 七、交互反馈机制

| 动作 | 反馈 | 动效 |
|------|------|------|
| 页面切换 | 交叉渐变 | 0.3s 线性 |
| 成功操作 | 绿色脉冲 | 核心图标向外扩散 |
| 列表滑动 | 阻尼反馈 | 到底部时挤压感 |
| PRO 锁定 | 晶体遮罩 | 半透明折射效果 |

---

## 八、下一步行动

按照优先级依次优化：
1. TabBar + 中间交换按钮
2. Home 工作台
3. MyCards 名片页面
4. 其他页面

---

*Version: 3.0*
*Last Updated: 2026-03-25*
