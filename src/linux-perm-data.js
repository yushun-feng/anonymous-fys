/**
 * Linux permissions explorer data (Chinese teaching sketch).
 * Structure & motivation only — no exploit steps.
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
 *   name: string,
 *   fullName: string,
 *   category: 'basics' | 'bits' | 'acl' | 'practice',
 *   stage: number,
 *   stageLabel: string,
 *   blurb: string,
 *   flowLegend: string,
 *   facts: { label: string, value: string }[],
 *   modeDemo?: { path: string, ls: string, octal: string, explain: string }[],
 *   nodes: { id: string, label: string, role: string }[],
 *   steps: {
 *     title: string,
 *     summary: string,
 *     body: string,
 *     highlight?: string[],
 *     modeFocus?: number,
 *     anim?: string,
 *     events?: ReturnType<typeof ev>[],
 *   }[],
 * }} PermScenario
 */

/** @type {PermScenario[]} */
export const PERM_SCENARIOS = [
  {
    id: 'rwx',
    name: 'rwx 基础',
    fullName: '所有者 / 组 / 其他人',
    category: 'basics',
    stage: 1,
    stageLabel: '三类身份',
    blurb:
      '每个文件有所有者与所属组；权限按「拥有者、同组、其他人」三组 rwx 解释。目录的 x 表示能否穿越。',
    flowLegend: 'user · group · other · rwx',
    facts: [
      { label: '读 r', value: '读内容 / 列目录' },
      { label: '写 w', value: '改内容 / 增删项' },
      { label: '执行 x', value: '运行 / 穿越目录' },
      { label: '查看', value: 'ls -l' },
    ],
    modeDemo: [
      {
        path: 'notes.txt',
        ls: '-rw-r--r--  alice  students',
        octal: '644',
        explain: '主人读写；组与其他人只读',
      },
      {
        path: 'script.sh',
        ls: '-rwxr-xr-x  alice  students',
        octal: '755',
        explain: '主人可执行；他人可读执行',
      },
      {
        path: 'secrets/',
        ls: 'drwx--x---  alice  students',
        octal: '710',
        explain: '目录：组可穿越但不列目录；其他人无',
      },
      {
        path: 'open/',
        ls: 'drwxr-xr-x  alice  students',
        octal: '755',
        explain: '常见目录：人人可进可列，仅主人可改',
      },
    ],
    nodes: [
      { id: 'owner', label: '拥有者', role: 'u' },
      { id: 'group', label: '所属组', role: 'g' },
      { id: 'other', label: '其他人', role: 'o' },
      { id: 'file', label: '文件/目录', role: 'inode' },
    ],
    steps: [
      {
        title: '三组权限',
        summary: 'ls -l 左边那串',
        body: '形如 -rwxr-xr--：类型位后每 3 个字符一组，依次对应用户、组、其他人。',
        highlight: ['owner', 'group', 'other', 'file'],
        modeFocus: 0,
        anim: 'disk',
        events: [
          ev({
            no: 1,
            time: '读法',
            from: 'ls -l',
            to: 'inode',
            phase: 'MODE',
            info: '类型 + 9 位权限 + 所有者 + 组',
          }),
        ],
      },
      {
        title: '文件上的 rwx',
        summary: '读内容 / 改内容 / 当程序跑',
        body: 'r 读字节；w 截断或改写；x 允许以该文件为程序入口（脚本还需解释器可读）。',
        highlight: ['file', 'owner'],
        modeFocus: 1,
        anim: 'service',
        events: [
          ev({
            no: 2,
            time: '读法',
            from: '进程',
            to: '文件',
            phase: 'MODE',
            info: '按有效身份匹配 u/g/o 之一',
          }),
        ],
      },
      {
        title: '目录上的 rwx',
        summary: '列、改目录、穿越',
        body: '目录的 r≈可否列举名字；w≈可否创建/删/改名（常要 x）；x≈可否进入或把路径组件用作穿越。',
        highlight: ['file', 'group'],
        modeFocus: 2,
        anim: 'mount',
        events: [
          ev({
            no: 3,
            time: '读法',
            from: 'cd / ls',
            to: '目录',
            phase: 'MODE',
            info: '无 x 则路径走不通',
          }),
        ],
      },
      {
        title: '身份如何选中',
        summary: '先主人，再组，再其他人',
        body: '若你是拥有者只用 u 那组；否则若在所属组用 g；否则用 o。不会「三组合并取并集」。',
        highlight: ['owner', 'group', 'other'],
        modeFocus: 3,
        anim: 'service',
        events: [
          ev({
            no: 4,
            time: '读法',
            from: '凭证',
            to: '权限位',
            phase: 'MODE',
            info: '命中一类身份后只看该类三位',
          }),
        ],
      },
    ],
  },
  {
    id: 'octal',
    name: '八进制与 chmod',
    fullName: '数字模式与符号模式',
    category: 'basics',
    stage: 2,
    stageLabel: '怎么改',
    blurb:
      'chmod 可用 755 这类八进制，也可用 u+x、g-w 符号式。umask 决定「新建文件默认抹掉哪些位」。',
    flowLegend: 'chmod · chown · umask · ls -l',
    facts: [
      { label: 'r', value: '4' },
      { label: 'w', value: '2' },
      { label: 'x', value: '1' },
      { label: '示例', value: '7=rwx 6=rw- 5=r-x' },
    ],
    modeDemo: [
      {
        path: 'chmod 644 f',
        ls: '-rw-r--r--',
        octal: '644',
        explain: '6=rw- · 4=r-- · 4=r--',
      },
      {
        path: 'chmod 755 d',
        ls: 'drwxr-xr-x',
        octal: '755',
        explain: '目录常见：主人满权，他人 rx',
      },
      {
        path: 'chmod u+x g-w o=',
        ls: '符号模式',
        octal: '—',
        explain: '精确加减某一类身份的位',
      },
      {
        path: 'umask 022',
        ls: '新建默认',
        octal: '≈755/644',
        explain: '从满权模板减去 umask',
      },
    ],
    nodes: [
      { id: 'admin', label: '操作者', role: 'chmod' },
      { id: 'mode', label: '模式位', role: 'mode_t' },
      { id: 'file', label: '目标', role: '路径' },
      { id: 'umask', label: 'umask', role: '默认掩码' },
    ],
    steps: [
      {
        title: '每位对应数字',
        summary: 'r=4 w=2 x=1',
        body: '一组三位加成 0–7。644 = 6|4|4 → rw-r--r--。先写清三类身份再换算。',
        highlight: ['mode'],
        modeFocus: 0,
        anim: 'disk',
        events: [
          ev({
            no: 1,
            time: '换算',
            from: '心算',
            to: '八进制',
            phase: 'CHMOD',
            info: '每组独立相加',
          }),
        ],
      },
      {
        title: 'chmod 数字式',
        summary: '一次设满 9 位',
        body: 'chmod 755 script.sh 直接写入新模式（受能力与所有权约束：通常仅主人或 root）。',
        highlight: ['admin', 'file'],
        modeFocus: 1,
        anim: 'service',
        events: [
          ev({
            no: 2,
            time: '修改',
            from: 'chmod',
            to: 'inode',
            phase: 'CHMOD',
            info: '更新 mode 位',
          }),
        ],
      },
      {
        title: '符号式',
        summary: 'u/g/o/a 与 +-=',
        body: 'chmod u+x,g-w,o= file 适合「在现有基础上微调」。a 表示 all。',
        highlight: ['admin', 'mode'],
        modeFocus: 2,
        anim: 'service',
        events: [
          ev({
            no: 3,
            time: '修改',
            from: '符号',
            to: 'mode',
            phase: 'CHMOD',
            info: '按类加减位',
          }),
        ],
      },
      {
        title: 'umask',
        summary: '新建默认权限',
        body: '创建文件/目录时内核用满权模板（文件常 666，目录 777）减去进程 umask。022 很常见。',
        highlight: ['umask', 'file'],
        modeFocus: 3,
        anim: 'mount',
        events: [
          ev({
            no: 4,
            time: '新建',
            from: 'umask',
            to: '新 inode',
            phase: 'CHMOD',
            info: '默认权限 = 模板 & ~umask',
          }),
        ],
      },
    ],
  },
  {
    id: 'special',
    name: '特殊位',
    fullName: 'SUID · SGID · Sticky',
    category: 'bits',
    stage: 3,
    stageLabel: '特殊模式位',
    blurb:
      '额外三位改变执行或目录语义：SUID/SGID 影响「以谁的身份跑」，Sticky 常见于 /tmp。只讲结构与动机，不讲利用。',
    flowLegend: 'SUID · SGID · Sticky · ls 显示',
    facts: [
      { label: 'SUID', value: '文件：以主人 UID 跑' },
      { label: 'SGID', value: '文件：以组跑；目录：继承组' },
      { label: 'Sticky', value: '目录：只能删自己的' },
      { label: '八进制', value: '前置位 4/2/1' },
    ],
    modeDemo: [
      {
        path: '/usr/bin/passwd',
        ls: '-rwsr-xr-x',
        octal: '4755',
        explain: 'SUID：示意（发行版真实位以本机为准）',
      },
      {
        path: 'shared/',
        ls: 'drwxrwsr-x',
        octal: '2775',
        explain: 'SGID 目录：新建文件继承目录组',
      },
      {
        path: '/tmp',
        ls: 'drwxrwxrwt',
        octal: '1777',
        explain: 'Sticky：防删他人临时文件',
      },
      {
        path: 'ls 大写 S/T',
        ls: '---S--S--T',
        octal: '提示',
        explain: '对应 x 未设时特殊位显示为大写',
      },
    ],
    nodes: [
      { id: 'suid', label: 'SUID', role: '4xxx' },
      { id: 'sgid', label: 'SGID', role: '2xxx' },
      { id: 'sticky', label: 'Sticky', role: '1xxx' },
      { id: 'file', label: '目标', role: '文件/目录' },
    ],
    steps: [
      {
        title: 'SUID 直觉',
        summary: '执行时像主人',
        body: '设在可执行文件上时，进程有效用户可变为文件拥有者——因此必须严格控制谁能写该文件。',
        highlight: ['suid', 'file'],
        modeFocus: 0,
        anim: 'service',
        events: [
          ev({
            no: 1,
            time: '特殊位',
            from: 'exec',
            to: '凭证',
            phase: 'SPECIAL',
            info: '有效 UID 可能切换到主人',
          }),
        ],
      },
      {
        title: 'SGID 直觉',
        summary: '文件与目录含义不同',
        body: '文件：以文件组身份运行；目录：新建条目默认继承目录的组，方便协作目录。',
        highlight: ['sgid', 'file'],
        modeFocus: 1,
        anim: 'disk',
        events: [
          ev({
            no: 2,
            time: '特殊位',
            from: '新建',
            to: '目录组',
            phase: 'SPECIAL',
            info: '协作目录常用 2775 一类',
          }),
        ],
      },
      {
        title: 'Sticky 直觉',
        summary: '/tmp 为什么安全一点',
        body: '对他人可写的目录，粘滞位限制「只能删自己的条目」，避免随手删掉别人的临时文件。',
        highlight: ['sticky', 'file'],
        modeFocus: 2,
        anim: 'mount',
        events: [
          ev({
            no: 3,
            time: '特殊位',
            from: 'unlink',
            to: '/tmp',
            phase: 'SPECIAL',
            info: '非主人/非 root 不能乱删',
          }),
        ],
      },
      {
        title: '怎么认',
        summary: 's/t 与八进制千位',
        body: 'ls 用 s/t 替换 x 位；若无 x 则显示 S/T。八进制写成 4755、2775、1777 等形式。',
        highlight: ['suid', 'sgid', 'sticky'],
        modeFocus: 3,
        anim: 'disk',
        events: [
          ev({
            no: 4,
            time: '特殊位',
            from: 'ls -l',
            to: '眼睛',
            phase: 'SPECIAL',
            info: '看第 4/7/10 字符与前导数字',
          }),
        ],
      },
    ],
  },
  {
    id: 'decision',
    name: '判定流程',
    fullName: '一次 open 如何判权限',
    category: 'practice',
    stage: 4,
    stageLabel: '访问判定',
    blurb:
      '把「进程凭证 × inode 权限」收成一条判定链。root 能力、ACL、挂载选项会加例外——此处给 POSIX 基础模型。',
    flowLegend: '凭证 · 选 u/g/o · 检查位 · 允许/拒绝',
    facts: [
      { label: 'UID/GID', value: '进程凭证' },
      { label: '能力', value: 'root 常绕过 DAC' },
      { label: 'ACL', value: '可扩展（另篇）' },
      { label: '挂载', value: 'nodev/nosuid…' },
    ],
    modeDemo: [
      {
        path: '进程 uid=1000',
        ls: '文件 alice:students 644',
        octal: '命中 u',
        explain: 'alice 本人 → 看 rw-',
      },
      {
        path: '进程 uid=2000 组含 students',
        ls: '同文件 644',
        octal: '命中 g',
        explain: '非主人但同组 → 看 r--',
      },
      {
        path: '路人',
        ls: '同文件 644',
        octal: '命中 o',
        explain: '其他人 → 看 r--',
      },
      {
        path: '目录无 x',
        ls: 'drw-r--r--',
        octal: '拒绝穿越',
        explain: '即使文件本身 777 也走不到',
      },
    ],
    nodes: [
      { id: 'proc', label: '进程', role: '凭证' },
      { id: 'inode', label: 'inode', role: 'mode' },
      { id: 'kernel', label: '内核', role: '判定' },
      { id: 'result', label: '结果', role: '允许/EACCES' },
    ],
    steps: [
      {
        title: '收集凭证',
        summary: '有效 UID/GID 与附加组',
        body: '内核看有效用户、有效组及附加组列表，作为匹配身份的输入。',
        highlight: ['proc', 'kernel'],
        modeFocus: 0,
        anim: 'service',
        events: [
          ev({
            no: 1,
            time: '判定',
            from: '进程',
            to: '内核',
            phase: 'DAC',
            info: 'uid/euid/gid/groups',
          }),
        ],
      },
      {
        title: '选中一类身份',
        summary: 'u → g → o',
        body: '与文件主人相同则用 u；否则若组匹配用 g；否则 o。只启用一类。',
        highlight: ['inode', 'kernel'],
        modeFocus: 1,
        anim: 'disk',
        events: [
          ev({
            no: 2,
            time: '判定',
            from: '内核',
            to: 'mode',
            phase: 'DAC',
            info: '选择 u/g/o 三元组',
          }),
        ],
      },
      {
        title: '检查需要的位',
        summary: '读要 r，写要 w…',
        body: '按系统调用语义检查对应位。路径上每一层目录都要有合适的 x（穿越）。',
        highlight: ['kernel', 'inode'],
        modeFocus: 3,
        anim: 'mount',
        events: [
          ev({
            no: 3,
            time: '判定',
            from: '路径组件',
            to: '目录 x',
            phase: 'DAC',
            info: '逐级穿越检查',
          }),
        ],
      },
      {
        title: '允许或拒绝',
        summary: '成功或 EACCES',
        body: '失败返回权限错误。root 或具备能力时可能绕过经典 DAC——生产环境还要考虑强制访问控制，本示意从略。',
        highlight: ['result'],
        modeFocus: 2,
        anim: 'service',
        events: [
          ev({
            no: 4,
            time: '判定',
            from: '内核',
            to: '调用方',
            phase: 'DAC',
            info: '允许继续 / EACCES',
          }),
        ],
      },
    ],
  },
  {
    id: 'acl',
    name: 'ACL 速览',
    fullName: '访问控制列表扩展',
    category: 'acl',
    stage: 5,
    stageLabel: '超出 rwx',
    blurb:
      '当「一人一组」不够时，POSIX ACL 可给额外用户/组授权。getfacl/setfacl 是常见工具；掩码位影响显示与生效。',
    flowLegend: 'user · group · mask · other · default',
    facts: [
      { label: '查看', value: 'getfacl' },
      { label: '设置', value: 'setfacl' },
      { label: '掩码', value: 'mask::' },
      { label: '默认', value: '目录 default:' },
    ],
    modeDemo: [
      {
        path: 'getfacl file',
        ls: 'user::rw-\ngroup::r--\nother::---',
        octal: '基础',
        explain: '无扩展项时接近经典模式',
      },
      {
        path: '额外用户',
        ls: 'user:bob:rwx',
        octal: 'ACL',
        explain: '给 bob 单独授权',
      },
      {
        path: 'mask',
        ls: 'mask::r-x',
        octal: '上限',
        explain: '限制组与命名用户有效权',
      },
      {
        path: 'default ACL',
        ls: 'default:user:bob:rwx',
        octal: '继承',
        explain: '目录下新建对象可继承',
      },
    ],
    nodes: [
      { id: 'acl', label: 'ACL', role: '扩展项' },
      { id: 'mask', label: 'mask', role: '有效上限' },
      { id: 'file', label: '文件', role: '客体' },
      { id: 'bob', label: 'bob', role: '命名用户' },
    ],
    steps: [
      {
        title: '为何需要 ACL',
        summary: '不止一个组',
        body: '项目要临时给某用户写权限、又不想改所属组时，命名用户 ACL 更干净。',
        highlight: ['acl', 'bob'],
        modeFocus: 1,
        anim: 'service',
        events: [
          ev({
            no: 1,
            time: 'ACL',
            from: '需求',
            to: '命名用户',
            phase: 'ACL',
            info: '精确授权',
          }),
        ],
      },
      {
        title: 'mask 的角色',
        summary: '有效权限上限',
        body: 'mask 限制「组类」与命名项的有效权限；ls 显示可能与 getfacl 有效权不同，以 getfacl 为准排查。',
        highlight: ['mask', 'acl'],
        modeFocus: 2,
        anim: 'disk',
        events: [
          ev({
            no: 2,
            time: 'ACL',
            from: 'mask',
            to: '有效权',
            phase: 'ACL',
            info: 'named & group 受 mask 约束',
          }),
        ],
      },
      {
        title: '默认 ACL',
        summary: '目录继承',
        body: '在目录设 default: 项，新建文件/子目录可自动带上预设 ACL，适合协作树。',
        highlight: ['acl', 'file'],
        modeFocus: 3,
        anim: 'mount',
        events: [
          ev({
            no: 3,
            time: 'ACL',
            from: '目录 default',
            to: '新文件',
            phase: 'ACL',
            info: '继承策略',
          }),
        ],
      },
      {
        title: '与经典模式共存',
        summary: '先有心智再上工具',
        body: '仍应先精通 rwx/八进制；ACL 是扩展。部分备份工具需显式保留 ACL。',
        highlight: ['file'],
        modeFocus: 0,
        anim: 'disk',
        events: [
          ev({
            no: 4,
            time: 'ACL',
            from: '管理员',
            to: '文档',
            phase: 'ACL',
            info: 'getfacl / setfacl 为接口',
          }),
        ],
      },
    ],
  },
];

export const PERM_CATEGORY_LABELS = {
  all: '全部',
  basics: '基础',
  bits: '特殊位',
  practice: '判定',
  acl: 'ACL',
};

export const PERM_STAGES = [
  { n: 1, name: 'rwx' },
  { n: 2, name: 'chmod' },
  { n: 3, name: '特殊位' },
  { n: 4, name: '判定链' },
  { n: 5, name: 'ACL' },
];
