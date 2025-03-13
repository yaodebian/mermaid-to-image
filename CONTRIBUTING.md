# 贡献指南

感谢您考虑为Mermaid图表提取器项目做出贡献！这份文档提供了参与项目开发所需遵循的流程和最佳实践。

## 🔄 贡献流程

### 提交问题或建议

1. 在提交新问题前，请先搜索现有issues，确保不会重复
2. 使用提供的issue模板，填写所有必要信息
3. 问题报告应包含：
   - 明确的问题描述
   - 重现步骤
   - 预期行为与实际行为
   - 浏览器版本和操作系统信息
   - 相关的截图或录屏(如适用)

### 代码贡献

1. Fork项目仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到远程分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📋 开发规范

### 代码风格

- 遵循TypeScript和React的最佳实践
- 使用ESLint和Prettier保持代码风格一致
- 组件使用函数式组件和React Hooks
- 保持代码简洁，遵循DRY(Don't Repeat Yourself)原则
- 变量和函数名采用驼峰命名法(camelCase)
- 组件名采用大驼峰命名法(PascalCase)

### Git提交规范

提交信息应遵循以下格式：
```
<类型>(<范围>): <描述>

[可选的详细描述]

[可选的脚注]
```

类型包括：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整(不影响代码逻辑)
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 添加或修改测试
- `chore`: 构建过程或辅助工具的变动

### 分支策略

- `main`: 稳定分支，保持随时可发布状态
- `develop`: 开发分支，最新的开发状态
- `feature/*`: 新功能开发
- `bugfix/*`: 修复bug
- `release/*`: 版本发布准备

## 🛠️ 开发设置

### 环境准备

- 确保已安装Node.js (v16+)和npm
- 设置Chrome开发者模式以加载未打包的扩展

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务
npm run dev

# 构建扩展
npm run build

# 运行测试
npm test
```

### 测试

- 所有新功能应包含相应的测试
- 修复bug时应添加测试确保问题不再复现
- 运行`npm test`确保所有测试通过

## 📝 文档贡献

- 使用清晰简洁的语言
- 为复杂功能提供示例
- 更新相关的README.md部分
- 根据需要创建或更新用户指南

## 👥 审核流程

1. 所有Pull Request需要至少一名维护者审核
2. 代码应通过所有自动化测试
3. 审核者可能会要求修改，请耐心响应并进行必要的调整
4. 合并后，您的贡献将包含在下一个版本中

## 📅 版本发布

- 我们使用[语义化版本](https://semver.org/)
- 主要版本(MAJOR): 不兼容的API变更
- 次要版本(MINOR): 向后兼容的功能性新增
- 修订版本(PATCH): 向后兼容的问题修正

## 🙏 行为准则

作为贡献者，您应当遵循以下准则：

- 使用友好、包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注项目的最佳利益
- 对其他社区成员表示同理心

## 📞 联系方式

如果您有任何问题或需要帮助，请通过以下方式联系我们：

- 项目Issues: [GitHub Issues](https://github.com/yaodebian/mermaid-to-image/issues)
- 邮件: yaodebian@gmail.com

感谢您为Mermaid图表提取器做出的贡献！ 