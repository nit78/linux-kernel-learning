# EXTRA_LESSONS.md — 额外课触发规范（额外补充老师）

> 这个文件是给**主教师**（未来任何一次教学会话）的指令清单。
> 当主课程推进到某个章节时，若本文件登记了对应的"触发器"，主教师应**额外生成一章补充课**，
> 把用户引入的高质量书外视角（量产 / 工程 / 厂商实战）补进课程树。
>
> 这些额外课**不替代主教材课**，而是作为主课的**卫星课**紧跟其后，
> 覆盖主教材不讲、但对 BSP / 内核工程师属于"入场券"的内容。
> 额外课编号紧随对应主课之后顺延，与主课形成一对（参考第 7/8 课"同步基础 + RCU"的拆分关系）。

---

## 机制（所有触发器通用）

每个触发器包含五块：
1. **触发条件** —— 主课程推进到哪一节时激活。
2. **来源** —— 用户引入这份视角的出处（笔记 / 链接 / 口述），可回溯。
3. **与主教材的关系** —— 互补点：主教材讲了什么、额外课讲什么、二者如何咬合（绝不重复）。
4. **生成蓝图** —— 标题、编号占位、章节号 chip、学习目标、内容结构（按维度 / 按主题）、MCU↔内核 对照、WSL2 实验可行性标注、待入术语、quiz 方向、推荐精读源、nav 链接策略。
5. **生成时的全量 checklist** —— 直接套用 [`NOTES.md`](./NOTES.md) 的 LR-0009 checklist（页眉 chip / 开头预告 / 结尾 callout / 问题列表 / footer / nav / 下游相邻课 / CURRICULUM_MAP / glossary / 自动校验）。

额外课必须遵守工作区既有约定：
- 复用 `../assets/style.css`、`../assets/quiz.js`、`../assets/notes.js`。
- quiz 答案选项**等长**，不漏线索。
- 页眉 chip 标"额外课"+ 所补主课章节号 + 三级子节（书外的，标"书外·量产视角"）。
- 链接到 `../reference/glossary.html` 和相邻课程，推荐一个精读源。
- 中文教学；关键术语保留英文原词并附中文。

---

## 触发器 1：进程调度篇（§14）→ 额外课《摆核·调频·调度：量产性能调优三位一体》

### 触发条件
当主课程进入**第 4 篇 · 进程管理篇**，开始讲 **§14 调度**（即 `CURRICULUM_MAP.md` 中 §14.1–§14.9 各三级子节从 🔜 转为 ✅ 的那一章主课）时，**紧接着生成此额外课**。

### 来源
用户提供的笔记《操作系统进程调度三要素（摆核、调频、调度）》（Google Doc，2026-08-02 引入）。
核心命题：**进程调度 ≠ 单核选任务**，而是"摆核 + 调频 + 调度"三位一体的系统工程（异构芯片 + Linux/Android）。

### 与主教材的关系（互补，非重复）
| 维度 | 主教材 §14 讲的 | 本额外课补的（书外·量产） |
|------|----------------|--------------------------|
| 调度类内部 | stop / dl / rt / fair(CFS→EEVDF) / idle 的算法与数据结构（§14.3–§14.7） | 调度类之上的**用户态控制接口**：`sched_setscheduler` / `nice` / `chrt` / SCHED_FIFO/RR/DEADLINE 怎么用、何时用 |
| 任务放哪个核 | 不展开（默认 SMP 均匀） | **摆核**：`sched_setaffinity` / `taskset` / cpuset cgroup / HMP / EAS / `load_balance` |
| 核跑什么频率 | 不展开 | **调频**：DVFS / cpufreq sysfs / governor(performance/powersave/**schedutil**) / OPP / thermal 联动 |
| 体系结构前提 | 通用 SMP | **异构**：Arm big.LITTLE / DynamIQ、PELT 负载追踪、EM 能量模型 |
| 实战 | 看图说话为主 | **组合拳**：场景化 Boost（触控滑动 / App 启动 / 关键帧渲染）+ ftrace/perf 定位"核选错 / 频拉慢 / 抢占延时高" |

**咬合点**：主课 §14.5.1 已标"CFS/EEVDF，需版本纠偏"——额外课正好补充 EEVDF 在 6.x 取代 CFS 的**真实背景**（上游 6.6 合入），并讲清 EEVDF 解决的 CFS 长尾问题，把"版本纠偏"落到实处。

### 生成蓝图

**标题**：《摆核·调频·调度：量产性能调优三位一体》
**编号占位**：第 N+1 课（N = §14 主课的编号，随实际推进确定；额外课紧跟 §14 主课之后）。
**页眉 chip**：
- `额外课`
- `第 4 篇 · 进程调度` / `配 §14 主课`
- `书外·量产视角（HMP/EAS/DVFS/cpufreq）`
- `Linux 6.6 (你的环境)`

**学习目标**（学完能做到，对应 mission 的 BSP 入场券）：
- 能用 `taskset` / `sched_setaffinity` 把一个进程钉在指定核上，并解释何时该这么做。
- 能读 `/sys/devices/system/cpu/cpuX/cpufreq/`，说清 governor 选型（尤其 schedutil 为何与调度器联动）。
- 能区分"核选错 / 频拉慢 / 抢占延时高"三类性能瓶颈，并用 ftrace 的 `sched_switch` / `cpu_frequency` 事件定位。
- 说清 HMP → EAS 的演进逻辑，以及 PELT + EM 如何驱动 EAS 的核选择决策。

**内容结构**（按笔记的三维度，每维度都给：用户态接口 → 内核机制 → 与 §14 主课的连接点 → 实验）：

1. **认知转变**：为什么"调度 = 选下一个 task"是误区；异构芯片如何改变游戏规则。MCU 对照：裸机单一 MCU 无此问题（一颗核一个频），内核面对 N 核 M 频点。
2. **维度一·摆核（CPU Placement）**
   - 用户态：`sched_setaffinity` / `sched_getaffinity`、`taskset -c`、cpuset cgroup（Android 前后台隔离）。
   - 内核：HMP（静态阈值迁移）→ EAS（PELT + EM，能耗最优核选择）→ `load_balance()`（动态拉平）。
   - 连接 §14.2（进程入队 / 唤醒 / 迁移路径）。
3. **维度二·调频（DVFS）**
   - 用户态 sysfs：`scaling_min_freq`（地板）/ `scaling_max_freq`（天花板）/ `scaling_governor` / `scaling_setspeed`（userspace 手动定频）。
   - 内核：governor 族（performance / powersave / **schedutil**）/ OPP（电压-频率对）/ thermal 压频保护。
   - 重点讲 **schedutil** 与调度器的深度联动（基于 PELT 实时下发 OPP）—— 这是 §14 主课不讲、但 6.x 默认倾向的关键机制。
4. **维度三·调度（Single-CPU Scheduling）的用户态面**
   - 主课讲了调度类内部；额外课讲**怎么从用户态驱动**这些类：`sched_setscheduler` / `pthread_setschedparam` / `nice` / `renice` / `setpriority`。
   - 调度类优先级表（stop > dl > rt > fair > idle）与 §14.3/§14.4/§14.5/§14.7 的对应。
5. **量产组合拳**：场景化 Boost（触控滑动 / App 启动 / 关键帧渲染 = 摆核 + 调频 + 提权 三连）+ ftrace/perf/Systrace 定位（区分根因：核 / 频 / 延时）。

**MCU ↔ 内核 对照**（用户最大迁移杠杆，必含）：
| 问题 | 裸机 MCU | Linux/Android 内核 |
|------|----------|--------------------|
| 任务放哪 | 只有一颗核，无需选 | N 核（大/中/小），HMP/EAS 决策 |
| 跑多快 | 固定主频或手动改寄存器 | DVFS 动态，governor 策略 |
| 谁先跑 | 裸机轮询 / 一刀切中断 | 5 个调度类 + nice + 实时优先级 |

**WSL2 实验可行性标注**（关键，避免设计跑不了的实验）：
- ✅ **可跑**：`taskset` / `sched_setaffinity` 钉核；`/proc/<pid>/status` 看 `Cpus_allowed`；`nice` / `chrt` 改优先级；ftrace 的 `sched:sched_switch` / `sched:sched_wakeup` 事件（tracefs 在 WSL2 可用）。
- ⚠️ **WSL2 限制**：WSL2 是虚拟内核、单一 CPU 类型——`/sys/.../cpufreq/` 节点**通常不存在**；**看不到大小学核**，HMP/EAS 无从实测。这些维度用**读源码 + 读 ARM 官方文档**替代实操，明确标注"WSL2 不可跑，理论 / 留真机"。
- 实验主线建议：用 `taskset` 把一个 CPU 密集进程钉到不同 CPU、配 `chrt` 提实时优先级、用 ftrace 抓 `sched_switch` 观察——这一串在 WSL2 全可跑，且能同时体现"摆核 + 调度"两维。

**待入术语**（生成课时加入 `../reference/glossary.html`，遵循"已理解才收录、紧定义、英文原词"）：
HMP / EAS / PELT / EM(Energy Model) / DVFS / OPP / cpufreq governor / schedutil / big.LITTLE / DynamIQ / cpuset / sched_setaffinity / sched_setscheduler / nice / SCHED_FIFO / SCHED_RR / SCHED_DEADLINE / dl_sched_class / rt_sched_class / fair_sched_class。其中 PELT / EAS / schedutil / EM 为本课新增重点。

**quiz 方向**（等长选项，4 选 1，不漏线索）：
- "下列哪个 governor 与调度器实时联动下发 OPP？"（schedutil / performance / powersave / userspace）
- "EAS 选择目标核主要依据哪两项输入？"（PELT + EM / nice + affinity / HZ + jiffies / rt_prio + dl）
- "把进程钉在指定 CPU 用哪个系统调用？"（sched_setaffinity / sched_setscheduler / nice / setpriority）
- "WSL2 上通常**看不到**下列哪一项？"（cpufreq sysfs 节点 / sched_switch 事件 / /proc/pid/status / tracefs）

**推荐精读源**（生成课时择一作为"主推"，并建议把高可信条目补进 [`RESOURCES.md`](./RESOURCES.md)）：
- kernel.org `Documentation/scheduler/sched-energy.rst`（EAS 官方文档，权威）。
- kernel.org `Documentation/cpu-freq/`（cpufreq 子系统，governor 列表）。
- ARM Developer：*big.LITTLE* 与 *DynamIQ* 技术白皮书（异构硬件根源）。
- LWN.net："Energy aware scheduling" 系列（EAS 设计动机与 patch 评审，高信号）。
- 内核源码：`kernel/sched/fair.c`（EEVDF / PELT）、`drivers/cpufreq/schedutil.c`（governor 与调度器联动）。

**nav 链接策略**：
- 额外课作为 §14 主课的**直接后继**：主课 footer 的"下一站"指向本额外课；本额外课 footer 再指向 §15（进程通信）主课。
- 在 `CURRICULUM_MAP.md` 第 4 篇区块**新增一行"书外补充"**：登记本额外课覆盖的 HMP/EAS/DVFS/cpufreq（这些不在书的 §X.Y.Z 列表里，单独标注 `书外·量产`，状态 ✅），与 §14 主课的 ✅ 区分。
- §14 主课与额外课互相在 chip 里交叉引用（参考第 7/8 课"RCU 见第 8 课"的写法）。

### 生成时的全量 checklist
照搬 [`NOTES.md`](./NOTES.md) 的 LR-0009 checklist，**额外**注意：
- [ ] CURRICULUM_MAP：§14 各子节 🔜→✅；**另起一行**登记"书外补充（HMP/EAS/DVFS/cpufreq）"。
- [ ] glossary：补入上面"待入术语"，PELT/EAS/schedutil 给紧定义。
- [ ] WSL2 限制：每个涉及 cpufreq / 异构核的实验段必须标注"WSL2 不可跑 / 理论 / 留真机"。
- [ ] 主教材 §14.5.1 的"CFS/EEVDF 版本纠偏"在本额外课落到实处以闭合该缺口。
- [ ] RESOURCES.md：把选定的精读源（至少 kernel.org sched-energy + 一篇 LWN）补进 Knowledge 区。

---

## 后续触发器（占位）
用户日后引入其它书外视角（如 PREEMPT_RT、Binder 性能、ION/DMA-BUF、Android ashmem/memfd 等）时，在此追加新触发器，沿用上面同样的五块结构。
