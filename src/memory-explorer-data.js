/**
 * Memory Explorer scenario data (Chinese teaching sketch).
 * Stack/heap, RAII, smart pointers, vector growth — structure & ownership only.
 */

/** @param {Partial<{no:number,time:string,from:string,to:string,phase:string,info:string}>} e */
function ev(e) {
  return {
    no: e.no ?? 0,
    time: e.time ?? '',
    from: e.from ?? '',
    to: e.to ?? '',
    phase: e.phase ?? '',
    info: e.info ?? '',
  };
}

/**
 * @typedef {{
 *   id: string,
 *   label: string,
 *   region: 'stack'|'heap'|'static'|'code'|'gap',
 *   detail?: string,
 * }} MemBlock
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   fullName: string,
 *   category: 'layout'|'ownership'|'growth',
 *   stage: number,
 *   stageLabel: string,
 *   blurb: string,
 *   flowLegend: string,
 *   facts: { label: string, value: string }[],
 *   nodes: { id: string, label: string, role: string }[],
 *   steps: {
 *     title: string,
 *     summary: string,
 *     body: string,
 *     highlight?: string[],
 *     anim?: string,
 *     memory?: MemBlock[],
 *     events?: ReturnType<typeof ev>[],
 *   }[],
 * }} MemScenario
 */

/** @type {MemScenario[]} */
export const MEM_SCENARIOS = [
  {
    id: 'vas',
    name: '地址空间',
    fullName: '进程虚存布局（教学模型）',
    category: 'layout',
    stage: 1,
    stageLabel: '布局',
    blurb:
      '用户态进程常见分区：代码/数据、堆向上长、栈向下长，中间有未映射间隙。具体地址随 ASLR 变化；本示意为相对位置。',
    flowLegend: 'Text · Data/BSS · Heap ↑ · … · Stack ↓',
    facts: [
      { label: '栈', value: '局部 / 返回地址' },
      { label: '堆', value: 'new / malloc' },
      { label: '生长', value: '栈↓ 堆↑（常见）' },
      { label: '笔记', value: 'linux 内存分段速查' },
    ],
    nodes: [
      { id: 'cpu', label: 'CPU', role: '执行' },
      { id: 'mm', label: '虚存', role: '映射' },
      { id: 'stack', label: '栈', role: '高地址侧' },
      { id: 'heap', label: '堆', role: '低→高' },
    ],
    steps: [
      {
        title: '代码与静态区',
        summary: 'Text / Data / BSS',
        body: '可执行指令在 Text；已初始化全局/静态在 Data，未初始化或零初始化在 BSS。通常可读执行或只读，不按「帧」进出。',
        highlight: ['mm'],
        anim: 'layout',
        memory: [
          { id: 'stack', label: 'Stack', region: 'stack', detail: '（尚未深入）' },
          { id: 'gap', label: '… 间隙 / ASLR …', region: 'gap' },
          { id: 'heap', label: 'Heap', region: 'heap' },
          { id: 'bss', label: 'BSS', region: 'static', detail: '未初始化静态' },
          { id: 'data', label: 'Data', region: 'static', detail: '已初始化静态' },
          { id: 'text', label: 'Text', region: 'code', detail: '代码' },
        ],
        events: [
          ev({
            no: 1,
            time: '布局',
            from: '加载器',
            to: '虚存',
            phase: 'MAP',
            info: '映射 ELF 段到 Text/Data/BSS',
          }),
        ],
      },
      {
        title: '堆向上',
        summary: '动态分配区',
        body: 'malloc/new 从堆获取；教学模型中堆向高地址扩张。失败可能抛 bad_alloc 或返回空（视接口）。',
        highlight: ['heap', 'mm'],
        anim: 'heap',
        memory: [
          { id: 'stack', label: 'Stack', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'heap', label: 'Heap ↑ 扩张', region: 'heap', detail: '动态块' },
          { id: 'bss', label: 'BSS', region: 'static' },
          { id: 'data', label: 'Data', region: 'static' },
          { id: 'text', label: 'Text', region: 'code' },
        ],
        events: [
          ev({
            no: 2,
            time: '布局',
            from: '分配器',
            to: '堆',
            phase: 'HEAP',
            info: 'brk/mmap 背后扩展可用堆',
          }),
        ],
      },
      {
        title: '栈向下',
        summary: '调用与局部',
        body: '每次调用压栈帧（返回地址、保存的寄存器、局部）；返回则弹出。常见模型栈向低地址生长。',
        highlight: ['stack', 'cpu'],
        anim: 'stack',
        memory: [
          { id: 'stack', label: 'Stack ↓ 生长', region: 'stack', detail: '帧叠帧' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'heap', label: 'Heap', region: 'heap' },
          { id: 'bss', label: 'BSS', region: 'static' },
          { id: 'data', label: 'Data', region: 'static' },
          { id: 'text', label: 'Text', region: 'code' },
        ],
        events: [
          ev({
            no: 3,
            time: '布局',
            from: 'call',
            to: '栈',
            phase: 'STACK',
            info: '压入返回地址与帧',
          }),
        ],
      },
      {
        title: '对照直觉',
        summary: '谁在哪、谁负责释放',
        body: '栈对象随作用域自动结束；堆对象必须有明确所有者（delete、智能指针或容器）。二者相向生长，中间隔着未用空间。',
        highlight: ['stack', 'heap'],
        anim: 'layout',
        memory: [
          { id: 'stack', label: 'Stack（自动）', region: 'stack', detail: '作用域结束即释放' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'heap', label: 'Heap（显式）', region: 'heap', detail: '需所有者' },
          { id: 'static', label: 'Static', region: 'static' },
          { id: 'text', label: 'Text', region: 'code' },
        ],
        events: [
          ev({
            no: 4,
            time: '布局',
            from: '程序员',
            to: '心智模型',
            phase: 'OWN',
            info: '栈自动 · 堆要所有权',
          }),
        ],
      },
    ],
  },
  {
    id: 'stackframe',
    name: '栈帧',
    fullName: '一次函数调用在栈上留下什么',
    category: 'layout',
    stage: 2,
    stageLabel: '栈',
    blurb:
      '调用 foo() 时：参数/返回地址/保存寄存器/局部变量组成一帧。返回后帧失效——悬空引用栈对象是经典错误。',
    flowLegend: 'call · 建帧 · 使用局部 · ret 拆帧',
    facts: [
      { label: '返回地址', value: 'ret 跳回哪' },
      { label: '局部', value: '帧内槽位' },
      { label: '生命周期', value: '= 作用域' },
      { label: '禁忌', value: '返回局部指针' },
    ],
    nodes: [
      { id: 'caller', label: '调用者', role: 'main' },
      { id: 'frame', label: 'foo 帧', role: '栈上' },
      { id: 'local', label: '局部 x', role: '自动存储' },
      { id: 'ret', label: '返回', role: 'ret' },
    ],
    steps: [
      {
        title: '即将调用',
        summary: '主调方准备',
        body: '参数按约定放在寄存器或栈上；随后 call 压入返回地址。',
        highlight: ['caller'],
        anim: 'stack',
        memory: [
          { id: 'main', label: 'main 帧', region: 'stack', detail: '仍在' },
          { id: 'free', label: '（未用栈空间）', region: 'gap' },
        ],
        events: [
          ev({
            no: 1,
            time: '调用',
            from: 'main',
            to: '约定',
            phase: 'CALL',
            info: '准备参数',
          }),
        ],
      },
      {
        title: '建立 foo 帧',
        summary: '栈指针移动',
        body: 'call 之后进入 foo：保存帧指针等，为局部变量留出槽位。教学上把整块看作「foo 帧」。',
        highlight: ['caller', 'frame'],
        anim: 'stack',
        memory: [
          { id: 'foo', label: 'foo 帧', region: 'stack', detail: 'retaddr + 局部…' },
          { id: 'main', label: 'main 帧', region: 'stack' },
        ],
        events: [
          ev({
            no: 2,
            time: '调用',
            from: 'call',
            to: '栈',
            phase: 'FRAME',
            info: '压返回地址，分配局部槽',
          }),
        ],
      },
      {
        title: '使用局部对象',
        summary: '构造在帧内',
        body: '如 `std::string s` 的控制块在栈上，短字符串可能也在栈缓冲；堆缓冲另论。离开作用域会自动析构。',
        highlight: ['frame', 'local'],
        anim: 'stack',
        memory: [
          { id: 'foo', label: 'foo 帧 { s }', region: 'stack', detail: '局部存活' },
          { id: 'main', label: 'main 帧', region: 'stack' },
        ],
        events: [
          ev({
            no: 3,
            time: '调用',
            from: 'foo',
            to: '局部',
            phase: 'CTOR',
            info: '构造栈上对象',
          }),
        ],
      },
      {
        title: '返回拆帧',
        summary: '局部结束',
        body: '析构逆序运行，然后 ret。若有人保存了指向已拆帧局部的指针/引用——悬空。',
        highlight: ['ret', 'caller'],
        anim: 'stack',
        memory: [
          { id: 'main', label: 'main 帧', region: 'stack', detail: 'foo 帧已释放' },
          { id: 'free', label: '（原 foo 槽可复用）', region: 'gap' },
        ],
        events: [
          ev({
            no: 4,
            time: '返回',
            from: 'foo',
            to: '析构',
            phase: 'DTOR',
            info: '局部析构 → ret',
          }),
          ev({
            no: 5,
            time: '返回',
            from: 'ret',
            to: 'main',
            phase: 'FRAME',
            info: '栈指针恢复',
          }),
        ],
      },
    ],
  },
  {
    id: 'heapnew',
    name: '堆分配',
    fullName: 'new / delete 与所有者',
    category: 'layout',
    stage: 3,
    stageLabel: '堆',
    blurb:
      'new 在堆上创建对象并返回指针；必须有人 delete（或交由智能指针/容器）。忘记释放→泄漏；重复释放/用已释放→未定义行为。',
    flowLegend: 'new · 指针持有 · 使用 · delete',
    facts: [
      { label: '得到', value: 'T*' },
      { label: '责任', value: '谁释放' },
      { label: '现代', value: '优先智能指针' },
      { label: '数组', value: 'new[] / delete[]' },
    ],
    nodes: [
      { id: 'code', label: '代码', role: 'new Expr' },
      { id: 'heap', label: '堆块', role: '对象' },
      { id: 'ptr', label: '指针 p', role: '栈上' },
      { id: 'del', label: 'delete', role: '释放' },
    ],
    steps: [
      {
        title: 'new 分配',
        summary: '堆上构造',
        body: '`p = new T(...)`：分配存储并调用构造函数；p 通常在栈上保存地址。',
        highlight: ['code', 'heap', 'ptr'],
        anim: 'heap',
        memory: [
          { id: 'ptr', label: 'p →', region: 'stack', detail: '指针变量' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'obj', label: 'T 对象', region: 'heap', detail: 'new 出来' },
        ],
        events: [
          ev({
            no: 1,
            time: '堆',
            from: 'new',
            to: '堆',
            phase: 'ALLOC',
            info: '分配 + 构造',
          }),
          ev({
            no: 2,
            time: '堆',
            from: 'new',
            to: 'p',
            phase: 'PTR',
            info: 'p 保存地址',
          }),
        ],
      },
      {
        title: '经指针使用',
        summary: '访问堆对象',
        body: '通过 p 读写。此时所有权仍模糊——只是「有一个裸指针知道地址」。',
        highlight: ['ptr', 'heap'],
        anim: 'heap',
        memory: [
          { id: 'ptr', label: 'p →', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'obj', label: 'T（使用中）', region: 'heap' },
        ],
        events: [
          ev({
            no: 3,
            time: '堆',
            from: 'p',
            to: '对象',
            phase: 'USE',
            info: '*p 读写',
          }),
        ],
      },
      {
        title: 'delete 释放',
        summary: '析构 + 还存储',
        body: '`delete p` 先析构再释放堆块。之后 p 成悬空指针，应置空或结束其生命周期。',
        highlight: ['del', 'heap'],
        anim: 'heap',
        memory: [
          { id: 'ptr', label: 'p（悬空！）', region: 'stack', detail: '勿再解引用' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'free', label: '（已归还堆）', region: 'gap', detail: '原 T 块' },
        ],
        events: [
          ev({
            no: 4,
            time: '堆',
            from: 'delete',
            to: '对象',
            phase: 'DTOR',
            info: '析构',
          }),
          ev({
            no: 5,
            time: '堆',
            from: 'delete',
            to: '分配器',
            phase: 'FREE',
            info: '归还存储',
          }),
        ],
      },
      {
        title: '所有权教训',
        summary: '裸指针难表达「谁负责」',
        body: '现代 C++ 用 unique_ptr/shared_ptr/容器把释放绑到对象生命周期，避免手工配对 new/delete。',
        highlight: ['code', 'ptr'],
        anim: 'layout',
        memory: [
          { id: 'hint', label: '→ 改用智能指针', region: 'static', detail: '下一场景' },
          { id: 'gap', label: '…', region: 'gap' },
        ],
        events: [
          ev({
            no: 6,
            time: '堆',
            from: '设计',
            to: 'API',
            phase: 'OWN',
            info: '优先唯一/共享所有权类型',
          }),
        ],
      },
    ],
  },
  {
    id: 'raii',
    name: 'RAII',
    fullName: '资源获取即初始化',
    category: 'ownership',
    stage: 4,
    stageLabel: '所有权',
    blurb:
      '把资源寿命绑在对象作用域：构造获取，析构释放。异常栈展开时也会调析构，因此比手工 new/delete 更安全。',
    flowLegend: '构造获取 · 使用 · 离开作用域 · 析构释放',
    facts: [
      { label: '获取', value: '构造函数' },
      { label: '释放', value: '析构函数' },
      { label: '触发', value: '作用域结束/展开' },
      { label: '例子', value: 'lock_guard / fstream' },
    ],
    nodes: [
      { id: 'scope', label: '作用域 { }', role: '栈帧' },
      { id: 'obj', label: 'RAII 对象', role: '栈上' },
      { id: 'res', label: '资源', role: '文件/锁/堆' },
      { id: 'dtor', label: '析构', role: '~T()' },
    ],
    steps: [
      {
        title: '进入作用域',
        summary: '准备局部对象',
        body: '例如 `std::lock_guard<mutex> g(m);` 或自定义 File 包装：对象将在此 `{ }` 内生存。',
        highlight: ['scope'],
        anim: 'stack',
        memory: [
          { id: 'frame', label: '当前帧', region: 'stack', detail: '即将构造 g' },
        ],
        events: [
          ev({
            no: 1,
            time: 'RAII',
            from: '控制流',
            to: '作用域',
            phase: 'SCOPE',
            info: '进入 {',
          }),
        ],
      },
      {
        title: '构造即获取',
        summary: '资源到手',
        body: '构造函数里 lock / open / new。若获取失败应抛异常，避免「半开」对象。',
        highlight: ['obj', 'res'],
        anim: 'heap',
        memory: [
          { id: 'g', label: 'guard g', region: 'stack', detail: '持有锁/句柄' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'res', label: '资源（已获取）', region: 'heap', detail: '或内核对象' },
        ],
        events: [
          ev({
            no: 2,
            time: 'RAII',
            from: 'ctor',
            to: '资源',
            phase: 'ACQUIRE',
            info: 'lock/open/new…',
          }),
        ],
      },
      {
        title: '作用域内使用',
        summary: '不必手写配对释放',
        body: '业务代码使用资源。无论正常走到末尾还是中途 throw，只要栈展开经过该帧，就会析构。',
        highlight: ['obj', 'scope'],
        anim: 'stack',
        memory: [
          { id: 'g', label: 'guard g（活跃）', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'res', label: '资源', region: 'heap' },
        ],
        events: [
          ev({
            no: 3,
            time: 'RAII',
            from: '业务',
            to: '资源',
            phase: 'USE',
            info: '使用中；释放已预约在 dtor',
          }),
        ],
      },
      {
        title: '析构即释放',
        summary: '离开 } 或异常展开',
        body: '析构函数 unlock/close/delete。RAII 把「何时释放」从业务路径里拿掉，减少遗漏。',
        highlight: ['dtor', 'res'],
        anim: 'stack',
        memory: [
          { id: 'frame', label: '帧（g 已析构）', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'freed', label: '资源已释放', region: 'gap' },
        ],
        events: [
          ev({
            no: 4,
            time: 'RAII',
            from: '}',
            to: 'dtor',
            phase: 'RELEASE',
            info: '自动释放资源',
          }),
        ],
      },
    ],
  },
  {
    id: 'unique',
    name: 'unique_ptr',
    fullName: '独占所有权',
    category: 'ownership',
    stage: 5,
    stageLabel: '智能指针',
    blurb:
      '同一时刻至多一个 unique_ptr 拥有对象。移动转移所有权，不可拷贝。离开作用域自动 delete。',
    flowLegend: 'make_unique · 使用 · move 转移 · 析构释放',
    facts: [
      { label: '创建', value: 'make_unique' },
      { label: '拷贝', value: '删除' },
      { label: '移动', value: '所有权交接' },
      { label: '空', value: 'nullptr 可表示空' },
    ],
    nodes: [
      { id: 'u1', label: 'up', role: '拥有者' },
      { id: 'obj', label: 'T', role: '堆对象' },
      { id: 'u2', label: 'up2', role: '接收方' },
      { id: 'empty', label: '（空）', role: 'moved-from' },
    ],
    steps: [
      {
        title: '创建独占指针',
        summary: 'make_unique<T>',
        body: '`auto up = std::make_unique<T>(...)`：堆上 T，由 up 独占。',
        highlight: ['u1', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'up', label: 'up 独占 →', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 't', label: 'T', region: 'heap' },
        ],
        events: [
          ev({
            no: 1,
            time: 'unique',
            from: 'make_unique',
            to: '堆',
            phase: 'ALLOC',
            info: '创建 T，up 持有',
          }),
        ],
      },
      {
        title: '移动移交',
        summary: 'up2 = std::move(up)',
        body: '移动后 up2 拥有对象，up 变为空。禁止两个 unique_ptr 同时指向同一对象。',
        highlight: ['u1', 'u2', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'up', label: 'up = null', region: 'stack', detail: 'moved-from' },
          { id: 'up2', label: 'up2 独占 →', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 't', label: 'T', region: 'heap' },
        ],
        events: [
          ev({
            no: 2,
            time: 'unique',
            from: 'up',
            to: 'up2',
            phase: 'MOVE',
            info: '所有权转移',
          }),
        ],
      },
      {
        title: '接收方析构',
        summary: '自动 delete',
        body: 'up2 离开作用域（或 reset）时删除 T。无需手写 delete。',
        highlight: ['u2', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'up2', label: 'up2 结束', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'gone', label: 'T 已 delete', region: 'gap' },
        ],
        events: [
          ev({
            no: 3,
            time: 'unique',
            from: 'up2 dtor',
            to: 'T',
            phase: 'FREE',
            info: '自动释放',
          }),
        ],
      },
      {
        title: '适用场景',
        summary: '工厂返回、成员独占',
        body: '表达「这块内存只有一个主人」。共享只读观察可用裸指针/引用（不拥有），共享所有权才上 shared_ptr。',
        highlight: ['u1', 'empty'],
        anim: 'layout',
        memory: [
          { id: 'hint', label: '默认先 unique', region: 'static', detail: '能独就不共' },
        ],
        events: [
          ev({
            no: 4,
            time: 'unique',
            from: '设计',
            to: 'API',
            phase: 'OWN',
            info: '返回 unique_ptr 交接所有权',
          }),
        ],
      },
    ],
  },
  {
    id: 'shared',
    name: 'shared_ptr',
    fullName: '共享所有权与 weak_ptr',
    category: 'ownership',
    stage: 6,
    stageLabel: '智能指针',
    blurb:
      '多个 shared_ptr 共享同一对象，控制块记引用计数；最后一个析构时释放。环状引用需 weak_ptr 打破。',
    flowLegend: 'make_shared · 拷贝 +1 · 析构 -1 · weak 观察',
    facts: [
      { label: '控制块', value: '引用计数等' },
      { label: '拷贝', value: '共享 +1' },
      { label: 'weak', value: '不增强引用' },
      { label: '风险', value: '环→泄漏' },
    ],
    nodes: [
      { id: 'a', label: 'spA', role: '共享者' },
      { id: 'b', label: 'spB', role: '共享者' },
      { id: 'ctrl', label: '控制块', role: 'refcount' },
      { id: 'obj', label: 'T', role: '堆对象' },
      { id: 'w', label: 'wp', role: 'weak' },
    ],
    steps: [
      {
        title: '创建共享',
        summary: 'make_shared',
        body: '一次分配（常含控制块）。use_count == 1。',
        highlight: ['a', 'ctrl', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'spa', label: 'spA', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'cb', label: '控制块 count=1', region: 'heap' },
          { id: 't', label: 'T', region: 'heap' },
        ],
        events: [
          ev({
            no: 1,
            time: 'shared',
            from: 'make_shared',
            to: '控制块+T',
            phase: 'ALLOC',
            info: 'count=1',
          }),
        ],
      },
      {
        title: '拷贝共享',
        summary: 'spB = spA',
        body: '拷贝 shared_ptr 使 count++。两者均可使用 T。',
        highlight: ['a', 'b', 'ctrl'],
        anim: 'heap',
        memory: [
          { id: 'spa', label: 'spA', region: 'stack' },
          { id: 'spb', label: 'spB', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'cb', label: '控制块 count=2', region: 'heap' },
          { id: 't', label: 'T', region: 'heap' },
        ],
        events: [
          ev({
            no: 2,
            time: 'shared',
            from: '拷贝',
            to: '控制块',
            phase: 'REF+',
            info: 'count 1→2',
          }),
        ],
      },
      {
        title: 'weak 观察',
        summary: '不延长寿命',
        body: '`weak_ptr wp = spA` 不增加强引用。lock() 时若对象还在则提升为 shared_ptr，否则为空。',
        highlight: ['w', 'ctrl', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'spa', label: 'spA', region: 'stack' },
          { id: 'wp', label: 'wp（弱）', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'cb', label: '强=2 弱≥1', region: 'heap' },
          { id: 't', label: 'T', region: 'heap' },
        ],
        events: [
          ev({
            no: 3,
            time: 'shared',
            from: 'weak_ptr',
            to: '控制块',
            phase: 'WEAK',
            info: '不增加 use_count',
          }),
        ],
      },
      {
        title: '计数归零',
        summary: '释放对象',
        body: '所有强引用析构后释放 T。若 A↔B 互相 shared_ptr，计数永不为 0——环；一侧改 weak 可破。',
        highlight: ['ctrl', 'obj'],
        anim: 'heap',
        memory: [
          { id: 'gone', label: '强引用已无', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'freed', label: 'T 已释放', region: 'gap', detail: '控制块或仍为弱留存' },
        ],
        events: [
          ev({
            no: 4,
            time: 'shared',
            from: '最后 dtor',
            to: 'T',
            phase: 'REF0',
            info: 'count→0，释放对象',
          }),
        ],
      },
    ],
  },
  {
    id: 'vector',
    name: 'vector 扩容',
    fullName: '连续缓冲的重新分配',
    category: 'growth',
    stage: 7,
    stageLabel: '容器',
    blurb:
      'vector 在堆上维护连续数组。容量不足时分配更大缓冲、移动/拷贝元素、释放旧块——迭代器/引用/指针可能全部失效。',
    flowLegend: 'size/cap · push · 扩容 · 失效',
    facts: [
      { label: 'size', value: '元素个数' },
      { label: 'capacity', value: '已分配槽' },
      { label: '增长', value: '常几何级' },
      { label: '失效', value: '扩容后指针废' },
    ],
    nodes: [
      { id: 'vec', label: 'vector', role: '对象（可在栈）' },
      { id: 'buf', label: '缓冲', role: '堆' },
      { id: 'newbuf', label: '新缓冲', role: '堆' },
      { id: 'iter', label: '迭代器', role: '观察者' },
    ],
    steps: [
      {
        title: '有余量',
        summary: 'size < capacity',
        body: 'push_back 在末尾构造，size++。缓冲地址不变，既有引用仍有效。',
        highlight: ['vec', 'buf'],
        anim: 'heap',
        memory: [
          { id: 'v', label: 'vector 三指针', region: 'stack', detail: 'begin/size/cap' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'buf', label: '[a b c _ _]', region: 'heap', detail: 'size=3 cap=5' },
        ],
        events: [
          ev({
            no: 1,
            time: 'vector',
            from: 'push_back',
            to: '缓冲',
            phase: 'INPLACE',
            info: '就地构造，无重分配',
          }),
        ],
      },
      {
        title: '容量用尽',
        summary: '触发扩容',
        body: '再 push 时 size==cap：分配更大堆块（示意 ×2），把旧元素搬迁过去。',
        highlight: ['buf', 'newbuf'],
        anim: 'heap',
        memory: [
          { id: 'v', label: 'vector', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'old', label: '旧 [a b c d e]', region: 'heap', detail: '即将搬迁' },
          { id: 'neu', label: '新 [     …    ]', region: 'heap', detail: '更大 cap' },
        ],
        events: [
          ev({
            no: 2,
            time: 'vector',
            from: '分配器',
            to: '新缓冲',
            phase: 'REALLOC',
            info: '申请更大连续内存',
          }),
        ],
      },
      {
        title: '搬迁与释放旧块',
        summary: '移动/拷贝元素',
        body: '逐个移动（或拷贝）到新缓冲，析构旧元素并 deallocate 旧块。vector 内部指针改指向新缓冲。',
        highlight: ['vec', 'newbuf'],
        anim: 'heap',
        memory: [
          { id: 'v', label: 'vector → 新', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'dead', label: '旧块已释放', region: 'gap' },
          { id: 'neu', label: '[a b c d e f _ _ …]', region: 'heap', detail: 'size=6' },
        ],
        events: [
          ev({
            no: 3,
            time: 'vector',
            from: '旧缓冲',
            to: '新缓冲',
            phase: 'MOVE',
            info: '元素搬迁',
          }),
          ev({
            no: 4,
            time: 'vector',
            from: 'vector',
            to: '旧缓冲',
            phase: 'FREE',
            info: 'deallocate 旧块',
          }),
        ],
      },
      {
        title: '迭代器失效',
        summary: '扩容后勿用旧指针',
        body: '指向旧缓冲的 iterator/引用/指针全部失效。扩容前可 reserve 降低重分配次数。',
        highlight: ['iter', 'vec'],
        anim: 'layout',
        memory: [
          { id: 'it', label: '旧 it（悬空）', region: 'stack', detail: '勿解引用' },
          { id: 'v', label: 'vector', region: 'stack' },
          { id: 'gap', label: '…', region: 'gap' },
          { id: 'neu', label: '现行缓冲', region: 'heap' },
        ],
        events: [
          ev({
            no: 5,
            time: 'vector',
            from: '规则',
            to: '调用方',
            phase: 'INVALID',
            info: '重分配 ⇒ 迭代器失效',
          }),
        ],
      },
    ],
  },
];

export const MEM_CATEGORY_LABELS = {
  all: '全部',
  layout: '布局',
  ownership: '所有权',
  growth: '容器增长',
};

export const MEM_STAGES = [
  { n: 1, name: '虚存布局' },
  { n: 2, name: '栈帧' },
  { n: 3, name: '堆' },
  { n: 4, name: 'RAII' },
  { n: 5, name: 'unique' },
  { n: 6, name: 'shared' },
  { n: 7, name: 'vector' },
];
