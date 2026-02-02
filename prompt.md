#### 1）先把“组件交互”拆成三层：触发 → 编排 → 作用到目标
在可拖拽低代码里，交互如果直接做成“组件A改组件B的某个属性”，很快会失控（耦合、不可复用、难排查）。更稳的做法是：
- 触发（Trigger）：谁在什么时机触发了什么事件（`onClick` / `onChange` / `onVisible` / `onMount`…）
- 编排（Workflow / Action Flow）：触发后要执行的一串动作（请求、写状态、条件判断、并发/串行、错误处理…）
- 作用（Binding / Reaction）：哪些组件属性从“状态/数据”推导（比如 `visible`、`disabled`、`text`、`dataSource`）
核心思想：组件不直接互相调用；组件只发事件 & 读状态。
交互的“联动”本质是：某个事件改变了状态（或数据），其他组件的属性绑定到这个状态而自动变化。
#### 2）关键数据模型：Event / Action / Store / Binding
##### 2.1 事件（Event）
事件建议统一成一个规范结构，便于埋点、回放、调试：
  .tik_search-typography pre code {
    border: none;
    border-radius: initial;
    color: initial;
    background-color: transparent;
    padding: initial;
  }
  pre {
    font-size: 13px;
    background: none;
  }
  pre code {
    font-size: 13px;
    background: none !important;
    border: none;
  }
  code:not(pre code) {
    border: none !important;
    background: var(--semi-color-black-bg-highlight) !important;
    border-radius: 4px;
  }
type LowcodeEvent = {
  type: string;              // e.g. "button.submit.click"
  sourceId: string;          // 组件实例ID
  payload?: any;             // 事件参数（表单值、行数据等）
  context: {
    pageId: string;
    user?: any;
    traceId: string;
    time: number;
  };
};
##### 2.2 动作（Action）
动作是“低代码可配置”的最小执行单元，常见类型：
| 类型 | 示例 | 说明 |
| --- | --- | --- |
| request | 调接口取数据 | 支持映射入参、取响应字段、错误分支 |
| setState | 写全局/页面状态 | 用于驱动显示隐藏、文案、禁用等 |
| toggleVisible | 显示隐藏 | 本质可降级为 setState |
| navigate | 跳转/打开弹窗 | 带参数、回传 |
| emit | 再发事件 | 用于解耦跨区域联动 |
| condition / switch | 条件判断 | 基于表达式 |
| parallel / sequence | 并发/串行 | 支持依赖 |
| toast / modal | 提示确认 | 配合风控 |
##### 2.3 状态（Store）
建议至少分 3 类命名空间，避免“一个大 JSON”：
- `pageState`：页面级 UI 状态（`filters`、`activeTab`、`panelVisible`…）
- `dataState`：请求结果与缓存（`userList`、`detail`、`loading/error`…）
- `uiState`：通用 UI 状态（`globalLoading`、`dialog.open`…）
> 经验：“显示隐藏/禁用/文案/选中态”全部走 store，组件只绑定。
##### 2.4 绑定（Binding）
组件属性支持从 store/表达式派生：
- 静态：`visible: true`
- 引用：`visible: {{pageState.panelVisible}}`
- 表达式：`visible: {{dataState.userList.total > 0 && !dataState.userList.loading}}`
#### 3）推荐的交互引擎：事件总线 + 动作编排器 + 状态机/Store
##### 3.1 运行时链路（点击 Button → 请求数据 → 联动其他模块）
1. `Button.onClick` 发出事件 `button.search.click`
2. 编排器匹配到该事件的 workflow（可视化配置的“交互流”）
3. 执行动作：
  - `setState(loading=true)`
  - `request(GET /list, params=...)`
  - `setState(data=resp, loading=false)`
  - （可选）根据结果 `setState(panelVisible=true/false)`
4. 其他组件（列表、面板、空态、loading）因属性绑定到 store 自动更新
这样联动就不需要“点名控制某个组件”，而是改状态 → 自动反应。
#### 4）一个可落地的 DSL 示例（事件 → 动作流 → 绑定）
##### 4.1 事件到动作流（Workflow）
  .tik_search-typography pre code {
    border: none;
    border-radius: initial;
    color: initial;
    background-color: transparent;
    padding: initial;
  }
  pre {
    font-size: 13px;
    background: none;
  }
  pre code {
    font-size: 13px;
    background: none !important;
    border: none;
  }
  code:not(pre code) {
    border: none !important;
    background: var(--semi-color-black-bg-highlight) !important;
    border-radius: 4px;
  }
{
  "workflows": [
    {
      "id": "wf_search",
      "trigger": { "type": "button.search.click", "sourceId": "btn_search" },
      "actions": [
        { "type": "setState", "path": "dataState.userList.loading", "value": true },
        {
          "type": "request",
          "id": "req_user_list",
          "method": "GET",
          "url": "/api/users",
          "params": {
            "keyword": "{{pageState.filters.keyword}}",
            "deptId": "{{pageState.filters.deptId}}"
          },
          "onSuccess": [
            { "type": "setState", "path": "dataState.userList.data", "value": "{{response.data}}" },
            { "type": "setState", "path": "dataState.userList.total", "value": "{{response.total}}" },
            { "type": "setState", "path": "pageState.panelVisible", "value": "{{response.total > 0}}" }
          ],
          "onError": [
            { "type": "toast", "level": "error", "message": "{{error.message}}" }
          ],
          "finally": [
            { "type": "setState", "path": "dataState.userList.loading", "value": false }
          ]
        }
      ]
    }
  ]
}
##### 4.2 组件属性绑定（联动显示隐藏）
  .tik_search-typography pre code {
    border: none;
    border-radius: initial;
    color: initial;
    background-color: transparent;
    padding: initial;
  }
  pre {
    font-size: 13px;
    background: none;
  }
  pre code {
    font-size: 13px;
    background: none !important;
    border: none;
  }
  code:not(pre code) {
    border: none !important;
    background: var(--semi-color-black-bg-highlight) !important;
    border-radius: 4px;
  }
{
  "components": [
    {
      "id": "panel_result",
      "type": "Panel",
      "props": {
        "visible": "{{pageState.panelVisible}}",
        "title": "查询结果"
      }
    },
    {
      "id": "table_users",
      "type": "Table",
      "props": {
        "dataSource": "{{dataState.userList.data}}",
        "loading": "{{dataState.userList.loading}}"
      }
    },
    {
      "id": "empty_state",
      "type": "Empty",
      "props": {
        "visible": "{{!dataState.userList.loading && (dataState.userList.total === 0)}}"
      }
    }
  ]
}
#### 5）编辑器侧怎么做“可配置但不崩”
##### 5.1 交互配置面板建议长这样（面向运营/产品）
- 触发器：选择组件事件（下拉）
- 动作列表（可拖拽排序）：请求 / 写状态 / 条件 / 并发 / 弹窗 / 跳转
- 变量选择器：从 `组件输出`、`页面状态`、`请求响应`、`上下文`中点选插入
- 调试：单步执行、查看每步输入输出、查看 store diff、查看网络请求
##### 5.2 “联动其他模块显示隐藏”的推荐方式
不要让用户选择“目标组件ID → setVisible”，而是引导：
- 先定义一个状态：`pageState.xxxVisible`
- 面板/模块 `visible` 绑定该状态
- 交互流里 `setState(pageState.xxxVisible = 条件)`
好处：复用、可回溯、避免循环依赖。
#### 6）工程化细节（决定你平台后期稳不稳）
##### 6.1 异步与并发
- 支持 `sequence/parallel`
- 支持取消：同一请求 key 的重复触发做 `abort` 或 “只保留最后一次”（takeLatest）
- 统一 `loading/error` 写法（最好框架自动生成字段）
##### 6.2 作用域与隔离
- 页面级 store 与组件局部 state 分离
- 弹窗/子页面有独立 scope（避免关闭弹窗后状态污染）
##### 6.3 安全与可控（尤其是“表达式/脚本”）
- 表达式使用白名单语法（禁止任意 JS 执行），或沙箱 + 超时
- Request 动作做域名白名单、鉴权透传策略、敏感参数脱敏
- 全链路审计：谁改了哪个 workflow、何时发布、影响哪些页面
#### 7）你可以用一句话选路线
你希望交互能力做到哪一级？我按级别给你更具体的落地方案（含 UI、DSL、运行时实现建议）：
- L1（最稳）：事件 → 动作（request/setState）+ 属性绑定（表达式）
- L2（更强）：加条件/并发/错误分支/变量作用域
- L3（最灵活）：受限脚本/自定义动作插件（需要更强治理）
你现在的平台更偏 表单+列表、还是 活动搭建（多模块/强联动）？我可以按场景给一套“标准交互模板库”（搜索、联动筛选、级联、弹窗详情、表格行操作等）。
