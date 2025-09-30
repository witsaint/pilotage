# CI/CD 工作流文档

本项目使用 GitHub Actions 实现完整的 CI/CD 流程，包括代码检查、测试、构建、安全扫描和自动发布。

## 🚀 工作流概览

### 1. CI 工作流 (`ci.yml`)
**触发条件**: Push 到 main/master/develop 分支，PR 创建/更新
**功能**:
- 代码 Lint 检查
- TypeScript 类型检查
- 多平台多版本测试 (Ubuntu/Windows/macOS + Node.js 18/20/22)
- 项目构建
- 安全审计
- 代码覆盖率上传

### 2. Release 工作流 (`release.yml`)
**触发条件**: Push 标签 (v*) 或手动触发
**功能**:
- 自动版本升级
- 创建 GitHub Release
- 发布到 NPM

- 上传发布资产

### 3. PR 检查工作流 (`pr-check.yml`)
**触发条件**: PR 创建/更新/标记为 ready for review
**功能**:
- PR 大小分析和评论
- 仅检查变更文件的 Lint
- 测试覆盖率报告
- 依赖安全审查
- 构建验证
- 自动标签分配

### 4. CodeQL 安全分析 (`codeql.yml`)
**触发条件**: Push/PR + 每周一定时运行
**功能**:
- 静态代码安全分析
- 漏洞检测
- 安全报告生成

### 5. 依赖更新工作流 (`dependency-update.yml`)
**触发条件**: 每周一 09:00 UTC 或手动触发
**功能**:
- 自动更新依赖
- 创建更新 PR
- 安全审计
- 发现漏洞时自动创建 Issue

### 6. 标签同步工作流 (`label-sync.yml`)
**触发条件**: 标签配置文件变更或手动触发
**功能**:
- 自动同步仓库标签
- 创建和更新标签

## 🔧 必需的 Secrets 配置

在 GitHub 仓库设置中添加以下 Secrets：

### NPM 发布 (可选)
```
NPM_TOKEN=your_npm_token
```

### 代码覆盖率 (可选)
```
CODECOV_TOKEN=your_codecov_token
```

### 安全扫描 (可选)
```
SNYK_TOKEN=your_snyk_token
```

## 📋 使用指南

### 开发流程
1. **创建功能分支**: `git checkout -b feature/your-feature`
2. **开发代码**: 编写代码并确保通过 lint 和测试
3. **提交代码**: `git commit -m "feat: add new feature"`
4. **推送分支**: `git push origin feature/your-feature`
5. **创建 PR**: 在 GitHub 上创建 Pull Request
6. **代码审查**: 等待 CI 检查通过和代码审查
7. **合并代码**: 合并到主分支

### 发布流程

#### 自动发布 (推荐)
1. **手动触发发布工作流**:
   - 进入 GitHub Actions 页面
   - 选择 "Release" 工作流
   - 点击 "Run workflow"
   - 选择版本类型 (patch/minor/major)

#### 标签发布
1. **创建版本标签**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

### 本地开发命令
```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 运行测试
pnpm test

# 构建项目
pnpm build
```

## 🏷️ 标签系统

项目使用自动标签系统来组织 Issues 和 PR：

- **类型标签**: `bug`, `enhancement`, `documentation`
- **大小标签**: `size/xs`, `size/s`, `size/m`, `size/l`, `size/xl`
- **技术标签**: `typescript`, `tests`, `ci/cd`
- **状态标签**: `needs-triage`, `high-priority`, `automated`

## 🔒 安全最佳实践

1. **定期依赖更新**: 每周自动更新依赖
2. **安全扫描**: CodeQL + Snyk 双重扫描
3. **依赖审查**: PR 中自动审查新增依赖
4. **容器安全**: 使用非 root 用户运行容器
5. **最小权限**: 工作流仅获取必需权限

## 📊 监控和报告

- **构建状态**: GitHub Actions 页面
- **代码覆盖率**: Codecov 集成
- **安全报告**: GitHub Security 页面
- **依赖漏洞**: Dependabot 和 Snyk 报告

## 🛠️ 自定义配置

### 修改 Node.js 版本
编辑 `.nvmrc` 文件：
```
20
```

### 调整测试矩阵
编辑 `.github/workflows/ci.yml` 中的 matrix 配置：
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [18, 20, 22]
```

### 更新依赖配置
编辑 `.github/dependabot.yml` 文件来调整更新频率和范围。

## 🚀 下一步

1. 配置必要的 Secrets
2. 测试 CI/CD 流程
3. 根据项目需求调整工作流
4. 设置 branch protection rules
5. 配置 code owners

---

有任何问题，请在 Issues 中提出或查看项目文档。
