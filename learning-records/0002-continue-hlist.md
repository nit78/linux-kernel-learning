# 第 1 课后用户真实反馈与第 2 课决策（LR-0002，已修正）

**Status:** active
**修订说明：** 初版误判为"用户只回复'继续'无反馈"。重新检查 workspace 后发现用户已大量动手实践，反馈极其充分。本记录以修正版为准。

## Evidence（用户在第 1 课与第 2 课之间做的事）

1. **手敲并运行了第 1 课代码**：`code/lession1/bt_list.c`。做了两处体现个人风格的改动：
   - `u16` → `uint16_t`：用 stdint 风格而非内核 <code>u16</code> 习惯——典型 MCU 工程师惯性。
   - 把 `int i` 声明从函数顶移到 for 循环内（C99 风格）——说明熟悉现代 C。
2. **独立搭建了 WSL2 内核编译环境**：`doc/WSL2内核编译与驱动环境搭建.md`（423 行）记录完整流程 + 4 个踩坑 + 关键概念解释。水平远超"初入门"。
3. **额外写了 hello world 驱动**：`code/test/hello.c` + Makefile——确认环境跑通。
4. **把整个学习项目工程化**：git 仓库、GitHub Pages 在线托管（nit78.github.io/linux-kernel-learning）、README、COMMIT_CONVENTION.md、git 维护操作步骤。
5. **环境实为 WSL2 + Linux 6.6.87.2-microsoft-standard-WSL2**，不是之前假设的 QEMU。且用户已清楚知道 WSL2 的限制（无 USB/PCI/中断/DMA/GPU 真实硬件）。

## Implications（深刻影响后续教学）

1. **工程严谨度被低估了**。用户不是"照抄"，而是"理解 + 重写 + 沉淀成文档"。后续课程可以放心加入更深的内容、更大的实验、更少的 hand-holding。
2. **环境定调：WSL2 6.6.87.2**。实验必须能在 WSL2 跑通（纯软件模块：list/hlist/rbtree/timer/sysfs/proc 等）。需要真实硬件的实验（USB/PCI/中断 DMA）要明确标注"WSL2 跑不了，记为理论/留待真机"。NOTES.md 需更新环境信息。
3. **uint16_t vs u16 是可教的点**：内核用 <code>u8/u16/u32/u64</code>（<linux/types.h>）而非 stdint。用户保留 stdint 说明这个约定还没建立——值得在第 2 课轻轻点一下，但不必长篇（用户的代码已能跑，说明内核头文件里 uint16_t 也被接受）。
4. **第 2 课实验不变，但措辞调整**：沿用 hlist 哈希表实验（纯软件，WSL2 可跑）。但实验说明里把"QEMU"改为"你的 WSL2 环境"，并引用用户自己的搭建文档作为环境前置（让用户感到被看见）。
5. **在线托管意味着课件质量要更高**：用户把课件公开到 GitHub Pages，不只是自用。代码示例必须正确可编译，排版要经得起公开审视。
6. **下一课可适当加深**：用户既然能独立啃下 WSL2 内核编译，红黑树课（第 3 课）可以引入真正的内核 rbtree API 而非简化版。

## 待观察
- 用户是否希望课程与他的 GitHub Pages 仓库同步（每课 push 上去）？还是课件在本地 workspace 生成、由用户自行同步？目前假设后者——用户已建立了自己的同步流程，我专注内容生产即可。
- 用户对 <code>u16</code> vs <code>uint16_t</code> 的反应。如果接受，后续代码统一用内核风格。
