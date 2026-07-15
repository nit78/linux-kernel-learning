# WSL2 内核编译与驱动开发环境搭建

> 本文记录在 WSL2 上从零搭建「可编译 + 可加载运行自编内核驱动」环境的完整过程，
> 包含每一步的**为什么这么做**、**踩过的坑**、**关键概念解释**。
> 参考教程：<https://dion6850.github.io/posts/59779/>，结合本机实际操作整理。

---

## 一、为什么需要自己编译内核

### 1.1 普通发行版 vs WSL2 的根本区别

在普通的 Ubuntu / Debian 上，编译内核驱动只要一行：

```bash
sudo apt install build-essential linux-headers-$(uname -r)
```

`linux-headers-$(uname -r)` 这个包里就是当前内核对应的头文件 + 构建脚本，装上之后
`/lib/modules/$(uname -r)/build` 就有了，直接 `make` 就能编译外部模块。

**但 WSL2 上这条命令必然失败**：

```
E: Unable to locate package linux-headers-6.6.87.2-microsoft-standard-WSL2
E: Couldn't find any package by glob 'linux-headers-6.6.87.2-microsoft-standard-WSL2'
```

### 1.2 根因

WSL2 的内核**不是发行版提供的**，而是 **Microsoft 单独编译后通过 Windows Update 推送**的。
因此：

| | 普通发行版 | WSL2 |
|---|---|---|
| 内核来源 | 发行版仓库 | Microsoft 编译，Windows Update 推送 |
| headers 包 | apt 仓库里有 | **apt 仓库里根本没有**，Microsoft 不发布这个 .deb |
| `/lib/modules/$(uname -r)/` | 默认存在 | **默认不存在** |

所以 WSL2 上编译驱动，**必须从 WSL2 内核源码自己编译出 headers 构建树**，然后手动
建立 `/lib/modules/$(uname -r)/build` 软链。这就是本文档要做的事。

> 关键认知：`apt install linux-headers-...-microsoft-standard-WSL2` **永远不可能成功**，
> 不是源配置问题，是这个包压根不存在。

---

## 二、我的环境信息

| 项目 | 值 |
|---|---|
| 内核版本 | `6.6.87.2-microsoft-standard-WSL2`（`uname -r`） |
| 源码对应 tag | `linux-msft-wsl-6.6.87.2` |
| 源码仓库 | <https://github.com/microsoft/WSL2-Linux-Kernel> |

> 你的版本可能不同，先在 WSL 里执行 `uname -r` 确认，再去仓库找对应 tag。

---

## 三、完整搭建步骤

### 步骤 1：安装编译依赖

```bash
sudo apt update
sudo apt install -y build-essential flex bison libssl-dev libelf-dev bc \
    dwarves libncurses-dev cpio kmod git
```

| 包 | 作用 |
|---|---|
| `build-essential` | gcc / g++ / make 基础工具链 |
| `flex` `bison` | 内核配置解析器生成器（Kconfig 依赖） |
| `libssl-dev` | 内核加密子系统、模块签名 |
| `libelf-dev` | 解析 ELF（BTF、模块依赖） |
| `bc` `dwarves` | 内核构建辅助工具 |
| `libncurses-dev` | `make menuconfig` 的 TUI 界面（可选） |

### 步骤 2：获取对应版本的内核源码

⚠️ **关键：要 checkout tag，不能用 branch tip。**

仓库里 `linux-msft-wsl-6.6.y` 是一个**长期维护的分支**，它的 tip 比任何单个 tag 都
**新很多**（6.6 系列已经发到 6.6.114.x）。如果用分支 tip 编 headers：

- 版本号不匹配 → DKMS / 模块可能拒装
- 内核 ABI 可能已变 → 编出的模块加载时符号不匹配

**headers 必须和正在跑的内核完全对应**，所以要精确 checkout 对应 tag。

先远程确认 tag 存在（不用 clone）：

```bash
git ls-remote --tags https://github.com/microsoft/WSL2-Linux-Kernel.git \
  | grep "linux-msft-wsl-6.6.87"
```

应该能看到 `linux-msft-wsl-6.6.87.2`。然后精确 clone 这个 tag：

```bash
cd ~
git clone --depth 1 --branch linux-msft-wsl-6.6.87.2 \
  https://github.com/microsoft/WSL2-Linux-Kernel.git
cd WSL2-Linux-Kernel
```

- `--branch` 既能接分支名，也能接 **tag 名**
- `--depth 1` 只拉这个 tag 的快照，省时间省空间

验证版本对得上：

```bash
make kernelversion
# 必须输出: 6.6.87.2
```

> 如果 GitHub 拉不下来（网络问题），可直接下 tarball：
> ```bash
> wget https://github.com/microsoft/WSL2-Linux-Kernel/archive/refs/tags/linux-msft-wsl-6.6.87.2.tar.gz
> tar xzf linux-msft-wsl-6.6.87.2.tar.gz
> ```

### 步骤 3：配置内核

```bash
cp Microsoft/config-wsl .config   # 用 Microsoft 官方的 WSL 配置
make olddefconfig                  # 补全配置，见下方解释
```

**`make olddefconfig` 是什么意思：**

| 命令 | 行为 |
|---|---|
| `old` | 以**现有的** `.config` 为基础 |
| `def` | 新增的、old config 里没有的选项，**全部用默认值** |
| `config` | 内核的配置体系（生成 `.config`） |

`Microsoft/config-wsl` 只列了 WSL 关心的关键配置项，但 Linux 内核有上万个 `CONFIG_*`
选项，`.config` 必须每项都有明确值才能编译。`olddefconfig` 把缺失的选项用默认值补全，
**不提问、静默完成**，生成完整可用的 `.config`。

验证：

```bash
wc -l .config   # olddefconfig 后行数会明显变多
```

### 步骤 4：编译内核（生成 Module.symvers，关键）

```bash
make -j$(nproc)
```

- `nproc`：输出当前系统可用的 CPU 逻辑核心数（如 `8`）
- `$(nproc)`：shell 命令替换，把 `nproc` 的输出嵌入命令
- 所以等价于 `make -j8`：**同时开 8 个 gcc 进程并行编译**

| 方式 | 8 核机器编译内核耗时 |
|---|---|
| `make`（单进程） | ~40 分钟 |
| `make -j8`（8 进程） | ~6 分钟 |

这一步会编译 `vmlinux` / `bzImage` / 所有内置模块，并生成 **完整的 `Module.symvers`**。

> ⚠️ **`Module.symvers` 是什么**：存放内核所有导出符号的版本信息（CRC）。
> modpost 链接模块时靠它确认 `printk`、`module_layout` 等符号确实存在且版本对得上。
> **只跑 `make modules_prepare` 不会生成它**，会导致 modpost 报一堆 `undefined` 符号。

> ⚠️ gcc-15 用户（Ubuntu 25.04+）编 6.6.87.2 会因 C23 默认标准失败，加参数：
> ```bash
> make -j$(nproc) KCFLAGS="-std=c17"
> ```

> 内存不够时（OOM），降到 `make -j4` 甚至更低。每个 gcc 进程峰值约 1~2G 内存。

### 步骤 5：建立软链（让外部模块能找到 headers）

```bash
KVER=$(uname -r)   # 6.6.87.2-microsoft-standard-WSL2
sudo mkdir -p /lib/modules/$KVER
sudo ln -sfn "$(pwd)" /lib/modules/$KVER/build
```

⚠️ **必须在源码树根目录下执行**（`$(pwd)` 取当前目录）。验证：

```bash
ls -l /lib/modules/$(uname -r)/build
# lrwxrwxrwx ... /lib/modules/6.6.87.2-microsoft-standard-WSL2/build -> /home/xxx/WSL2-Linux-Kernel
```

`->` 后面必须指向**源码树根目录**（有 `Makefile`、`scripts/`、`Module.symvers` 的那一层）。

> 不依赖 `pwd` 的写法（在哪执行都行）：
> ```bash
> sudo ln -sfn /home/$USER/WSL2-Linux-Kernel /lib/modules/$(uname -r)/build
> ```

### 步骤 6：编译第一个驱动并验证

```bash
mkdir -p ~/drivers/hello && cd ~/drivers/hello
```

`hello.c`：

```c
#include <linux/module.h>
#include <linux/init.h>
#include <linux/kernel.h>

static int __init hello_init(void)
{
    pr_info("hello: 驱动已加载\n");
    return 0;
}

static void __exit hello_exit(void)
{
    pr_info("hello: 驱动已卸载\n");
}

module_init(hello_init);
module_exit(hello_exit);

MODULE_LICENSE("GPL");
MODULE_AUTHOR("lvyangqi");
MODULE_DESCRIPTION("测试驱动");
```

`Makefile`：

```makefile
obj-m := hello.o

KDIR := /lib/modules/$(shell uname -r)/build
PWD := $(shell pwd)

all:
	$(MAKE) -C $(KDIR) M=$(PWD) modules

clean:
	$(MAKE) -C $(KDIR) M=$(PWD) clean
```

编译、加载、查看日志、卸载：

```bash
make                          # 生成 hello.ko
sudo insmod hello.ko          # 加载
sudo dmesg | tail             # 看到 "hello: 驱动已加载"
lsmod | grep hello            # 确认模块在
sudo rmmod hello              # 卸载
sudo dmesg | tail             # 看到 "hello: 驱动已卸载"
```

到这一步，整个「编译驱动 + 运行驱动」链路就打通了。

---

## 四、踩过的坑（重点记录）

### 坑 1：`apt install linux-headers-...` 找不到包

见第一节根因。**结论：WSL2 上不能用 apt 装 headers，必须源码编译。**

### 坑 2：克隆时只看到 `linux-msft-wsl-6.6.y` 分支，没有 6.6.87.2

那是**分支（branch）**，你需要的是**标签（tag）**，两者不同：

| 名称 | 类型 | 说明 |
|---|---|---|
| `linux-msft-wsl-6.6.y` | 分支 | 长期维护，tip 比任何 tag 都新 |
| `linux-msft-wsl-6.6.87.2` | 标签 | 对应你正在跑的内核，**才是你要的** |

用 `git ls-remote --tags` 确认 tag 存在，再用 `git clone --branch <tag>` 精确拉取。

### 坑 4：编译过了，但 modpost 报一堆 `undefined` 符号

```
WARNING: Module.symvers is missing.
ERROR: modpost: "__fentry__" [...] undefined!
ERROR: modpost: "_printk" [...] undefined!
ERROR: modpost: "module_layout" [...] undefined!
```

**原因：只跑了 `make modules_prepare`，没有生成 `Module.symvers`。**

```
modules_prepare  →  准备脚本/头文件    （没 Module.symvers）
make modules      →  编译内置模块        （生成 Module.symvers）
make              →  编译整个内核+模块   （完整 Module.symvers）
```

**解决：跑一次 `make -j$(nproc)` 生成完整 `Module.symvers`，一劳永逸。**

### 坑 5：`insmod` 报 `Operation not permitted`

WSL2 默认的 root 上下文加载内核模块需要 `CAP_SYS_MODULE` 能力。直接 `sudo insmod`
有时权限继承不完整。**加 `sudo` 即可成功**（本机实测）：

```bash
sudo insmod hello.ko   # ✅ 加 sudo 能成功
```

---

## 五、关键概念解释

### `make modules_prepare` vs `make` vs `make modules`

| 命令 | 作用 | 产物 |
|---|---|---|
| `make modules_prepare` | 准备编译脚本和头文件 | `scripts/`、`include/generated/`，**无 Module.symvers** |
| `make modules` | 编译内核源码自带的模块 | 各 `.ko` + `Module.symvers` |
| `make` | 编译整个内核 + 所有模块 | `vmlinux`、`bzImage` + 完整 `Module.symvers` |

### `/lib/modules/$(uname -r)/build` 的作用

外部模块编译时，`make -C /lib/modules/$(uname -r)/build M=$(PWD) modules` 会进到这个
目录调用内核构建系统。DKMS、NVIDIA 驱动、VirtualBox 等工具都默认去这里找 headers。
软链指向源码树根目录后，这些工具就能正常工作。

### `make -j$(nproc)`

- `nproc`：输出 CPU 逻辑核心数
- `$(...)`：shell 命令替换，把命令输出嵌入当前位置
- `-j8`：同时开 8 个编译进程并行，大幅缩短编译时间

> ⚠️ `make -j`（不跟数字）会不限并行数，可能启动几千个 gcc 把内存搞崩，别这么用。

### WSL2 换内核的流程（与普通 Linux 不同）

WSL2 的内核**不从 `/boot/` 启动**，所以 `make install` 在 WSL2 上没意义。换自定义内核
要这样：

```bash
# 1. 编出 bzImage
cd ~/WSL2-Linux-Kernel && make -j$(nproc) KCFLAGS="-std=c17"

# 2. 拷到 Windows 端
cp arch/x86/boot/bzImage /mnt/c/Users/<用户名>/vmlinux-custom

# 3. Windows 端编辑 C:\Users\<用户名>\.wslconfig
[wsl2]
kernel=C:\\Users\\<用户名>\\vmlinux-custom

# 4. PowerShell 重启 WSL
wsl --shutdown
```

---

## 六、关于 install 命令（重要澄清）

很多人教程里会写：

```bash
make -j8; make modules -j8; make modules_install -j8; make install -j8
```

但**对本场景（编驱动 + 加载运行），后两个 install 根本不需要执行**：

| 命令 | 目标位置 | 本场景是否需要 |
|---|---|---|
| `make` | 源码树内（生成 `Module.symvers`） | ✅ **需要** |
| `make modules` | 源码树内 | 可选（make 已包含） |
| `make modules_install` | `/lib/modules/$(uname -r)/` | ❌ 不需要 |
| `make install` | `/boot/` + GRUB | ❌ 不需要 |

原因：
- 你的目的是用**现有内核的 headers 编外部模块**，不是替换内核。
- WSL2 内核由 Windows 端管理，`make install` 装到 `/boot/` 也没用——WSL2 不从 `/boot` 启动。
- `modules_install` 装的是内核源码自带的 `.ko`，编外部模块不依赖这些。

**所以本场景实际只需要：**

```bash
cd ~/WSL2-Linux-Kernel
make -j$(nproc)                        # 拿到 Module.symvers
# 软链建好，回去编驱动就行
```

---

## 七、WSL2 驱动开发的限制

WSL2 内核是 Microsoft 裁剪过的，**没有真实硬件访问**：

| 驱动类型 | WSL2 能否跑 |
|---|---|
| 字符设备（`misc_register`、`cdev`） | ✅ 能 |
| `/proc`、`/sys` 接口 | ✅ 能 |
| 网络驱动（`net_device`） | ✅ 能 |
| 块设备 | ✅ 能 |
| USB、PCI 驱动 | ❌ 没有真实硬件透传 |
| 中断、DMA、GPU | ❌ 同上 |

依赖具体硬件的驱动，WSL2 上没法测——需要虚拟机（VMware/VirtualBox + Ubuntu）或真机。

---

## 八、验证清单

搭建完成后，确认以下全部通过：

- [ ] `ls -l /lib/modules/$(uname -r)/build` 软链指向源码树根目录
- [ ] `ls ~/WSL2-Linux-Kernel/Module.symvers` 存在
- [ ] `make -C /lib/modules/$(uname -r)/build M=$(pwd) modules` 能生成 `.ko`
- [ ] `sudo insmod xxx.ko` 能加载，`sudo dmesg` 看到日志
- [ ] `sudo rmmod xxx` 能卸载
- [ ] 驱动源码在 `~/` 下，不在 `/mnt/`

---

## 九、参考资料

- 官方内核源码：<https://github.com/microsoft/WSL2-Linux-Kernel>
- 内核 Releases / Tags：<https://github.com/microsoft/WSL2-Linux-Kernel/releases>
- WSL 内核发行说明：<https://learn.microsoft.com/zh-cn/windows/wsl/kernel-release-notes>
- 参考教程：<https://dion6850.github.io/posts/59779/>
- gcc-15 编 6.6.87.2 失败问题：<https://github.com/microsoft/WSL/issues/13086>
- `git ls-remote` 文档：<https://git-scm.com/docs/git-ls-remote>
