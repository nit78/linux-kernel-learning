# 第 7 课同步基础（LR-0010）

**Status:** active

## 决策
附录 B 内核同步按 LR-0009 既定方案**拆两课**：
- 第 7 课（本课）：§B.1 竞争 + §B.2.1–§B.2.11 基础原语（percpu/atomic/READ_ONCE-WRITE_ONCE/spinlock 四变体/mutex/rwlock/seqlock）
- 第 8 课：§B.2.12 RCU 单独深讲（+ 顺带把 §B.2.3 屏障讲透）

## 核验（不靠记忆）
- spinlock 四变体语义：6.6 稳定未变。`spin_lock_irqsave` 是最通用安全（锁可能沾中断时必用）。
- READ_ONCE/WRITE_ONCE：内核**明确不推荐**裸 volatile，用这两个代替（=C11 memory_order_relaxed）。
- mutex 仅进程上下文、可睡；spinlock 可用于中断、不睡。选型核心仍是第 4 课上下文铁律。
- seqlock：读者无锁+序号重试；percpu：零竞争；atomic：单变量跨核免锁。

## 实验
`bt_sync.c`：percpu vs spinlock 各加 1000 万次，对比耗时。WSL2 多核可跑，让用户亲手量到锁开销 → 理解免锁机制的价值。

## checklist 应用（LR-0009 的 10 项）
本次是首课认真执行自定的 checklist：
- [x] nav 链接：第 6 课 `#` → `0007-synchro-basics.html`
- [x] 页眉 chip：第 7 课标 §B.1 + §B.2.1–11 + "RCU 见第 8 课"
- [x] 第 6 课 footer/预告：本就提"第 7 课同步"，仍成立，未改
- [x] CURRICULUM_MAP：§B.1+§B.2.1-11 翻 ✅/🟡；§B.2.12 翻 🔜 第 8 课
- [x] glossary：+9 条同步术语（竞争/临界区/percpu/atomic/READ_ONCE/spinlock/mutex/semaphore/rwlock/seqlock）
- [x] 自动化校验：nav 链 1→7 全 ✅，aside 6/6，quiz 2/2

## 覆盖统计变化
- ✅ 已覆盖：11 → **24**（+13，整个附录 B 基础）
- 🟡 部分覆盖：9 → **12**（+3：§B.2.3 屏障、§B.2.5 禁中断、原有）
- ⬜ 未覆盖：30 → **15**（-15，附录 B 大块填上；剩 §B.2.6 禁抢占 + 零散）

## 诚实的部分覆盖标注（不冒充全覆盖）
- §B.2.3 屏障 🟡：smp_mb/rmb/wmb 提及未深讲，留第 8 课 RCU 展开
- §B.2.5 禁中断 🟡：通过 spin_lock_irqsave 体现，未单独讲 local_irq_save
- §B.2.6 禁抢占 ⬜：preempt_disable 完全没讲，登记为缺口

## 待观察
- 第 8 课 RCU 是否要把 §B.2.6 禁抢占也带上（它和 RCU 的 preempt 模型有关联）。
