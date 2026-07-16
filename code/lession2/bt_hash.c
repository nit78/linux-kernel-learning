#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/list.h>        // hlist 在这里
#include <linux/hashtable.h>  // DECLARE_HASHTABLE / hash_add / hash_for_each
#include <linux/slab.h>
#include <linux/random.h>

struct bt_device {
    u16               addr;
    char              name[16];
    struct hlist_node node;     // ← 嵌入 hlist 节点
};

// 声明一个 8 桶哈希表（桶数必须是 2 的幂）
// 等价于struct hlist_head bt_table[1 << (3)]
static DECLARE_HASHTABLE(bt_table, 3);   // 2^3 = 8 个桶

static int __init bt_hash_init(void)
{
    struct bt_device *dev; //零时执行对象的指针
    u16 addrs[] = { 0x1122, 0x3344, 0x5566, 0x7788, 0x1122 + 0x8 }; // 故意制造一些冲突

    pr_info("bt_hash: 加载\n");

    for (int i = 0; i < 5; i++) {
        dev = kzalloc(sizeof(*dev), GFP_KERNEL);
        if (!dev) return -ENOMEM;
        dev->addr = addrs[i];
        scnprintf(dev->name, sizeof(dev->name), "BT-%d", i);

        // 关键：按 addr 哈希，挂进对应桶。hash_32 把值映射到 [0, 桶数)。
        hash_add(bt_table, &dev->node, dev->addr);
    }
     // 遍历整个哈希表，逐桶打印
    struct bt_device *cur;
    int bkt;
    pr_info("bt_hash: 哈希表内容:\n");
    hash_for_each(bt_table, bkt, cur, node) {
        pr_info("  bucket[%d] - %s (addr=0x%04x)\n", bkt, cur->name, cur->addr);
    }
    return 0;
}

static void __exit bt_hash_exit(void)
{
    int bkt;
    struct bt_device *cur;
    struct hlist_node *tmp;

    // 边遍历边删，必须用 _safe 版本（桶里是 hlist）
    hash_for_each_safe(bt_table, bkt, tmp, cur, node) {
        pr_info("bt_hash: 删除 %s\n", cur->name);
        hash_del(&cur->node);
        kfree(cur);
    }
    pr_info("bt_hash: 卸载\n");
}

module_init(bt_hash_init);
module_exit(bt_hash_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Lesson 2: hlist hash table demo");