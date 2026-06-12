# 前端（saiadmin-artd）— AI 编码代理指南

SaiAdmin 6.x 前端，基于 **Art Design Pro** 二次开发。技术栈：Vue 3 + TypeScript + Vite 7 + Element Plus + Pinia + vue-router + vue-i18n + Tailwind 4。要求 Node ≥ 20.19、pnpm ≥ 8.8（**用 pnpm，勿用 npm/yarn**）。

## 常用命令

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | **先 `vue-tsc --noEmit` 类型检查**再 `vite build`，类型错误会中断构建 |
| `pnpm fix` | ESLint 自动修复 |
| `pnpm lint:stylelint` | 样式检查修复 |
| `pnpm commit` | cz-git 交互式提交 |

开发环境 `VITE_API_URL=/api`，由 Vite 代理转发到 `VITE_API_PROXY_URL`（默认远端，见 [.env.development](.env.development)）。要连本地后端就改 `VITE_API_PROXY_URL`。

## 路径别名（见 [vite.config.ts](vite.config.ts)）

`@`→`src/`，`@views`、`@imgs`→`src/assets/images`、`@icons`、`@utils`、`@stores`→`src/store`、`@styles`。优先用别名而非相对路径。

## 自动导入（重要，避免重复 import）

通过 unplugin-auto-import / unplugin-vue-components，以下**无需手动 import**：

- Vue / vue-router / pinia / `@vueuse/core` 的 API（`ref`、`computed`、`watch`、`onMounted`、`useRouter`、`useRoute`、`defineStore` 等）
- Element Plus 组件与 `ElMessage`/`ElMessageBox`/`ElNotification`
- Art Design 组件（`ArtTable`、`ArtTableHeader` 等）与 `src/components/sai/` 下的 `sa-*` 组件

声明文件 [src/auto-imports.d.ts](src/auto-imports.d.ts)、[src/components.d.ts](src/components.d.ts) 自动生成，**勿手改**。

## API 层约定

每个模块在 `src/api/` 下默认导出一个对象，方法调用封装好的 `request`。范例 [src/api/system/user.ts](src/api/system/user.ts)：

```ts
import request from '@/utils/http'
export default {
  list(params) { return request.get<Api.Common.ApiPage>({ url: '/core/user/index', params }) },
  save(data)   { return request.post({ url: '/core/user/save', data }) },
  update(data) { return request.put({ url: '/core/user/update', data }) },
  delete(data) { return request.del({ url: '/core/user/destroy', data }) }
}
```

请求封装在 [src/utils/http/index.ts](src/utils/http/index.ts)：自动注入 `Bearer` token、响应拦截以 `code===200` 为成功（[status.ts](src/utils/http/status.ts)）、`401` 自动登出。

## 业务页面（CRUD）标准结构

目录约定见 [SAIADMIN.md](SAIADMIN.md)。完整范例：用户管理 [src/views/system/user/](src/views/system/user/)

```
views/<module>/<table>/
├── index.vue                  # 列表页：useTable + ArtTable + 部门树等
└── modules/
    ├── table-search.vue       # 搜索表单（sa-search-bar）
    └── edit-dialog.vue        # 新增/编辑弹窗（el-form + 校验）
```

新建 CRUD 页面时复用两个核心能力，**勿自行实现分页/弹窗/删除逻辑**：

- [src/hooks/core/useTable.ts](src/hooks/core/useTable.ts)：数据加载、分页、搜索、列显隐、刷新策略
- [src/composables/useSaiAdmin.ts](src/composables/useSaiAdmin.ts)：`showDialog`/`deleteRow`/`deleteSelectedRows` 等弹窗与删除逻辑

参考列表页 [index.vue](src/views/system/user/index.vue)、搜索 [table-search.vue](src/views/system/user/modules/table-search.vue)、弹窗 [edit-dialog.vue](src/views/system/user/modules/edit-dialog.vue)。

## 组件 / 路由 / 状态

- **业务组件**优先用 [src/components/sai/](src/components/sai/) 下的 `sa-*`（`sa-select` 接字典、`sa-image-picker`、`sa-search-bar`、`sa-button`、`sa-import`/`sa-export` 等）。
- **权限**用指令 `v-permission="'core:user:save'"`。
- **路由**：静态路由 [src/router/routes/staticRoutes.ts](src/router/routes/staticRoutes.ts)，业务菜单由后端动态下发并在守卫 [src/router/guards/beforeEach.ts](src/router/guards/beforeEach.ts) 中注册。
- **状态**：Pinia 模块在 [src/store/modules/](src/store/modules/)（`user`/`menu`/`dict`/`setting`/`table`/`worktab`），均持久化。

## 代码风格

ESLint（[eslint.config.mjs](eslint.config.mjs)）+ Prettier + Stylelint；husky pre-commit 跑 lint-staged。提交类型见 [commitlint.config.cjs](commitlint.config.cjs)。

## 支付模块权限（Phase 9.1 / 9.5）

| 场景 | 权限码 | 菜单 ID（种子） |
|------|--------|----------------|
| 商户「代收/代付通道配置」抽屉 | `pay:merchant:channel` | 9017（代收与代付入口共用） |
| 代收通道管理 CRUD + 授权商户（代收） | `pay:channel:*` / `pay:channel:auth` | 9020~9026 |
| 代付通道管理 CRUD + 授权商户（代付） | `pay:transferChannel:*` / `pay:transferChannel:auth` | 9027~9033 |

`v-permission` 须与后端 `#[Permission]` slug 一致。菜单全量种子见 [server/plugin/paymentchannel/db/menu.sql](../server/plugin/paymentchannel/db/menu.sql)（导入后角色可独立分配代收/代付运营权限）。

## 注释与变更清单

- 函数与复杂逻辑写 JSDoc + 行内中文注释，解释意图而非复述代码。
- 每轮改动后列出变更清单供我审查，代码经我确认再提交。通用执行边界与清单规范见根 [../AGENTS.md](../AGENTS.md)。
