class Vue {
    constructor(option) {
        this.$data = option.data
        Observe(this.$data)
        //属性代理
        Object.keys(this.$data).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                configurablea: true,
                get() {
                    return this.$data[key]
                },
                set(newValue) {
                    this.$data[key] = newValue

                }
            })
        })

        //模板编译
        Compile(option.el, this)
    }
}

//数据劫持
function Observe(obj) {

    if (!obj || !(obj instanceof Object)) return

    //创建dep实例(data每嵌套一层创建一个实例)
    const dep = new Dep()


    Object.keys(obj).forEach((key) => {
        let value = obj[key]
        Observe(value)
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,
            get() {
                //订阅watcher实例
                Dep.target && dep.addSub(Dep.target)
                return value
            },
            set(newValue) {

                value = newValue
                Observe(value)
                //通知所有订阅者更新
                dep.notify()
            }
        })

    })

}

//模板实例
function Compile(el, vm) {

    vm.$el = document.querySelector(el)

    //创建文档碎片
    const fragment = document.createDocumentFragment()
    while (childNode = vm.$el.firstChild) {
        fragment.appendChild(childNode)
    }

    //模板编译
    replace(fragment)

    //重新渲染
    vm.$el.appendChild(fragment)


    function replace(node) {
        const regMustache = /\{\{\s*(\S+)\s*\}\}/


        //node types 1:元素,2:属性节点,3:文本子节点
        if (node.nodeType === 3) {
            const text = node.textContent
            const execResult = regMustache.exec(node.textContent)
            if (execResult) {
                const value = execResult[1].split(".").reduce((newObj, key) => newObj[key], vm)
                //替换template
                node.textContent = text.replace(regMustache, value)

                //创建订阅者
                new Watcher(vm, execResult[1], (newValue) => {
                    node.textContent = text.replace(regMustache, newValue)
                })
            }
            return
        }

        if (node.nodeType === 1 && node.tagName.toUpperCase() === "INPUT") {
            const attrs = Array.from(node.attributes)
            const vModle = attrs.find((x) => x.name === 'v-model')
            if (vModle) {
                const value = vModle.value.split('.').reduce((newObj, key) => newObj[key], vm)
                node.value = value

                new Watcher(vm, vModle.value, (newValue) => {
                    node.value = newValue
                })
                //监听文本框
                node.addEventListener('input', (e) => {
                    const keyArr = vModle.value.split(".")
                    const obj = keyArr.slice(0, keyArr.length - 1).reduce((newObj, key) => newObj[key], vm)
                    obj[keyArr[keyArr.length - 1]] = e.target.value
                })
            }

        }

        node.childNodes.forEach((child) => replace(child))

    }

}

//收集类
class Dep {
    constructor() {
        this.subs = []

    }
    addSub(watcher) {
        this.subs.push(watcher)

    }
    notify() {
        this.subs.forEach((watcher) => {
            watcher.update()

        })
    }
}
//订阅者类
class Watcher {
    //data,key,回调
    constructor(vm, key, updateFun) {
        this.vm = vm
        this.key = key
        this.updateFun = updateFun


        //存入Dep实例的subs数组中
        Dep.target = this
        key.split(".").reduce((newObj, key) => newObj[key], vm)
        Dep.target = null
    }
    //调用回调

    //存在问题，只要修改了data一层中一个数据，那么这一层中所有属性都会执行刷新
    update() {
        const value = this.key.split(".").reduce((newObj, key) => newObj[key], this.vm)
        this.updateFun(value)

    }

}

// 1创建vm实例
// 2为每一层data数据创建一个dep实例，并为每个属性添加defineProperty
// 3把所有dom元素加入文档碎片
// 4遍历文档碎片通过key找出vm属性值并替换，同时创建一个订阅者实例，把替换方法传入watcher实例作为回调（此时触发get方法，将watcher加入dep实例）

// 5重新渲染页面

// 在修改属性值时将触发set：触发 dep中所有watcher的更新方法
//  重新进行替换方法（？渲染后修改内存中的文档碎片仍然能更新页面元素）



