# 第 9 课内存寻址（LR-0013）

**Status:** active

## 决策
内存管理篇开篇，讲 §5 内存寻址：DRAM/MMIO、MMU+多级页表、TLB/PCID/KPTI、ioremap（GPU framebuffer 案例）。
覆盖 §5.1、§5.2.1、§5.2.2、§5.3 四个三级子节。

## 核验（不靠记忆）
- **页表层级**：6.x 在 LA57 CPU 上默认 5 级（57 位 VA，128PB），新增 P4D 层；老 4 级 48 位。no5lvl 可关。
- **物理地址空间**：DRAM 与 MMIO 共享统一空间，E820/UEFI 表标注类型。GPU framebuffer 是 PCIe BAR 落在 MMIO 区，不是 DRAM。
- **ioremap**：必须用它建立 uncached/强序映射；用 readl/writel 访问，不可裸解引用。/dev/mem 受 CONFIG_STRICT_DEVMEM 限制。
- **TLB**：硬件页表遍历（TLB miss）；PCID 标进程标签免全刷；KPTI（Meltdown 缓解）使 CR3 切换频繁，PCID 更关键。

## 附录 A 决定
附录 A（内存初始化 §A.1-A.3）依赖启动流程知识较多，合并进第 9 课会过载。决定**不合并**，留作 §6/§7 物理内存管理时的补充材料（那时讲 memblock/伙伴系统，自然能接上内存初始化）。

## 实验设计（按 LR-0012 规则）
内存寻址的硬件细节不能"写代码测"（MMU/TLB 是硬件）。实验是**观察性**的：grep la57 /proc/cpuinfo、cat /proc/self/maps、两个 bash 对比相同 VA 映射到不同 PA。
按 LR-0012 规则，实验前明确声明"这实验在测什么"（验证页表真实存在、每进程独立）。

## checklist 执行
- [x] 第 8 课 nav → 0009
- [x] 第 9 课页眉：§5 + 四个子节 + "内存管理篇·开篇"
- [x] CURRICULUM_MAP：§5.1/§5.2.1/§5.2.2/§5.3 翻 ✅
- [x] glossary：+8 条（MMU/VA-PA/页表/TLB/DRAM/MMIO/ioremap）
- [x] 自动化校验：nav 1→9 全 ✅；aside 8/8；quiz 2/2

## 覆盖统计
- ✅：26 → **30**（+4，§5 全章完成）
- 内存管理篇进度：§5 ✅，§6–§9 待办

## 待观察
- 用户 WSL2 的 CPU 是否支持 LA57（影响实验观察）。等用户反馈。
- 内存管理篇最硬核，后续节奏可能需要更多图解。LR-0014 起持续评估。
