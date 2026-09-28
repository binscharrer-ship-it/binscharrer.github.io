(() => {
  "use strict";

  const ENERGY_DIMENSIONS = [
    { key: "stability", label: "稳定", color: "#4d8d78" },
    { key: "clarity", label: "清晰", color: "#5a8eb5" },
    { key: "courage", label: "勇气", color: "#ca6a62" },
    { key: "softness", label: "柔软", color: "#c67891" },
    { key: "intuition", label: "直觉", color: "#8176a9" },
    { key: "action", label: "行动", color: "#c79a3a" },
  ];

  const BASE_CRYSTALS = [
    {
      id: "amethyst",
      name: "紫水晶",
      en: "Amethyst",
      color: "#8b6fb2",
      dark: "#543b75",
      light: "#d9c9ee",
      element: "水",
      tags: ["静心", "边界", "直觉"],
      meaning: "守住内心边界，把外界的噪音调低，让自己重新听见真实需要。",
      emotion: "安宁、清明与自我边界",
      usage: "睡前握住紫水晶三分钟，只关注一呼一吸，并在心里重复：“今天只处理今天的事。”",
      energies: { stability: 64, clarity: 70, courage: 44, softness: 78, intuition: 92, action: 38 },
    },
    {
      id: "rose",
      name: "粉晶",
      en: "Rose Quartz",
      color: "#c97e8d",
      dark: "#86505f",
      light: "#f0cad2",
      element: "木",
      tags: ["温柔", "关系", "接纳"],
      meaning: "提醒你先对自己温和，再把柔软留给真正值得的关系。",
      emotion: "被爱、自我接纳与情感流动",
      usage: "把粉晶放在掌心，回想一件你曾责怪自己的小事，用对朋友说话的语气重新安慰自己。",
      energies: { stability: 58, clarity: 48, courage: 46, softness: 94, intuition: 74, action: 40 },
    },
    {
      id: "citrine",
      name: "黄水晶",
      en: "Citrine",
      color: "#dfad45",
      dark: "#916b23",
      light: "#f6dda0",
      element: "火",
      tags: ["喜悦", "自信", "行动"],
      meaning: "把注意力从欠缺移向已有资源，为下一步行动点亮一小块地方。",
      emotion: "自信、丰盛感与轻快行动",
      usage: "清晨把黄水晶放在今日待办旁边，只写下最容易启动的一步，完成后停顿十秒感受成就感。",
      energies: { stability: 56, clarity: 72, courage: 84, softness: 48, intuition: 54, action: 93 },
    },
    {
      id: "aventurine",
      name: "绿东陵",
      en: "Green Aventurine",
      color: "#59a47b",
      dark: "#327056",
      light: "#b8e1c8",
      element: "木",
      tags: ["机会", "生长", "松弛"],
      meaning: "让紧绷的期待松开一点，新的机会往往出现在不那么用力的时候。",
      emotion: "成长、机会感与从容",
      usage: "出门前将绿东陵握在手里，想一件今天值得期待的小事，把目标缩小到可完成的规模。",
      energies: { stability: 78, clarity: 62, courage: 68, softness: 70, intuition: 56, action: 74 },
    },
    {
      id: "clear",
      name: "白水晶",
      en: "Clear Quartz",
      color: "#d8e7e8",
      dark: "#8baeb2",
      light: "#ffffff",
      element: "金",
      tags: ["清明", "聚焦", "重置"],
      meaning: "像擦亮一面镜子，帮助你看清事实、情绪与想象之间的差别。",
      emotion: "清晰、聚焦与重新开始",
      usage: "用白水晶作为三分钟专注计时器：开始前写下一个问题，结束后只记录事实，不急着评价。",
      energies: { stability: 62, clarity: 95, courage: 60, softness: 42, intuition: 70, action: 72 },
    },
    {
      id: "obsidian",
      name: "黑曜石",
      en: "Black Obsidian",
      color: "#32383c",
      dark: "#14191c",
      light: "#899398",
      element: "水",
      tags: ["防护", "边界", "断舍"],
      meaning: "把不属于你的情绪和责任留在门外，为真正重要的事情保留力量。",
      emotion: "边界、保护与自我立场",
      usage: "结束一天后把黑曜石放在门口或桌边，写下今天最想结束的一件事，并决定不再反复回放。",
      energies: { stability: 78, clarity: 66, courage: 82, softness: 34, intuition: 56, action: 72 },
    },
    {
      id: "smoky",
      name: "茶晶",
      en: "Smoky Quartz",
      color: "#75675f",
      dark: "#453b38",
      light: "#c6b7ad",
      element: "土",
      tags: ["落地", "稳定", "消化"],
      meaning: "帮助情绪慢慢沉淀，把模糊的压力变成可以处理的一件件小事。",
      emotion: "稳定、落地与压力消化",
      usage: "脚踩地面，把茶晶放在腿上，依次说出让你不安的三件事，再为每件事标记“能处理 / 暂时搁置”。",
      energies: { stability: 94, clarity: 66, courage: 64, softness: 52, intuition: 48, action: 62 },
    },
    {
      id: "tiger",
      name: "黄虎眼石",
      en: "Tiger's Eye",
      color: "#b97738",
      dark: "#70471c",
      light: "#e5bd75",
      element: "土",
      tags: ["意志", "执行", "底气"],
      meaning: "在犹豫和行动之间加一道桥，让底气来自已经完成的每一步。",
      emotion: "意志、执行与沉着勇气",
      usage: "面对需要推进的任务时，把虎眼石放在手边，先做五分钟，并告诉自己：“只负责开场，不负责一次做完。”",
      energies: { stability: 84, clarity: 70, courage: 92, softness: 38, intuition: 46, action: 96 },
    },
    {
      id: "lapis",
      name: "青金石",
      en: "Lapis Lazuli",
      color: "#315f9b",
      dark: "#193b68",
      light: "#8db5df",
      element: "水",
      tags: ["表达", "洞察", "诚实"],
      meaning: "让真正想说的话变得有条理，也让沉默拥有更清晰的位置。",
      emotion: "表达、洞察与内在诚实",
      usage: "说话前暂停一次呼吸，用青金石做提醒，把想表达的内容压成一句不超过二十字的话。",
      energies: { stability: 58, clarity: 90, courage: 72, softness: 44, intuition: 80, action: 68 },
    },
    {
      id: "sodalite",
      name: "方钠石",
      en: "Sodalite",
      color: "#536fa6",
      dark: "#2e466f",
      light: "#a9bae0",
      element: "金",
      tags: ["逻辑", "冷静", "判断"],
      meaning: "在情绪很满的时候，为理性腾出一个可呼吸的小空间。",
      emotion: "冷静、判断与秩序感",
      usage: "遇到复杂决定时，把方钠石放在纸边，分别写下事实、感受、假设，再做下一判断。",
      energies: { stability: 72, clarity: 92, courage: 52, softness: 46, intuition: 54, action: 66 },
    },
    {
      id: "moonstone",
      name: "月光石",
      en: "Moonstone",
      color: "#bdcbd5",
      dark: "#7d91a0",
      light: "#f4f7fa",
      element: "水",
      tags: ["直觉", "节律", "安抚"],
      meaning: "接受情绪有自己的潮汐，不必在每一次起伏里强迫自己立刻振作。",
      emotion: "直觉、节律与柔软安放",
      usage: "夜晚调暗灯光，把月光石放在床边，回想今天一个微小但真实的感受，不急着给它结论。",
      energies: { stability: 60, clarity: 54, courage: 42, softness: 88, intuition: 95, action: 34 },
    },
    {
      id: "aquamarine",
      name: "海蓝宝",
      en: "Aquamarine",
      color: "#69bec1",
      dark: "#317d82",
      light: "#c0ebea",
      element: "水",
      tags: ["沟通", "松弛", "勇气"],
      meaning: "让表达更流畅，也帮助你在紧张场面里保留一点从容。",
      emotion: "沟通、平静与温柔勇气",
      usage: "在重要对话前，将海蓝宝放在喉部附近做三次缓慢呼吸，然后只准备开场第一句话。",
      energies: { stability: 62, clarity: 76, courage: 74, softness: 76, intuition: 66, action: 62 },
    },
    {
      id: "garnet",
      name: "石榴石",
      en: "Garnet",
      color: "#8e3348",
      dark: "#571b2b",
      light: "#d4778a",
      element: "火",
      tags: ["活力", "热情", "坚持"],
      meaning: "重新连接生命力与热情，让坚持来自渴望，而不是逼迫。",
      emotion: "活力、热情与持续力",
      usage: "身体疲惫但任务仍需推进时，握一握石榴石，只做一件能恢复能量的小事，再决定是否继续。",
      energies: { stability: 72, clarity: 58, courage: 90, softness: 50, intuition: 42, action: 88 },
    },
    {
      id: "amazonite",
      name: "天河石",
      en: "Amazonite",
      color: "#62b29f",
      dark: "#347565",
      light: "#b8e3d9",
      element: "木",
      tags: ["真诚", "界线", "舒缓"],
      meaning: "鼓励真诚表达，也提醒你不必为了维持和平而持续委屈自己。",
      emotion: "真诚、界线与情绪舒缓",
      usage: "当你想答应一个并不愿意的请求时，先触摸天河石，用一句清楚而礼貌的话为自己推迟决定。",
      energies: { stability: 68, clarity: 74, courage: 68, softness: 74, intuition: 60, action: 54 },
    },
    {
      id: "rhodonite",
      name: "蔷薇辉石",
      en: "Rhodonite",
      color: "#bd6c83",
      dark: "#794052",
      light: "#eab7c6",
      element: "火",
      tags: ["宽恕", "修复", "自爱"],
      meaning: "为受伤后的重新连接留出可能，也允许自己先完成修复，再决定是否靠近。",
      emotion: "情感修复、宽恕与自爱",
      usage: "写下最近一次让你难受的互动，不评判谁对谁错，只补充一句：“我真正需要的是……”",
      energies: { stability: 60, clarity: 52, courage: 66, softness: 90, intuition: 72, action: 46 },
    },
    {
      id: "labradorite",
      name: "拉长石",
      en: "Labradorite",
      color: "#52677e",
      dark: "#26394e",
      light: "#9db1c2",
      element: "水",
      tags: ["直觉", "防护", "变化"],
      meaning: "在变动和不确定中保存直觉，让未知不再只意味着危险。",
      emotion: "直觉、防护与适应变化",
      usage: "面对变化时，把拉长石放在面前，写下最担心的结果与仍然可控的一步。",
      energies: { stability: 56, clarity: 62, courage: 76, softness: 44, intuition: 94, action: 60 },
    },
    {
      id: "sunstone",
      name: "太阳石",
      en: "Sunstone",
      color: "#d8783f",
      dark: "#8e431f",
      light: "#f3bb82",
      element: "火",
      tags: ["活力", "乐观", "感染力"],
      meaning: "把被消耗的生气重新带回身体，让存在本身先亮起来。",
      emotion: "活力、乐观与自我展现",
      usage: "在低落时把太阳石放到自然光下，做十次舒展，随后记录一个今天仍然让你满意的瞬间。",
      energies: { stability: 58, clarity: 60, courage: 86, softness: 48, intuition: 50, action: 90 },
    },
    {
      id: "howlite",
      name: "白纹石",
      en: "Howlite",
      color: "#dce1dc",
      dark: "#929d96",
      light: "#ffffff",
      element: "金",
      tags: ["安眠", "减速", "安静"],
      meaning: "让高频运转的念头慢下来，为休息和恢复留出真正的空位。",
      emotion: "安静、放松与睡前安定",
      usage: "睡前把白纹石放在床头，进行四轮“吸气四拍、呼气六拍”，不要求自己马上入睡。",
      energies: { stability: 86, clarity: 54, courage: 40, softness: 82, intuition: 56, action: 30 },
    },
  ];

  const EXTRA_CRYSTALS = [
    {
      id: "red-flower",
      name: "红胶花水晶",
      en: "Red Flower Quartz",
      color: "#a95d68",
      dark: "#6c313d",
      light: "#e5aab3",
      element: "火",
      tags: ["热情", "修复", "包容"],
      meaning: "让被压住的情绪重新流动，在温柔里找回表达与靠近的勇气。",
      emotion: "情感修复、热情与包容",
      usage: "写出最近一件让你心里发紧的事，再补上一句“我希望自己被怎样对待”。",
      energies: { stability: 62, clarity: 60, courage: 54, softness: 86, intuition: 76, action: 48 },
    },
    {
      id: "yellow-flower",
      name: "黄胶花水晶",
      en: "Golden Flower Quartz",
      color: "#d1a449",
      dark: "#8b6624",
      light: "#f0d18a",
      element: "火",
      tags: ["希望", "自信", "顺流"],
      meaning: "把注意力带回仍可行动的地方，让信心从一次次小进展中重新长出。",
      emotion: "希望、自信与顺流感",
      usage: "为今天设定一个十分钟可完成的小目标，完成后停下来感受一次“我做到了”。",
      energies: { stability: 66, clarity: 78, courage: 64, softness: 58, intuition: 56, action: 80 },
    },
    {
      id: "red-tiger",
      name: "红虎眼石",
      en: "Red Tiger's Eye",
      color: "#8f3d35",
      dark: "#59231f",
      light: "#d58a72",
      element: "火",
      tags: ["胆识", "突破", "生命力"],
      meaning: "为停滞的场面注入胆识，适合面对需要果断推进或结束的事情。",
      emotion: "胆识、突破与生命力",
      usage: "把最拖延的一件事写到纸上，只执行其中最小且不可再拆的一步。",
      energies: { stability: 82, clarity: 62, courage: 94, softness: 38, intuition: 46, action: 90 },
    },
    {
      id: "strawberry",
      name: "草莓晶",
      en: "Strawberry Quartz",
      color: "#d45f84",
      dark: "#8a3452",
      light: "#f0aec2",
      element: "火",
      tags: ["吸引", "浪漫", "好感"],
      meaning: "唤醒感受爱与吸引美好的能力，也提醒你先珍惜自己的独特光泽。",
      emotion: "好感、浪漫与自我吸引",
      usage: "写下三件别人曾经欣赏你的真实品质，今天至少亲手发挥其中一项。",
      energies: { stability: 54, clarity: 52, courage: 64, softness: 90, intuition: 74, action: 56 },
    },
    {
      id: "green-phantom",
      name: "绿幽灵",
      en: "Green Phantom Quartz",
      color: "#4f8f69",
      dark: "#28543d",
      light: "#a8d0b3",
      element: "木",
      tags: ["事业", "积累", "增长"],
      meaning: "把过去留下的经验变成正在生长的根基，适合长期目标与事业积累。",
      emotion: "成长、积累与事业专注",
      usage: "回顾一个已经积累很久但尚未完成的目标，写下它今年最值得推进的一步。",
      energies: { stability: 82, clarity: 72, courage: 68, softness: 58, intuition: 78, action: 76 },
    },
    {
      id: "red-agate",
      name: "红玛瑙",
      en: "Red Agate",
      color: "#b64a43",
      dark: "#71302c",
      light: "#e59689",
      element: "火",
      tags: ["底气", "根基", "勇气"],
      meaning: "稳定身体里的安全感，为需要落地的决定提供一份踏实底气。",
      emotion: "安全感、底气与行动勇气",
      usage: "双脚踩稳地面，做十次缓慢呼吸，再写下继续或停止这件事的真正理由。",
      energies: { stability: 88, clarity: 50, courage: 80, softness: 42, intuition: 42, action: 78 },
    },
    {
      id: "blue-lace",
      name: "蓝纹玛瑙",
      en: "Blue Lace Agate",
      color: "#8ebcd0",
      dark: "#4e7d92",
      light: "#d6edf4",
      element: "水",
      tags: ["沟通", "平静", "舒缓"],
      meaning: "让紧绷的表达慢下来，为重要的话找到温和、清楚又不伤人的入口。",
      emotion: "沟通、平静与情绪舒缓",
      usage: "把想说的话删改成一句事实和一句需求，等呼吸平稳后再开口。",
      energies: { stability: 72, clarity: 78, courage: 42, softness: 90, intuition: 54, action: 36 },
    },
    {
      id: "white-agate",
      name: "白玛瑙",
      en: "White Agate",
      color: "#dfe6e1",
      dark: "#98a39f",
      light: "#ffffff",
      element: "金",
      tags: ["净化", "安定", "重启"],
      meaning: "为混乱的思绪做一次清空，把注意力重新带回最简单、最必要的事情。",
      emotion: "安定、净化与重新开始",
      usage: "关闭一个不必要的通知，清理桌面上三件无用物品，再开始今天最重要的一件事。",
      energies: { stability: 90, clarity: 60, courage: 44, softness: 76, intuition: 50, action: 42 },
    },
    {
      id: "black-agate",
      name: "黑玛瑙",
      en: "Black Agate",
      color: "#373d42",
      dark: "#14191c",
      light: "#818a90",
      element: "水",
      tags: ["边界", "坚定", "保护"],
      meaning: "帮助收回分散的注意力，让边界、立场和真正的优先事项变得坚定。",
      emotion: "边界、坚定与自我保护",
      usage: "写下今天最想拒绝的一件事，用一句简短的话练习拒绝，不需要解释过多。",
      energies: { stability: 92, clarity: 62, courage: 80, softness: 34, intuition: 46, action: 74 },
    },
    {
      id: "prehnite",
      name: "葡萄石",
      en: "Prehnite",
      color: "#91b86a",
      dark: "#577840",
      light: "#d0e2b8",
      element: "木",
      tags: ["预判", "安心", "疗愈"],
      meaning: "在行动前收集足够信息，也用更柔和的方式照料疲惫的身体与心。",
      emotion: "安心、预判与温和疗愈",
      usage: "做决定前只补充三条真正需要的信息，同时取消一项今天不必要的任务。",
      energies: { stability: 74, clarity: 66, courage: 52, softness: 80, intuition: 86, action: 56 },
    },
    {
      id: "fluorite",
      name: "萤石",
      en: "Fluorite",
      color: "#7377b0",
      dark: "#414575",
      light: "#b9bde4",
      element: "金",
      tags: ["专注", "整理", "逻辑"],
      meaning: "把散乱的念头排出顺序，适合学习、分析和需要深度专注的时刻。",
      emotion: "专注、整理与思维清晰",
      usage: "把眼前任务拆成“已知道、待确认、下一步”三栏，只处理下一栏。",
      energies: { stability: 50, clarity: 94, courage: 48, softness: 56, intuition: 82, action: 60 },
    },
    {
      id: "black-tourmaline",
      name: "黑碧玺",
      en: "Black Tourmaline",
      color: "#242a2d",
      dark: "#0c1012",
      light: "#697579",
      element: "土",
      tags: ["防护", "落地", "清理"],
      meaning: "像一道安静的保护线，帮助你区分自己的责任、情绪与他人的投射。",
      emotion: "防护、落地与能量清理",
      usage: "把不属于你的三条担忧写下来并划掉，只保留今天真正需要你负责的一件事。",
      energies: { stability: 90, clarity: 66, courage: 86, softness: 30, intuition: 52, action: 80 },
    },
    {
      id: "peridot",
      name: "橄榄石",
      en: "Peridot",
      color: "#99af46",
      dark: "#617128",
      light: "#d5df9a",
      element: "木",
      tags: ["新生", "轻盈", "释怀"],
      meaning: "帮助放下旧的负担，把注意力交给更新鲜、更富有生命力的方向。",
      emotion: "新生、轻盈与释怀",
      usage: "整理一件已经结束却仍占用注意力的事，明确告诉自己“这一页已经翻过”。",
      energies: { stability: 62, clarity: 70, courage: 74, softness: 56, intuition: 52, action: 82 },
    },
    {
      id: "rhodochrosite",
      name: "红纹石",
      en: "Rhodochrosite",
      color: "#cf7785",
      dark: "#8c4250",
      light: "#efb9c2",
      element: "火",
      tags: ["自爱", "心轮", "修复"],
      meaning: "把过度向外付出的注意力收回来，先照顾自己的感受与真实需要。",
      emotion: "自爱、情感修复与温柔力量",
      usage: "今天拒绝一次超出精力的付出，把省下的时间用于一件真正让自己舒服的事。",
      energies: { stability: 60, clarity: 48, courage: 58, softness: 94, intuition: 72, action: 44 },
    },
    {
      id: "charoite",
      name: "紫龙晶",
      en: "Charoite",
      color: "#78678f",
      dark: "#483d5c",
      light: "#c0afd7",
      element: "水",
      tags: ["洞察", "转化", "直觉"],
      meaning: "在复杂情绪里辨认真正的信号，帮助旧经验转化为新的理解。",
      emotion: "洞察、转化与深层直觉",
      usage: "回忆一个反复出现的情绪模式，用一个更成熟的视角写下新的解释。",
      energies: { stability: 58, clarity: 72, courage: 58, softness: 74, intuition: 90, action: 52 },
    },
    {
      id: "morganite",
      name: "摩根石",
      en: "Morganite",
      color: "#e0a7ae",
      dark: "#a35f6a",
      light: "#f6d6da",
      element: "木",
      tags: ["温柔", "爱意", "接纳"],
      meaning: "用不牺牲自己的方式表达爱，也在关系里允许更多轻松与接纳。",
      emotion: "温柔、爱意与被接纳感",
      usage: "对一个重要的人说一句真实感谢，同时为自己保留一项不被打扰的时间。",
      energies: { stability: 64, clarity: 58, courage: 50, softness: 95, intuition: 70, action: 42 },
    },
    {
      id: "kyanite",
      name: "蓝晶石",
      en: "Kyanite",
      color: "#6f95b8",
      dark: "#3f668a",
      light: "#b8d2e7",
      element: "水",
      tags: ["表达", "对齐", "冷静"],
      meaning: "让想法、语言与行动重新对齐，减少因为勉强和含糊造成的消耗。",
      emotion: "表达、对齐与冷静判断",
      usage: "把“我想要、我需要、我愿意做”分别写一句，检查它们是否彼此一致。",
      energies: { stability: 60, clarity: 84, courage: 70, softness: 50, intuition: 78, action: 68 },
    },
    {
      id: "iolite",
      name: "堇青石",
      en: "Iolite",
      color: "#5c6482",
      dark: "#33394f",
      light: "#a7afca",
      element: "水",
      tags: ["方向", "直觉", "自律"],
      meaning: "在分心与犹豫中重新辨认方向，让直觉和长期目标一起参与决定。",
      emotion: "方向感、直觉与自律",
      usage: "先写下三个月后仍重要的目标，再删除今天不服务于它的一个干扰。",
      energies: { stability: 56, clarity: 76, courage: 58, softness: 52, intuition: 92, action: 54 },
    },
    {
      id: "kunzite",
      name: "紫锂辉",
      en: "Kunzite",
      color: "#c39cc7",
      dark: "#80588b",
      light: "#edcfee",
      element: "水",
      tags: ["温柔", "梦境", "接纳"],
      meaning: "让过强的自我要求暂时松开，为柔软、感受和休息留出空间。",
      emotion: "温柔、梦境与无条件接纳",
      usage: "睡前不安排新任务，只听一首喜欢的歌，让身体先于头脑进入休息。",
      energies: { stability: 50, clarity: 58, courage: 44, softness: 94, intuition: 88, action: 34 },
    },
  ];

  const MARKET_CATALOG = {
    white: {
      label: "白色系",
      names: [
        "白水晶", "白幽灵", "白兔毛", "喜马拉雅白", "白阿塞",
        "白月光", "白萤石", "白玉髓", "白珍珠", "白蝶贝",
        "欧泊", "白翡翠", "和田白玉", "白松石", "白珊瑚",
        "黑银钛", "银发晶",
      ],
    },
    black: {
      label: "黑色系",
      names: [
        "黑水晶", "黑碧玺", "黑玛瑙", "黑骨干", "金运石",
        "黑曜石", "彩虹黑曜", "金曜石", "银曜石", "冰种黑曜",
        "黑透辉石", "黑龙晶", "黑极光", "黑草莓", "黑月光",
        "地狱海蓝", "黑银钛", "黑发晶", "毒液超七", "黑烟超七",
        "黑幽灵", "黑金阿塞", "茶晶", "黑金超七", "黑金骨干",
        "黑闪灵", "灰月光",
      ],
    },
    yellow: {
      label: "黄色系",
      names: [
        "黄碧玺", "黄萤石", "利比亚陨石", "柠檬黄晶", "金葡萄",
        "黄水晶", "黄阿塞", "橙黄水晶", "黄塔晶", "黄托帕",
        "黄兔毛", "金发晶", "钛晶", "铜发晶", "黄幽灵",
        "黄玛瑙", "黄胶花", "蜜蜡", "黄龙玉", "黄方解石",
        "橙月光", "太阳石", "红东陵玉", "橙红石榴", "黄虎眼",
      ],
    },
    green: {
      label: "绿色系",
      names: [
        "绿幽灵", "绿兔毛", "绿发晶", "绿草莓", "绿萤石",
        "绿水晶", "葡萄石", "绿碧玺", "绿玉髓", "东陵玉",
        "绿方解", "孔雀石", "绿松石", "绿虎眼", "绿锂云母",
        "透辉石", "祖母绿", "翠榴石", "翡翠", "绿龙晶",
        "橄榄石", "沙弗莱", "金绿石", "捷克陨石", "岫玉",
      ],
    },
    red: {
      label: "红粉色系",
      names: [
        "冰粉晶", "樱花玛瑙", "粉白幽", "粉幽灵", "粉月光",
        "莫粉", "粉欧泊", "星光粉", "马粉", "粉玉髓",
        "粉烟超七", "粉兔毛", "草莓晶", "红纹石", "蔷薇石",
        "红超七", "红发晶", "红兔毛", "红胶花", "红锂云母",
        "石榴石", "红碧玺", "金草莓", "金太阳", "红幽灵",
        "红玉髓", "南红玛瑙", "朱砂", "红玛瑙", "红虎眼",
      ],
    },
    purple: {
      label: "紫色系",
      names: [
        "玻利维亚紫", "巴西紫", "乌拉圭紫", "薰衣草紫", "梦幻紫",
        "紫玉髓", "紫玉晶", "紫锂辉", "紫萤石", "紫牙乌石榴",
        "紫阿塞", "紫发晶", "紫幽灵", "紫黄晶", "紫锂云母",
        "紫翡翠", "紫方钠", "紫月光", "紫龙晶", "俱舒来",
        "紫粉超七", "紫超七",
      ],
    },
    blue: {
      label: "蓝色系",
      names: [
        "蓝绿晶", "蓝萤石", "蓝碧玺", "天河石", "绿松石",
        "蓝发晶", "蓝玛瑙", "蓝兔毛", "蓝托帕", "海蓝宝",
        "蓝针", "蓝月光", "蓝纹玛瑙", "天使石", "蓝晶石",
        "蓝方解石", "蓝东陵玉", "异极矿", "蓝磷辉", "海纹石",
        "苏打石", "蓝虎眼", "堇青石", "坦桑石", "蓝纹方钠",
        "蓝砂石", "青金石", "深蓝月光", "彼得石", "蓝铜矿",
      ],
    },
  };

  const MARKET_PROFILES = {
    white: {
      element: "金",
      tags: ["清明", "净化", "安定"],
      meaning: "帮助整理杂念、恢复透明度，让真正重要的事重新变得清楚。",
      usage: "清理一个不必要的干扰，再只保留今天真正重要的一件事。",
      energies: { stability: 74, clarity: 88, courage: 46, softness: 72, intuition: 62, action: 44 },
      palettes: [
        ["#85969b", "#d9e5e7", "#ffffff"],
        ["#9d9c92", "#e8e4d9", "#ffffff"],
        ["#7e8d91", "#c8d7da", "#f8ffff"],
        ["#a68e87", "#e8d7d1", "#fffaf8"],
      ],
    },
    black: {
      element: "水",
      tags: ["边界", "保护", "坚定"],
      meaning: "像一道安静的保护线，帮助区分自己的责任、情绪与他人的投射。",
      usage: "写下今天最想停止承担的一件事，并给出清楚、简短的边界。",
      energies: { stability: 92, clarity: 64, courage: 82, softness: 32, intuition: 58, action: 76 },
      palettes: [
        ["#07090a", "#252b2e", "#9ba4a8"],
        ["#101518", "#3a3f44", "#b6b7b5"],
        ["#251e1a", "#6b594b", "#d8c7ae"],
        ["#141326", "#46445f", "#b9b6d1"],
      ],
    },
    yellow: {
      element: "火",
      tags: ["自信", "行动", "丰盛"],
      meaning: "把注意力带回仍可行动的地方，让信心从一次次小进展中重新长出。",
      usage: "为一个拖延目标只做十分钟，完成后记录一次真实进展。",
      energies: { stability: 62, clarity: 74, courage: 84, softness: 48, intuition: 54, action: 92 },
      palettes: [
        ["#7a5016", "#d7a53f", "#ffe5a4"],
        ["#765116", "#c48a2d", "#ffd889"],
        ["#8a3f14", "#dc7b32", "#ffc27d"],
        ["#826612", "#d2c150", "#fff2a4"],
      ],
    },
    green: {
      element: "木",
      tags: ["成长", "平衡", "舒展"],
      meaning: "为长期成长补充稳定的生命力，让改变以可持续的速度发生。",
      usage: "回看一个正在成长的目标，只推进最需要耐心的一步。",
      energies: { stability: 78, clarity: 68, courage: 68, softness: 72, intuition: 66, action: 74 },
      palettes: [
        ["#28533b", "#58a078", "#bce0c5"],
        ["#284e32", "#6ba25d", "#d2e9b7"],
        ["#1d5551", "#4ba39b", "#b9e7df"],
        ["#5f611e", "#aeb545", "#eef2a7"],
      ],
    },
    red: {
      element: "火",
      tags: ["温柔", "情感", "勇气"],
      meaning: "让感受重新流动，在照顾自己的同时保留表达与靠近的勇气。",
      usage: "写下今天一个真实感受，并补上一句你真正需要什么。",
      energies: { stability: 60, clarity: 54, courage: 72, softness: 90, intuition: 70, action: 60 },
      palettes: [
        ["#763449", "#cf7f94", "#f7c8d3"],
        ["#78252a", "#c84a4e", "#f3a2a0"],
        ["#6d2332", "#ad3452", "#eb8ca8"],
        ["#7d351c", "#d26734", "#f7b183"],
      ],
    },
    purple: {
      element: "水",
      tags: ["直觉", "洞察", "转化"],
      meaning: "在复杂情绪里辨认真正的信号，让旧经验转化为新的理解。",
      usage: "把一个反复出现的情绪模式写成一句新的解释，不急着判断对错。",
      energies: { stability: 58, clarity: 74, courage: 56, softness: 74, intuition: 92, action: 52 },
      palettes: [
        ["#3e245f", "#865fb2", "#e1c8fb"],
        ["#4a2868", "#9d73c5", "#eddcff"],
        ["#31294f", "#665c91", "#c7c0e9"],
        ["#56234b", "#a95398", "#efb6df"],
      ],
    },
    blue: {
      element: "水",
      tags: ["沟通", "冷静", "清晰"],
      meaning: "让表达更流畅，也为紧张的情绪腾出更清楚的思考空间。",
      usage: "把想说的话整理成一句事实和一句需求，等呼吸平稳后再开口。",
      energies: { stability: 68, clarity: 82, courage: 56, softness: 70, intuition: 66, action: 58 },
      palettes: [
        ["#234e79", "#5c96c6", "#c1ddf3"],
        ["#184c73", "#3b8fc2", "#a8dff0"],
        ["#283257", "#6672a5", "#c4c9eb"],
        ["#17536b", "#4ca8b8", "#bfe9ee"],
      ],
    },
  };

  const MARKET_COLOR_OVERRIDES = [
    { pattern: /黑|墨|毒液|黑烟|地狱|深蓝|苏打/, palette: ["#080b0d", "#32383d", "#a8b1b5"] },
    { pattern: /银|灰月光/, palette: ["#50575b", "#aeb6b8", "#f2f5f5"] },
    { pattern: /粉|樱|莫粉|蔷薇|草莓|胶花/, palette: ["#77314b", "#d26f92", "#f8bed2"] },
    { pattern: /紫|薰衣草|巴西|乌拉圭|梦幻|俱舒/, palette: ["#40245f", "#8b63b5", "#e5cdf8"] },
    { pattern: /蓝|海|坦桑|托帕|异极|蓝铜|天使/, palette: ["#204f7a", "#5c9dca", "#c4e2f4"] },
    { pattern: /绿|翠|橄榄|葡萄|沙弗莱|捷克|岫玉|孔雀/, palette: ["#24553b", "#59a475", "#c1e2c8"] },
    { pattern: /黄|金|蜜蜡|柠檬|太阳|钛|铜发|龙玉/, palette: ["#775114", "#d5a23f", "#ffe3a1"] },
    { pattern: /红|朱砂|石榴|太阳石/, palette: ["#70242b", "#c34c52", "#f0a09d"] },
    { pattern: /白|冰|月光|珍珠|贝|欧泊/, palette: ["#829196", "#d9e5e6", "#ffffff"] },
  ];

  function marketPalette(name, category, index) {
    const override = MARKET_COLOR_OVERRIDES.find((item) => item.pattern.test(name));
    if (override) return override.palette;
    const palettes = MARKET_PROFILES[category].palettes;
    return palettes[index % palettes.length];
  }

  function marketBeadStyle(name, category) {
    if (/发晶|兔毛|超七|幽灵|草莓|阿塞|胶花|针/.test(name)) return "matrix";
    if (/月光|虎眼|曜石|极光|闪灵/.test(name)) return "cat-eye";
    if (/玛瑙|方解|松石|孔雀|纹|龙晶/.test(name)) return "banded";
    if (/玉|玉髓|翡翠|岫玉|珊瑚|珍珠|贝/.test(name)) return "cloudy";
    if (/白水晶|冰|净体|托帕|海蓝宝|碧玺/.test(name)) return "clear";
    return "crystal";
  }

  const REAL_BEAD_BY_ID = {
    amethyst: "./assets/beads/generated-3d-real/uruguay-classic.png",
    clear: "./assets/beads/generated-3d-real/clear-quartz.png",
  };
  const REAL_BEAD_BY_NAME = {
    "巴西浅紫": "./assets/beads/generated-3d-real/brasil-light.png",
    "巴西紫": "./assets/beads/generated-3d-real/mid-amethyst.png",
    "乌拉圭紫": "./assets/beads/generated-3d-real/uruguay-classic.png",
    "薰衣草紫": "./assets/beads/generated-3d-real/brasil-light.png",
    "梦幻紫": "./assets/beads/generated-3d-real/deep-amethyst.png",
    "白水晶": "./assets/beads/generated-3d-real/clear-quartz.png",
    "净体白水晶": "./assets/beads/generated-3d-real/clear-quartz.png",
  };

  function realBeadForName(name) {
    return REAL_BEAD_BY_NAME[name] || "";
  }

  function createMarketCrystals() {
    const existingNames = new Set([...BASE_CRYSTALS, ...EXTRA_CRYSTALS].map((crystal) => crystal.name));
    const seen = new Set();
    return Object.entries(MARKET_CATALOG).flatMap(([category, catalog]) =>
      catalog.names.flatMap((name, index) => {
        if (existingNames.has(name) || seen.has(name)) return [];
        seen.add(name);
        const profile = MARKET_PROFILES[category];
        const [dark, color, light] = marketPalette(name, category, index);
        const energy = { ...profile.energies };
        if (/发晶|超七|钛晶|铜发/.test(name)) {
          energy.clarity += 6;
          energy.courage += 8;
          energy.action += 6;
        }
        if (/月光|幽灵|欧泊|极光/.test(name)) energy.intuition += 7;
        if (/玛瑙|玉髓|玉|翡翠|珍珠|贝/.test(name)) energy.stability += 6;
        if (/太阳|金|黄/.test(name)) energy.action += 6;
        if (/粉|红纹|蔷薇|胶花|珊瑚/.test(name)) energy.softness += 6;
        ENERGY_DIMENSIONS.forEach((dimension) => {
          energy[dimension.key] = Math.max(28, Math.min(99, energy[dimension.key]));
        });
        return [{
          id: `market-${category}-${index + 1}`,
          name,
          en: `${catalog.label}成品珠`,
          color,
          dark,
          light,
          element: profile.element,
          tags: profile.tags,
          meaning: `${name}以${profile.tags.join("、")}为主要象征。${profile.meaning}`,
          emotion: `${profile.tags.join("、")}与日常情绪陪伴`,
          usage: profile.usage,
          beadStyle: marketBeadStyle(name, category),
          realImage: realBeadForName(name),
          energies: energy,
          catalogGroup: catalog.label,
        }];
      }),
    );
  }

  const MARKET_CRYSTALS = createMarketCrystals();
  const CRYSTALS_BASE = [...BASE_CRYSTALS, ...EXTRA_CRYSTALS, ...MARKET_CRYSTALS];
  const BEAD_STYLE_BY_ID = {
    clear: "clear",
    "white-agate": "clear",
    howlite: "clear",
    obsidian: "banded",
    "black-agate": "banded",
    "red-agate": "banded",
    "blue-lace": "banded",
    tiger: "cat-eye",
    "red-tiger": "cat-eye",
    moonstone: "cat-eye",
    sunstone: "cat-eye",
    labradorite: "cat-eye",
    lapis: "matrix",
    sodalite: "matrix",
    "black-tourmaline": "matrix",
    smoky: "matrix",
    garnet: "matrix",
    "green-phantom": "matrix",
    strawberry: "flakes",
    "red-flower": "flakes",
    "yellow-flower": "flakes",
    citrine: "flakes",
    rose: "cloudy",
    rhodonite: "cloudy",
    rhodochrosite: "cloudy",
    charoite: "cloudy",
    morganite: "cloudy",
    kunzite: "cloudy",
    amazonite: "cloudy",
    aventurine: "cloudy",
    prehnite: "cloudy",
    peridot: "cloudy",
    fluorite: "cloudy",
    kyanite: "cloudy",
    iolite: "cloudy",
    amethyst: "crystal",
    aquamarine: "crystal",
  };

  const CRYSTALS = CRYSTALS_BASE.map((crystal) => ({
    ...crystal,
    realImage: crystal.realImage || REAL_BEAD_BY_ID[crystal.id] || "",
  }));
  const CRYSTAL_MAP = new Map(CRYSTALS.map((crystal) => [crystal.id, crystal]));
  const IMAGE_DATA = window.CRYSTAL_IMAGE_DATA || {};

  const ZODIAC = [
    { id: "aries", name: "白羊座", short: "火", ids: ["red-tiger", "garnet", "sunstone"] },
    { id: "taurus", name: "金牛座", short: "土", ids: ["rose", "rhodochrosite", "aventurine"] },
    { id: "gemini", name: "双子座", short: "风", ids: ["clear", "aquamarine", "yellow-flower"] },
    { id: "cancer", name: "巨蟹座", short: "水", ids: ["moonstone", "howlite", "blue-lace"] },
    { id: "leo", name: "狮子座", short: "火", ids: ["citrine", "sunstone", "tiger"] },
    { id: "virgo", name: "处女座", short: "土", ids: ["amazonite", "clear", "sodalite"] },
    { id: "libra", name: "天秤座", short: "风", ids: ["rose", "morganite", "moonstone"] },
    { id: "scorpio", name: "天蝎座", short: "水", ids: ["obsidian", "labradorite", "red-tiger"] },
    { id: "sagittarius", name: "射手座", short: "火", ids: ["lapis", "citrine", "iolite"] },
    { id: "capricorn", name: "摩羯座", short: "土", ids: ["smoky", "black-tourmaline", "garnet"] },
    { id: "aquarius", name: "水瓶座", short: "风", ids: ["labradorite", "amethyst", "charoite"] },
    { id: "pisces", name: "双鱼座", short: "水", ids: ["amethyst", "moonstone", "aquamarine"] },
  ];

  const ELEMENTS = [
    { id: "metal", name: "金", short: "收敛与秩序", ids: ["clear", "howlite", "white-agate"] },
    { id: "wood", name: "木", short: "生长与舒展", ids: ["aventurine", "amazonite", "prehnite"] },
    { id: "water", name: "水", short: "流动与直觉", ids: ["aquamarine", "moonstone", "blue-lace"] },
    { id: "fire", name: "火", short: "热情与行动", ids: ["sunstone", "red-tiger", "strawberry"] },
    { id: "earth", name: "土", short: "稳定与承载", ids: ["smoky", "tiger", "black-agate"] },
  ];

  const MBTI = [
    { id: "INTJ", name: "INTJ", short: "战略者", ids: ["lapis", "kyanite", "sodalite"] },
    { id: "INTP", name: "INTP", short: "思考者", ids: ["sodalite", "fluorite", "iolite"] },
    { id: "ENTJ", name: "ENTJ", short: "指挥官", ids: ["red-tiger", "lapis", "black-tourmaline"] },
    { id: "ENTP", name: "ENTP", short: "辩论家", ids: ["clear", "fluorite", "labradorite"] },
    { id: "INFJ", name: "INFJ", short: "提倡者", ids: ["amethyst", "charoite", "lapis"] },
    { id: "INFP", name: "INFP", short: "调停者", ids: ["rose", "morganite", "kunzite"] },
    { id: "ENFJ", name: "ENFJ", short: "主人公", ids: ["rhodochrosite", "rose", "morganite"] },
    { id: "ENFP", name: "ENFP", short: "竞选者", ids: ["sunstone", "strawberry", "citrine"] },
    { id: "ISTJ", name: "ISTJ", short: "物流师", ids: ["smoky", "white-agate", "sodalite"] },
    { id: "ISFJ", name: "ISFJ", short: "守卫者", ids: ["howlite", "rhodochrosite", "rose"] },
    { id: "ESTJ", name: "ESTJ", short: "总经理", ids: ["tiger", "black-agate", "garnet"] },
    { id: "ESFJ", name: "ESFJ", short: "执政官", ids: ["rose", "prehnite", "rhodochrosite"] },
    { id: "ISTP", name: "ISTP", short: "鉴赏家", ids: ["obsidian", "black-tourmaline", "iolite"] },
    { id: "ISFP", name: "ISFP", short: "探险家", ids: ["aquamarine", "morganite", "moonstone"] },
    { id: "ESTP", name: "ESTP", short: "企业家", ids: ["red-tiger", "sunstone", "peridot"] },
    { id: "ESFP", name: "ESFP", short: "表演者", ids: ["sunstone", "strawberry", "citrine"] },
  ];

  const ISSUES = [
    { id: "work", name: "工作卡顿", short: "推进困难、缺少突破口", ids: ["clear", "green-phantom", "red-tiger"] },
    { id: "relationship", name: "关系疲惫", short: "付出很多却没有被看见", ids: ["rose", "rhodochrosite", "red-flower"] },
    { id: "sleep", name: "睡眠不稳", short: "思绪停不下来", ids: ["amethyst", "howlite", "moonstone"] },
    { id: "low", name: "情绪低落", short: "提不起劲、缺少活力", ids: ["citrine", "sunstone", "strawberry"] },
    { id: "boundary", name: "边界感弱", short: "总是不好意思拒绝", ids: ["obsidian", "black-tourmaline", "black-agate"] },
    { id: "creative", name: "创作堵塞", short: "没有灵感、迟迟无法开始", ids: ["fluorite", "lapis", "yellow-flower"] },
    { id: "money", name: "金钱焦虑", short: "对未来的安全感不足", ids: ["aventurine", "citrine", "smoky"] },
    { id: "social", name: "社交耗竭", short: "见完人只想把自己关机", ids: ["obsidian", "howlite", "blue-lace"] },
    { id: "decision", name: "决策犹豫", short: "想得很多却做不了决定", ids: ["iolite", "sodalite", "kyanite"] },
    { id: "tension", name: "过于紧绷", short: "放松不下来、总在备战", ids: ["howlite", "kunzite", "blue-lace"] },
  ];

  const QUOTES = [
    { text: "知人者智，自知者明。", author: "老子《道德经》" },
    { text: "千里之行，始于足下。", author: "老子《道德经》" },
    { text: "知止而后有定，定而后能静。", author: "《大学》" },
    { text: "天行健，君子以自强不息。", author: "《周易》" },
    { text: "穷则变，变则通，通则久。", author: "《周易》" },
    { text: "静胜躁，寒胜热。清静为天下正。", author: "老子《道德经》" },
    { text: "水善利万物而不争。", author: "老子《道德经》" },
    { text: "君子求诸己，小人求诸人。", author: "《论语》" },
    { text: "不迁怒，不贰过。", author: "《论语》" },
    { text: "虚室生白，吉祥止止。", author: "《庄子》" },
  ];

  const SOURCE_CONFIG = {
    zodiac: {
      title: "选择你的星座",
      copy: "不确定上升星座也没关系，选太阳星座即可。",
      items: ZODIAC,
      multiple: false,
    },
    element: {
      title: "此刻最想补充哪一种五行力量？",
      copy: "不是判断命理强弱，而是选择你当下更想靠近的象征方向。",
      items: ELEMENTS,
      multiple: false,
    },
    mbti: {
      title: "选择你的人格类型",
      copy: "如果不确定，也可以选最像你的工作与思考方式。",
      items: MBTI,
      multiple: false,
    },
    issue: {
      title: "最近哪里最不顺？",
      copy: "最多选择三项，晶序会优先回应你此刻最明显的消耗。",
      items: ISSUES,
      multiple: true,
      limit: 3,
    },
  };

  const SAMPLE_BEADS = [
    { stoneId: "amethyst", size: 8 },
    { stoneId: "amethyst", size: 8 },
    { stoneId: "howlite", size: 10 },
    { stoneId: "howlite", size: 8 },
    { stoneId: "moonstone", size: 6 },
    { stoneId: "moonstone", size: 8 },
    { stoneId: "clear", size: 10 },
    { stoneId: "amethyst", size: 8 },
    { stoneId: "howlite", size: 6 },
    { stoneId: "moonstone", size: 8 },
    { stoneId: "clear", size: 8 },
    { stoneId: "amethyst", size: 12 },
  ];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const sum = (values) => values.reduce((total, value) => total + value, 0);

  function hashString(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rgbaFromHex(hex, alpha) {
    const clean = hex.replace("#", "");
    const value = Number.parseInt(clean, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNumber(value) {
    return Math.round(value * 10) / 10;
  }

  class CrystalApp {
    constructor() {
      this.state = {
        source: "zodiac",
        selections: {
          zodiac: null,
          element: null,
          mbti: null,
          issue: [],
        },
        result: null,
        detailId: "amethyst",
        studio: {
          selectedStoneId: "amethyst",
          selectedSize: 8,
          search: "",
          beads: this.loadStudio(),
          selectedBeadIndex: null,
        },
      };
      this.braceletHits = new WeakMap();
      this.crystalImages = new Map();
      this.imageRedrawQueued = false;
      this.toastTimer = null;
      this.dragIndex = null;
      this.dom = this.collectDom();
      this.bindEvents();
      this.renderSourceChoices();
      this.renderStonePicker();
      this.renderCrystalIndex();
      this.dom.catalogCount.textContent = `${CRYSTALS.length} 种成品水晶珠`;
      this.selectCrystalDetail("amethyst");
      this.renderStudio();
      this.renderImageCredits();
      this.loadRealBeadImages();
      this.observeCanvases();
      window.__crystalApp = this;
    }

    collectDom() {
      return {
        nav: document.getElementById("main-nav"),
        navButtons: [...document.querySelectorAll(".nav-button")],
        views: [...document.querySelectorAll("[data-view-panel]")],
        sourceTabs: [...document.querySelectorAll(".source-tab")],
        sourceTitle: document.getElementById("source-title"),
        sourceCopy: document.getElementById("source-copy"),
        choiceArea: document.getElementById("choice-area"),
        selectionNote: document.getElementById("selection-note"),
        analyzeButton: document.getElementById("analyze-button"),
        analyzeLabel: document.getElementById("analyze-label"),
        engineStatus: document.getElementById("engine-status"),
        emptyResult: document.getElementById("empty-result"),
        resultPanel: document.getElementById("result-panel"),
        resultContent: document.getElementById("result-content"),
        resultMatchLabel: document.getElementById("result-match-label"),
        resultBracelet: document.getElementById("result-bracelet"),
        primaryName: document.getElementById("primary-crystal-name"),
        primaryEn: document.getElementById("primary-crystal-en"),
        primaryMeaning: document.getElementById("primary-crystal-meaning"),
        primaryTags: document.getElementById("primary-crystal-tags"),
        recipeStrip: document.getElementById("recipe-strip"),
        resultEnergyChart: document.getElementById("result-energy-chart"),
        energyDominantLabel: document.getElementById("energy-dominant-label"),
        ritualList: document.getElementById("ritual-list"),
        quoteText: document.getElementById("quote-text"),
        quoteAuthor: document.getElementById("quote-author"),
        copyResultButton: document.getElementById("copy-result-button"),
        useRecipeButton: document.getElementById("use-recipe-button"),
        rerollButton: document.getElementById("reroll-button"),
        sizeSelector: document.getElementById("size-selector"),
        stoneSearch: document.getElementById("stone-search"),
        stonePicker: document.getElementById("stone-picker"),
        selectedSizeReadout: document.getElementById("selected-size-readout"),
        addBeadButton: document.getElementById("add-bead-button"),
        studioBracelet: document.getElementById("studio-bracelet"),
        studioCanvasEmpty: document.getElementById("studio-canvas-empty"),
        beadCount: document.getElementById("bead-count"),
        compositionStats: document.getElementById("composition-stats"),
        studioEnergyChart: document.getElementById("studio-energy-chart"),
        studioEnergyLabel: document.getElementById("studio-energy-label"),
        sequenceList: document.getElementById("sequence-list"),
        beadEditor: document.getElementById("bead-editor"),
        editorStoneName: document.getElementById("editor-stone-name"),
        editorSize: document.getElementById("editor-size"),
        removeBeadButton: document.getElementById("remove-bead-button"),
        moveBeadLeft: document.getElementById("move-bead-left"),
        moveBeadRight: document.getElementById("move-bead-right"),
        loadSampleButton: document.getElementById("load-sample-button"),
        clearBraceletButton: document.getElementById("clear-bracelet-button"),
        copyBraceletButton: document.getElementById("copy-bracelet-button"),
        crystalIndex: document.getElementById("crystal-index"),
        catalogCount: document.getElementById("catalog-count"),
        detailGemCanvas: document.getElementById("detail-gem-canvas"),
        detailName: document.getElementById("detail-name"),
        detailEn: document.getElementById("detail-en"),
        detailMeaning: document.getElementById("detail-meaning"),
        detailTags: document.getElementById("detail-tags"),
        detailEmotion: document.getElementById("detail-emotion"),
        detailElement: document.getElementById("detail-element"),
        detailEnergyChart: document.getElementById("detail-energy-chart"),
        detailRitual: document.getElementById("detail-ritual"),
        addDetailButton: document.getElementById("add-detail-to-bracelet"),
        imageCreditsList: document.getElementById("image-credits-list"),
        toast: document.getElementById("toast"),
      };
    }

    loadStudio() {
      try {
        const raw = JSON.parse(localStorage.getItem("crystal-studio-v3") || "null");
        if (Array.isArray(raw) && raw.every((bead) => CRYSTAL_MAP.has(bead.stoneId) && [6, 8, 10, 12].includes(bead.size))) {
          return raw;
        }
      } catch {
        // A disabled or full storage layer should not block the app.
      }
      return SAMPLE_BEADS.map((bead) => ({ ...bead }));
    }

    saveStudio() {
      try {
        localStorage.setItem("crystal-studio-v3", JSON.stringify(this.state.studio.beads));
      } catch {
        // Storage is optional; the live state remains available for this session.
      }
    }

    loadRealBeadImages() {
      const sources = new Set(CRYSTALS.map((crystal) => crystal.realImage).filter(Boolean));
      sources.forEach((source) => {
        const image = new Image();
        image.decoding = "async";
        image.addEventListener("load", () => this.queueImageRedraw());
        image.src = source;
        this.crystalImages.set(source, image);
      });
    }

    queueImageRedraw() {
      if (this.imageRedrawQueued) return;
      this.imageRedrawQueued = true;
      requestAnimationFrame(() => {
        this.imageRedrawQueued = false;
        this.renderStudioCanvas();
        this.renderResultCanvas();
        this.renderDetailCanvas();
      });
    }

    realBeadImage(crystal) {
      if (!crystal?.realImage) return null;
      const image = this.crystalImages.get(crystal.realImage);
      return image?.complete && image.naturalWidth ? image : null;
    }

    bindEvents() {
      this.dom.navButtons.forEach((button) => {
        button.addEventListener("click", () => this.switchView(button.dataset.view));
      });

      this.dom.sourceTabs.forEach((button) => {
        button.addEventListener("click", () => this.setSource(button.dataset.source));
      });

      this.dom.analyzeButton.addEventListener("click", () => this.analyze());
      this.dom.copyResultButton.addEventListener("click", () => this.copyResult());
      this.dom.useRecipeButton.addEventListener("click", () => this.useRecipeInStudio());
      this.dom.rerollButton.addEventListener("click", () => {
        this.dom.resultContent.hidden = true;
        this.dom.emptyResult.hidden = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      this.dom.sizeSelector.addEventListener("click", (event) => {
        const button = event.target.closest("[data-size]");
        if (!button) return;
        this.state.studio.selectedSize = Number(button.dataset.size);
        this.renderSizeSelector();
      });
      this.dom.stoneSearch.addEventListener("input", () => {
        this.state.studio.search = this.dom.stoneSearch.value.trim();
        this.renderStonePicker();
      });

      this.dom.addBeadButton.addEventListener("click", () => this.addBead());
      this.dom.loadSampleButton.addEventListener("click", () => {
        this.state.studio.beads = SAMPLE_BEADS.map((bead) => ({ ...bead }));
        this.state.studio.selectedBeadIndex = null;
        this.saveStudio();
        this.renderStudio();
        this.showToast("已载入月光安眠示例");
      });
      this.dom.clearBraceletButton.addEventListener("click", () => {
        this.state.studio.beads = [];
        this.state.studio.selectedBeadIndex = null;
        this.saveStudio();
        this.renderStudio();
      });
      this.dom.copyBraceletButton.addEventListener("click", () => this.copyBracelet());

      this.dom.studioBracelet.addEventListener("pointerdown", (event) => {
        const rect = this.dom.studioBracelet.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const hits = this.braceletHits.get(this.dom.studioBracelet) || [];
        let closest = null;
        hits.forEach((hit) => {
          const distance = Math.hypot(hit.x - x, hit.y - y);
          if (distance <= hit.radius + 5 && (!closest || distance < closest.distance)) {
            closest = { index: hit.index, distance };
          }
        });
        if (closest) {
          this.state.studio.selectedBeadIndex = closest.index;
          this.renderStudio();
        }
      });

      this.dom.removeBeadButton.addEventListener("click", () => this.removeSelectedBead());
      this.dom.moveBeadLeft.addEventListener("click", () => this.moveSelectedBead(-1));
      this.dom.moveBeadRight.addEventListener("click", () => this.moveSelectedBead(1));
      this.dom.editorSize.addEventListener("click", (event) => {
        const button = event.target.closest("[data-editor-size]");
        if (!button) return;
        this.changeSelectedBeadSize(Number(button.dataset.editorSize));
      });

      this.dom.addDetailButton.addEventListener("click", () => {
        this.state.studio.selectedStoneId = this.state.detailId;
        this.state.studio.selectedSize = 8;
        this.addBead();
        this.switchView("studio");
      });
    }

    observeCanvases() {
      if (!window.ResizeObserver) return;
      const observer = new ResizeObserver(() => {
        this.renderStudioCanvas();
        this.renderResultCanvas();
        this.renderDetailCanvas();
      });
      observer.observe(this.dom.studioBracelet);
      observer.observe(this.dom.resultBracelet);
      observer.observe(this.dom.detailGemCanvas);
    }

    switchView(view) {
      this.state.view = view;
      this.dom.navButtons.forEach((button) => {
        const active = button.dataset.view === view;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      this.dom.views.forEach((panel) => {
        const active = panel.dataset.viewPanel === view;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      requestAnimationFrame(() => {
        if (view === "studio") this.renderStudioCanvas();
        if (view === "library") this.renderDetailCanvas();
      });
    }

    setSource(source) {
      this.state.source = source;
      this.dom.sourceTabs.forEach((button) => {
        const active = button.dataset.source === source;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
      this.renderSourceChoices();
    }

    renderSourceChoices() {
      const config = SOURCE_CONFIG[this.state.source];
      this.dom.sourceTitle.textContent = config.title;
      this.dom.sourceCopy.textContent = config.copy;
      this.dom.choiceArea.classList.toggle("issues", this.state.source === "issue");
      this.dom.choiceArea.innerHTML = config.items
        .map((item) => {
          const selected = this.isSourceItemSelected(item.id);
          return `
            <button class="choice-button${selected ? " is-selected" : ""}" type="button" data-item-id="${item.id}">
              <span>${escapeHtml(item.name)}</span>
              <small>${escapeHtml(item.short)}</small>
            </button>
          `;
        })
        .join("");

      this.dom.choiceArea.querySelectorAll("[data-item-id]").forEach((button) => {
        button.addEventListener("click", () => this.selectSourceItem(button.dataset.itemId));
      });
      this.updateSelectionState();
    }

    isSourceItemSelected(itemId) {
      if (this.state.source === "issue") return this.state.selections.issue.includes(itemId);
      return this.state.selections[this.state.source] === itemId;
    }

    selectSourceItem(itemId) {
      const config = SOURCE_CONFIG[this.state.source];
      if (config.multiple) {
        const current = this.state.selections.issue;
        if (current.includes(itemId)) {
          this.state.selections.issue = current.filter((id) => id !== itemId);
        } else if (current.length >= config.limit) {
          this.showToast(`最多选择 ${config.limit} 项，先取消一个再继续`);
          return;
        } else {
          this.state.selections.issue = [...current, itemId];
        }
      } else {
        this.state.selections[this.state.source] = itemId;
      }
      this.renderSourceChoices();
    }

    selectedItems() {
      const config = SOURCE_CONFIG[this.state.source];
      if (config.multiple) {
        return config.items.filter((item) => this.state.selections.issue.includes(item.id));
      }
      return config.items.filter((item) => item.id === this.state.selections[this.state.source]);
    }

    updateSelectionState() {
      const selected = this.selectedItems();
      const labels = selected.map((item) => item.name);
      this.dom.selectionNote.querySelector("span:first-child").textContent = labels.length
        ? `已选择：${labels.join("、")}`
        : "未选择";
      this.dom.analyzeButton.disabled = selected.length === 0;
      this.dom.analyzeLabel.textContent = selected.length ? "1 秒测出我的水晶" : "请先完成选择";
    }

    analyze() {
      const selected = this.selectedItems();
      if (!selected.length) return;
      this.dom.analyzeButton.disabled = true;
      this.dom.analyzeLabel.textContent = "正在读取你的选择…";
      this.dom.engineStatus.textContent = "正在编织三石配方";

      window.setTimeout(() => {
        this.state.result = this.buildResult();
        this.renderResult();
        this.dom.analyzeButton.disabled = false;
        this.dom.analyzeLabel.textContent = "重新测算一次";
        this.dom.engineStatus.textContent = "测配完成";
      }, 760);
    }

    buildResult() {
      const selected = this.selectedItems();
      const scoreMap = new Map(CRYSTALS.map((crystal) => [crystal.id, 0.1 + (hashString(crystal.id) % 11) / 100]));
      const addScores = (ids, weights) => {
        ids.forEach((id, index) => {
          scoreMap.set(id, (scoreMap.get(id) || 0) + (weights[index] || weights.at(-1) || 1));
        });
      };

      if (this.state.source === "issue") {
        selected.forEach((issue) => addScores(issue.ids, [6, 4, 2.5]));
      } else {
        selected.forEach((item) => addScores(item.ids, [8, 5, 3]));
      }

      const ranked = CRYSTALS.map((crystal) => ({
        crystal,
        score: scoreMap.get(crystal.id) || 0,
      })).sort((first, second) => second.score - first.score || first.crystal.id.localeCompare(second.crystal.id));

      const [primary, support, balance] = ranked.slice(0, 3).map((item) => item.crystal);
      const recipe = [
        { role: "主石", crystal: primary, count: 5, size: 8 },
        { role: "辅石", crystal: support, count: 3, size: 8 },
        { role: "平衡石", crystal: balance, count: 2, size: 6 },
      ];
      const beads = recipe.flatMap((item) =>
        Array.from({ length: item.count }, () => ({ stoneId: item.crystal.id, size: item.size })),
      );
      const energies = this.combineEnergies(beads);
      const quote = this.pickQuote(selected);
      const sourceLabel = SOURCE_CONFIG[this.state.source].title.replace(/选择|此刻|最近/g, "").replace("？", "");

      return {
        primary,
        support,
        balance,
        recipe,
        beads,
        energies,
        quote,
        sourceLabel,
        selectedLabels: selected.map((item) => item.name),
      };
    }

    pickQuote(selected) {
      let index = hashString(`${this.state.source}-${selected.map((item) => item.id).join("-")}`) % QUOTES.length;
      if (this.state.source === "issue" && selected[0]) {
        const issueIndex = ISSUES.findIndex((issue) => issue.id === selected[0].id);
        index = (issueIndex * 3 + selected.length) % QUOTES.length;
      }
      return QUOTES[index];
    }

    combineEnergies(beads) {
      if (!beads.length) {
        return Object.fromEntries(ENERGY_DIMENSIONS.map((dimension) => [dimension.key, 0]));
      }
      const weighted = Object.fromEntries(ENERGY_DIMENSIONS.map((dimension) => [dimension.key, 0]));
      let totalWeight = 0;
      beads.forEach((bead) => {
        const crystal = CRYSTAL_MAP.get(bead.stoneId);
        if (!crystal) return;
        const weight = Math.max(1, bead.size / 8);
        totalWeight += weight;
        ENERGY_DIMENSIONS.forEach((dimension) => {
          weighted[dimension.key] += crystal.energies[dimension.key] * weight;
        });
      });
      return Object.fromEntries(
        ENERGY_DIMENSIONS.map((dimension) => [dimension.key, Math.round(weighted[dimension.key] / totalWeight)]),
      );
    }

    renderResult() {
      const result = this.state.result;
      if (!result) return;
      this.dom.emptyResult.hidden = true;
      this.dom.resultContent.hidden = false;
      this.dom.resultContent.classList.remove("is-revealing");
      void this.dom.resultContent.offsetWidth;
      this.dom.resultContent.classList.add("is-revealing");

      this.dom.resultMatchLabel.textContent = `${result.sourceLabel} · 你的此刻配方`;
      this.dom.primaryName.textContent = result.primary.name;
      this.dom.primaryEn.textContent = result.primary.en;
      this.dom.primaryMeaning.textContent = result.primary.meaning;
      this.dom.primaryTags.innerHTML = result.primary.tags
        .map((tag) => `<span>${escapeHtml(tag)}</span>`)
        .join("");

      this.dom.recipeStrip.innerHTML = result.recipe
        .map(
          (item) => `
            <div class="recipe-chip">
              <span class="swatch-dot" style="--swatch:${item.crystal.color}"></span>
              <span>
                <strong>${escapeHtml(item.role)} · ${escapeHtml(item.crystal.name)}</strong>
                <small>${item.count} 颗 · ${item.size} mm</small>
              </span>
            </div>
          `,
        )
        .join("");

      this.renderEnergyChart(this.dom.resultEnergyChart, result.energies);
      const dominant = this.dominantDimension(result.energies);
      this.dom.energyDominantLabel.textContent = `${dominant.label}领先`;

      this.dom.ritualList.innerHTML = [
        {
          title: `主石 · ${result.primary.name}`,
          copy: result.primary.usage,
        },
        {
          title: `辅石 · ${result.support.name}`,
          copy: result.support.usage,
        },
        {
          title: `组合练习 · ${result.balance.name}`,
          copy: `佩戴或拿起这组水晶时，用一分钟观察“${dominant.label}”是否真的变清晰；只记录感受，不急着判断有效或无效。`,
        },
      ]
        .map(
          (item, index) => `
            <article class="ritual-item">
              <span class="ritual-number">${index + 1}</span>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.copy)}</p>
            </article>
          `,
        )
        .join("");

      this.dom.quoteText.textContent = result.quote.text;
      this.dom.quoteAuthor.textContent = `—— ${result.quote.author}`;
      requestAnimationFrame(() => this.renderResultCanvas());
      if (window.matchMedia("(max-width: 700px)").matches) {
        requestAnimationFrame(() => {
          this.dom.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }

    renderEnergyChart(container, energies) {
      const dominant = this.dominantDimension(energies);
      const labels = ENERGY_DIMENSIONS.map((dimension) => `${dimension.label}${energies[dimension.key] || 0}`).join("，");
      container.setAttribute("aria-label", `情绪力量柱状图：${labels}，最高为${dominant.label}`);
      container.innerHTML = ENERGY_DIMENSIONS.map(
        (dimension) => `
          <div class="energy-item">
            <div class="energy-bar-track">
              <div class="energy-bar" style="--value:${energies[dimension.key] || 0};--bar-color:${dimension.color}">
                <span class="energy-value">${energies[dimension.key] || 0}</span>
              </div>
            </div>
            <span class="energy-label">${dimension.label}</span>
          </div>
        `,
      ).join("");
    }

    dominantDimension(energies) {
      return ENERGY_DIMENSIONS.reduce((best, dimension) =>
        (energies[dimension.key] || 0) > (energies[best.key] || 0) ? dimension : best,
      );
    }

    useRecipeInStudio() {
      if (!this.state.result) return;
      this.state.studio.beads = this.state.result.beads.map((bead) => ({ ...bead }));
      this.state.studio.selectedBeadIndex = null;
      this.state.studio.selectedStoneId = this.state.result.primary.id;
      this.saveStudio();
      this.renderStudio();
      this.switchView("studio");
      this.showToast("推荐配方已放进串珠台");
    }

    renderStonePicker() {
      const query = this.state.studio.search.toLowerCase();
      const visibleCrystals = query
        ? CRYSTALS.filter((crystal) =>
            `${crystal.name} ${crystal.en} ${crystal.tags.join(" ")}`.toLowerCase().includes(query),
          )
        : CRYSTALS;
      this.dom.stonePicker.innerHTML = visibleCrystals.length
        ? visibleCrystals.map(
        (crystal) => `
          <button
            class="stone-option${crystal.id === this.state.studio.selectedStoneId ? " is-selected" : ""}"
            type="button"
            data-stone-id="${crystal.id}"
          >
            ${this.gemThumbMarkup(crystal)}
            <span>
              <strong>${escapeHtml(crystal.name)}</strong>
              <small>${escapeHtml(crystal.emotion)}</small>
            </span>
          </button>
          `,
        ).join("")
        : '<div class="sequence-empty">没有找到这个名称<br />试试其他关键词</div>';
      this.dom.stonePicker.querySelectorAll("[data-stone-id]").forEach((button) => {
        button.addEventListener("click", () => {
          this.state.studio.selectedStoneId = button.dataset.stoneId;
          this.renderStonePicker();
        });
      });
    }

    gemThumbMarkup(crystal) {
      const style = crystal.beadStyle || BEAD_STYLE_BY_ID[crystal.id] || "crystal";
      const realImage = crystal.realImage;
      return `
        <span
          class="gem-thumb bead-style-${style}${realImage ? " has-live-image" : ""}"
          style="--gem-color:${crystal.color};--gem-dark:${crystal.dark};--gem-light:${crystal.light};${realImage ? `--live-image:url('${realImage}');` : ""}"
          data-style="${style}"
          aria-hidden="true"
        ></span>
      `;
    }

    renderSizeSelector() {
      this.dom.sizeSelector.querySelectorAll("[data-size]").forEach((button) => {
        const active = Number(button.dataset.size) === this.state.studio.selectedSize;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-checked", String(active));
      });
      this.dom.selectedSizeReadout.textContent = `${this.state.studio.selectedSize} mm`;
    }

    addBead() {
      this.state.studio.beads.push({
        stoneId: this.state.studio.selectedStoneId,
        size: this.state.studio.selectedSize,
      });
      this.state.studio.selectedBeadIndex = this.state.studio.beads.length - 1;
      this.saveStudio();
      this.renderStudio();
      const crystal = CRYSTAL_MAP.get(this.state.studio.selectedStoneId);
      this.showToast(`${crystal.name} ${this.state.studio.selectedSize} mm 已加入`);
    }

    renderStudio() {
      this.renderSizeSelector();
      this.renderSequence();
      this.renderStudioStats();
      this.renderStudioCanvas();
    }

    renderStudioStats() {
      const beads = this.state.studio.beads;
      const energies = this.combineEnergies(beads);
      const dominant = this.dominantDimension(energies);
      const uniqueStones = new Set(beads.map((bead) => bead.stoneId)).size;
      const averageSize = beads.length
        ? beads.reduce((total, bead) => total + bead.size, 0) / beads.length
        : 0;

      this.dom.beadCount.textContent = `${beads.length} 颗`;
      this.dom.studioCanvasEmpty.hidden = beads.length > 0;
      this.dom.compositionStats.innerHTML = `
        <div class="stat-tile">
          <span>珠子总数</span>
          <strong>${beads.length} 颗</strong>
        </div>
        <div class="stat-tile">
          <span>平均珠径</span>
          <strong>${beads.length ? `${formatNumber(averageSize)} mm` : "—"}</strong>
        </div>
        <div class="stat-tile">
          <span>水晶种类</span>
          <strong>${uniqueStones} 种</strong>
        </div>
      `;

      if (!beads.length) {
        this.dom.studioEnergyLabel.textContent = "等待添加";
        this.dom.studioEnergyChart.innerHTML = ENERGY_DIMENSIONS.map(
          (dimension) => `
            <div class="energy-item">
              <div class="energy-bar-track"><div class="energy-bar" style="--value:0;--bar-color:${dimension.color}"></div></div>
              <span class="energy-label">${dimension.label}</span>
            </div>
          `,
        ).join("");
        return;
      }

      this.dom.studioEnergyLabel.textContent = `${dominant.label}领先`;
      this.renderEnergyChart(this.dom.studioEnergyChart, energies);
    }

    renderSequence() {
      const beads = this.state.studio.beads;
      const selectedIndex = this.state.studio.selectedBeadIndex;
      if (!beads.length) {
        this.dom.sequenceList.innerHTML = '<div class="sequence-empty">还没有珠子<br />从左侧选一颗加入吧</div>';
      } else {
        this.dom.sequenceList.innerHTML = beads
          .map((bead, index) => {
            const crystal = CRYSTAL_MAP.get(bead.stoneId);
            return `
              <div
                class="sequence-item${index === selectedIndex ? " is-selected" : ""}"
                data-sequence-index="${index}"
                draggable="true"
              >
                <span class="drag-handle" aria-hidden="true">⋮⋮</span>
                ${this.gemThumbMarkup(crystal)}
                <span class="sequence-copy">
                  <strong>${escapeHtml(crystal.name)}</strong>
                  <small>${escapeHtml(crystal.tags.join(" · "))}</small>
                </span>
                <span class="sequence-size">${bead.size} mm</span>
              </div>
            `;
          })
          .join("");

        this.dom.sequenceList.querySelectorAll("[data-sequence-index]").forEach((item) => {
          item.addEventListener("click", () => {
            this.state.studio.selectedBeadIndex = Number(item.dataset.sequenceIndex);
            this.renderStudio();
          });
          item.addEventListener("dragstart", (event) => {
            this.dragIndex = Number(item.dataset.sequenceIndex);
            item.classList.add("is-dragging");
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(this.dragIndex));
          });
          item.addEventListener("dragend", () => {
            this.dragIndex = null;
            item.classList.remove("is-dragging");
          });
          item.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          });
          item.addEventListener("drop", (event) => {
            event.preventDefault();
            const from = Number(event.dataTransfer.getData("text/plain"));
            const to = Number(item.dataset.sequenceIndex);
            this.reorderBead(from, to);
          });
        });
      }
      this.updateBeadEditor();
    }

    updateBeadEditor() {
      const index = this.state.studio.selectedBeadIndex;
      const bead = index === null ? null : this.state.studio.beads[index];
      this.dom.beadEditor.hidden = !bead;
      if (!bead) return;
      const crystal = CRYSTAL_MAP.get(bead.stoneId);
      this.dom.editorStoneName.textContent = crystal.name;
      this.dom.editorSize.querySelectorAll("[data-editor-size]").forEach((button) => {
        button.classList.toggle("is-active", Number(button.dataset.editorSize) === bead.size);
      });
      this.dom.moveBeadLeft.disabled = index === 0;
      this.dom.moveBeadRight.disabled = index === this.state.studio.beads.length - 1;
    }

    reorderBead(from, to) {
      if (!Number.isInteger(from) || !Number.isInteger(to) || from === to) return;
      const beads = this.state.studio.beads;
      const [moved] = beads.splice(from, 1);
      beads.splice(to, 0, moved);
      this.state.studio.selectedBeadIndex = to;
      this.saveStudio();
      this.renderStudio();
    }

    removeSelectedBead() {
      const index = this.state.studio.selectedBeadIndex;
      if (index === null) return;
      this.state.studio.beads.splice(index, 1);
      this.state.studio.selectedBeadIndex = this.state.studio.beads.length
        ? clamp(index, 0, this.state.studio.beads.length - 1)
        : null;
      this.saveStudio();
      this.renderStudio();
    }

    moveSelectedBead(direction) {
      const index = this.state.studio.selectedBeadIndex;
      if (index === null) return;
      const target = index + direction;
      if (target < 0 || target >= this.state.studio.beads.length) return;
      this.reorderBead(index, target);
    }

    changeSelectedBeadSize(size) {
      const index = this.state.studio.selectedBeadIndex;
      if (index === null) return;
      this.state.studio.beads[index].size = size;
      this.saveStudio();
      this.renderStudio();
    }

    renderStudioCanvas() {
      this.drawBracelet(
        this.dom.studioBracelet,
        this.state.studio.beads,
        this.state.studio.selectedBeadIndex,
      );
    }

    renderResultCanvas() {
      if (!this.state.result || this.dom.resultContent.hidden) return;
      this.drawBracelet(this.dom.resultBracelet, this.state.result.beads, null);
    }

    drawBracelet(canvas, beads, selectedIndex) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const context = canvas.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const center = { x: width * 0.5, y: height * 0.5 };
      const ringRadius = Math.min(width, height) * 0.315;
      const hits = [];

      context.save();
      context.strokeStyle = "rgba(78, 111, 109, 0.28)";
      context.lineWidth = Math.max(1.4, ringRadius * 0.018);
      context.setLineDash(beads.length ? [] : [5, 7]);
      context.beginPath();
      context.arc(center.x, center.y, ringRadius, 0, Math.PI * 2);
      context.stroke();
      context.restore();

      if (!beads.length) return;

      const gapMm = 0.55;
      const physicalWeights = beads.map((bead) => bead.size + gapMm);
      const totalWeight = sum(physicalWeights);
      const naturalRingRadiusMm = totalWeight / (Math.PI * 2);
      const largestBeadMm = Math.max(...beads.map((bead) => bead.size));
      const availableRadius = Math.min(width, height) * 0.43;
      const scale = Math.min(
        8.8,
        availableRadius / (naturalRingRadiusMm + largestBeadMm * 0.5),
      );
      const fittedRingRadius = naturalRingRadiusMm * scale;
      let cursor = -Math.PI * 0.5;

      beads.forEach((bead, index) => {
        const crystal = CRYSTAL_MAP.get(bead.stoneId);
        if (!crystal) return;
        const angleSpan = (physicalWeights[index] / totalWeight) * Math.PI * 2;
        const angle = cursor + angleSpan * 0.5;
        const x = center.x + Math.cos(angle) * fittedRingRadius;
        const y = center.y + Math.sin(angle) * fittedRingRadius;
        const radius = clamp(bead.size * scale * 0.5, 5, 72);
        this.drawBead(context, x, y, radius, crystal, index, index === selectedIndex);
        hits.push({ x, y, radius, index });
        cursor += angleSpan;
      });

      this.braceletHits.set(canvas, hits);
    }

    drawBead(context, x, y, radius, crystal, index, selected) {
      context.save();
      context.fillStyle = "rgba(23, 51, 52, 0.13)";
      context.beginPath();
      context.ellipse(x + radius * 0.15, y + radius * 0.48, radius * 0.94, radius * 0.62, 0, 0, Math.PI * 2);
      context.fill();

      const gradient = context.createRadialGradient(
        x - radius * 0.36,
        y - radius * 0.42,
        radius * 0.04,
        x,
        y,
        radius * 1.08,
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.12, crystal.light);
      gradient.addColorStop(0.42, crystal.color);
      gradient.addColorStop(1, crystal.dark);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();

      context.save();
      context.beginPath();
      context.arc(x, y, radius * 0.96, 0, Math.PI * 2);
      context.clip();
      const realImage = this.realBeadImage(crystal);
      if (realImage) {
        context.globalAlpha = 0.98;
        context.drawImage(realImage, x - radius, y - radius, radius * 2, radius * 2);
        context.globalAlpha = 1;
      } else {
        this.drawBeadTexture(context, x, y, radius, crystal, index);
      }
      const shade = context.createRadialGradient(
        x - radius * 0.32,
        y - radius * 0.38,
        radius * 0.04,
        x,
        y,
        radius * 1.05,
      );
      shade.addColorStop(0, "rgba(255, 255, 255, 0.06)");
      shade.addColorStop(0.6, "rgba(0, 0, 0, 0)");
      shade.addColorStop(1, "rgba(15, 30, 32, 0.24)");
      context.fillStyle = shade;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      context.restore();

      context.strokeStyle = selected ? "rgba(35, 111, 115, 0.94)" : "rgba(255, 255, 255, 0.54)";
      context.lineWidth = selected ? 2.4 : 1;
      context.beginPath();
      context.arc(x, y, radius * 0.98, 0, Math.PI * 2);
      context.stroke();

      context.fillStyle = "rgba(255, 255, 255, 0.75)";
      context.beginPath();
      context.ellipse(
        x - radius * 0.3,
        y - radius * 0.38,
        radius * 0.16,
        radius * 0.1,
        -0.5,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.beginPath();
      context.ellipse(
        x - radius * 0.52,
        y - radius * 0.22,
        radius * 0.055,
        radius * 0.04,
        -0.5,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.restore();
    }

    drawBeadTexture(context, x, y, radius, crystal, index) {
      const style = crystal.beadStyle || BEAD_STYLE_BY_ID[crystal.id] || "crystal";
      let seed = (hashString(crystal.id) + index * 977) >>> 0;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967295;
      };

      if (style === "clear") {
        context.strokeStyle = "rgba(255, 255, 255, 0.34)";
        context.lineWidth = Math.max(0.8, radius * 0.045);
        context.beginPath();
        context.moveTo(x - radius * 0.86, y + radius * 0.05);
        context.lineTo(x - radius * 0.22, y - radius * 0.06);
        context.lineTo(x + radius * 0.2, y - radius * 0.56);
        context.moveTo(x - radius * 0.24, y + radius * 0.1);
        context.lineTo(x + radius * 0.56, y + radius * 0.6);
        context.stroke();
        context.fillStyle = "rgba(255, 255, 255, 0.14)";
        for (let point = 0; point < 4; point += 1) {
          context.beginPath();
          context.arc(
            x + (random() - 0.5) * radius * 1.2,
            y + (random() - 0.5) * radius * 1.2,
            Math.max(0.7, radius * (0.018 + random() * 0.025)),
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        return;
      }

      if (style === "cat-eye") {
        const angle = index % 2 ? -0.55 : 0.55;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        const sheen = context.createLinearGradient(x - dx, y - dy, x + dx, y + dy);
        sheen.addColorStop(0, "rgba(255, 255, 255, 0)");
        sheen.addColorStop(0.36, "rgba(255, 255, 255, 0.06)");
        sheen.addColorStop(0.48, "rgba(255, 255, 255, 0.48)");
        sheen.addColorStop(0.52, "rgba(255, 255, 255, 0.18)");
        sheen.addColorStop(0.65, "rgba(255, 255, 255, 0.03)");
        sheen.addColorStop(1, "rgba(0, 0, 0, 0.08)");
        context.fillStyle = sheen;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        return;
      }

      if (style === "banded") {
        context.strokeStyle = crystal.id === "black-agate" ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.2)";
        context.lineWidth = Math.max(1, radius * 0.06);
        for (let line = -2; line <= 2; line += 1) {
          context.beginPath();
          context.moveTo(x - radius * 1.05, y + line * radius * 0.28 - radius * 0.08);
          context.bezierCurveTo(
            x - radius * 0.34,
            y + line * radius * 0.24 + radius * 0.1,
            x + radius * 0.25,
            y + line * radius * 0.32 - radius * 0.08,
            x + radius * 1.05,
            y + line * radius * 0.24,
          );
          context.stroke();
        }
        return;
      }

      if (style === "matrix") {
        for (let point = 0; point < 15; point += 1) {
          const angle = random() * Math.PI * 2;
          const distance = Math.sqrt(random()) * radius * 0.72;
          const dotRadius = Math.max(0.7, radius * (0.012 + random() * 0.026));
          context.fillStyle = point % 3 === 0 ? "rgba(255, 255, 255, 0.18)" : rgbaFromHex(crystal.dark, 0.2);
          context.beginPath();
          context.arc(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            dotRadius,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
        return;
      }

      if (style === "flakes") {
        for (let point = 0; point < 11; point += 1) {
          const px = x + (random() - 0.5) * radius * 1.15;
          const py = y + (random() - 0.5) * radius * 1.15;
          context.fillStyle = point % 4 === 0 ? "rgba(255, 255, 255, 0.35)" : rgbaFromHex(crystal.light, 0.22);
          context.beginPath();
          context.arc(px, py, Math.max(0.6, radius * (0.018 + random() * 0.032)), 0, Math.PI * 2);
          context.fill();
        }
        return;
      }

      if (style === "cloudy") {
        for (let patch = 0; patch < 3; patch += 1) {
          const px = x + (random() - 0.5) * radius * 0.72;
          const py = y + (random() - 0.5) * radius * 0.72;
          const cloud = context.createRadialGradient(px, py, 0, px, py, radius * (0.34 + random() * 0.18));
          cloud.addColorStop(0, "rgba(255, 255, 255, 0.26)");
          cloud.addColorStop(1, "rgba(255, 255, 255, 0)");
          context.fillStyle = cloud;
          context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        return;
      }

      context.strokeStyle = "rgba(255, 255, 255, 0.2)";
      context.lineWidth = Math.max(0.8, radius * 0.026);
      context.beginPath();
      context.moveTo(x - radius * 0.8, y - radius * 0.2);
      context.lineTo(x - radius * 0.08, y + radius * 0.05);
      context.lineTo(x + radius * 0.22, y - radius * 0.56);
      context.moveTo(x - radius * 0.14, y + radius * 0.08);
      context.lineTo(x + radius * 0.48, y + radius * 0.58);
      context.stroke();
    }

    renderCrystalIndex() {
      this.dom.crystalIndex.innerHTML = CRYSTALS.map(
        (crystal) => `
          <button
            class="crystal-index-button${crystal.id === this.state.detailId ? " is-selected" : ""}"
            type="button"
            data-detail-id="${crystal.id}"
          >
            ${this.gemThumbMarkup(crystal)}
            <span>
              <strong>${escapeHtml(crystal.name)}</strong>
              <small>${escapeHtml(crystal.emotion)}</small>
            </span>
          </button>
        `,
      ).join("");
      this.dom.crystalIndex.querySelectorAll("[data-detail-id]").forEach((button) => {
        button.addEventListener("click", () => this.selectCrystalDetail(button.dataset.detailId));
      });
    }

    renderImageCredits() {
      if (!this.dom.imageCreditsList) return;
      this.dom.imageCreditsList.innerHTML = CRYSTALS.map((crystal) => {
        const credit = IMAGE_DATA[crystal.id];
        if (!credit) return "";
        return `
          <a class="image-credit-item" href="${escapeHtml(credit.source)}" target="_blank" rel="noreferrer">
            <strong>${escapeHtml(crystal.name)} · ${escapeHtml(credit.creator)}</strong>
            <span>${escapeHtml(credit.title)}</span>
            <span>${escapeHtml(credit.license)} · Wikimedia Commons</span>
          </a>
        `;
      }).join("");
    }

    selectCrystalDetail(id) {
      const crystal = CRYSTAL_MAP.get(id) || CRYSTALS[0];
      this.state.detailId = crystal.id;
      if (this.dom.crystalIndex.children.length) {
        this.dom.crystalIndex.querySelectorAll("[data-detail-id]").forEach((button) => {
          button.classList.toggle("is-selected", button.dataset.detailId === crystal.id);
        });
      }
      this.dom.detailName.textContent = crystal.name;
      this.dom.detailEn.textContent = crystal.en;
      this.dom.detailMeaning.textContent = crystal.meaning;
      this.dom.detailTags.innerHTML = crystal.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
      this.dom.detailEmotion.textContent = crystal.emotion;
      this.dom.detailElement.textContent = crystal.element;
      this.dom.detailRitual.textContent = crystal.usage;
      this.renderEnergyChart(this.dom.detailEnergyChart, crystal.energies);
      requestAnimationFrame(() => this.renderDetailCanvas());
    }

    renderDetailCanvas() {
      if (document.getElementById("view-library").hidden) return;
      const crystal = CRYSTAL_MAP.get(this.state.detailId);
      this.drawSingleGem(this.dom.detailGemCanvas, crystal);
    }

    drawSingleGem(canvas, crystal) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 20 || rect.height < 20) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const context = canvas.getContext("2d");
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width * 0.37, height * 0.4);
      this.drawBead(context, width * 0.5, height * 0.5, radius, crystal, 0, false);
    }

    copyResult() {
      const result = this.state.result;
      if (!result) return;
      const energyText = ENERGY_DIMENSIONS.map(
        (dimension) => `${dimension.label} ${result.energies[dimension.key]}`,
      ).join(" / ");
      const text = [
        `晶序 · ${result.sourceLabel}水晶配方`,
        `主石：${result.primary.name}（${result.primary.meaning}）`,
        `辅石：${result.support.name}`,
        `平衡石：${result.balance.name}`,
        `组合能量：${energyText}`,
        `赠言：${result.quote.text} —— ${result.quote.author}`,
        "说明：内容用于象征与自我关照，不替代专业建议。",
      ].join("\n");
      this.copyText(text, "结果摘要已复制");
    }

    copyBracelet() {
      const beads = this.state.studio.beads;
      if (!beads.length) {
        this.showToast("先加入至少一颗珠子");
        return;
      }
      const counts = new Map();
      beads.forEach((bead) => {
        const key = `${bead.stoneId}-${bead.size}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });
      const lines = [...counts.entries()].map(([key, count]) => {
        const [stoneId, size] = key.split("-");
        return `${CRYSTAL_MAP.get(stoneId).name} ${size} mm × ${count}`;
      });
      this.copyText(`晶序手链清单（共 ${beads.length} 颗）\n${lines.join("\n")}`, "手链清单已复制");
    }

    async copyText(text, successMessage) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }
      this.showToast(successMessage);
    }

    showToast(message) {
      this.dom.toast.textContent = message;
      this.dom.toast.classList.add("is-visible");
      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.dom.toast.classList.remove("is-visible");
      }, 2200);
    }
  }

  new CrystalApp();
})();
