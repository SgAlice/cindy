# Cindy-personal 维护说明

本文件按所有者要求命名为 aegnt.md，不覆盖上游 AGENTS.md。维护前请同时阅读两者；这个文件名通常不会被编码工具自动发现，需要在任务中明确要求先读它。

## 1. 仓库和操作边界

- origin 是所有者的 fork：SgAlice/cindy；上游为 makecindy/cindy，配置成 upstream。
- main 的默认 push 目标为 origin；upstream 的 push URL 为 DISABLED，避免误推上游。
- 已公开的定制代码提交：65bbc3a666eb69ccdb1435d7e8dfd056379b3983。后续维护说明提交见 Git 历史。
- 只迁移源码仓库、构建产物、依赖缓存、构建工具和构建日志；没有迁移安装中的 Cindy、用户资料库、真实 Claude/Codex 配置或会话历史。
- 未获所有者新授权，不运行真实 claude/codex 命令，包括版本查询、登录状态探测、模型测试；不要读取它们的认证文件或钥匙串。已存在的对话日志只能在用户指定的范围内只读分析。
- 构建不等于安装。不要启动或替换当前 Cindy，也不要结束它的进程或创建自动重启任务。
- 不自动合入上游、不强推、不重置用户改动。新增分支、提交、push 和安装按当前任务的明确授权执行。

## 2. 本 fork 已批准的改动

1. 不向主对话注入界面语言、zh-CN 或文言风格说明。
2. 不注入查看设备名称、ID、手机来源及手机输出偏好；上下文交接摘要同样不恢复这些信息。内部设备身份与授权判据保留。
3. 删除 Cindy 自我身份及项目来源介绍；新默认伙伴不再指定 Cindy 身份，旧模板仍能被识别，不重写用户已有伙伴资料。
4. 删除 Cindy 的 Claude 订阅额度查询、读写缓存及显示/刷新入口，包括多账号池的余量查询；保留登录、正常推理和原生 token 计量。
5. Claude Code 不再注入 Cindy Memory 的规则和索引，也不挂载 cindy_memory；不删除旧记忆文件。
6. Claude Code 不再追加 Cindy 自定义提示词和 .cindy/project-knowledge 入口；不删除对应文件。
7. Claude Code 不再追加伙伴身份、能力上下文和用户资料。
8. 2026-11-08 经所有者确认，移除共享提示词中的 Cindy Skills 来源优先级、提交/PR 署名、Cindy 更新流程和应用归属规则。保留设置发现入口、cindy-ui、计划写法及内部规则呈现要求；不改原生引擎提示词、Skills/工具可用性或更新器实现。

第 5–7 项的引擎级停用针对 Claude Code，不擅自扩大到其他引擎。原生 preset: 'claude_code'、配置来源、原生记忆设置、认证、权限及实际执行目录的必要说明保留。伙伴原有权限/配置隔离也保留，不能宣传成与终端 CLI 完全一致。

尚未批准移除：cindy-ui、计划写法、设置发现入口、内部规则呈现、插件发现等规则。不要将所有 Cindy 字样一律删掉，许可证和产品/工具名称也不属于本次身份清理。

输入建议是另外的辅助模型调用，目前仍保留。桌面开关默认开启，手机调用链未接入该桌面偏好；它有独立的语言和工作目录提示。不能把主对话注入已清理解释为辅助调用也已清理。实际辅助模型须查当前设置，不要把源码默认候选链当作用户当前配置。

## 3. 本地目录

- .git/：完整保留的仓库、提交和 remotes；目前仍是浅克隆，但已能确定与上游的共同基点。
- node_modules/：构建依赖；工作区整体搬动后需按新缓存位置重新链接。
- .local-build/cache/pnpm-store/：离线 pnpm store。
- .local-build/tooling/：已验证的 Node 22.22.0、pnpm 10.33.2、CC 误调用保护和 SwiftPM 库副本。
- .local-build/validation/：独立 Vitest 3.2.4 验证工具及隔离配置。
- .local-build/logs/：依赖、类型检查、测试、UI 检查、构建和上游合并模拟的记录。
- .local-build/deliverables/：已交付 ZIP 的独立保留副本。
- apps/desktop/out/Cindy-darwin-arm64/Cindy.app：编译的应用目录。
- apps/desktop/release/artifacts/global/unversioned/darwin-arm64/：打包 ZIP 与 build-info.json。
- artifacts/ui-check/：界面检查截图和 summary。

.local-build/ 只加入本地 Git 排除，不推送 GitHub。新 clone 不会带这些大文件；需要重新准备构建环境。新的 clone 可用 git rev-parse --git-path info/exclude 定位本地排除文件并加入 /.local-build/，不要把缓存或打包产物误提交。

迁移后的离线依赖重新链接已完成，pnpm 的 storeDir 已指向本目录下的缓存。新路径下 162 项隔离测试和 10 项文档检查通过；原 ARM64 应用的 codesign 校验通过，交付 ZIP 的 SHA256 仍为 87210dd782e40fb9f256e7fb136dbd1bd3555324c833eb34796f7dae9514d898。迁移没有重新构建或启动应用。

## 4. 本次遇到的构建问题

### Node 和 pnpm

- 系统 pnpm 11 不满足本次源码要求；使用 package.json 固定的 pnpm 10.33.2。
- Node 26.8.2 能做部分构建，但 Electron 封装未产出完整目录，随后报 packaged Cindy source metadata missing。改用官方 SHA256 核验过的 Node 22.22.0 后成功，不替换系统 Node。
- 不要把子命令退出 0 当成打包完成；必须核对最终应用目录、cindy-source.json、build-info.json、架构与哈希。
- 上游更新后以新的 package.json、packageManager 和 lockfile 为准；这里是已验证组合，不是永久锁死的全局策略。

### macOS SDK 与 SwiftPM 混装

- 当前默认 macOS 27 SDK 在 Command Line Tools 下缺少 SwiftUIMacros，导致 SwiftUI 的 State 宏编译失败。只对构建命令指定现有 macOS 26.5 SDK 后，SwiftUI 辅助程序编译通过。未更改 xcode-select 或系统 SDK 链接。
- SwiftPM 的 PackageDescription 目录同时存在 Swift 6.4 的公开接口/库和 Swift 5.10 的旧 private.swiftinterface，导致 PackageDescription.Package 初始化函数链接失败。
- 修复仅在临时副本中进行：复制当前工具链的 usr/lib/swift/pm，排除旧 private.swiftinterface，通过 SWIFTPM_CUSTOM_LIBS_DIR 指向副本。本项目已保留这份副本，未删除系统文件。
- 更新 Xcode/Command Line Tools 后，先重新核对版本和编译探测；不要盲目沿用旧副本，也不要未经确认安装一整套 Xcode或删除系统工具链。

### 浅克隆与原生资源

- Git LFS 必须准备，ARM64 使用 apps/desktop/native/sqlite-vec/darwin-arm64/vec0.dylib。
- db:validate 会核对历史迁移基线。浅克隆缺少基线对象时，先按 apps/desktop/drizzle/migration-baseline.json 的 sourceCommit/runtimeSourceCommit 补 fetch。
- 本次两个字段均为 51440f675cbc8a42c582614dda6b3c34e65c298d。已补拉该对象；以后以文件中实际值为准。
- 不跳过 migration 校验，不改写历史 SQL、历史 companion 脚本或基线 hash 来“修复”构建。

### 内存、依赖迁移与验证

- Desktop 完整类型检查在 8GB 堆上限下 OOM，12GB 下通过。单独运行，不与大构建同时争抢内存。
- maker-shared 的原标准库配置有既有 findLastIndex 错误。额外以 ES2023/DOM 标准库检查通过，但这不等于原配置已通过；未修改无关配置掩盖问题。
- pnpm 的 .modules.yaml 记录了绝对 storeDir。移动项目和缓存后，运行带新 store-dir 的离线重新安装，而不是只搬文件就假定以后安装仍可用。
- 原有 162 项隔离测试、58 项相关 Renderer 测试、507 项发送/上下文重建测试、10 项文档检查通过。
- 广泛 UI 检查原为 434/456；更新额度移除所影响的旧断言与过期 fixture 后，相关账号页面 8/8、供应商账号池 2/2 复测通过并目检浅/深色。另 14 个 AuthProvider/向导选择器问题未完成归因，不计作通过、不为本任务修改无关功能。
- 没有运行真实模型测试或 packaged smoke；没有安装测试构建来覆盖正在工作的应用。

## 5. 本机已验证的构建方法

从本仓库根目录运行，所有路径都相对于当前目录；不要照抄旧任务目录或 /private/tmp 路径。下列环境只影响当前终端和它的子进程，不改全局工具设置。

    ROOT="$(pwd)"
    TOOLS="$ROOT/.local-build/tooling"
    export PATH="$TOOLS/node-v22.22.0-darwin-arm64/bin:$TOOLS/node_modules/.bin:$PATH"
    export SDKROOT=/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk
    export SWIFTPM_CUSTOM_LIBS_DIR="$TOOLS/swiftpm-libs"
    export NODE_OPTIONS="--require=\"$TOOLS/block-claude.cjs\""
    node --version
    pnpm --version

不通过 claude --version 或 codex --version 检查环境。保护脚本是额外防误用措施，不能代替对测试是否调用真实服务的审查。

正常依赖安装（已有缓存优先）：

    pnpm install --frozen-lockfile --prefer-offline --store-dir "$ROOT/.local-build/cache/pnpm-store"

迁移导致 storeDir 不一致时，可在确认源码干净、缓存齐备后离线重建依赖链接；这会重建生成的 node_modules，不删源码：

    CI=1 npm_config_nodedir="$TOOLS/node-v22.22.0-darwin-arm64" pnpm install --offline --frozen-lockfile --force --store-dir "$ROOT/.local-build/cache/pnpm-store" --child-concurrency 1

只运行已审查过的模拟测试。原有最小隔离测试入口：

    CINDY_TEST_REPO="$ROOT" node "$ROOT/.local-build/validation/node_modules/vitest/vitest.mjs" run --config "$ROOT/.local-build/validation/vitest.config.mjs"

类型检查不需要启动任何 Agent：

    node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit -p packages/maker-core/tsconfig.json
    node --max-old-space-size=12288 node_modules/typescript/bin/tsc --noEmit -p apps/desktop/tsconfig.json

只打 ARM64 个人包，保留数据校验、跳过启动应用的 smoke，不使用发布签名凭据：

    pnpm --filter desktop release:package --platform darwin --arch arm64 --region global --no-sign --skip-smoke

验证产物而不是运行它：

    lipo -archs apps/desktop/out/Cindy-darwin-arm64/Cindy.app/Contents/MacOS/Cindy
    codesign --verify --deep --strict apps/desktop/out/Cindy-darwin-arm64/Cindy.app
    shasum -a 256 apps/desktop/release/artifacts/global/unversioned/darwin-arm64/cindy-unversioned-arm64.zip

0.0.0 是不参与官方自动更新的个人包。ad-hoc 签名完整性通过不等于 Developer ID 签名或 Apple 公证。后续重新生成的 ZIP 哈希会随代码、签名与构建时间变化，必须与同次 build-info.json 对照。

## 6. 后续合并上游的可维护性

本次只做 Git 合并模拟，没有实际合并上游，也没有改写 main 的历史：

- 共同基点：92f130735160a0afbc58576bda7a89ebd86ce426。
- 定制代码：65bbc3a666eb69ccdb1435d7e8dfd056379b3983，43 个文件。
- 检查的上游：672c22bfb8（完整值可从 upstream/main 或模拟日志查询）。上游相对基点多 131 个提交、改动 479 个文件。
- 两边同改 4 个文件；3 个能自动文本合并，1 个内容冲突。
- 唯一文本冲突：apps/desktop/src/renderer/hooks/useRemoteClaudeSubscriptionUsage.ts。
- 其余重叠：apps/desktop/src/main/maker-ipc/register.ts、apps/desktop/src/main/subscription-accounts/runtime.ts、apps/desktop/src/main/usageBroadcaster.ts。

冲突原因：上游给远程 Claude 额度镜像增加 DEFAULT_ACCOUNT_USAGE_SCOPE，修复跨版本账号池读取；本 fork 已把该镜像替换成返回 null / 无操作的兼容入口。处理时应保留停用语义，不把远程额度请求接回去；若上游将来调整导出签名，要同步保留新签名以兼容调用方。不要直接恢复整份上游文件。

结论：这是可继续维护的 fork，本次冲突量小，但涉及会话/账户热点，不能承诺无冲突自动更新。函数留有兼容入口、没有改 SDK/认证和数据库迁移，降低了后续合并成本；大量删除的旧行为测试仍需逐版按新契约维护，不能把所有上游测试期望机械照搬或删掉。

每次更新先只读检查：

    git status --short
    git fetch upstream main
    git merge-base HEAD upstream/main
    git rev-list --left-right --count HEAD...upstream/main
    git merge-tree --write-tree --name-only --messages HEAD upstream/main

merge-tree 的 --write-tree 只生成 Git 对象，不改当前工作区或索引；退出 1 通常表示有冲突，不代表当前 main 已经合并。原始演练记录在 .local-build/logs/upstream-merge-preview.log。浅克隆找不到共同基点时，按需 git fetch --deepen=256 upstream main，不用 reset 强行覆盖。

只有得到更新/建分支授权后，才在独立维护分支执行实际 merge。已公开的 main 优先使用 merge 保留历史，不默认 rebase 后强推。冲突逐处解决，禁止对全仓一键选择 ours/theirs。

合并后至少复核：

- 原生 Claude preset、settingSources、认证、权限和原生记忆没有被误改。
- 所有发送、插话、重放/换窗路径仍不恢复语言/设备注入；发送者和授权来源仍保留。
- Claude 追加段仍不接收 Cindy Memory、自定义提示词和伙伴资料；项目知识入口仍跳过 Claude。
- 额度查询不因新账号池、远程镜像、后台刷新或新设置页而复活；非 Claude 供应商的额度及登录正常。
- 不删除旧记忆/伙伴资料、不变更历史 migration、不把运行成本估算或 token 计量误当作订阅剩余额度删掉。
- 跑相关模拟测试、类型检查、必要的页面检查后才再次打包；有红项如实记录。

只读核对用户已完成的真实会话时，不要仅看 Cindy 展示的消息正文。新版 CC 转录中实际请求可能分散于 api-request-shape.system、api-request.tail 引用的 api-request-blob，以及 prompt_snapshot；只看一个动态 system blob 会漏掉静态追加段。只查用户指定会话，不读取认证文件，不新发测试对话。

## 7. 提交与发布

- 源码、测试、可移植维护说明可以提交；缓存、工具二进制、产物、截图、实际日志、私聊和个人路径不提交。
- 保留现有人的 author/committer；git commit -s 添加匹配作者/提交者的 Signed-off-by，并加入 Assisted-by: Cindy (https://cindy.app)。
- 推送前核对 origin 确实是所有者的 fork，正常 push，不使用 --force 或 --force-with-lease，除非用户另行明确授权并理解影响。
- aegnt.md 只是维护说明，不授权自动修改、启动 Agent、发布或替换正在运行的应用。

## 8. 2026-11-08 提示词精简与重新打包

- 所有者明确批准移除四项：Skills 来源优先级、提交/PR 署名、Cindy 更新流程、应用归属。只删宿主模型指令，不改原生引擎配置、工具定义或更新器实现。
- Claude/Codex 共用拼接入口不再加载 Skills 优先级文件；共享 host/business 文本的删除也作用于 Pi。设置发现、回答展示、计划写法和内部规则呈现要求保留。
- 更新既有运行时配置测试和远程授权提示词契约测试，并清理评估脚本对已删除文件的引用；没有运行真实模型评估脚本。
- 14 个测试文件、168 项隔离测试通过；测试阻止原生子进程与真实网络。没有启动 Claude Code、Codex 或打包应用，没有读取真实认证文件，没有安装或替换正在运行的应用。
- 使用第 5 节的工具链与保护脚本打包 Global macOS ARM64，跳过 packaged smoke。架构、ad-hoc 签名、ZIP 与 build-info 哈希一致性通过。
- 只读扫描 app.asar 内 67 个主进程构建 JS 文件：四项被删规则的标记均不存在，回答展示、计划写法、设置发现、内部规则呈现标记仍存在。未实测模型回答质量、真实缓存命中率或手机新会话；提示词前缀变化可能导致旧缓存失效。
- 本轮没有提交或 push；产物由 ce4cdeefb3cdb123d73eef171f11218aebfc1ea4 基础上的未提交工作区构建，不能把 build-info 的基础提交号当作已包含本轮变更的提交。
- 独立交付副本：.local-build/deliverables/Cindy-arm64-custom-20261108-prompt-cleanup.zip；249411637 字节；SHA256 为 c71d017cfb5c5964412a3efe7dd007e5ea3a47947d137931a817ac4534f76fc4。
