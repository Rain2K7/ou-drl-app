import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { 
  Sparkles, 
  Award, 
  User, 
  CheckCircle, 
  Save, 
  Image as ImageIcon, 
  Calendar, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  Palette, 
  ShieldAlert, 
  PlusCircle, 
  Trash2, 
  FileText, 
  Paperclip, 
  ExternalLink,
  Layers,
  CheckSquare,
  Eye,
  EyeOff,
  UserPlus,
  Bookmark,
  ChevronRight,
  Upload,
  Heart,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "demo-key",
      authDomain: "demo.firebaseapp.com",
      projectId: "demo-project",
      storageBucket: "demo.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:123456789:web:demo"
    };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'ou-drl-app';

// --- QUY ĐỊNH ĐIỂM RÈN LUYỆN OU (5 ĐIỀU) ---
const OU_CRITERIA_GROUPS = [
  { id: 'g1', title: 'Điều 1. Ý thức học tập (Tối đa 20 điểm)', maxPoints: 20 },
  { id: 'g2', title: 'Điều 2. Ý thức chấp hành quy chế, quy định (Tối đa 25 điểm)', maxPoints: 25 },
  { id: 'g3', title: 'Điều 3. Tham gia hoạt động chính trị, xã hội, VH-TT (Tối đa 20 điểm)', maxPoints: 20 },
  { id: 'g4', title: 'Điều 4. Ý thức công dân trong quan hệ cộng đồng (Tối đa 25 điểm)', maxPoints: 25 },
  { id: 'g5', title: 'Điều 5. Ý thức tham gia công tác cán bộ lớp, đoàn thể (Tối đa 10 điểm)', maxPoints: 10 }
];

const DEFAULT_CRITERIA_ITEMS = [
  { id: 'def_1_1', groupId: 'g1', title: 'Tinh thần thái độ học tập, dự giờ, thi cử đầy đủ nghiêm túc', defaultScore: 5, maxScore: 5, defaultChecked: true, note: 'Khuyến khích mặc định 5đ' },
  { id: 'def_1_2', groupId: 'g1', title: 'Tham gia CLB học thuật, NCKH, thi Olympic, hội thảo khoa học', defaultScore: 5, maxScore: 5, defaultChecked: false },
  { id: 'def_1_3', groupId: 'g1', title: 'Kết quả học tập ĐTB (≥3.6: 10đ | ≥3.2: 8đ | ≥2.5: 6đ | ≥2.0: 4đ)', defaultScore: 6, maxScore: 10, defaultChecked: true, isScoreInput: true },
  
  { id: 'def_2_1', groupId: 'g2', title: 'Chấp hành nội quy, quy chế thi, văn hóa học đường OU', defaultScore: 10, maxScore: 10, defaultChecked: true, note: 'Khuyến khích mặc định 10đ' },
  { id: 'def_2_2', groupId: 'g2', title: 'Dự đầy đủ SHCD, Tuần sinh hoạt công dân đầu/cuối khóa', defaultScore: 10, maxScore: 10, defaultChecked: true, note: 'Khuyến khích mặc định 10đ' },
  { id: 'def_2_3', groupId: 'g2', title: 'Đóng học phí và các khoản lệ phí đúng thời hạn quy định', defaultScore: 5, maxScore: 5, defaultChecked: true, note: 'Khuyến khích mặc định 5đ' },

  { id: 'def_3_1', groupId: 'g3', title: 'Tham gia các hoạt động Văn nghệ - Thể thao do Trường/Khoa tổ chức', defaultScore: 8, maxScore: 8, defaultChecked: false },
  { id: 'def_3_2', groupId: 'g3', title: 'Tham gia Chiến dịch Mùa hè xanh, Tiếp sức mùa thi, Xuân tình nguyện', defaultScore: 8, maxScore: 8, defaultChecked: false },
  { id: 'def_3_3', groupId: 'g3', title: 'Tham gia các buổi tọa đàm tuyên truyền pháp luật, an toàn giao thông', defaultScore: 4, maxScore: 4, defaultChecked: false },

  { id: 'def_4_1', groupId: 'g4', title: 'Chấp hành đường lối của Đảng, pháp luật Nhà nước tại nơi cư trú', defaultScore: 10, maxScore: 10, defaultChecked: true, note: 'Khuyến khích mặc định 10đ' },
  { id: 'def_4_2', groupId: 'g4', title: 'Tham gia hoạt động hiến máu nhân đạo, từ thiện trợ giúp cộng đồng', defaultScore: 10, maxScore: 10, defaultChecked: false },
  { id: 'def_4_3', groupId: 'g4', title: 'Có tinh thần hỗ trợ, giúp đỡ bạn bè trong học tập & cuộc sống', defaultScore: 5, maxScore: 5, defaultChecked: true, note: 'Khuyến khích mặc định 5đ' },

  { id: 'def_5_1', groupId: 'g5', title: 'Ban cán sự lớp, Cán bộ Đoàn - Hội hoàn thành tốt nhiệm vụ', defaultScore: 5, maxScore: 5, defaultChecked: false },
  { id: 'def_5_2', groupId: 'g5', title: 'Đạt danh hiệu "Sinh viên 5 tốt", Tập thể tiên tiến/Xuất sắc', defaultScore: 5, maxScore: 5, defaultChecked: false }
];

const YEARS = [1, 2, 3, 4];
const SEMESTERS = [1, 2, 3];

const initializeDefaultSemesters = () => {
  const semestersData = {};
  YEARS.forEach(y => {
    SEMESTERS.forEach(s => {
      const key = `Y${y}_S${s}`;
      const scores = {};
      DEFAULT_CRITERIA_ITEMS.forEach(item => {
        scores[item.id] = item.defaultChecked ? item.defaultScore : 0;
      });
      semestersData[key] = {
        scores,
        customTasks: [],
        note: '',
      };
    });
  });
  return semestersData;
};

export default function App() {
  const [user, setUser] = useState(null);
  
  // Tab Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState('login');
  
  // Auth Form State
  const [authMssv, setAuthMssv] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authClass, setAuthClass] = useState('25DH1101');
  const [authMajor, setAuthMajor] = useState('Công Nghệ Thông Tin');
  const [showPassword, setShowPassword] = useState(false);

  // Modal Chọn Tài Khoản Tự Điền
  const [showAutoFillModal, setShowAutoFillModal] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);

  // App Main State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Thông tin sinh viên
  const [studentInfo, setStudentInfo] = useState({
    name: 'Sinh Viên OU Cute',
    mssv: '',
    class: '25DH1101',
    major: 'Công Nghệ Thông Tin',
    avatarUrl: '',
    customBgUrl: ''
  });

  // Học kỳ đang chọn
  const [selectedYear, setSelectedYear] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const currentSemKey = `Y${selectedYear}_S${selectedSemester}`;

  // Bảng điểm 12 Học kỳ
  const [semestersData, setSemestersData] = useState(initializeDefaultSemesters());

  // Modal Thêm Nhiệm vụ
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    groupId: 'g1',
    score: 5,
    date: new Date().toISOString().split('T')[0],
    note: '',
    evidenceName: '',
    evidenceData: '',
    evidenceType: ''
  });

  // Tải danh sách tài khoản đã nhớ từ localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ou_saved_accounts_v2');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      } else {
        // Tài khoản mẫu nếu chưa có
        const initialSample = [
          { mssv: '2551070017', name: 'Đặng Mai Phương', class: '25DH1101', pass: '123456' },
          { mssv: '2551070088', name: 'Nguyễn Văn Minh', class: '25DH1102', pass: 'ou2026' }
        ];
        setSavedAccounts(initialSample);
        localStorage.setItem('ou_saved_accounts_v2', JSON.stringify(initialSample));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // 1. Firebase Auth Setup
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Lưu tài khoản vào bộ nhớ Tự động điền local
  const saveAccountToLocal = (accountObj) => {
    setSavedAccounts(prev => {
      const filtered = prev.filter(a => a.mssv !== accountObj.mssv);
      const updated = [accountObj, ...filtered];
      localStorage.setItem('ou_saved_accounts_v2', JSON.stringify(updated));
      return updated;
    });
  };

  // Tải dữ liệu từ Firestore Cloud
  const fetchCloudData = async (targetMssv) => {
    if (!user || !targetMssv) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'ou_accounts', targetMssv);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.studentInfo) setStudentInfo(data.studentInfo);
        if (data.semestersData) setSemestersData(data.semestersData);
        showToast('🌸 Đã tải dữ liệu & minh chứng từ Cloud thành công!');
        return data;
      } else {
        showToast('✨ Tạo mới không gian lưu trữ cho MSSV trên Cloud!');
      }
    } catch (err) {
      console.error("Fetch Cloud error:", err);
      showToast('❌ Kết nối Firestore thất bại!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ĐĂNG KÝ TÀI KHOẢN MỚI
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword || !authName) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    if (authMssv.length < 8) {
      showToast('MSSV chưa đúng định dạng!', 'error');
      return;
    }

    setLoading(true);
    const newStudentInfo = {
      name: authName,
      mssv: authMssv,
      class: authClass,
      major: authMajor,
      avatarUrl: '',
      customBgUrl: ''
    };

    try {
      // Lưu thông tin đăng ký lên Firestore
      if (user) {
        const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'ou_accounts', authMssv);
        await setDoc(docRef, {
          mssv: authMssv,
          password: authPassword,
          studentInfo: newStudentInfo,
          semestersData: initializeDefaultSemesters(),
          createdAt: new Date().toISOString()
        });
      }

      // Nhớ tài khoản để auto-fill lần sau
      saveAccountToLocal({
        mssv: authMssv,
        name: authName,
        class: authClass,
        pass: authPassword
      });

      setStudentInfo(newStudentInfo);
      setIsLoggedIn(true);
      showToast('🎉 Đăng ký thành công! Dữ liệu đã sẵn sàng trên Cloud!');
    } catch (err) {
      console.error("Register Error:", err);
      showToast('❌ Lỗi đăng ký tài khoản!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ĐĂNG NHẬP
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword) {
      showToast('Vui lòng nhập MSSV và Mật khẩu!', 'error');
      return;
    }

    setLoading(true);
    try {
      // Kiểm tra tài khoản trong Saved Local hoặc fetch từ Cloud
      const matchedLocal = savedAccounts.find(a => a.mssv === authMssv);
      
      saveAccountToLocal({
        mssv: authMssv,
        name: matchedLocal?.name || 'Sinh Viên OU',
        class: matchedLocal?.class || '25DH1101',
        pass: authPassword
      });

      setStudentInfo(prev => ({
        ...prev,
        mssv: authMssv,
        name: matchedLocal?.name || 'Sinh Viên OU'
      }));

      if (user) {
        await fetchCloudData(authMssv);
      }

      setIsLoggedIn(true);
      showToast('💖 Đăng nhập thành công!');
    } catch (err) {
      console.error(err);
      showToast('❌ Đăng nhập không thành công!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Chọn 1 Tài khoản từ Modal Tự Động Điền
  const handleSelectAutoFillAccount = (acc) => {
    setAuthMssv(acc.mssv);
    setAuthPassword(acc.pass || '123456');
    if (acc.name) setAuthName(acc.name);
    setShowAutoFillModal(false);
    showToast(`✨ Đã tự động điền thông tin tài khoản ${acc.mssv}!`);
  };

  // Lưu Toàn Bộ Dữ Liệu Lên Cloud Firebase
  const handleSaveToCloud = async () => {
    if (!user || !studentInfo.mssv) {
      showToast('Cần có MSSV để lưu trữ!', 'error');
      return;
    }
    setLoading(true);
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'ou_accounts', studentInfo.mssv);
      await setDoc(docRef, {
        mssv: studentInfo.mssv,
        studentInfo,
        semestersData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast('☁️ Đã sao lưu toàn bộ Học kỳ & Minh chứng lên Firestore!');
    } catch (err) {
      console.error(err);
      showToast('❌ Lỗi khi đồng bộ Firestore!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật điểm tiêu chí mặc định
  const handleDefaultScoreChange = (itemId, val) => {
    const numVal = Math.max(0, Number(val) || 0);
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || {};
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          scores: {
            ...(sem.scores || {}),
            [itemId]: numVal
          }
        }
      };
    });
  };

  // Upload đính kèm file minh chứng
  const handleEvidenceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('Dung lượng file tối đa 2.5MB để lưu Cloud mượt mà!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const isPdf = file.type === 'application/pdf';
      setNewTask(prev => ({
        ...prev,
        evidenceName: file.name,
        evidenceData: reader.result,
        evidenceType: isPdf ? 'pdf' : 'image'
      }));
      showToast('📄 Đã chọn minh chứng đính kèm!');
    };
    reader.readAsDataURL(file);
  };

  // Thêm Nhiệm Vụ Mới
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTask.title) {
      showToast('Vui lòng nhập tên nhiệm vụ!', 'error');
      return;
    }

    const taskItem = {
      id: 'custom_' + Date.now(),
      ...newTask,
      score: Number(newTask.score) || 0
    };

    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { scores: {}, customTasks: [] };
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          customTasks: [...(sem.customTasks || []), taskItem]
        }
      };
    });

    setShowAddTaskModal(false);
    setNewTask({
      title: '',
      groupId: 'g1',
      score: 5,
      date: new Date().toISOString().split('T')[0],
      note: '',
      evidenceName: '',
      evidenceData: '',
      evidenceType: ''
    });
    showToast('✨ Thêm nhiệm vụ & đính kèm minh chứng thành công!');
  };

  // Xóa Nhiệm vụ Custom
  const handleDeleteTask = (taskId) => {
    setSemestersData(prev => {
      const sem = prev[currentSemKey] || { customTasks: [] };
      return {
        ...prev,
        [currentSemKey]: {
          ...sem,
          customTasks: (sem.customTasks || []).filter(t => t.id !== taskId)
        }
      };
    });
    showToast('🗑️ Đã xóa nhiệm vụ!');
  };

  // Đổi Avatar
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentInfo(prev => ({ ...prev, avatarUrl: reader.result }));
        showToast('✨ Đã cập nhật Avatar cá nhân!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Đổi Background
  const handleBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentInfo(prev => ({ ...prev, customBgUrl: reader.result }));
        showToast('🎨 Đã thay đổi Hình Nền Cá Nhân!');
      };
      reader.readAsDataURL(file);
    }
  };

  // TÍNH ĐIỂM CHI TIẾT
  const calculateGroupTotals = (semKey) => {
    const sem = semestersData[semKey] || { scores: {}, customTasks: [] };
    const totals = {};

    OU_CRITERIA_GROUPS.forEach(g => {
      let sum = 0;
      DEFAULT_CRITERIA_ITEMS.filter(it => it.groupId === g.id).forEach(it => {
        sum += (sem.scores?.[it.id] || 0);
      });
      (sem.customTasks || []).filter(t => t.groupId === g.id).forEach(t => {
        sum += Number(t.score || 0);
      });
      totals[g.id] = sum;
    });

    return totals;
  };

  const calculateSemesterTotal = (semKey) => {
    const groupTotals = calculateGroupTotals(semKey);
    let total = 0;
    OU_CRITERIA_GROUPS.forEach(g => {
      total += Math.min(groupTotals[g.id] || 0, g.maxPoints);
    });
    return Math.min(100, Math.max(0, total));
  };

  const calculateYearAverage = (yearNum) => {
    const s1 = calculateSemesterTotal(`Y${yearNum}_S1`);
    const s2 = calculateSemesterTotal(`Y${yearNum}_S2`);
    const s3 = calculateSemesterTotal(`Y${yearNum}_S3`);
    return Math.round(((s1 + s2 + s3) / 3) * 10) / 10;
  };

  const calculateOverallAverage = () => {
    let sum = 0;
    YEARS.forEach(y => { sum += calculateYearAverage(y); });
    return Math.round((sum / 4) * 10) / 10;
  };

  const getGradeRank = (score) => {
    if (score >= 90) return { title: 'Xuất Sắc', color: 'text-pink-600 bg-pink-100 border-pink-300' };
    if (score >= 80) return { title: 'Tốt', color: 'text-purple-600 bg-purple-100 border-purple-300' };
    if (score >= 65) return { title: 'Khá', color: 'text-blue-600 bg-blue-100 border-blue-300' };
    if (score >= 50) return { title: 'Trung Bình', color: 'text-amber-600 bg-amber-100 border-amber-300' };
    return { title: 'Yếu / Kém', color: 'text-red-600 bg-red-100 border-red-300' };
  };

  const currentGroupTotals = calculateGroupTotals(currentSemKey);
  const currentSemesterScore = calculateSemesterTotal(currentSemKey);

  const bgStyle = studentInfo.customBgUrl 
    ? { backgroundImage: `url(${studentInfo.customBgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
    : { background: 'linear-gradient(135deg, #fff0f5 0%, #ffe4e1 35%, #fff8dc 100%)' };

  return (
    <div className="min-h-screen text-slate-800 font-sans relative transition-all duration-300 pb-20" style={bgStyle}>
      {studentInfo.customBgUrl && (
        <div className="fixed inset-0 bg-white/75 backdrop-blur-[2px] pointer-events-none z-0"></div>
      )}

      {/* TOAST MESSAGE */}
      {toastMessage && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-bounce ${
          toastMessage.type === 'error' ? 'bg-red-100 border-red-300 text-red-700' : 'bg-white/95 border-pink-300 text-pink-700'
        }`}>
          <Sparkles className="w-5 h-5 text-pink-400" />
          <span className="font-medium text-xs md:text-sm">{toastMessage.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 bg-white/85 backdrop-blur-md border-b border-pink-100 sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-400 to-yellow-300 flex items-center justify-center text-white shadow-md font-bold text-lg">
              OU
            </div>
            <div>
              <h1 className="font-bold text-pink-600 text-base md:text-lg flex items-center gap-1.5">
                ĐIỂM RÈN LUYỆN OU <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              </h1>
              <p className="text-xs text-slate-500">Trường Đại Học Mở TP.HCM • Hệ Thống Cloud 12 Học Kỳ & Minh Chứng</p>
            </div>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-3 flex-wrap">
              <button 
                onClick={handleSaveToCloud}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-yellow-400 hover:opacity-95 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-md shadow-pink-200 transition active:scale-95 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu Đám Mây Firestore
              </button>
              <button 
                onClick={() => setIsLoggedIn(false)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium flex items-center gap-1 transition"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 mt-6">
        {!isLoggedIn ? (
          /* MÀN HÌNH ĐĂNG NHẬP / ĐĂNG KÝ CLOUD */
          <div className="max-w-md mx-auto mt-6 bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-pink-100 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-pink-200/50 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-yellow-200/50 rounded-full blur-2xl"></div>

            <div className="text-center mb-6 relative">
              <div className="w-20 h-20 mx-auto bg-gradient-to-tr from-pink-300 via-pink-400 to-yellow-300 rounded-full flex items-center justify-center p-1 shadow-md mb-3">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <Heart className="w-9 h-9 text-pink-500 fill-pink-100" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800">
                {authMode === 'login' ? 'Đăng Nhập Sinh Viên OU' : 'Đăng Ký Tài Khoản Cloud Mới'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Lưu trữ toàn bộ 12 Học kỳ & File minh chứng an toàn</p>
            </div>

            {/* TAB CHUYỂN ĐỔI LOGIN / REGISTER */}
            <div className="flex bg-pink-50/80 p-1 rounded-2xl mb-5 border border-pink-100">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'login' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  authMode === 'register' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng Ký Mới
              </button>
            </div>

            {/* FORM ĐĂNG NHẬP HOẶC ĐĂNG KÝ */}
            <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5 relative">
              
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và Tên Sinh Viên</label>
                    <input 
                      type="text" 
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-xs bg-pink-50/20 font-medium"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mã Lớp</label>
                      <input 
                        type="text" 
                        value={authClass}
                        onChange={(e) => setAuthClass(e.target.value)}
                        placeholder="VD: 25DH1101"
                        className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-pink-50/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ngành Học</label>
                      <input 
                        type="text" 
                        value={authMajor}
                        onChange={(e) => setAuthMajor(e.target.value)}
                        placeholder="VD: CNTT"
                        className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-pink-50/20"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mã Số Sinh Viên (MSSV 10 số)</label>
                <input 
                  type="text" 
                  value={authMssv}
                  onChange={(e) => setAuthMssv(e.target.value)}
                  placeholder="Nhập MSSV, VD: 2551070017"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-xs bg-pink-50/20 font-bold text-slate-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mật khẩu</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-xs bg-pink-50/20"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* NÚT TỰ ĐỘNG ĐIỀN ĐẶC BIỆT */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAutoFillModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-200 to-pink-200 hover:from-yellow-300 hover:to-pink-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Bookmark className="w-4 h-4 text-pink-600" /> Tự Động Điền / Chọn Tài Khoản Đã Lưu ✨
                </button>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-pink-200 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : authMode === 'login' ? (
                    <> <LogIn className="w-4 h-4" /> Đăng Nhập Cloud </>
                  ) : (
                    <> <UserPlus className="w-4 h-4" /> Tạo Tài Khoản Cloud Mới </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-5 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
              🌸 Toàn bộ dữ liệu được bảo mật & đồng bộ trên Cloud Firebase
            </div>
          </div>
        ) : (
          /* MÀN HÌNH QUẢN LÝ CHÍNH KHI ĐÃ ĐĂNG NHẬP */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* THÔNG TIN CÁ NHÂN & DASHBOARD TỔNG HỢP (CỘT TRÁI) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* CARD CÁ NHÂN HÓA */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl relative overflow-hidden">
                <div className="text-center relative">
                  
                  {/* UPLOAD AVATAR */}
                  <div className="relative w-24 h-24 mx-auto mb-3 group cursor-pointer">
                    <img 
                      src={studentInfo.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full border-4 border-pink-200 shadow-md"
                    />
                    <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white text-[11px] opacity-0 group-hover:opacity-100 cursor-pointer transition">
                      <ImageIcon className="w-5 h-5 mb-1" />
                      <span>Đổi Avatar</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base">{studentInfo.name}</h3>
                  <p className="text-xs text-pink-600 font-extrabold mt-0.5">MSSV: {studentInfo.mssv}</p>
                  
                  <div className="mt-3 text-xs text-slate-500 space-y-1 bg-pink-50/50 p-2.5 rounded-2xl border border-pink-100">
                    <p>Lớp: <span className="font-medium text-slate-700">{studentInfo.class}</span></p>
                    <p>Ngành: <span className="font-medium text-slate-700">{studentInfo.major}</span></p>
                  </div>

                  {/* THAY ĐỔI BACKGROUND */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="w-full py-2 px-3 rounded-xl bg-yellow-100/70 hover:bg-yellow-200/70 text-amber-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                      <Palette className="w-4 h-4 text-amber-600" />
                      {studentInfo.customBgUrl ? 'Thay Nền Cá Nhân' : 'Upload Hình Nền Cá Nhân'}
                      <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                    </label>
                    {studentInfo.customBgUrl && (
                      <button 
                        onClick={() => setStudentInfo(p => ({ ...p, customBgUrl: '' }))}
                        className="text-[10px] text-pink-500 hover:underline mt-1.5 block mx-auto"
                      >
                        Khôi phục Theme Mây Hồng Mặc Định
                      </button>
                    )}
                  </div>

                </div>
              </div>

              {/* DASHBOARD TỔNG HỢP 4 NĂM HỌC */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl">
                <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-pink-500" /> DASHBOARD TỔNG HỢP 4 NĂM
                </h3>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-yellow-300 text-white shadow-md mb-4 text-center">
                  <p className="text-[11px] uppercase tracking-wider font-medium opacity-90">ĐRL Trung Bình Toàn Khóa</p>
                  <div className="text-3xl font-extrabold mt-1">{calculateOverallAverage()} <span className="text-xs font-normal">/ 100</span></div>
                  <div className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-white/30 text-white text-xs font-semibold backdrop-blur-sm">
                    Xếp loại: {getGradeRank(calculateOverallAverage()).title}
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {YEARS.map(y => {
                    const avg = calculateYearAverage(y);
                    const rank = getGradeRank(avg);
                    return (
                      <div key={y} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-700">Năm Học {y}</p>
                          <p className="text-[10px] text-slate-400">HK1 • HK2 • HK Hè</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-800 text-xs md:text-sm">{avg} đ</span>
                          <span className={`block text-[10px] px-2 py-0.5 rounded-md border mt-0.5 ${rank.color}`}>
                            {rank.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* BẢNG CHỌN HỌC KỲ VÀ TÍNH ĐIỂM (CỘT PHẢI) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* BẢNG CHỌN 12 HỌC KỲ */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
                  <h2 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" /> Lựa Chọn Học Kỳ Tính Điểm
                  </h2>
                  <span className="text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-700 font-bold">
                    Đang xem: Năm {selectedYear} - Học kỳ {selectedSemester === 3 ? '3 (Hè)' : selectedSemester}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {YEARS.map(y => (
                    <div key={y} className="p-2.5 rounded-2xl bg-pink-50/40 border border-pink-100">
                      <p className="font-bold text-xs text-pink-600 mb-1.5 text-center">NĂM {y}</p>
                      <div className="grid grid-cols-3 gap-1">
                        {SEMESTERS.map(s => {
                          const isActive = selectedYear === y && selectedSemester === s;
                          const k = `Y${y}_S${s}`;
                          const semScore = calculateSemesterTotal(k);
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                setSelectedYear(y);
                                setSelectedSemester(s);
                              }}
                              className={`py-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition ${
                                isActive 
                                  ? 'bg-pink-500 text-white shadow-md shadow-pink-200 scale-105' 
                                  : 'bg-white hover:bg-pink-100 text-slate-700 border border-pink-100'
                              }`}
                            >
                              <span>HK{s === 3 ? 'Hè' : s}</span>
                              <span className={`text-[10px] mt-0.5 ${isActive ? 'text-pink-100' : 'text-slate-400'}`}>
                                {semScore}đ
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BẢNG TÍNH ĐIỂM VÀ MINH CHỨNG CHI TIẾT */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-pink-100 shadow-xl space-y-6">
                
                {/* HEADER TỔNG ĐIỂM HỌC KỲ */}
                <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-pink-100">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800">
                      Năm {selectedYear} - Học Kỳ {selectedSemester === 3 ? '3 (Hè)' : selectedSemester}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tự động áp dụng trần điểm & tính điểm minh chứng</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500 to-yellow-400 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-md hover:opacity-95 transition active:scale-95"
                    >
                      <PlusCircle className="w-4 h-4" /> Thêm Nhiệm Vụ & Minh Chứng
                    </button>

                    <div className="text-right">
                      <div className="text-xs text-slate-500">Tổng Học Kỳ:</div>
                      <div className="text-2xl md:text-3xl font-extrabold text-pink-600">
                        {currentSemesterScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DANH SÁCH 5 ĐIỀU RÈN LUYỆN */}
                <div className="space-y-6">
                  {OU_CRITERIA_GROUPS.map((group) => {
                    const groupTotal = currentGroupTotals[group.id] || 0;
                    const isExceeded = groupTotal > group.maxPoints;
                    const sem = semestersData[currentSemKey] || { scores: {}, customTasks: [] };
                    
                    const defaultItems = DEFAULT_CRITERIA_ITEMS.filter(it => it.groupId === group.id);
                    const customItems = (sem.customTasks || []).filter(t => t.groupId === group.id);

                    return (
                      <div key={group.id} className="rounded-2xl border border-pink-100 bg-pink-50/20 p-4 transition">
                        
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-pink-500" /> {group.title}
                          </h4>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            isExceeded 
                              ? 'bg-pink-100 text-pink-700 border-pink-300' 
                              : 'bg-white text-slate-700 border-slate-200'
                          }`}>
                            {groupTotal} / {group.maxPoints} đ
                          </span>
                        </div>

                        {/* CANH BAO DIEM VUOT TRAN CUTE */}
                        {isExceeded && (
                          <div className="mb-3 p-3 rounded-xl bg-pink-100/90 border border-pink-300 text-pink-800 text-xs font-semibold flex items-center gap-2 animate-pulse">
                            <ShieldAlert className="w-4 h-4 text-pink-600 shrink-0" />
                            <span>{groupTotal}/{group.maxPoints} điểm - Đã vượt mức rồi nè! 🌸 Bạn hãy dành thời gian làm hoạt động khác nha 💕</span>
                          </div>
                        )}

                        {/* DANH SÁCH MỤC MẶC ĐỊNH */}
                        <div className="space-y-2 mb-3">
                          {defaultItems.map(item => {
                            const val = sem.scores?.[item.id] || 0;
                            const isChecked = val > 0;

                            return (
                              <div key={item.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {!item.isScoreInput && (
                                      <input 
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) => {
                                          handleDefaultScoreChange(item.id, e.target.checked ? item.maxScore : 0);
                                        }}
                                        className="w-4 h-4 text-pink-500 rounded focus:ring-pink-300 cursor-pointer accent-pink-500"
                                      />
                                    )}
                                    <span className={`text-xs md:text-sm font-medium ${isChecked ? 'text-slate-800' : 'text-slate-500'}`}>
                                      {item.title}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <span className="text-[10px] text-pink-400 block ml-6 mt-0.5">🌸 {item.note}</span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center">
                                  {item.isScoreInput ? (
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="number"
                                        min="0"
                                        max={item.maxScore}
                                        value={val}
                                        onChange={(e) => handleDefaultScoreChange(item.id, e.target.value)}
                                        className="w-16 px-2 py-1 border border-pink-200 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-pink-300"
                                      />
                                      <span className="text-xs text-slate-400">/ {item.maxScore}đ</span>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-lg">
                                      +{val} / {item.maxScore}đ
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* NHIỆM VỤ CÁ NHÂN & MINH CHỨNG */}
                        {customItems.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-pink-100/60 space-y-2">
                            <p className="text-[11px] font-bold text-pink-600 uppercase tracking-wider flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> Nhiệm Vụ & File Minh Chứng Đã Thêm
                            </p>

                            {customItems.map(task => (
                              <div key={task.id} className="p-3 rounded-xl bg-gradient-to-r from-yellow-50/50 to-pink-50/50 border border-pink-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs md:text-sm text-slate-800">{task.title}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-yellow-200 text-amber-800 rounded-md font-semibold">
                                      {task.date}
                                    </span>
                                  </div>
                                  {task.note && <p className="text-xs text-slate-500">{task.note}</p>}

                                  {/* XEM DỰ XEM ANH HOAC PDF */}
                                  {task.evidenceData && (
                                    <div className="mt-2 pt-2 border-t border-pink-100 flex items-center gap-3">
                                      {task.evidenceType === 'image' ? (
                                        <div className="flex items-center gap-2">
                                          <img 
                                            src={task.evidenceData} 
                                            alt="Minh chứng" 
                                            className="w-12 h-12 object-cover rounded-lg border border-pink-200 shadow-sm"
                                          />
                                          <div>
                                            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                              <Paperclip className="w-3 h-3 text-pink-500" /> {task.evidenceName || 'Giay_Chung_Nhan.png'}
                                            </p>
                                            <a 
                                              href={task.evidenceData} 
                                              target="_blank" 
                                              rel="noreferrer" 
                                              className="text-[10px] text-pink-500 hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <ExternalLink className="w-2.5 h-2.5" /> Mở xem kích thước đầy đủ
                                            </a>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs">
                                            PDF
                                          </div>
                                          <div>
                                            <p className="text-xs font-semibold text-slate-700">{task.evidenceName}</p>
                                            <a 
                                              href={task.evidenceData} 
                                              download={task.evidenceName} 
                                              className="text-[10px] text-pink-500 hover:underline flex items-center gap-1 mt-0.5"
                                            >
                                              <ExternalLink className="w-2.5 h-2.5" /> Tải về file PDF
                                            </a>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 self-end md:self-center">
                                  <span className="text-xs font-extrabold text-pink-600 bg-white px-3 py-1 rounded-xl border border-pink-200 shadow-sm">
                                    +{task.score} điểm
                                  </span>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                                    title="Xóa nhiệm vụ"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>

                {/* GHI CHÚ BỔ SUNG HỌC KỲ */}
                <div className="pt-4 border-t border-pink-100 space-y-2">
                  <h4 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-pink-500" /> Ghi Chú Riêng Cho Học Kỳ
                  </h4>
                  <textarea
                    rows={2}
                    value={semestersData[currentSemKey]?.note || ''}
                    onChange={(e) => {
                      const txt = e.target.value;
                      setSemestersData(prev => ({
                        ...prev,
                        [currentSemKey]: { ...prev[currentSemKey], note: txt }
                      }));
                    }}
                    placeholder="Ghi chú thêm về học kỳ này..."
                    className="w-full p-3 rounded-2xl border border-pink-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/20"
                  />
                </div>

              </div>

            </div>

          </div>
        )}
      </main>

      {/* MODAL TỰ ĐỘNG ĐIỀN CHỌN TÀI KHOẢN ĐÃ LƯU */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-pink-100 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-pink-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-pink-500" /> Danh Sách Tài Khoản Đã Nhớ
              </h3>
              <button 
                onClick={() => setShowAutoFillModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Bấm chọn một tài khoản dưới đây để tự động điền MSSV và Mật khẩu ngay lập tức:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {savedAccounts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Chưa có tài khoản nào được lưu trên thiết bị này.</p>
              ) : (
                savedAccounts.map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectAutoFillAccount(acc)}
                    className="p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/80 border border-pink-100 flex items-center justify-between cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-pink-400 text-white flex items-center justify-center font-bold text-xs">
                        {acc.mssv.slice(-2)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{acc.name || 'Sinh Viên OU'}</p>
                        <p className="text-[11px] text-pink-600 font-semibold">MSSV: {acc.mssv} • Lớp: {acc.class || '25DH1101'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-pink-400 group-hover:translate-x-1 transition" />
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowAutoFillModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM NHIỆM VỤ & MINH CHỨNG */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-pink-100 relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-pink-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-pink-500" /> Thêm Hoạt Động & Đính Kèm Minh Chứng
              </h3>
              <button 
                onClick={() => setShowAddTaskModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên Nhiệm vụ / Hoạt động</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Giấy chứng nhận Tham gia Cuộc thi Olympic..."
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Thuộc Điều quy định</label>
                  <select
                    value={newTask.groupId}
                    onChange={(e) => setNewTask(prev => ({ ...prev, groupId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300 bg-white"
                  >
                    {OU_CRITERIA_GROUPS.map(g => (
                      <option key={g.id} value={g.id}>{g.title.split('.')[0]}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm cộng (+đ)</label>
                  <input 
                    type="number"
                    min="1"
                    max="25"
                    value={newTask.score}
                    onChange={(e) => setNewTask(prev => ({ ...prev, score: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300 font-bold text-pink-600"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày hoàn thành</label>
                <input 
                  type="date" 
                  value={newTask.date}
                  onChange={(e) => setNewTask(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300"
                />
              </div>

              {/* UPLOAD FILE MINH CHỨNG */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Đính kèm File Minh Chứng (Ảnh / PDF)</label>
                <div className="border-2 border-dashed border-pink-200 rounded-2xl p-4 text-center bg-pink-50/30 relative">
                  {newTask.evidenceData ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-pink-600 flex items-center justify-center gap-1">
                        <Paperclip className="w-4 h-4" /> {newTask.evidenceName}
                      </p>
                      <button
                        type="button"
                        onClick={() => setNewTask(p => ({ ...p, evidenceData: '', evidenceName: '', evidenceType: '' }))}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Xóa file này
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="w-6 h-6 text-pink-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-600 font-medium block">Bấm để tải File Minh Chứng (Ảnh/PDF)</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Dung lượng tối đa 2.5MB</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleEvidenceFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú thêm</label>
                <textarea 
                  rows={2}
                  value={newTask.note}
                  onChange={(e) => setNewTask(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Ghi chú đơn vị cấp, số hiệu bằng khen..."
                  className="w-full p-2.5 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-200"
                >
                  Xác Nhận Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
