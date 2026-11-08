/**
 * AI 史记大事年表 — structured import for #/ai explorer.
 *
 * Source: zsjunai/history-of-ai (CC BY-SA 4.0)
 * https://github.com/zsjunai/history-of-ai
 * https://zsjunai.github.io/history-of-ai/timeline/
 *
 * Adapted: dropped English fields; remapped links to absolute upstream URLs;
 * added stable ids. Event Chinese text retained as structured timeline data
 * with attribution (not a prose dump of annals/biographies).
 * ShareAlike: this derived data remains under CC BY-SA 4.0.
 */

/** @typedef {'paper'|'product'|'company'|'policy'|'person'|'event'|'milestone'} AiEventType */
/** @typedef {'milestone'|'major'|'minor'} AiImportance */

/**
 * @typedef {{
 *   id: string,
 *   year: string,
 *   month: number|null,
 *   text: string,
 *   type: AiEventType,
 *   importance: AiImportance,
 *   upstreamPath: string,
 *   upstreamUrl: string,
 * }} AiTimelineEvent
 */

/**
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   name: string,
 *   nameEn: string,
 *   period: string,
 *   upstreamPath: string,
 *   upstreamUrl: string,
 *   order: number,
 *   events: AiTimelineEvent[],
 * }} AiTimelineEra
 */

/** @type {AiTimelineEra[]} */
export const AI_TIMELINE_ERAS = [
  {
    "id": "annals-01-dawn",
    "slug": "01-dawn",
    "name": "黎明期",
    "nameEn": "The Dawn",
    "period": "1943-1956",
    "upstreamPath": "/annals/01-dawn",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/01-dawn/",
    "order": 1,
    "events": [
      {
        "id": "01-dawn-1936-0",
        "year": "1936",
        "month": null,
        "text": "图灵（Turing）发表《论可计算数》，提出图灵机模型，奠定可计算理论与现代计算机的数学基础",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/turing",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/turing/"
      },
      {
        "id": "01-dawn-1943-1",
        "year": "1943",
        "month": null,
        "text": "麦卡洛克（McCulloch）与皮茨（Pitts）发表神经元数学模型，首次证明大脑活动可以用数学描述",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/treatises/neural-networks",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/neural-networks/"
      },
      {
        "id": "01-dawn-1948-2",
        "year": "1948",
        "month": null,
        "text": "维纳（Wiener）出版《控制论》，提出机器与生物共享反馈机制的洞察",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/wiener",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/wiener/"
      },
      {
        "id": "01-dawn-1949-3",
        "year": "1949",
        "month": null,
        "text": "赫布（Hebb）出版《行为的组织》，提出赫布学习规则——\"一起激发的神经元连接在一起\"",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/annals/01-dawn",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/01-dawn/"
      },
      {
        "id": "01-dawn-1950-4",
        "year": "1950",
        "month": null,
        "text": "图灵（Turing）发表《计算机器与智能》，提出\"模仿游戏\"（图灵测试）",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/turing",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/turing/"
      },
      {
        "id": "01-dawn-1950-5",
        "year": "1950",
        "month": null,
        "text": "香农（Shannon）发表《为下棋编程》，开创计算机博弈研究",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/biographies/shannon",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/shannon/"
      },
      {
        "id": "01-dawn-1951-6",
        "year": "1951",
        "month": null,
        "text": "明斯基（Minsky）与埃德蒙兹（Edmonds）建造 SNARC——人类历史上第一台神经网络硬件",
        "type": "milestone",
        "importance": "major",
        "upstreamPath": "/biographies/minsky",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/minsky/"
      },
      {
        "id": "01-dawn-1952-7",
        "year": "1952",
        "month": null,
        "text": "塞缪尔（Samuel）在 IBM 开发跳棋程序，开创机器学习的先河",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/ibm-research",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/ibm-research/"
      },
      {
        "id": "01-dawn-1955-8",
        "year": "1955",
        "month": null,
        "text": "纽厄尔（Newell）、西蒙（Simon）与肖（Shaw）创建 Logic Theorist，首个能自动证明数学定理的 AI 程序",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/biographies/herbert-simon",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/herbert-simon/"
      },
      {
        "id": "01-dawn-1956-8-9",
        "year": "1956",
        "month": 8,
        "text": "Dartmouth 会议召开，麦卡锡（McCarthy）正式命名\"人工智能\"，AI 作为学科诞生",
        "type": "milestone",
        "importance": "milestone",
        "upstreamPath": "/annals/01-dawn",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/01-dawn/"
      }
    ]
  },
  {
    "id": "annals-02-golden-age",
    "slug": "02-golden-age",
    "name": "黄金时代",
    "nameEn": "The Golden Age",
    "period": "1956-1973",
    "upstreamPath": "/annals/02-golden-age",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/02-golden-age/",
    "order": 2,
    "events": [
      {
        "id": "02-golden-age-1957-0",
        "year": "1957",
        "month": null,
        "text": "罗森布拉特（Rosenblatt）发明感知机（Perceptron），引发全球轰动，被誉为可学习的人工大脑",
        "type": "milestone",
        "importance": "milestone",
        "upstreamPath": "/biographies/rosenblatt",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/rosenblatt/"
      },
      {
        "id": "02-golden-age-1958-1",
        "year": "1958",
        "month": null,
        "text": "麦卡锡（McCarthy）发明 LISP 语言，成为 AI 研究的标准工具",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/mccarthy",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/mccarthy/"
      },
      {
        "id": "02-golden-age-1959-2",
        "year": "1959",
        "month": null,
        "text": "维德罗（Widrow）与霍夫（Hoff）提出 ADALINE 与 LMS 算法，把感知机思想推向工程实践",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/treatises/neural-networks",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/neural-networks/"
      },
      {
        "id": "02-golden-age-1959-3",
        "year": "1959",
        "month": null,
        "text": "麦卡锡与明斯基在 MIT 共同创立 AI Group，后发展为 MIT AI Lab",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/mit-ai-lab",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/mit-ai-lab/"
      },
      {
        "id": "02-golden-age-1962-4",
        "year": "1962",
        "month": null,
        "text": "塞缪尔（Samuel）的跳棋程序击败业余高手，\"机器学习\"概念广为人知",
        "type": "event",
        "importance": "minor",
        "upstreamPath": "/houses/ibm-research",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/ibm-research/"
      },
      {
        "id": "02-golden-age-1963-5",
        "year": "1963",
        "month": null,
        "text": "麦卡锡离开 MIT，创立斯坦福 AI 实验室（SAIL），美国 AI 形成东西两大阵营",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/stanford-ai-lab",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/stanford-ai-lab/"
      },
      {
        "id": "02-golden-age-1965-6",
        "year": "1965",
        "month": null,
        "text": "费根鲍姆（Feigenbaum）在斯坦福开发 DENDRAL，首个成功的专家系统",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/annals/02-golden-age",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/02-golden-age/"
      },
      {
        "id": "02-golden-age-1966-7",
        "year": "1966",
        "month": null,
        "text": "维森鲍姆（Weizenbaum）创建 ELIZA 聊天程序，用户竟然对一个程序产生了感情",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/annals/02-golden-age",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/02-golden-age/"
      },
      {
        "id": "02-golden-age-1966-8",
        "year": "1966",
        "month": null,
        "text": "ALPAC 报告发表，质疑机器翻译可行性，美国机器翻译研究资金大幅削减",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/nlp",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/nlp/"
      },
      {
        "id": "02-golden-age-1969-9",
        "year": "1969",
        "month": null,
        "text": "明斯基（Minsky）与派珀特（Papert）出版《感知机》，数学证明单层网络的局限性，神经网络陷入寒冬",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/treatises/neural-networks",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/neural-networks/"
      },
      {
        "id": "02-golden-age-1972-10",
        "year": "1972",
        "month": null,
        "text": "科尔默劳尔（Colmerauer）等在马赛开发 Prolog 语言，逻辑编程成为欧洲 AI 的旗帜",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/knowledge-representation",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/knowledge-representation/"
      },
      {
        "id": "02-golden-age-1972-11",
        "year": "1972",
        "month": null,
        "text": "维诺格拉德（Winograd）的 SHRDLU 在 MIT 完成，能用自然语言操作积木世界",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/nlp",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/nlp/"
      }
    ]
  },
  {
    "id": "annals-03-first-winter",
    "slug": "03-first-winter",
    "name": "第一次寒冬",
    "nameEn": "The First Winter",
    "period": "1973-1980",
    "upstreamPath": "/annals/03-first-winter",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/03-first-winter/",
    "order": 3,
    "events": [
      {
        "id": "03-first-winter-1973-0",
        "year": "1973",
        "month": null,
        "text": "Lighthill 报告发表，严厉批评 AI 研究未能兑现承诺，英国率先大幅削减资金",
        "type": "policy",
        "importance": "milestone",
        "upstreamPath": "/annals/03-first-winter",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/03-first-winter/"
      },
      {
        "id": "03-first-winter-1974-1",
        "year": "1974",
        "month": null,
        "text": "DARPA 削减 AI 项目预算，\"AI 寒冬\"在美国正式蔓延，大批研究者转向其他领域",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/annals/03-first-winter",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/03-first-winter/"
      },
      {
        "id": "03-first-winter-1975-2",
        "year": "1975",
        "month": null,
        "text": "明斯基（Minsky）发表《知识表示的框架》，把\"框架（Frame）\"引入认知建模",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/treatises/knowledge-representation",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/knowledge-representation/"
      },
      {
        "id": "03-first-winter-1976-3",
        "year": "1976",
        "month": null,
        "text": "维森鲍姆（Weizenbaum）出版《计算机能力与人类理性》，系统反思 AI 的伦理边界",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/treatises/ai-ethics",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-ethics/"
      },
      {
        "id": "03-first-winter-1979-4",
        "year": "1979",
        "month": null,
        "text": "汉斯·莫拉维克（Moravec）的 Stanford Cart 首次在户外自主导航穿越障碍",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/embodied-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/embodied-ai/"
      },
      {
        "id": "03-first-winter-1979-5",
        "year": "1979",
        "month": null,
        "text": "卡内基梅隆大学成立机器人研究所（Robotics Institute），全美第一所机器人专业研究院",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/cmu",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/cmu/"
      }
    ]
  },
  {
    "id": "annals-04-expert-systems",
    "slug": "04-expert-systems",
    "name": "专家系统时代",
    "nameEn": "The Expert Systems Era",
    "period": "1980-1987",
    "upstreamPath": "/annals/04-expert-systems",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/04-expert-systems/",
    "order": 4,
    "events": [
      {
        "id": "04-expert-systems-1980-0",
        "year": "1980",
        "month": null,
        "text": "XCON/R1 专家系统在 DEC 投入使用，每年节省 4000 万美元，证明 AI 的商业价值",
        "type": "product",
        "importance": "milestone",
        "upstreamPath": "/annals/04-expert-systems",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/04-expert-systems/"
      },
      {
        "id": "04-expert-systems-1981-1",
        "year": "1981",
        "month": null,
        "text": "日本启动第五代计算机计划，投资 8.5 亿美元，引发美欧恐慌与跟风",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-in-japan",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-in-japan/"
      },
      {
        "id": "04-expert-systems-1982-2",
        "year": "1982",
        "month": null,
        "text": "霍普菲尔德（Hopfield）发表 Hopfield 网络论文，把统计物理引入神经网络，重启联结主义研究",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/hopfield",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hopfield/"
      },
      {
        "id": "04-expert-systems-1982-3",
        "year": "1982",
        "month": null,
        "text": "日本设立国际新一代计算机技术研究所（ICOT），统筹第五代计划",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/icot",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/icot/"
      },
      {
        "id": "04-expert-systems-1984-4",
        "year": "1984",
        "month": null,
        "text": "勒纳特（Lenat）在 MCC 启动 Cyc 项目，试图把人类常识全部编入机器",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/knowledge-representation",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/knowledge-representation/"
      },
      {
        "id": "04-expert-systems-1985-5",
        "year": "1985",
        "month": null,
        "text": "辛顿（Hinton）与塞诺夫斯基（Sejnowski）提出玻尔兹曼机，把概率推断引入神经网络",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/biographies/hinton",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hinton/"
      },
      {
        "id": "04-expert-systems-1986-6",
        "year": "1986",
        "month": null,
        "text": "鲁梅尔哈特（Rumelhart）、辛顿（Hinton）、威廉姆斯（Williams）在《自然》上发表反向传播算法，多层神经网络终于可以训练",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/biographies/hinton",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hinton/"
      },
      {
        "id": "04-expert-systems-1986-7",
        "year": "1986",
        "month": null,
        "text": "塞诺夫斯基与罗森伯格的 NETtalk 学会朗读英文，被称为联结主义的经典演示",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/neural-networks",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/neural-networks/"
      },
      {
        "id": "04-expert-systems-1986-8",
        "year": "1986",
        "month": null,
        "text": "Pearl 出版《启发式：智能搜索策略》，奠定贝叶斯网络与因果推理基础",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/biographies/judea-pearl",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/judea-pearl/"
      },
      {
        "id": "04-expert-systems-1987-9",
        "year": "1987",
        "month": null,
        "text": "AAAI 春季会议聚焦专家系统局限，行业进入清算期",
        "type": "event",
        "importance": "minor",
        "upstreamPath": "/annals/04-expert-systems",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/04-expert-systems/"
      }
    ]
  },
  {
    "id": "annals-05-second-winter",
    "slug": "05-second-winter",
    "name": "第二次寒冬",
    "nameEn": "The Second Winter",
    "period": "1987-1993",
    "upstreamPath": "/annals/05-second-winter",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/05-second-winter/",
    "order": 5,
    "events": [
      {
        "id": "05-second-winter-1987-0",
        "year": "1987",
        "month": null,
        "text": "LISP 机器市场崩溃，专用 AI 硬件公司纷纷倒闭，专家系统泡沫破裂",
        "type": "event",
        "importance": "milestone",
        "upstreamPath": "/annals/05-second-winter",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/05-second-winter/"
      },
      {
        "id": "05-second-winter-1989-1",
        "year": "1989",
        "month": null,
        "text": "勒坤（LeCun）在贝尔实验室构建 LeNet 卷积网络，首次将反向传播应用于手写数字识别",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/lecun",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/lecun/"
      },
      {
        "id": "05-second-winter-1989-2",
        "year": "1989",
        "month": null,
        "text": "沃特金斯（Watkins）在剑桥提出 Q-Learning，奠定现代强化学习基础",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/treatises/reinforcement-learning",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/reinforcement-learning/"
      },
      {
        "id": "05-second-winter-1990-3",
        "year": "1990",
        "month": null,
        "text": "埃尔曼（Elman）提出简单循环网络（SRN），把时间维度引入神经网络",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/treatises/neural-networks",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/neural-networks/"
      },
      {
        "id": "05-second-winter-1992-4",
        "year": "1992",
        "month": null,
        "text": "日本第五代计算机计划宣告失败，未能实现任何预定目标",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-in-japan",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-in-japan/"
      },
      {
        "id": "05-second-winter-1993-5",
        "year": "1993",
        "month": null,
        "text": "IEEE Spectrum 称 AI 进入\"第二次寒冬\"，研究者纷纷改用\"机器学习\"等更低调的标签",
        "type": "event",
        "importance": "minor",
        "upstreamPath": "/annals/05-second-winter",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/05-second-winter/"
      }
    ]
  },
  {
    "id": "annals-06-statistical-learning",
    "slug": "06-statistical-learning",
    "name": "统计学习崛起",
    "nameEn": "The Rise of Statistical Learning",
    "period": "1993-2006",
    "upstreamPath": "/annals/06-statistical-learning",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/06-statistical-learning/",
    "order": 6,
    "events": [
      {
        "id": "06-statistical-learning-1995-0",
        "year": "1995",
        "month": null,
        "text": "科廷斯（Cortes）与万普尼克（Vapnik）发表支持向量机（SVM）论文，统计学习理论迎来高峰",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/annals/06-statistical-learning",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/06-statistical-learning/"
      },
      {
        "id": "06-statistical-learning-1995-1",
        "year": "1995",
        "month": null,
        "text": "布雷曼（Breiman）发表 Bagging 论文，集成学习思想成型",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/annals/06-statistical-learning",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/06-statistical-learning/"
      },
      {
        "id": "06-statistical-learning-1997-2",
        "year": "1997",
        "month": null,
        "text": "霍赫赖特（Hochreiter）与施密德胡贝尔（Schmidhuber）发表 LSTM，长短期记忆网络解决梯度消失难题",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/biographies/schmidhuber",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/schmidhuber/"
      },
      {
        "id": "06-statistical-learning-1997-5-3",
        "year": "1997",
        "month": 5,
        "text": "IBM Deep Blue 击败国际象棋世界冠军卡斯帕罗夫（Kasparov），全球震动，登上各大报纸头版",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/treatises/ai-games",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-games/"
      },
      {
        "id": "06-statistical-learning-1998-4",
        "year": "1998",
        "month": null,
        "text": "勒坤等发表 LeNet-5 论文，奠定现代卷积神经网络范式",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/lecun",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/lecun/"
      },
      {
        "id": "06-statistical-learning-1998-5",
        "year": "1998",
        "month": null,
        "text": "佩奇（Page）与布林（Brin）创立 Google，PageRank 把图算法推上互联网舞台",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/treatises/ai-in-usa",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-in-usa/"
      },
      {
        "id": "06-statistical-learning-1999-6",
        "year": "1999",
        "month": null,
        "text": "NVIDIA 发布 GeForce 256，首次提出\"GPU\"概念，为后来的深度学习算力革命埋下伏笔",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/nvidia",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/nvidia/"
      },
      {
        "id": "06-statistical-learning-2000-7",
        "year": "2000",
        "month": null,
        "text": "Pearl 出版《因果论》，把因果推断重新带回主流研究议程",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/biographies/judea-pearl",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/judea-pearl/"
      },
      {
        "id": "06-statistical-learning-2001-8",
        "year": "2001",
        "month": null,
        "text": "布雷曼（Breiman）发表随机森林论文，集成学习成为工业界主力算法",
        "type": "paper",
        "importance": "minor",
        "upstreamPath": "/annals/06-statistical-learning",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/06-statistical-learning/"
      },
      {
        "id": "06-statistical-learning-2002-9",
        "year": "2002",
        "month": null,
        "text": "iRobot 推出 Roomba 扫地机器人，首款真正进入家庭的服务机器人",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/embodied-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/embodied-ai/"
      },
      {
        "id": "06-statistical-learning-2004-10",
        "year": "2004",
        "month": null,
        "text": "DARPA Grand Challenge 首届无人车挑战在莫哈韦沙漠举行，全部参赛车辆中途故障",
        "type": "event",
        "importance": "minor",
        "upstreamPath": "/treatises/autonomous-driving",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/autonomous-driving/"
      },
      {
        "id": "06-statistical-learning-2005-11",
        "year": "2005",
        "month": null,
        "text": "Stanford 团队的 Stanley 在 DARPA Grand Challenge 完赛夺冠，自动驾驶进入工程化阶段",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/treatises/autonomous-driving",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/autonomous-driving/"
      },
      {
        "id": "06-statistical-learning-2006-12",
        "year": "2006",
        "month": null,
        "text": "辛顿（Hinton）与萨拉赫丁诺夫提出深度信念网络，\"deep learning\" 一词正式进入主流",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/biographies/hinton",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hinton/"
      },
      {
        "id": "06-statistical-learning-2006-13",
        "year": "2006",
        "month": null,
        "text": "吴恩达（Ng）加入斯坦福，开启大规模 GPU 训练神经网络的探索",
        "type": "person",
        "importance": "minor",
        "upstreamPath": "/biographies/andrew-ng",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/andrew-ng/"
      },
      {
        "id": "06-statistical-learning-2006-14",
        "year": "2006",
        "month": null,
        "text": "Geoffrey Hinton 在多伦多大学带队推动神经网络复兴，后催生向量研究院",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/toronto-vector",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/toronto-vector/"
      }
    ]
  },
  {
    "id": "annals-07-prelude-to-deep-learning",
    "slug": "07-prelude-to-deep-learning",
    "name": "深度学习前夜",
    "nameEn": "The Eve of Deep Learning",
    "period": "2006-2012",
    "upstreamPath": "/annals/07-prelude-to-deep-learning",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/07-prelude-to-deep-learning/",
    "order": 7,
    "events": [
      {
        "id": "07-prelude-to-deep-learning-2007-0",
        "year": "2007",
        "month": null,
        "text": "英伟达发布 CUDA，把 GPU 通用计算工具化，为深度学习铺路",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/nvidia",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/nvidia/"
      },
      {
        "id": "07-prelude-to-deep-learning-2009-1",
        "year": "2009",
        "month": null,
        "text": "李飞飞（Fei-Fei Li）团队发布 ImageNet 数据集，1400 万张手工标注图片，为深度学习革命埋下种子",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/biographies/fei-fei-li",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/fei-fei-li/"
      },
      {
        "id": "07-prelude-to-deep-learning-2009-2",
        "year": "2009",
        "month": null,
        "text": "吴恩达（Ng）与 Raina 发表《Large-scale Deep Unsupervised Learning Using GPUs》，证明 GPU 训练神经网络的巨大优势",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/andrew-ng",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/andrew-ng/"
      },
      {
        "id": "07-prelude-to-deep-learning-2010-3",
        "year": "2010",
        "month": null,
        "text": "微软发布 Kinect，将深度感知与人体姿态识别带入消费市场",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/houses/microsoft-research",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/microsoft-research/"
      },
      {
        "id": "07-prelude-to-deep-learning-2011-2-4",
        "year": "2011",
        "month": 2,
        "text": "IBM Watson 在 Jeopardy! 中击败人类冠军，认知计算概念进入大众视野",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/ibm-research",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/ibm-research/"
      },
      {
        "id": "07-prelude-to-deep-learning-2011-10-5",
        "year": "2011",
        "month": 10,
        "text": "苹果发布 Siri，AI 走进数亿人的口袋",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/apple-intelligence",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/apple-intelligence/"
      },
      {
        "id": "07-prelude-to-deep-learning-2011-6",
        "year": "2011",
        "month": null,
        "text": "吴恩达与 Daphne Koller 共同创立 Coursera，把斯坦福机器学习课带向全球",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/biographies/andrew-ng",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/andrew-ng/"
      },
      {
        "id": "07-prelude-to-deep-learning-2011-7",
        "year": "2011",
        "month": null,
        "text": "Google Brain 项目在 X 实验室秘密启动，由吴恩达与 Jeff Dean 牵头",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/google-brain",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/google-brain/"
      },
      {
        "id": "07-prelude-to-deep-learning-2012-6-8",
        "year": "2012",
        "month": 6,
        "text": "Google Brain 团队用 16,000 个 CPU 核心训练神经网络，自动从 YouTube 视频中识别出\"猫\"",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/google-brain",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/google-brain/"
      },
      {
        "id": "07-prelude-to-deep-learning-2012-9",
        "year": "2012",
        "month": null,
        "text": "蒙特利尔大学的 Yoshua Bengio 等推动 MILA 实验室扩张，深度学习\"加拿大三巨头\"格局成型",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/mila",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/mila/"
      }
    ]
  },
  {
    "id": "annals-08-cnn-era",
    "slug": "08-cnn-era",
    "name": "视觉革命",
    "nameEn": "The Vision Revolution",
    "period": "2012-2017",
    "upstreamPath": "/annals/08-cnn-era",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/08-cnn-era/",
    "order": 8,
    "events": [
      {
        "id": "08-cnn-era-2012-9-0",
        "year": "2012",
        "month": 9,
        "text": "AlexNet 赢得 ImageNet 竞赛，错误率骤降 10 个百分点，深度学习革命爆发",
        "type": "milestone",
        "importance": "milestone",
        "upstreamPath": "/annals/08-cnn-era",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/08-cnn-era/"
      },
      {
        "id": "08-cnn-era-2013-1",
        "year": "2013",
        "month": null,
        "text": "Mikolov 等在 Google 发表 Word2Vec 论文，词向量成为 NLP 标准工具",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/treatises/nlp",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/nlp/"
      },
      {
        "id": "08-cnn-era-2013-2",
        "year": "2013",
        "month": null,
        "text": "DeepMind 发表《Playing Atari with Deep Reinforcement Learning》，Deep Q-Network 让 AI 学会打游戏",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/houses/deepmind",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/deepmind/"
      },
      {
        "id": "08-cnn-era-2014-1-3",
        "year": "2014",
        "month": 1,
        "text": "Google 以约 6 亿美元收购 DeepMind，全球科技巨头 AI 收购竞赛拉开帷幕",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/deepmind",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/deepmind/"
      },
      {
        "id": "08-cnn-era-2014-4",
        "year": "2014",
        "month": null,
        "text": "苏茨克维（Sutskever）等发表 Seq2Seq 论文，用编解码器结构统一翻译与生成任务",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/biographies/ilya-sutskever",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/ilya-sutskever/"
      },
      {
        "id": "08-cnn-era-2014-5",
        "year": "2014",
        "month": null,
        "text": "Bahdanau 等首次把注意力机制（Attention）引入神经机器翻译",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/treatises/nlp",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/nlp/"
      },
      {
        "id": "08-cnn-era-2014-6",
        "year": "2014",
        "month": null,
        "text": "古德费洛（Goodfellow）在蒙特利尔的酒吧灵感中发明生成对抗网络（GAN），开创生成式 AI",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/houses/mila",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/mila/"
      },
      {
        "id": "08-cnn-era-2014-7",
        "year": "2014",
        "month": null,
        "text": "百度成立深度学习研究院（IDL），吴恩达出任首席科学家，中国互联网巨头入场",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/baidu-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/baidu-ai/"
      },
      {
        "id": "08-cnn-era-2015-11-8",
        "year": "2015",
        "month": 11,
        "text": "Google 开源 TensorFlow，深度学习工具民主化",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-open-source",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-open-source/"
      },
      {
        "id": "08-cnn-era-2015-9",
        "year": "2015",
        "month": null,
        "text": "何恺明等发表 ResNet，残差连接突破百层深度，刷新 ImageNet 与 COCO 纪录",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/annals/08-cnn-era",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/08-cnn-era/"
      },
      {
        "id": "08-cnn-era-2015-12-10",
        "year": "2015",
        "month": 12,
        "text": "OpenAI 在旧金山宣告成立，马斯克与奥特曼承诺 10 亿美元，对抗\"AI 被巨头垄断\"",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "08-cnn-era-2016-3-11",
        "year": "2016",
        "month": 3,
        "text": "AlphaGo 以 4:1 击败围棋世界冠军李世石（Lee Sedol），AI 攻克人类最复杂的棋类游戏",
        "type": "event",
        "importance": "milestone",
        "upstreamPath": "/houses/deepmind",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/deepmind/"
      },
      {
        "id": "08-cnn-era-2016-12",
        "year": "2016",
        "month": null,
        "text": "Facebook AI Research 开源 PyTorch，动态图风格迅速征服研究社区",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/meta-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/meta-ai/"
      },
      {
        "id": "08-cnn-era-2017-13",
        "year": "2017",
        "month": null,
        "text": "DeepMind 发布 AlphaZero，仅凭自我对弈在围棋、国际象棋、将棋上全面超越人类",
        "type": "paper",
        "importance": "major",
        "upstreamPath": "/houses/deepmind",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/deepmind/"
      },
      {
        "id": "08-cnn-era-2017-14",
        "year": "2017",
        "month": null,
        "text": "中国国务院印发《新一代人工智能发展规划》，明确 2030 年成为 AI 创新中心目标",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-in-china",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-in-china/"
      }
    ]
  },
  {
    "id": "annals-09-transformer",
    "slug": "09-transformer",
    "name": "Transformer 纪元",
    "nameEn": "The Transformer Era",
    "period": "2017-2022",
    "upstreamPath": "/annals/09-transformer",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/09-transformer/",
    "order": 9,
    "events": [
      {
        "id": "09-transformer-2017-6-0",
        "year": "2017",
        "month": 6,
        "text": "八位 Google 研究员发表《Attention Is All You Need》，Transformer 架构诞生，改变一切",
        "type": "paper",
        "importance": "milestone",
        "upstreamPath": "/houses/google-brain",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/google-brain/"
      },
      {
        "id": "09-transformer-2018-6-1",
        "year": "2018",
        "month": 6,
        "text": "OpenAI 发布 GPT-1，提出\"生成式预训练 + 微调\"路线",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/llm",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/llm/"
      },
      {
        "id": "09-transformer-2018-10-2",
        "year": "2018",
        "month": 10,
        "text": "Google 发布 BERT，双向预训练横扫 11 项 NLP 基准",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/llm",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/llm/"
      },
      {
        "id": "09-transformer-2018-3",
        "year": "2018",
        "month": null,
        "text": "ACM 将图灵奖授予辛顿（Hinton）、本吉奥（Bengio）、勒坤（LeCun），表彰深度学习贡献",
        "type": "person",
        "importance": "major",
        "upstreamPath": "/biographies/hinton",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hinton/"
      },
      {
        "id": "09-transformer-2019-2-4",
        "year": "2019",
        "month": 2,
        "text": "OpenAI 发布 GPT-2（15 亿参数），以\"太危险\"为由延迟公开，引发开源与安全之争",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/llm",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/llm/"
      },
      {
        "id": "09-transformer-2019-5",
        "year": "2019",
        "month": null,
        "text": "智谱 AI 在清华大学 KEG 实验室基础上成立，中国大模型创业潮启动",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/zhipu-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/zhipu-ai/"
      },
      {
        "id": "09-transformer-2019-6",
        "year": "2019",
        "month": null,
        "text": "Cohere 在多伦多成立，把 Transformer 商业化推向企业市场",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/cohere",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/cohere/"
      },
      {
        "id": "09-transformer-2019-7-7",
        "year": "2019",
        "month": 7,
        "text": "微软向 OpenAI 投资 10 亿美元，并签署 Azure 独家算力协议",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "09-transformer-2020-5-8",
        "year": "2020",
        "month": 5,
        "text": "OpenAI 发布 GPT-3（1750 亿参数），少样本学习展示出\"近似涌现\"的能力",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/llm",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/llm/"
      },
      {
        "id": "09-transformer-2020-9",
        "year": "2020",
        "month": null,
        "text": "DeepMind 在 CASP14 用 AlphaFold 2 解决蛋白质折叠问题，被誉为\"50 年来最大突破\"",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/treatises/ai-biology",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-biology/"
      },
      {
        "id": "09-transformer-2020-10",
        "year": "2020",
        "month": null,
        "text": "Hugging Face 完成 B 轮融资，Transformers 库成为开源社区事实标准",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/huggingface",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/huggingface/"
      },
      {
        "id": "09-transformer-2021-1-11",
        "year": "2021",
        "month": 1,
        "text": "OpenAI 发布 DALL·E，文本到图像生成首次进入大众视野",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-art",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-art/"
      },
      {
        "id": "09-transformer-2021-6-12",
        "year": "2021",
        "month": 6,
        "text": "GitHub 推出 Copilot 预览，AI 开始正式协助程序员写代码",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-agent",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-agent/"
      },
      {
        "id": "09-transformer-2021-13",
        "year": "2021",
        "month": null,
        "text": "前 OpenAI 研究员 Dario 与 Daniela Amodei 等创立 Anthropic，把 AI 安全作为公司使命",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "09-transformer-2021-14",
        "year": "2021",
        "month": null,
        "text": "Inflection、Character.AI 等新 AI 创业潮涌现，\"AI native\"创业范式成型",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/annals/09-transformer",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/09-transformer/"
      },
      {
        "id": "09-transformer-2022-15",
        "year": "2022",
        "month": null,
        "text": "DeepMind 发布 AlphaCode，能在编程竞赛中达到中等水平选手成绩",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/ai-agent",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-agent/"
      },
      {
        "id": "09-transformer-2022-7-16",
        "year": "2022",
        "month": 7,
        "text": "Midjourney 公开测试，扩散模型把 AI 绘画推向社交平台",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-art",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-art/"
      },
      {
        "id": "09-transformer-2022-8-17",
        "year": "2022",
        "month": 8,
        "text": "Stability AI 开源 Stable Diffusion，扩散模型生态全面爆发",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-art",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-art/"
      },
      {
        "id": "09-transformer-2022-11-18",
        "year": "2022",
        "month": 11,
        "text": "Anthropic 内部首次推出 Claude 早期版本，开启 Constitutional AI 路线",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "09-transformer-2022-11-19",
        "year": "2022",
        "month": 11,
        "text": "ChatGPT 发布（11月30日），两个月用户破亿，成为史上增长最快的消费级应用",
        "type": "milestone",
        "importance": "milestone",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      }
    ]
  },
  {
    "id": "annals-10-generative-ai",
    "slug": "10-generative-ai",
    "name": "生成式 AI 浪潮",
    "nameEn": "The Generative AI Wave",
    "period": "2022-2026",
    "upstreamPath": "/annals/10-generative-ai",
    "upstreamUrl": "https://zsjunai.github.io/history-of-ai/annals/10-generative-ai/",
    "order": 10,
    "events": [
      {
        "id": "10-generative-ai-2023-2-0",
        "year": "2023",
        "month": 2,
        "text": "微软发布 Bing Chat（基于 GPT-4），与 Google 展开搜索保卫战",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/microsoft-research",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/microsoft-research/"
      },
      {
        "id": "10-generative-ai-2023-2-1",
        "year": "2023",
        "month": 2,
        "text": "Meta 发布 LLaMA，权重通过申请方式开放，引爆开源大模型运动",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/meta-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/meta-ai/"
      },
      {
        "id": "10-generative-ai-2023-3-2",
        "year": "2023",
        "month": 3,
        "text": "OpenAI 发布 GPT-4，多模态能力震撼业界",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "10-generative-ai-2023-3-3",
        "year": "2023",
        "month": 3,
        "text": "Anthropic 发布 Claude 1，主打长上下文与安全可控",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "10-generative-ai-2023-4-4",
        "year": "2023",
        "month": 4,
        "text": "马斯克在 X.AI Corp 名下注册公司，xAI 雏形浮现",
        "type": "company",
        "importance": "minor",
        "upstreamPath": "/houses/xai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/xai/"
      },
      {
        "id": "10-generative-ai-2023-5-5",
        "year": "2023",
        "month": 5,
        "text": "辛顿（Hinton）从 Google 离职，公开警告通用 AI 的风险",
        "type": "person",
        "importance": "major",
        "upstreamPath": "/biographies/hinton",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/biographies/hinton/"
      },
      {
        "id": "10-generative-ai-2023-5-6",
        "year": "2023",
        "month": 5,
        "text": "法国 Mistral AI 成立，欧洲开源大模型旗手",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/mistral-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/mistral-ai/"
      },
      {
        "id": "10-generative-ai-2023-7-7",
        "year": "2023",
        "month": 7,
        "text": "Meta 发布 LLaMA 2，免费商用许可让开源大模型真正走入企业",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/meta-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/meta-ai/"
      },
      {
        "id": "10-generative-ai-2023-7-8",
        "year": "2023",
        "month": 7,
        "text": "xAI 正式成立，马斯克启动与 OpenAI、Anthropic 的三方竞争",
        "type": "company",
        "importance": "major",
        "upstreamPath": "/houses/xai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/xai/"
      },
      {
        "id": "10-generative-ai-2023-7-9",
        "year": "2023",
        "month": 7,
        "text": "Anthropic 发布 Claude 2，100K 上下文成为核心卖点",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "10-generative-ai-2023-10-10",
        "year": "2023",
        "month": 10,
        "text": "美国总统拜登签署 EO 14110 行政令，把前沿模型纳入国家安全监管",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-governance",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-governance/"
      },
      {
        "id": "10-generative-ai-2023-11-11",
        "year": "2023",
        "month": 11,
        "text": "OpenAI 董事会突然解雇奥特曼（Altman），五天后在员工与投资人压力下回归",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "10-generative-ai-2023-12",
        "year": "2023",
        "month": null,
        "text": "中国一线科技公司接连发布通义千问、文心一言、混元等大模型，\"百模大战\"开启",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/ai-in-china",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-in-china/"
      },
      {
        "id": "10-generative-ai-2024-2-13",
        "year": "2024",
        "month": 2,
        "text": "OpenAI 发布 Sora 视频生成模型，把扩散模型与 Transformer 推向时间维度",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-art",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-art/"
      },
      {
        "id": "10-generative-ai-2024-3-14",
        "year": "2024",
        "month": 3,
        "text": "Anthropic 发布 Claude 3 系列，Opus 在多项基准上超越 GPT-4",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "10-generative-ai-2024-5-15",
        "year": "2024",
        "month": 5,
        "text": "OpenAI 发布 GPT-4o，原生多模态、低延迟语音交互",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "10-generative-ai-2024-6-16",
        "year": "2024",
        "month": 6,
        "text": "欧盟正式通过《人工智能法案》（EU AI Act），全球首部综合性 AI 法律落地",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-governance",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-governance/"
      },
      {
        "id": "10-generative-ai-2024-9-17",
        "year": "2024",
        "month": 9,
        "text": "OpenAI 发布 o1 系列推理模型，\"Test-time Compute\"路线浮出水面",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/llm",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/llm/"
      },
      {
        "id": "10-generative-ai-2024-10-18",
        "year": "2024",
        "month": 10,
        "text": "辛顿（Hinton）获诺贝尔物理学奖，哈萨比斯（Hassabis）与 Jumper 获诺贝尔化学奖——AI 研究者首次双线获诺奖",
        "type": "person",
        "importance": "milestone",
        "upstreamPath": "/treatises/ai-biology",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-biology/"
      },
      {
        "id": "10-generative-ai-2024-19",
        "year": "2024",
        "month": null,
        "text": "英伟达成为全球市值最高的公司之一，AI 算力需求重塑半导体格局",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/nvidia",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/nvidia/"
      },
      {
        "id": "10-generative-ai-2025-1-20",
        "year": "2025",
        "month": 1,
        "text": "DeepSeek 发布 R1 推理模型，以极低成本接近 o1 水平，引爆全球开源讨论",
        "type": "product",
        "importance": "milestone",
        "upstreamPath": "/houses/deepseek",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/deepseek/"
      },
      {
        "id": "10-generative-ai-2025-1-21",
        "year": "2025",
        "month": 1,
        "text": "特朗普签署行政令撤销拜登的 EO 14110，美国 AI 治理路线转向加速主义",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-governance",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-governance/"
      },
      {
        "id": "10-generative-ai-2025-1-22",
        "year": "2025",
        "month": 1,
        "text": "美、日、阿联酋等宣布 Stargate 计划，规划 5000 亿美元级 AI 算力基础设施",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-hardware",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-hardware/"
      },
      {
        "id": "10-generative-ai-2025-3-23",
        "year": "2025",
        "month": 3,
        "text": "Manus、Operator 等通用 Agent 产品上线，\"AI 员工\"概念走向商业化",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/treatises/ai-agent",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-agent/"
      },
      {
        "id": "10-generative-ai-2025-3-24",
        "year": "2025",
        "month": 3,
        "text": "xAI 收购 X（前 Twitter），构建\"模型+社交+数据\"一体化平台",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/houses/xai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/xai/"
      },
      {
        "id": "10-generative-ai-2025-25",
        "year": "2025",
        "month": null,
        "text": "OpenAI 发布 GPT-5，推理、工具调用与多模态能力进一步统一",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/openai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/openai/"
      },
      {
        "id": "10-generative-ai-2025-26",
        "year": "2025",
        "month": null,
        "text": "Anthropic 发布 Claude 4 系列，Agent 与编码场景成为旗舰能力",
        "type": "product",
        "importance": "major",
        "upstreamPath": "/houses/anthropic",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/houses/anthropic/"
      },
      {
        "id": "10-generative-ai-2025-27",
        "year": "2025",
        "month": null,
        "text": "Cursor、Devin、Codex CLI 等 AI 编码工具进入主流开发流程",
        "type": "product",
        "importance": "minor",
        "upstreamPath": "/treatises/ai-agent",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-agent/"
      },
      {
        "id": "10-generative-ai-2026-28",
        "year": "2026",
        "month": null,
        "text": "全球已有 70 余个国家和地区出台 AI 治理框架，AI 安全与产业政策深度交织",
        "type": "policy",
        "importance": "major",
        "upstreamPath": "/treatises/ai-governance",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/ai-governance/"
      },
      {
        "id": "10-generative-ai-2026-29",
        "year": "2026",
        "month": null,
        "text": "AI 深度融入医疗、教育、制造、科研等行业，具身智能与 AI for Science 成为新主战场",
        "type": "event",
        "importance": "major",
        "upstreamPath": "/treatises/embodied-ai",
        "upstreamUrl": "https://zsjunai.github.io/history-of-ai/treatises/embodied-ai/"
      }
    ]
  }
];

export const AI_TIMELINE_META = {
  sourceName: 'AI 史记',
  sourceRepo: 'https://github.com/zsjunai/history-of-ai',
  sourceSite: 'https://zsjunai.github.io/history-of-ai/',
  sourceTimeline: 'https://zsjunai.github.io/history-of-ai/timeline/',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  importedAt: '2026-11-08',
  eraCount: 10,
  eventCount: 134,
};

export const AI_EVENT_TYPE_LABELS = {
  paper: '论文',
  product: '产品',
  company: '机构',
  policy: '政策',
  person: '人物',
  event: '事件',
  milestone: '里程碑',
};

export const AI_IMPORTANCE_LABELS = {
  milestone: '里程碑',
  major: '重要',
  minor: '一般',
};
