// seqlock_demo.c — seqlock 顺序锁演示
// 展示读端零开销、写端 +1+1 的奇偶标记机制
// 用法: 加载后 cat /proc/seqlock_demo 观察读写并发情况

#include <linux/module.h>
#include <linux/init.h>
#include <linux/proc_fs.h>
#include <linux/uaccess.h>
#include <linux/seqlock.h>
#include <linux/delay.h>
#include <linux/kernel.h>

#define PROC_NAME "seqlock_demo"

/* 受 seqlock 保护的数据:一对关联值(a 应该 == b 的平方) */
static struct shared_data {
    unsigned int a;
    unsigned int b;
} data;

static seqlock_t demo_lock;

/* 读端: 完全不加锁, 只读 sequence + 重试.
 * 对比 rwlock: 这里没有 acquire/release, 没有 cache line 争用. */
static struct shared_data read_data(void)
{
    struct shared_data snapshot;
    unsigned int seq;

    do {
        /* read_seqcount_begin: 等到 sequence 为偶数, 返回该偶数值 */
        seq = read_seqcount_begin(&demo_lock.seqcount);

        /* 读数据: 可能读到正在写的中间状态, 没关系, 下面 retry 会检测 */
        snapshot.a = data.a;
        snapshot.b = data.b;

        /* read_seqcount_retry: sequence 变了? 变了说明写过, 重读 */
    } while (read_seqcount_retry(&demo_lock.seqcount, seq));

    return snapshot;
}

/* 写端: 拿 spinlock 互斥, 然后 sequence++ ... 数据写 ... sequence++ */
static void write_data(unsigned int a, unsigned int b)
{
    unsigned long flags;

    /* write_seqlock: 内部拿 spinlock(写者互斥) + sequence++ 变奇数 */
    write_seqlock_irqsave(&demo_lock, flags);

    data.a = a;      /* 此时 sequence 为奇数, 读者若进入会忙等或重读 */
    data.b = b;

    /* write_sequnlock: sequence++ 变偶数 + 释放 spinlock */
    write_sequnlock_irqrestore(&demo_lock, flags);
}

/* 定时器: 模拟写者不停更新数据, 制造读者重试的机会 */
static struct timer_list writer_timer;
static unsigned int counter;

static void writer_timer_fn(struct timer_list *t)
{
    counter++;
    /* 维持 a = b 的不变式; 若读者读到不一致的 (a, b), 说明撞上写了 */
    write_data(counter, counter);
    mod_timer(&writer_timer, jiffies + msecs_to_jiffies(1));
}

/* /proc 读取: 读端临界区, 展示每次读是否需要重试 */
static int proc_show(struct seq_file *m, void *v)
{
    struct shared_data snap;
    unsigned int seq, retries = 0;

    /* 手动写一次带计数的读循环, 观察实际 retry 次数 */
    do {
        seq = read_seqcount_begin(&demo_lock.seqcount);
        snap.a = data.a;
        snap.b = data.b;
        retries++;
    } while (read_seqcount_retry(&demo_lock.seqcount, seq));

    seq_printf(m, "读取结果: a=%u b=%u\n", snap.a, snap.b);
    seq_printf(m, "一致性: %s\n",
               (snap.a == snap.b) ? "✓ 一致(读到稳定快照)" : "✗ 不一致(异常, retry 应保证一致)");
    seq_printf(m, "本次读循环尝试次数: %u (>=1, >1 说明撞上写者重读了)\n", retries);
    seq_printf(m, "内部计数器: %u\n", counter);
    return 0;
}

static int proc_open(struct inode *inode, struct file *file)
{
    return single_open(file, proc_show, NULL);
}

static const struct proc_ops proc_fops = {
    .proc_open = proc_open,
    .proc_read = seq_read,
    .proc_lseek = seq_lseek,
    .proc_release = single_release,
};

static int __init seqlock_demo_init(void)
{
    seqlock_init(&demo_lock);
    write_data(0, 0);

    timer_setup(&writer_timer, writer_timer_fn, 0);
    mod_timer(&writer_timer, jiffies + msecs_to_jiffies(1));

    proc_create(PROC_NAME, 0444, NULL, &proc_fops);
    pr_info("seqlock_demo: 已加载, 读 /proc/%s 观察\n", PROC_NAME);
    return 0;
}

static void __exit seqlock_demo_exit(void)
{
    del_timer_sync(&writer_timer);
    remove_proc_entry(PROC_NAME, NULL);
    pr_info("seqlock_demo: 已卸载\n");
}

module_init(seqlock_demo_init);
module_exit(seqlock_demo_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("seqlock 顺序锁演示");
