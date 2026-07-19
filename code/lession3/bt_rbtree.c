#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/rbtree.h>
#include <linux/slab.h>

struct bt_device {
    u16               addr;
    char              name[16];
    struct rb_node     node;     /* ← 嵌入 rb_node 节点 */
};

static struct rb_root bt_tree = RB_ROOT; //定义一颗树

//自定义插入函数
static int bt_insert(struct rb_root *root, struct bt_device *dev)
{
    struct rb_node **new = &(root->rb_node), *parent = NULL;

    while (*new) {
        parent = *new;
        struct bt_device *cur = container_of(*new, struct bt_device, node);

        if (dev->addr < cur->addr)
            new = &((*new)->rb_left);
        else if (dev->addr > cur->addr)
            new = &((*new)->rb_right);
        else
            return -EEXIST;  /* 重复地址 */
    }

    rb_link_node(&dev->node, parent, new);
    rb_insert_color(&dev->node, root);
    return 0;
}

static int __init bt_hash_init(void)
{
    u16 addrs[10] = {0x0001, 0x0003, 0x0002, 0x0004, 0x0005, 0x0006, 0x0007, 0x0008, 0x0009, 0x000A};
    for (int i = 0; i < sizeof(addrs)/sizeof(addrs[0]); i++) {
        struct bt_device *dev = kmalloc(sizeof(*dev), GFP_KERNEL);
        if (!dev) {
            printk(KERN_ERR "bt_hash_init: failed to allocate device %d\n", i);
            return -ENOMEM;
        }
        dev->addr = addrs[i];
        snprintf(dev->name, sizeof(dev->name), "bt_dev_%d", i);
        if (bt_insert(&bt_tree, dev) < 0) {
            printk(KERN_WARNING "bt_hash_init: duplicate addr 0x%04X, skipped\n", addrs[i]);
            kfree(dev);
        }
    }
    printk("bt_hash_init: Inserted 10 devices into the red-black tree.\n");
    for (struct rb_node *node = rb_first(&bt_tree); node; node = rb_next(node)) {
        struct bt_device *dev = container_of(node, struct bt_device, node);
        printk("Device addr: 0x%04X, name: %s\n", dev->addr, dev->name);
    }
    return 0;
}

static void __exit bt_hash_exit(void)
{
    struct bt_device *pos, *n;
    rbtree_postorder_for_each_entry_safe(pos, n, &bt_tree, node) {
        kfree(pos);
    }
    bt_tree.rb_node = NULL;
}

module_init(bt_hash_init);
module_exit(bt_hash_exit);
MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Lesson 3: rbtree demo");