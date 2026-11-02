const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const demoCases = [
  {
    id: "fire-lab-electrical-smoke-002",
    reviewStatus: "approved",
    safetyType: "消防安全",
    campusScene: "实验室电器起火",
    title: "实验室仪器插座冒烟",
    subtitle: "先断电，还是先灭火？",
    sceneClass: "scene-fire",
    sourceName: "南开大学消防安全管理规定与实验室安全要求",
    sourceUrl: "https://guard.nankai.edu.cn/",
    sourceDate: "2026-10-27",
    desensitization: "采用通用实验室消防情景，不涉及具体实验室、课题组和个人信息。",
    actor: "实验同组同学",
    peer: "实验室同学",
    authority: "实验室安全负责人、保卫处或119",
    hook: "晚间实验接近结束时，仪器插座突然冒烟并伴有焦糊味，旁边还放着少量易燃试剂。",
    firstLure: "同组同学说数据马上就能保存，建议再坚持一分钟，随后再处理插座。",
    escalation: "插座开始出现火星，烟雾增多，火源与试剂的距离不断缩短，人员仍停留在设备旁。",
    pressure: "大家担心实验中断和数据丢失，有人准备直接泼水，有人想靠近拔掉正在冒烟的插头。",
    riskyChoice: "继续保存数据，并直接用水处理带电设备。",
    safeChoice: "立即提醒人员撤离，在确保安全的前提下切断总电源并联系实验室负责人、保卫处或119。",
    helperAction: "先制止人员靠近和泼水，引导撤离，再协助切断电源、报警并说明试剂和人员情况。",
    wrongHelp: "不判断电气和试剂风险，拿起身边任意灭火器独自靠近处置。",
    warningSigns: [
      "插座冒烟并伴有焦糊味",
      "带电设备出现火星",
      "火源附近存在易燃试剂",
      "人员为保存数据延误撤离",
      "有人准备向带电设备泼水"
    ],
    safeActions: [
      "立即示警并组织人员撤离",
      "确保安全后切断实验室总电源",
      "禁止用水扑救带电设备",
      "向119、保卫处和实验室负责人说明位置与试剂情况",
      "未经确认不得返回实验室"
    ]
  },
  {
    id: "fire-evacuation-blocked-003",
    reviewStatus: "approved",
    safetyType: "消防安全",
    campusScene: "疏散通道堵塞",
    title: "教学楼火警与通道堵塞",
    subtitle: "警铃响起，出口却被挡住",
    sceneClass: "scene-fire",
    sourceName: "南开大学消防安全管理规定与校园疏散要求",
    sourceUrl: "https://guard.nankai.edu.cn/",
    sourceDate: "2026-10-27",
    desensitization: "采用通用教学楼疏散情景，不涉及具体楼宇、班级和个人信息。",
    actor: "同班同学",
    peer: "班级安全员",
    authority: "现场工作人员、保卫处或119",
    hook: "教学楼火警响起，走廊一端出现烟雾，常用安全出口又被活动物料占去一部分空间。",
    firstLure: "有同学认为只是演练，想乘电梯下楼；另一名同学准备逆着人流返回教室拿电脑。",
    escalation: "烟雾逐渐进入走廊，狭窄出口前开始拥挤，有人停下拍摄，疏散速度明显下降。",
    pressure: "人群催促前进，但前方路线不清，班级集合点还缺少一名同学。",
    riskyChoice: "跟随人群挤向受阻出口，或者逆行返回取个人物品。",
    safeChoice: "服从现场指引，选择可用安全出口有序撤离，不乘电梯、不返回取物。",
    helperAction: "提醒同学放弃取物，协助维持单向疏散，到集合点后立即报告缺员和堵塞位置。",
    wrongHelp: "高声催促大家快跑并推挤前方人员，造成出口更加拥堵。",
    warningSigns: [
      "走廊出现烟雾",
      "安全出口被物料占用",
      "有人准备乘坐电梯",
      "有人逆行返回取物",
      "集合点清点发现人员缺失"
    ],
    safeActions: [
      "按疏散指示和现场指挥选择可用出口",
      "保持秩序，不推挤、不乘电梯、不返回取物",
      "通过烟区时降低身体并做好呼吸防护",
      "到集合点后立即清点并报告缺员",
      "向保卫处报告通道堵塞的准确位置"
    ]
  },
  {
    id: "fire-canteen-oil-pan-004",
    reviewStatus: "approved",
    safetyType: "消防安全",
    campusScene: "食堂后厨油锅起火",
    title: "食堂后厨油锅突然起火",
    subtitle: "盖上锅盖，还是直接泼水？",
    sceneClass: "scene-fire",
    sourceName: "校园消防安全与餐饮场所火灾处置要求综合改编",
    sourceUrl: "https://guard.nankai.edu.cn/",
    sourceDate: "2026-11-02",
    desensitization: "采用通用校园食堂消防情景，不涉及具体食堂、档口和个人信息。",
    actor: "后厨工作人员",
    peer: "现场同学",
    authority: "食堂安全负责人、保卫处或119",
    hook: "用餐高峰期，食堂后厨油锅突然起火，火焰迅速升高，排烟罩附近开始积聚烟气。",
    firstLure: "有人下意识端来一盆水，准备直接泼向油锅；周围同学则举起手机围观。",
    escalation: "火焰继续升高，附近可燃物受到烘烤，围观人员堵住了工作人员撤离和取用灭火器的通道。",
    pressure: "现场嘈杂且人员密集，大家急于马上灭火，却没有先判断油火和人员疏散风险。",
    riskyChoice: "向油锅泼水，并让围观人员继续停留在后厨入口。",
    safeChoice: "立即示警疏散，在确保安全时关闭火源，用锅盖或灭火毯覆盖，并联系负责人、保卫处或119。",
    helperAction: "阻止泼水和围观，协助疏散人员、清理通道，并向专业人员准确说明油锅位置和火势。",
    wrongHelp: "拿水冲向油锅，或者独自进入烟气区域寻找物品。",
    warningSigns: [
      "油锅出现明火并迅速升高",
      "有人准备向油火泼水",
      "围观人员堵塞处置通道",
      "附近存在可燃物",
      "排烟区域烟气快速增加"
    ],
    safeActions: [
      "立即示警并疏散无关人员",
      "在确保安全时关闭火源和燃气阀门",
      "使用锅盖或灭火毯覆盖，禁止向油火泼水",
      "联系食堂负责人、保卫处或119",
      "保持疏散和消防通道畅通"
    ]
  },
  {
    id: "fire-ebike-battery-smoke-005",
    reviewStatus: "approved",
    safetyType: "消防安全",
    campusScene: "电动车充电棚电池冒烟",
    title: "充电棚里的电动车电池冒烟",
    subtitle: "先拔电源，还是先远离报警？",
    sceneClass: "scene-fire",
    sourceName: "校园电动自行车消防安全提醒综合改编",
    sourceUrl: "https://guard.nankai.edu.cn/",
    sourceDate: "2026-11-02",
    desensitization: "采用通用校园充电棚消防情景，不涉及具体车辆、车主和停放区域。",
    actor: "电动车车主",
    peer: "路过同学",
    authority: "保卫处、充电棚管理人员或119",
    hook: "晚间经过集中充电棚时，一辆正在充电的电动车发出异响，电池部位冒出白烟并伴有刺鼻气味。",
    firstLure: "车主想立即靠近拔掉插头，并把冒烟车辆推到空地，周围还有多辆正在充电的电动车。",
    escalation: "白烟迅速增多，电池外壳变形，附近车辆和充电线路面临被引燃的风险。",
    pressure: "大家担心车辆受损，试图靠近搬车，但无法判断电池是否会发生喷射、爆燃或复燃。",
    riskyChoice: "徒手靠近冒烟电池并强行搬动车辆。",
    safeChoice: "立即远离并提醒周围人员撤离，拨打119和保卫处电话，准确说明充电棚位置和电池状态。",
    helperAction: "划出安全距离、阻止人员靠近，协助切断区域电源，并为消防人员保持通道畅通。",
    wrongHelp: "聚集拍摄或在没有防护和判断的情况下拆卸电池。",
    warningSigns: [
      "充电电池出现异响和白烟",
      "电池外壳变形并有刺鼻气味",
      "周围停放多辆正在充电的车辆",
      "人员试图徒手搬动车辆",
      "存在爆燃和复燃风险"
    ],
    safeActions: [
      "立即示警并扩大安全距离",
      "拨打119并联系保卫处和管理人员",
      "确保安全时切断充电区域总电源",
      "禁止拆卸、触碰或擅自搬动冒烟电池",
      "保持消防通道畅通并等待专业处置"
    ]
  }
];

function updateFile(relativePath) {
  const filePath = path.join(root, relativePath);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(payload.cases)) throw new Error(`${relativePath} 缺少 cases 数组`);
  const byId = new Map(payload.cases.map((item) => [item.id, item]));
  demoCases.forEach((item) => byId.set(item.id, item));
  payload.cases = [...byId.values()];
  payload.updatedAt = "2026-11-02";
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`${relativePath}: ${payload.cases.length} 个案例`);
}

updateFile("data/safety-cases.json");
updateFile("data/safety-case-db.json");

if (process.argv.includes("--mysql")) {
  const dbAdapter = require(path.join(root, "db-adapter"));
  if (!dbAdapter.mysqlEnabled()) throw new Error("当前 .env 未启用 MySQL，无法同步演示情景。");
  dbAdapter.initMysqlSchema();
  const bundled = JSON.parse(fs.readFileSync(path.join(root, "data/safety-cases.json"), "utf8"));
  const approvedCases = (bundled.cases || []).filter((item) => item.reviewStatus === "approved");
  approvedCases.forEach((item) => dbAdapter.upsertMysqlCase(item));
  console.log(`MySQL: 已同步 ${approvedCases.length} 个已发布演示情景`);
}
