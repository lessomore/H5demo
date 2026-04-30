# H5 Substation Game

变电站安全巡检 H5 闯关互动项目。项目基于 Vue 3、TypeScript、Vite 构建，面向移动端浏览器和大屏触控场景，采用横向/纵向自适应布局、图片资源驱动的关卡交互和 Hash 路由部署方式。

## 项目简介

项目包含首页和三个闯关模块：

- 第一关：日常巡检。拖动红外测温仪扫描设备区域，定位设备隐患后拍照上传。
- 第二关：设备认知拼图。将设备切片拖拽到正确区域，完成标准设备图像复原。
- 第三关：倒闸操作。先选择倒闸操作所需工具，再按步骤完成工作票、绝缘手套、验电笔、接地线等操作。

主要特性：

- 移动端优先的 H5 交互体验。
- 支持触摸和鼠标拖拽。
- 使用 `vue-router` Hash 模式，部署到任意静态目录时不依赖服务端路由重写。
- 提供普通构建和离线构建两种产物。

## 技术栈

- Vue 3
- TypeScript
- Vite 6
- Vue Router 4
- Sass
- GSAP / Swiper / html2canvas

## 目录结构

```text
src/
  assets/              静态图片资源
    all/               通用结果页资源
    index/             首页资源
    level1/            第一关资源
    level2/            第二关资源
    level3/            第三关资源
  components/          通用组件
  composables/         通用交互逻辑
  router/              路由配置
  styles/              全局样式与变量
  views/               页面与关卡
    HomePage.vue
    Level1/
    Level2/
    Level3/
```

## 环境要求

建议使用：

- Node.js 18+ 或 20+
- npm 9+

首次拉取项目后安装依赖：

```bash
npm install
```

## 本地开发

启动开发服务：

```bash
npm run dev
```

默认服务地址：

```text
http://localhost:3000/
```

局域网设备访问时，使用当前电脑 IP：

```text
http://<本机IP>:3000/
```

## 构建

普通生产构建：

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

本地预览生产产物：

```bash
npm run preview
```

## 部署说明

### 静态服务器部署

执行普通构建后，将 `dist/` 目录整体上传到静态服务器即可，例如 Nginx、Apache、对象存储静态网站、CDN 等。

因为项目使用 Hash 路由，访问路径形如：

```text
/#/level1
/#/level2
/#/level3
```

通常不需要额外配置服务端路由 fallback。

Nginx 示例：

```nginx
server {
  listen 80;
  server_name example.com;

  root /var/www/h5-substation-game/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 子目录部署

项目 `vite.config.ts` 中已配置：

```ts
base: './'
```

因此可以部署到域名根目录，也可以部署到子目录，例如：

```text
https://example.com/h5-game/
```

部署到子目录时，把 `dist/` 内的文件上传到对应目录即可。

### 离线包部署

如果需要生成更适合本地打开或弱服务环境使用的离线产物，执行：

```bash
npm run build:offline
```

离线构建产物输出到：

```text
dist-offline/
```

离线构建会使用 Vite 的 `offline` 模式，处理 HTML 中的模块脚本引用，并以内联动态导入方式输出脚本，便于在更简单的静态环境中运行。

推荐仍通过静态服务打开 `dist-offline/index.html`，例如使用 Nginx、IIS 或任意静态文件服务。部分浏览器直接双击打开本地 HTML 时，可能受安全策略影响导致资源加载异常。

## 常用命令

```bash
npm run dev            # 启动开发服务
npm run build          # 类型检查并构建 dist
npm run build:offline  # 类型检查并构建 dist-offline
npm run preview        # 预览生产构建
npx vue-tsc --noEmit   # 仅执行类型检查
```

## 交付检查

部署前建议确认：

- `npm install` 已完成，依赖版本与 `package-lock.json` 一致。
- `npm run build` 或 `npm run build:offline` 执行成功。
- 首页、三关入口、拖拽操作、成功弹窗均可正常访问。
- 移动端浏览器或目标触控设备上验证触摸拖拽体验。

## 免责声明

本项目仅供学习和交流使用，请勿用于商业用途。