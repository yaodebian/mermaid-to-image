# Mermaid图表提取器

<div align="center">
  <img src="icons/icon128.png" alt="Mermaid图表提取器" width="128"/>
  <br/>
  <p>一款强大的Chrome扩展，用于提取网页中的Mermaid图表文本和转换Mermaid为图片</p>
</div>

## 📝 功能介绍

Mermaid图表提取器是一款Chrome浏览器扩展，专为需要获取Mermaid图表源代码或将Mermaid文本转换为图片的用户设计。无论您是开发人员、技术文档编写者、学生还是教师，这款工具都能帮助您轻松获取和使用Mermaid图表。

### 核心功能

- **图表文本提取**：通过侧边栏一键提取网页中Mermaid图表的源代码
- **实时预览**：在侧边栏中直接预览检测到的图表
- **Mermaid转图片**：在独立页面中将Mermaid文本转换为多种图片格式
- **多尺寸支持**：自定义导出图片的尺寸倍数（1x/2x/3x）
- **图表模板**：提供常用图表类型的快速模板

## 🚀 快速开始

### 安装方法

1. 在Chrome商店搜索"Mermaid图表提取器"，或直接[点击此链接](https://chrome.google.com/webstore/detail/mermaid-chart-extractor/plugin-id)
2. 点击"添加到Chrome"按钮
3. 安装完成后，您将看到浏览器工具栏上出现扩展图标

### 使用指南

#### 提取Mermaid文本
1. 浏览包含Mermaid图表的网页
2. 点击工具栏中的扩展图标
3. 在弹出菜单中选择"打开侧边栏"
4. 侧边栏将显示当前页面上所有检测到的Mermaid图表
5. 点击任意图表项旁的"复制"按钮即可复制源代码到剪贴板
6. 若页面没有Mermaid图表，侧边栏会显示相应提示

#### Mermaid转图片
1. 点击侧边栏底部的"打开Mermaid转图片工具"按钮
2. 在新打开的页面中，左侧编辑框输入或粘贴Mermaid代码
3. 右侧会实时显示渲染的图表
4. 选择所需的图片格式（SVG/PNG/JPEG）和尺寸倍数
5. 点击"导出图片"按钮下载图片文件
6. 您也可以使用预设模板快速创建不同类型的图表

## 💻 主要界面

### 侧边栏（提取功能）

<div align="center">
  <img src="docs/images/sidebar-preview.png" alt="侧边栏界面" width="300"/>
</div>

- 显示当前页面所有检测到的Mermaid图表
- 每个图表项包含小型预览图和复制按钮
- 底部显示统计信息和转图片工具入口
- 当页面无图表时提供友好提示

### 转图片页面

<div align="center">
  <img src="docs/images/converter-preview.png" alt="转图片界面" width="600"/>
</div>

- 左右分栏布局，编辑与预览并存
- 左侧提供代码编辑区和图表模板
- 右侧实时预览渲染效果
- 顶部工具栏提供格式选择和导出选项
- 支持多种图表类型和尺寸设置

## 📊 使用场景

- **学习参考**：提取网页上他人创建的优质Mermaid图表源码，学习其实现方式
- **文档移植**：将Mermaid图表转换为图片，用于不支持Mermaid语法的平台
- **教学素材**：创建和导出各种图表作为教学或演示材料
- **快速制图**：使用预设模板快速创建常用类型的图表

## 🙋 常见问题

<details>
<summary>在某些网站上无法检测到图表？</summary>
部分网站使用非标准方式渲染Mermaid图表，可能导致检测失败。您可以尝试右键点击图表区域，选择"检查元素"，然后手动查找图表源码。
</details>

<details>
<summary>如何调整导出图片的尺寸？</summary>
在转图片页面的工具栏中，您可以选择不同的尺寸倍数（1x/2x/3x）。1x为原始大小，2x和3x则按比例放大，适合需要高分辨率图像的场景。
</details>

<details>
<summary>支持哪些Mermaid图表类型？</summary>
本扩展支持所有Mermaid语法支持的图表类型，包括流程图、时序图、甘特图、类图、状态图等。在转图片页面中提供了常用类型的模板供您选择。
</details>

## 💻 开发者信息

### 本地开发环境

要在本地开发此扩展，请按照以下步骤操作：

```bash
# 克隆仓库
git clone https://github.com/username/mermaid-to-image.git
cd mermaid-to-image

# 安装依赖
npm install

# 启动开发服务
npm run dev

# 构建生产版本
npm run build
```

### 在Chrome中加载开发版本

1. 打开Chrome，进入`chrome://extensions/`
2. 打开"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目的`dist`目录

### 项目结构

```
mermaid-to-image/
├── docs/                # 项目文档
├── src/                 # 源代码
│   ├── components/      # React组件
│   ├── sidebar/         # 侧边栏相关代码
│   ├── converter/       # 转图片页面代码
│   ├── renderer/        # Mermaid渲染器
│   ├── content/         # 内容脚本
│   ├── background/      # 后台脚本
│   └── utils/           # 工具函数
├── icons/               # 扩展图标
├── webpack.config.js    # Webpack配置
└── package.json         # 依赖与脚本
```

### 技术栈

- **核心**: TypeScript + React
- **渲染**: Mermaid.js
- **构建**: Webpack
- **样式**: TailwindCSS

## 📜 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## ✨ 致谢

- [Mermaid.js](https://mermaid-js.github.io/mermaid/) - 提供图表渲染核心功能
- 所有项目贡献者和测试用户

---

<div align="center">
  <p>如果您喜欢这个扩展，请给项目一个⭐️星标！</p>
  <p>有问题或建议？请<a href="https://github.com/username/mermaid-to-image/issues">提交Issue</a></p>
</div> 