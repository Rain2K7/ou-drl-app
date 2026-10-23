import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Heart, Award, CheckCircle2, AlertCircle, Save, LogOut, 
  Upload, FileText, User, Trash2, ShieldAlert, BarChart3, Cloud, Camera, Image as ImageIcon
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyForOUDRLTracker2026",
  authDomain: "ou-drl-tracker.firebaseapp.com",
  projectId: "ou-drl-tracker",
  storageBucket: "ou-drl-tracker.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:demokey"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Khai báo tiêu chí đánh giá DRL theo quy định OU
const CRITERIA_GROUPS = [
  {
    id: 1,
    title: "1. Chấp hành pháp luật & Nội quy",
    maxPoints: 25,
    items: [
      { id: "g1_1", label: "Chấp hành quy định pháp luật & nhà trường (+5đ)", defaultPoints: 5, isDefault: true },
      { id: "g1_2", label: "Chấp hành quy chế thi (+5đ/kỳ)", defaultPoints: 5, isDefault: true },
      { id: "g1_3", label: "Đóng học phí đúng hạn (+5đ/kỳ)", defaultPoints: 5, isDefault: true },
      { id: "g1_4", label: "Chấp hành quy định Thư viện (+5đ/kỳ)", defaultPoints: 5, isDefault: true },
      { id: "g1_5", label: "Đăng ký tạm trú/ngoại trú đúng hạn (+5đ/kỳ)", defaultPoints: 5, isDefault: true }
    ]
  },
  {
    id: 2,
    title: "2. Học tập & Nghiên cứu khoa học",
    maxPoints: 20,
    items: [
      { id: "g2_gpa", label: "Điểm TB tích lũy (GPA 2.50 - 3.19: +12đ mặc định)", defaultPoints: 12, isDefault: true },
      { id: "g2_1", label: "Tham gia Hội thảo / Tọa đàm học thuật (+3đ/lần)", defaultPoints: 0, isDefault: false, step: 3 },
      { id: "g2_2", label: "Thành viên đề tài Nghiên cứu khoa học (+3đ)", defaultPoints: 0, isDefault: false, step: 3 },
      { id: "g2_3", label: "Chủ nhiệm đề tài NCKH cấp Trường/Khoa (+5đ)", defaultPoints: 0, isDefault: false, step: 5 },
      { id: "g2_4", label: "Viết bài báo đăng tạp chí khoa học (+10đ)", defaultPoints: 0, isDefault: false, step: 10 },
      { id: "g2_5", label: "Tham gia cuộc thi học thuật (+3đ/lần)", defaultPoints: 0, isDefault: false, step: 3 }
    ]
  },
  {
    id: 3,
    title: "3. Hoạt động Chính trị - Xã hội, Tình nguyện",
    maxPoints: 20,
    items: [
      { id: "g3_1", label: "Tham gia sinh hoạt Lớp/Đoàn/Hội (+5đ)", defaultPoints: 5, isDefault: true },
      { id: "g3_2", label: "Chiến dịch Mùa Hè Xanh / Xuân Tình Nguyện (+10đ)", defaultPoints: 0, isDefault: false, step: 10 },
      { id: "g3_3", label: "Tham gia Hiến máu tình nguyện (+10đ)", defaultPoints: 0, isDefault: false, step: 10 },
      { id: "g3_4", label: "Chương trình 'Ngày Chủ Nhật Xanh' (+5đ)", defaultPoints: 0, isDefault: false, step: 5 },
      { id: "g3_5", label: "Thành viên CLB sở thích / Kỹ năng (+2đ/kỳ)", defaultPoints: 0, isDefault: false, step: 2 }
    ]
  },
  {
    id: 4,
    title: "4. Trách nhiệm Công dân & Cộng đồng",
    maxPoints: 15,
    items: [
      { id: "g4_1", label: "Tham gia Tuần sinh hoạt công dân (+5đ/kỳ)", defaultPoints: 5, isDefault: true },
      { id: "g4_2", label: "Làm bài thu hoạch Đạt Tuần SHCD (+3đ)", defaultPoints: 3, isDefault: true },
      { id: "g4_3", label: "Tuyên truyền chủ trương, chính sách (+3đ/lần)", defaultPoints: 0, isDefault: false, step: 3 },
      { id: "g4_4", label: "Gương người tốt việc tốt / Biểu dương (+5đ)", defaultPoints: 0, isDefault: false, step: 5 }
    ]
  },
  {
    id: 5,
    title: "5. Cán bộ Lớp, Đoàn - Hội & Thành tích xuất sắc",
    maxPoints: 20,
    items: [
      { id: "g5_1", label: "Cán bộ Lớp/Đoàn/Hội (Hoàn thành tốt +10đ)", defaultPoints: 0, isDefault: false, step: 10 },
      { id: "g5_2", label: "Khen thưởng Sinh viên 5 Tốt cấp Trường (+5đ)", defaultPoints: 0, isDefault: false, step: 5 },
      { id: "g5_3", label: "Bằng khen cấp Thành phố / Trung ương (+10đ)", defaultPoints: 0, isDefault: false, step: 10 }
    ]
  }
];

export default function App() {
  // Trạng thái đăng nhập
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mssv, setMssv] = useState('');
  const [password, setPassword] = useState('');
  const [savedUser, setSavedUser] = useState(null);

  // Trạng thái năm & học kỳ (4 năm x 3 học kỳ)
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);

  // Trạng thái điểm & Kỷ luật
  const [itemScores, setItemScores] = useState({});
  const [discipline, setDiscipline] = useState('none'); // 'none', 'khiên_trach', 'canh_cao'

  // Trạng thái tùy chỉnh giao diện
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  const [customBg, setCustomBg] = useState(null);

  // Trạng thái minh chứng & ghi chú
  const [customTasks, setCustomTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPoints, setNewTaskPoints] = useState(3);
  const [newTaskGroup, setNewTaskGroup] = useState(2);
  const [newTaskFile, setNewTaskFile] = useState(null);
  const [notes, setNotes] = useState('');

  // Tải dữ liệu lưu trong LocalStorage khi mở app
  useEffect(() => {
    const localSaved = localStorage.getItem('ou_saved_account');
    if (localSaved) {
      const parsed = JSON.parse(localSaved);
      setSavedUser(parsed);
      setMssv(parsed.mssv);
      setPassword(parsed.password);
    }
    
    // Đặt điểm mặc định ban đầu
    const defaults = {};
    CRITERIA_GROUPS.forEach(group => {
      group.items.forEach(item => {
        if (item.isDefault) {
          defaults[item.id] = item.defaultPoints;
        }
      });
    });
    setItemScores(defaults);
  }, []);

  // Xử lý Đăng nhập & Đồng bộ dữ liệu
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!mssv || !password) {
      alert("Vui lòng nhập đầy đủ MSSV và Mật khẩu!");
      return;
    }

    // Lưu credentials vào LocalStorage
    const userData = { mssv, password };
    localStorage.setItem('ou_saved_account', JSON.stringify(userData));
    setSavedUser(userData);

    // Thử lấy dữ liệu lưu từ Cloud (Firestore)
    try {
      const docRef = doc(db, "users", mssv);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.itemScores) setItemScores(data.itemScores);
        if (data.customTasks) setCustomTasks(data.customTasks);
        if (data.notes) setNotes(data.notes);
        if (data.avatar) setAvatar(data.avatar);
        if (data.customBg) setCustomBg(data.customBg);
      }
    } catch (err) {
      console.log("Sử dụng chế độ offline/local storage");
    }

    setIsLoggedIn(true);
  };

  // Tự động điền & Đăng nhập nhanh
  const handleAutoFillLogin = () => {
    if (savedUser) {
      setMssv(savedUser.mssv);
      setPassword(savedUser.password);
      handleLogin();
    }
  };

  // Lưu dữ liệu điểm & minh chứng lên Cloud
  const handleSaveData = async () => {
    const payload = {
      mssv,
      itemScores,
      customTasks,
      notes,
      avatar,
      customBg,
      updatedAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, "users", mssv), payload);
      alert("🌸 Đã lưu dữ liệu thành công lên Đám mây!");
    } catch (err) {
      localStorage.setItem(`ou_data_${mssv}`, JSON.stringify(payload));
      alert("💕 Đã lưu dữ liệu an toàn trên thiết bị cá nhân!");
    }
  };

  // Xử lý đổi Avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Xử lý đổi Hình nền Cá nhân
  const handleBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomBg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Tính toán Điểm theo từng Nhóm và Tổng điểm
  const calculateScores = () => {
    let groupTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let groupRaw = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Tính điểm từ danh sách cố định
    CRITERIA_GROUPS.forEach(group => {
      group.items.forEach(item => {
        const val = itemScores[item.id] || 0;
        groupRaw[group.id] += val;
      });
    });

    // Tính điểm từ nhiệm vụ cá nhân thêm mới
    customTasks.forEach(task => {
      if (task.year === selectedYear && task.semester === selectedSemester) {
        groupRaw[task.groupId] += Number(task.points);
      }
    });

    // Cắt theo điểm trần tối đa từng nhóm
    CRITERIA_GROUPS.forEach(group => {
      groupTotals[group.id] = Math.min(groupRaw[group.id], group.maxPoints);
    });

    let totalCalculated = Object.values(groupTotals).reduce((a, b) => a + b, 0);
    totalCalculated = Math.min(totalCalculated, 100);

    // Khống chế loại xếp loại do kỷ luật
    let finalRank = "Yếu";
    if (totalCalculated >= 90) finalRank = "Xuất sắc";
    else if (totalCalculated >= 80) finalRank = "Tốt";
    else if (totalCalculated >= 70) finalRank = "Khá";
    else if (totalCalculated >= 50) finalRank = "Trung bình";

    if (discipline === 'khiên_trach' && (finalRank === "Xuất sắc" || finalRank === "Tốt")) {
      finalRank = "Khá (Bị khống chế do Khiển trách)";
    } else if (discipline === 'canh_cao') {
      finalRank = "Trung bình (Bị khống chế do Cảnh cáo)";
    }

    return { groupTotals, groupRaw, totalCalculated, finalRank };
  };

  const { groupTotals, groupRaw, totalCalculated, finalRank } = calculateScores();

  // Thêm Nhiệm vụ & Upload Minh chứng mới
  const handleAddCustomTask = () => {
    if (!newTaskName) {
      alert("Vui lòng nhập tên hoạt động!");
      return;
    }

    const newTask = {
      id: Date.now(),
      name: newTaskName,
      points: Number(newTaskPoints),
      groupId: Number(newTaskGroup),
      year: selectedYear,
      semester: selectedSemester,
      fileName: newTaskFile ? newTaskFile.name : null,
      fileData: newTaskFile ? URL.createObjectURL(newTaskFile) : null
    };

    setCustomTasks([...customTasks, newTask]);
    setNewTaskName('');
    setNewTaskFile(null);
  };

  // MÀN HÌNH ĐĂNG NHẬP
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-yellow-100 to-pink-200 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-pink-200 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-pink-300 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner text-white">
            <Heart size={40} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-pink-600 mb-1">OU DRL Cloud Tracker</h1>
          <p className="text-sm text-gray-500 mb-6">Tự tính & Quản lý Điểm Rèn Luyện Siêu Cute 🌸</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mã Số Sinh Viên (MSSV)</label>
              <input 
                type="text"
                value={mssv}
                onChange={(e) => setMssv(e.target.value)}
                placeholder="Nhập đủ MSSV (ví dụ: 2551070017)"
                className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/90"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/90"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-pink-400 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles size={18} /> Đăng nhập / Xác nhận
            </button>

            {savedUser && (
              <button 
                type="button"
                onClick={handleAutoFillLogin}
                className="w-full py-3 bg-amber-200 hover:bg-amber-300 text-amber-800 font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <Cloud size={18} /> Tự động điền từ Đám mây ({savedUser.mssv})
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // MÀN HÌNH CHÍNH
  return (
    <div 
      className="min-h-screen pb-12 transition-all duration-300"
      style={{
        backgroundImage: customBg ? `url(${customBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: customBg ? 'transparent' : '#fdf2f8'
      }}
    >
      <div className={`min-h-screen ${customBg ? 'bg-black/30 backdrop-blur-sm' : 'bg-gradient-to-br from-pink-100 via-yellow-100 to-pink-200'}`}>
        
        {/* HEADER & PROFILE */}
        <header className="max-w-5xl mx-auto p-4 sm:p-6">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-lg border border-pink-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-pink-300 shadow-md"
                />
                <label className="absolute bottom-0 right-0 bg-pink-400 p-1.5 rounded-full text-white cursor-pointer hover:bg-pink-500 shadow">
                  <Camera size={14} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  Sinh viên OU <Sparkles size={18} className="text-pink-400" />
                </h1>
                <p className="text-sm text-gray-500">MSSV: <span className="font-semibold text-pink-600">{mssv}</span></p>
                <div className="flex gap-2 mt-2">
                  <label className="text-xs bg-pink-100 text-pink-600 px-3 py-1 rounded-full cursor-pointer hover:bg-pink-200 flex items-center gap-1">
                    <ImageIcon size={12} /> Đổi ảnh nền
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgChange} />
                  </label>
                  {customBg && (
                    <button 
                      onClick={() => setCustomBg(null)}
                      className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-300"
                    >
                      Xóa nền
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ĐỔI HỌC KỲ & NĂM HỌC (4 NĂM X 3 HỌC KỲ) */}
            <div className="flex flex-col items-end gap-2 w-full md:w-auto">
              <div className="flex gap-2 bg-pink-50 p-1.5 rounded-2xl border border-pink-200">
                {[1, 2, 3, 4].map(y => (
                  <button
                    key={y}
                    onClick={() => setSelectedYear(y)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedYear === y ? 'bg-pink-400 text-white shadow' : 'text-gray-500 hover:text-pink-500'}`}
                  >
                    Năm {y}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 bg-amber-50 p-1.5 rounded-2xl border border-amber-200">
                {[1, 2, 3].map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSemester(s)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedSemester === s ? 'bg-amber-300 text-amber-900 shadow' : 'text-gray-500 hover:text-amber-600'}`}
                  >
                    Học kỳ {s} {s === 3 ? '(Hè)' : ''}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-1">
                <button 
                  onClick={handleSaveData}
                  className="px-4 py-2 bg-pink-400 text-white text-xs font-bold rounded-xl shadow hover:bg-pink-500 flex items-center gap-1"
                >
                  <Save size={14} /> Lưu Cloud
                </button>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-300 flex items-center gap-1"
                >
                  <LogOut size={14} /> Đổi TK
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD TỔNG ĐIỂM & CẢNH BÁO */}
        <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-pink-200 text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">TỔNG ĐIỂM DỰ PHÓNG</p>
              <div className="text-4xl font-extrabold text-pink-500 mb-1">{totalCalculated} / 100</div>
              <p className="text-xs text-pink-400">Năm {selectedYear} - Học kỳ {selectedSemester}</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-pink-200 text-center">
              <p className="text-xs text-gray-500 font-semibold mb-1">XẾP LOẠI DỰ KIẾN</p>
              <div className="text-2xl font-bold text-amber-500 mb-1">{finalRank}</div>
              <p className="text-xs text-gray-400">Theo quy định Trường ĐH Mở TP.HCM</p>
            </div>

            <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-md border border-pink-200">
              <p className="text-xs text-gray-500 font-semibold mb-2 flex items-center gap-1">
                <ShieldAlert size={14} className="text-red-400" /> TÌNH TRẠNG KỶ LUẬT
              </p>
              <select 
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-pink-200 bg-pink-50 focus:outline-none"
              >
                <option value="none">Không vi phạm kỷ luật ✨</option>
                <option value="khiên_trach">Khiển trách (Max loại Khá)</option>
                <option value="canh_cao">Cảnh cáo trở lên (Max loại Trung bình)</option>
              </select>
            </div>
          </div>

          {/* DANH SÁCH BẢNG CHẤM ĐIỂM CHI TIẾT */}
          <div className="space-y-6">
            {CRITERIA_GROUPS.map((group) => {
              const raw = groupRaw[group.id];
              const max = group.maxPoints;
              const isOverflow = raw > max;

              return (
                <div key={group.id} className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-md border border-pink-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-3">
                    <h2 className="font-bold text-gray-800 text-base">{group.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${isOverflow ? 'bg-pink-100 text-pink-600' : 'bg-green-100 text-green-600'}`}>
                        {raw}/{max} điểm
                      </span>
                    </div>
                  </div>

                  {/* BÁO CẢNH BÁO VƯỢT TRẦN ĐIỂM DỄ THƯƠNG */}
                  {isOverflow && (
                    <div className="bg-pink-100/80 border border-pink-300 p-3 rounded-2xl text-xs text-pink-700 flex items-center gap-2">
                      <Heart size={16} className="text-pink-500 fill-pink-500 animate-bounce" />
                      <span><strong>{raw}/{max} điểm</strong> - Đã vượt mức rồi nè! 🌸 Bạn hãy dành thời gian làm hoạt động khác nha 💕</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map((item) => {
                      const currentVal = itemScores[item.id] || 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-50 transition-all">
                          <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                          
                          {item.isDefault ? (
                            <span className="text-xs font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-lg">Đã tích sẵn</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setItemScores({ ...itemScores, [item.id]: Math.max(0, currentVal - (item.step || 1)) })}
                                className="w-7 h-7 bg-white border border-pink-200 rounded-lg text-pink-500 font-bold flex items-center justify-center hover:bg-pink-100"
                              >
                                -
                              </button>
                              <span className="text-xs font-bold text-gray-700 w-6 text-center">{currentVal}</span>
                              <button
                                onClick={() => setItemScores({ ...itemScores, [item.id]: currentVal + (item.step || 1) })}
                                className="w-7 h-7 bg-pink-400 text-white rounded-lg font-bold flex items-center justify-center hover:bg-pink-500 shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* KHU VỰC THÊM NHIỆM VỤ & UPLOAD MINH CHỨNG CÁ NHÂN */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-md border border-pink-200 space-y-4">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Upload size={18} className="text-pink-500" /> Thêm Nhiệm Vụ & Minh Chứng Cá Nhân
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input 
                type="text"
                placeholder="Tên hoạt động / giấy chứng nhận..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="p-2.5 text-xs rounded-xl border border-pink-200 bg-white"
              />

              <select
                value={newTaskGroup}
                onChange={(e) => setNewTaskGroup(e.target.value)}
                className="p-2.5 text-xs rounded-xl border border-pink-200 bg-white"
              >
                {CRITERIA_GROUPS.map(g => (
                  <option key={g.id} value={g.id}>Thuộc {g.title}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="Điểm"
                  value={newTaskPoints}
                  onChange={(e) => setNewTaskPoints(e.target.value)}
                  className="w-20 p-2.5 text-xs rounded-xl border border-pink-200 bg-white"
                />
                <label className="flex-1 p-2.5 text-xs rounded-xl border border-dashed border-pink-300 bg-pink-50 text-pink-600 text-center cursor-pointer truncate">
                  {newTaskFile ? newTaskFile.name : "Đính kèm minh chứng (Ảnh/PDF)"}
                  <input type="file" className="hidden" onChange={(e) => setNewTaskFile(e.target.files[0])} />
                </label>
              </div>
            </div>

            <button 
              onClick={handleAddCustomTask}
              className="w-full py-2.5 bg-pink-400 hover:bg-pink-500 text-white font-bold text-xs rounded-xl shadow transition-all"
            >
              + Thêm Hoạt Động Vừa Làm
            </button>

            {/* DANH SÁCH MINH CHỨNG ĐÃ THÊM */}
            <div className="space-y-2 mt-4">
              {customTasks
                .filter(t => t.year === selectedYear && t.semester === selectedSemester)
                .map((task) => (
                  <div key={task.id} className="p-3 bg-pink-50/80 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{task.name} (+{task.points}đ)</p>
                      {task.fileName && (
                        <a href={task.fileData} target="_blank" rel="noreferrer" className="text-pink-500 underline flex items-center gap-1 mt-1">
                          <FileText size={12} /> Xem minh chứng: {task.fileName}
                        </a>
                      )}
                    </div>
                    <button 
                      onClick={() => setCustomTasks(customTasks.filter(t => t.id !== task.id))}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* KHU VỰC GHI CHÚ CÁ NHÂN */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-md border border-pink-200 space-y-2">
            <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <FileText size={18} className="text-amber-500" /> Nhật Ký & Ghi Chú Cá Nhân
            </h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc nhắc nhở bản thân (chỉ lưu riêng trên tài khoản của bạn)..."
              className="w-full p-3 text-xs rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
