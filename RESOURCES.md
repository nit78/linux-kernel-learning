# Linux 内核学习 Resources

> 资源筛选原则：只收高可信来源（官方文档、公认专家、同行评审、良好治理的社区）。每条注明覆盖范围与何时取用。

## Knowledge

### 主教材（中文，本课程主线）
- [《图解Linux内核（基于6.x）》— 姜亚华（机械工业出版社，2024，ISBN 978-7-111-74547-1）](https://www.mheducation.com.cn/)
  本课程的主线教材。Linux 6.2，5 篇 23 章 + 4 附录，双色图解，由浅入深。**何时取用**：每节课指定章节精读；图解机制看不懂时第一选择。配套：扫码视频课、源码下载、教学 PPT（公众号"IT有得聊"回复 74547）。

### 英文经典（互补深读）
- [Book: _Linux Kernel Development (3rd Edition)_ — Robert Love](https://www.informit.com/store/linux-kernel-development-9780672329463)
  公认的概念入门经典，讲清"为什么"而非逐行读码。**何时取用**：学新概念前先读对应章节建立直觉。注意：成书较早（v2.6），机制细节需对照当前内核核验。
- [Book: _Linux Kernel Programming (2nd Edition)_ — Kaiwan N. Billimoria (Packt, 2024)](https://www.packtpub.com/product/linux-kernel-programming-second-edition/9781803232225)
  贴近当前内核（6.x），含大量动手实验、调试/性能章节。**何时取用**：需要现代、可上手的代码示例与工程实践时。

### 官方文档（权威）
- [kernel.org 官方文档树 `Documentation/`](https://www.kernel.org/doc/html/latest/)
  内核自带的子系统文档、API、流程文档。**何时取用**：API 签名、子系统设计意图、Kconfig/构建细节——一切以它为准。
- [HOWTO do Linux Kernel Development (kernel.org)](https://www.kernel.org/doc/html/latest/process/howto.html)
  成为内核开发者的官方指南，含社区流程、补丁规范、入门入口。**何时取用**：决定向社区靠拢时。

### 互动课程（讲座 + 实验）
- [Linux Kernel Labs — linux-kernel-labs.github.io](https://linux-kernel-labs.github.io/)
  讲座 + 配套实验，系统覆盖内核架构、调度、内存等。**何时取用**：想要结构化的理论 + 动手结合时，与本书互为补充。
- [Linux Kernel Internals and Development (LFD420) — The Linux Foundation](https://training.linuxfoundation.org/training/linux-kernel-internals-and-development/)
  结构化付费课程，覆盖架构、内核算法、内存、模块化、调试。**何时取用**：愿意付费走系统培训路线时参考大纲。

## Wisdom (Communities)

- [LWN.net](https://lwn.net/)
  内核子系统深度文章 + patch 评审 + 当前进展。**何时取用**：看懂某子系统"为什么这样设计"、跟踪当前社区动向。付费订阅支持深度报道。
- [Bootlin 免费培训（嵌入式 / 内核驱动 / 调试追踪）](https://bootlin.com/doc/training/linux-kernel/)
  嵌入式 Linux 与内核驱动开发的免费幻灯 + 实验，BSP 对口。全部材料开源在 [GitHub](https://github.com/bootlin/training-materials)。**何时取用**：动手做 BSP / 驱动实验、补强嵌入式侧工程实践。
- [lkml.org（LKML 邮件列表镜像）](https://lkml.org/)
  内核开发主讨论区。**何时取用**：想看真实设计争论、补丁评审过程时（只读浏览即可）。
- [reddit r/kernel](https://www.reddit.com/r/kernel/)
  相对高信号的内核讨论区。**何时取用**：找资源推荐、问方向性问题（非深度技术答疑首选 LWN/LKML）。

## Gaps
- 中文高信号内核社区：目前缺少像 LWN 那样的中文深度站，主要靠英文 LWN + 本书。**待发现后补充。**
- 实时子系统（PREEMPT_RT）：mission 暂列为 out of scope，资源未收。
- 内核安全 / 漏洞分析方向：暂未收，待相关需求出现。

---
*维护规则：发现新的高可信资源时补充；质量下降或失联时果断剔除；每条必须可标注"何时取用"。*
