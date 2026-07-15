#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/list.h>
#include <linux/slab.h>

struct bt_device {
    char              name[16];
    uint16_t          addr;        // 模拟蓝牙地址
    struct list_head  list;        // ← 嵌入的挂钩
};

static LIST_HEAD(bt_devices);          // 声明并初始化链表头

//模块初始化函数
static int __init bt_list_init(void)
{
   struct bt_device *dev;
   pr_info("bt_list: 加载\n");
       // 创建并链入 3 个设备
    for (int i = 0; i < 3; i++) {
        dev = kzalloc(sizeof(*dev), GFP_KERNEL);
        if (!dev)
            return -ENOMEM;

        scnprintf(dev->name, sizeof(dev->name), "BT-%c", 'A' + i);
        dev->addr = 0x1000 * (i + 1);

        // 关键：把 dev->list 挂到 bt_devices 上
        INIT_LIST_HEAD(&dev->list);
        list_add(&dev->list, &bt_devices);
    }
     // 遍历：list_for_each_entry 自动用 container_of 取出宿主
    pr_info("bt_list: 当前设备链表:\n");
    list_for_each_entry(dev, &bt_devices, list) {
        pr_info("  - %s (addr=0x%04x)\n", dev->name, dev->addr);
    }
    return 0;
}

static void __exit bt_list_exit(void)
{
    struct bt_device *dev, *tmp;

    // 安全遍历+删除：边遍历边 free 必须用 _safe 版本
    list_for_each_entry_safe(dev, tmp, &bt_devices, list) {
        pr_info("bt_list: 摘除 %s\n", dev->name);
        list_del(&dev->list);
        kfree(dev);
    }
    pr_info("bt_list: 卸载\n");
}

module_init(bt_list_init);
module_exit(bt_list_exit);
MODULE_LICENSE("GPL");
MODULE_AUTHOR("kernel-student");
MODULE_DESCRIPTION("Lesson 1: intrusive list_head demo");
