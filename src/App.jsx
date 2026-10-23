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
  getDoc
} from 'firebase/firestore';
import { 
  Sparkles, 
  Award, 
  Save, 
  Image as ImageIcon, 
  LogOut, 
  LogIn, 
  RefreshCw, 
  Palette, 
  PlusCircle, 
  Trash2, 
  Paperclip,
  Eye,
  EyeOff,
  UserPlus,
  Bookmark,
  Heart,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

// --- FIREBASE INITIALIZATION ---
const firebaseConfig = {
  apiKey: "AIzaSyA6_FZejbBAHSTCeaypdDx9YDGsDywKIYc",
  authDomain: "rainer-88e5f.firebaseapp.com",
  projectId: "rainer-88e5f",
  storageBucket: "rainer-88e5f.firebasestorage.app",
  messagingSenderId: "878186322963",
  appId: "1:878186322963:web:4af21b06b144d1aa17f3e6",
  measurementId: "G-04EYBPBHY8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- HÌNH NỀN MẶC ĐỊNH MỚI CỦA APP ---
const DEFAULT_APP_BG = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1000"; 

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
    name: 'Sinh Viên OU',
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

  // Tải danh sách tài khoản đã lưu local
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ou_saved_accounts_v3');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Firebase Auth Setup
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

  const saveAccountToLocal = (accountObj) => {
    setSavedAccounts(prev => {
      const filtered = prev.filter(a => a.mssv !== accountObj.mssv);
      const updated = [accountObj, ...filtered];
      localStorage.setItem('ou_saved_accounts_v3', JSON.stringify(updated));
      return updated;
    });
  };

  // --- ĐĂNG KÝ TÀI KHOẢN MỚI TRÊN CLOUD ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword || !authName) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    if (authMssv.length < 8) {
      showToast('MSSV phải từ 8 ký tự trở lên!', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Kiểm tra tài khoản đã tồn tại trên Cloud chưa
      const userDocRef = doc(db, 'ou_users', authMssv);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        showToast('⚠️ MSSV này đã được đăng ký! Vui lòng chuyển sang Đăng Nhập.', 'error');
        setLoading(false);
        return;
      }

      const initialInfo = {
        name: authName,
        mssv: authMssv,
        class: authClass,
        major: authMajor,
        avatarUrl: '',
        customBgUrl: ''
      };

      const defaultSemData = initializeDefaultSemesters();

      // 2. Tạo mới tài khoản trên Cloud Firestore
      await setDoc(userDocRef, {
        mssv: authMssv,
        password: authPassword,
        studentInfo: initialInfo,
        semestersData: defaultSemData,
        createdAt: new Date().toISOString()
      });

      // 3. Cập nhật giao diện
      saveAccountToLocal({
        mssv: authMssv,
        name: authName,
        class: authClass,
        pass: authPassword
      });

      setStudentInfo(initialInfo);
      setSemestersData(defaultSemData);
      setIsLoggedIn(true);
      showToast('🎉 Đăng ký tài khoản Cloud thành công!');
    } catch (err) {
      console.error("Register Error:", err);
      showToast('❌ Lỗi kết nối Firestore khi đăng ký!', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- ĐĂNG NHẬP (KIỂM TRA CHÍNH XÁC MẬT KHẨU TỪ CLOUD) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authMssv || !authPassword) {
      showToast('Vui lòng nhập MSSV và Mật khẩu!', 'error');
      return;
    }

    setLoading(true);
    try {
      // 1. Tìm tài khoản trên Cloud Firestore
      const userDocRef = doc(db, 'ou_users', authMssv);
      const docSnap = await getDoc(userDocRef);

      if (!docSnap.exists()) {
        showToast('❌ Tài khoản chưa đăng ký trên app! Vui lòng chuyển sang Đăng Ký Mới.', 'error');
        setLoading(false);
        return;
      }

      const userData = docSnap.data();

      // 2. Kiểm tra mật khẩu
      if (userData.password !== authPassword) {
        showToast('❌ Sai mật khẩu! Vui lòng kiểm tra lại.', 'error');
        setLoading(false);
        return;
      }

      // 3. Đăng nhập thành công -> Tải toàn bộ dữ liệu đã lưu từ Cloud
      if (userData.studentInfo) setStudentInfo(userData.studentInfo);
      if (userData.semestersData) setSemestersData(userData.semestersData);

      saveAccountToLocal({
        mssv: authMssv,
        name: userData.studentInfo?.name || 'Sinh Viên OU',
        class: userData.studentInfo?.class || '25DH1101',
        pass: authPassword
      });

      setIsLoggedIn(true);
      showToast('💖 Đăng nhập thành công! Dữ liệu Cloud đã tải nguyên vẹn.');
    } catch (err) {
      console.error("Login Error:", err);
      showToast('❌ Không thể kết nối với Firestore!', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAutoFillAccount = (acc) => {
    setAuthMssv(acc.mssv);
    setAuthPassword(acc.pass || '');
    if (acc.name) setAuthName(acc.name);
    setShowAutoFillModal(false);
    showToast(`✨ Đã tự động điền tài khoản ${acc.mssv}!`);
  };

  // --- LƯU TOÀN BỘ ĐIỂM SỐ & MINH CHỨNG LÊN CLOUD ---
  const handleSaveToCloud = async () => {
    if (!studentInfo.mssv) {
      showToast('Không tìm thấy thông tin MSSV!', 'error');
      return;
    }
    setLoading(true);
    try {
      const userDocRef = doc(db, 'ou_users', studentInfo.mssv);
      await setDoc(userDocRef, {
        studentInfo,
        semestersData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      showToast('☁️ Đã sao lưu thành công toàn bộ Bảng điểm & Minh chứng lên Firestore!');
    } catch (err) {
      console.error("Save Cloud Error:", err);
      showToast('❌ Lỗi khi đồng bộ Firestore!', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const handleEvidenceFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      showToast('Dung lượng file tối đa 2.5MB!', 'error');
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
    showToast('✨ Thêm nhiệm vụ & minh chứng thành công!');
  };

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

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentInfo(prev => ({ ...prev, avatarUrl: reader.result }));
        showToast('✨ Đã cập nhật Avatar!');
      };
      reader.readAsDataURL(file);
    }
  };

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

  const activeBg = studentInfo.customBgUrl || DEFAULT_APP_BG;
  const bgStyle = {
    backgroundImage: `url(${activeBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="min-h-screen text-slate-800 font-sans relative transition-all duration-300 pb-20" style={bgStyle}>
      <div className="fixed inset-0 bg-white/60 backdrop-blur-[3px] pointer-events-none z-0"></div>

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

              {savedAccounts.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAutoFillModal(true)}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-yellow-200 to-pink-200 hover:from-yellow-300 hover:to-pink-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                  >
                    <Bookmark className="w-4 h-4 text-pink-600" /> Tự Động Điền Tài Khoản Đã Lưu ✨
                  </button>
                </div>
              )}

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
              🌸 Tất cả tài khoản & dữ liệu đều được bảo mật trên Firebase Cloud
            </div>
          </div>
        ) : (
          /* MÀN HÌNH QUẢN LÝ CHÍNH KHI ĐÃ ĐĂNG NHẬP */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN & DASHBOARD */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl relative overflow-hidden">
                <div className="text-center relative">
                  
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

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <label className="w-full py-2 px-3 rounded-xl bg-yellow-100/70 hover:bg-yellow-200/70 text-amber-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                      <Palette className="w-4 h-4 text-amber-600" />
                      {studentInfo.customBgUrl ? 'Thay Nền Cá Nhân' : 'Upload Hình Nền Tùy Chỉnh'}
                      <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                    </label>
                    {studentInfo.customBgUrl && (
                      <button 
                        onClick={() => setStudentInfo(p => ({ ...p, customBgUrl: '' }))}
                        className="text-[10px] text-pink-500 hover:underline mt-1.5 block mx-auto"
                      >
                        Khôi phục Nền Mặc Định
                      </button>
                    )}
                  </div>

                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl">
                <h3 className="font-bold text-slate-800 text-xs md:text-sm flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-pink-500" /> DASHBOARD TỔNG HỢP 4 NĂM
                </h3>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-400 via-pink-500 to-yellow-300 text-white shadow-md mb-4 text-center">
                  <p className="text-[11px] font-medium opacity-90">Điểm Trung Bình Toàn Khóa</p>
                  <div className="text-3xl font-black my-1">{calculateOverallAverage()} <span className="text-sm font-normal">/ 100</span></div>
                  <span className={`inline-block text-[11px] font-bold px-3 py-0.5 rounded-full border shadow-sm ${getGradeRank(calculateOverallAverage()).color}`}>
                    Xếp Loại: {getGradeRank(calculateOverallAverage()).title}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {YEARS.map(y => {
                    const yearAvg = calculateYearAverage(y);
                    const rank = getGradeRank(yearAvg);
                    return (
                      <div key={y} className="p-3 rounded-2xl bg-pink-50/40 border border-pink-100 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-700">Năm {y}</span>
                          <span className="text-[10px] text-slate-400 block">3 Học kỳ</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-pink-600 text-sm">{yearAvg} đ</span>
                          <span className={`block text-[9px] font-bold px-1.5 py-0.2 rounded border ${rank.color}`}>
                            {rank.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* CỘT PHẢI: BẢNG TÍNH ĐIỂM CHI TIẾT */}
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-pink-100 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                  <Calendar className="w-5 h-5 text-pink-500 shrink-0" />
                  <div className="flex bg-pink-50 p-1 rounded-2xl border border-pink-100 shrink-0">
                    {YEARS.map(y => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                          selectedYear === y ? 'bg-pink-500 text-white shadow-sm' : 'text-slate-600 hover:text-pink-600'
                        }`}
                      >
                        Năm {y}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-yellow-500 shrink-0" />
                  <div className="flex bg-yellow-50 p-1 rounded-2xl border border-yellow-100">
                    {SEMESTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSemester(s)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                          selectedSemester === s ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-amber-600'
                        }`}
                      >
                        Học Kỳ {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Bảng Điểm Rèn Luyện: Năm {selectedYear} - Học Kỳ {selectedSemester}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Tự động cộng tối đa theo quy định OU</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-2xl font-black text-pink-600">{currentSemesterScore}</span>
                    <span className="text-xs font-semibold text-slate-400"> / 100 đ</span>
                    <span className={`block text-[10px] font-bold px-2 py-0.5 rounded-md border ${getGradeRank(currentSemesterScore).color}`}>
                      Xếp loại: {getGradeRank(currentSemesterScore).title}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-pink-200 transition active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" /> Thêm Nhiệm Vụ & Minh Chứng
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {OU_CRITERIA_GROUPS.map(group => {
                  const groupScore = currentGroupTotals[group.id] || 0;
                  const groupItems = DEFAULT_CRITERIA_ITEMS.filter(item => item.groupId === group.id);
                  const customItems = (semestersData[currentSemKey]?.customTasks || []).filter(t => t.groupId === group.id);

                  return (
                    <div key={group.id} className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-pink-100 shadow-lg">
                      <div className="flex justify-between items-center border-b border-pink-100 pb-3 mb-3">
                        <h3 className="font-bold text-slate-800 text-xs md:text-sm text-pink-600">
                          {group.title}
                        </h3>
                        <div className="text-xs font-extrabold text-slate-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
                          {Math.min(groupScore, group.maxPoints)} / {group.maxPoints} đ
                        </div>
                      </div>

                      <div className="space-y-3">
                        {groupItems.map(item => {
                          const currentScore = semestersData[currentSemKey]?.scores?.[item.id] ?? (item.defaultChecked ? item.defaultScore : 0);
                          const isChecked = currentScore > 0;

                          return (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-pink-50/30 transition text-xs border border-transparent hover:border-pink-100">
                              <div className="flex items-start gap-2.5 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleDefaultScoreChange(item.id, e.target.checked ? item.defaultScore : 0)}
                                  className="mt-0.5 rounded border-pink-300 text-pink-500 focus:ring-pink-400 w-4 h-4 cursor-pointer"
                                />
                                <div>
                                  <span className={`font-medium ${isChecked ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {item.title}
                                  </span>
                                  {item.note && <span className="text-[10px] text-pink-500 block italic">{item.note}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {item.isScoreInput ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max={item.maxScore}
                                    value={currentScore}
                                    onChange={(e) => handleDefaultScoreChange(item.id, e.target.value)}
                                    className="w-14 px-2 py-1 border border-pink-200 rounded-xl text-center text-xs font-bold text-pink-600"
                                  />
                                ) : (
                                  <span className="font-bold text-slate-600 w-12 text-right">
                                    +{item.defaultScore}đ
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {customItems.map(task => (
                          <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800">{task.title}</span>
                                <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-medium">{task.date}</span>
                              </div>
                              {task.note && <p className="text-[11px] text-slate-500">{task.note}</p>}
                              
                              {task.evidenceData && (
                                <div className="mt-1 flex items-center gap-2">
                                  <Paperclip className="w-3.5 h-3.5 text-pink-500" />
                                  <a 
                                    href={task.evidenceData} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[11px] text-pink-600 hover:underline font-semibold flex items-center gap-1"
                                  >
                                    Xem Minh Chứng ({task.evidenceName})
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-amber-600">+{task.score}đ</span>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-slate-400 hover:text-red-500 p-1 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        )}
      </main>

      {/* MODAL THÊM NHIỆM VỤ */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-pink-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-pink-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-pink-500" /> Thêm Hoạt Động & Minh Chứng Mới
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tên hoạt động / Nhiệm vụ</label>
                <input
                  type="text"
                  placeholder="VD: Tham gia dọn dẹp vệ sinh khuôn viên OU"
                  value={newTask.title}
                  onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-pink-200 text-xs focus:ring-2 focus:ring-pink-300 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nhóm Điều</label>
                  <select
                    value={newTask.groupId}
                    onChange={(e) => setNewTask(p => ({ ...p, groupId: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl border border-pink-200 text-xs font-medium"
                  >
                    {OU_CRITERIA_GROUPS.map(g => (
                      <option key={g.id} value={g.id}>{g.title.slice(0, 18)}...</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm cộng</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newTask.score}
                    onChange={(e) => setNewTask(p => ({ ...p, score: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-pink-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày tham gia</label>
                <input
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Upload Minh Chứng (Ảnh / PDF ≤ 2.5MB)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleEvidenceFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold shadow-md shadow-pink-200"
                >
                  Lưu Nhiệm Vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TỰ ĐỘNG ĐIỀN TÀI KHOẢN */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-pink-100 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-pink-100 pb-2">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-pink-500" /> Chọn Tài Khoản Đã Lưu
              </h3>
              <button onClick={() => setShowAutoFillModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectAutoFillAccount(acc)}
                  className="p-3 rounded-2xl bg-pink-50/50 hover:bg-pink-100/70 border border-pink-100 cursor-pointer transition flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 text-xs block">{acc.name || 'Sinh Viên OU'}</span>
                    <span className="text-[11px] text-pink-600 font-extrabold">MSSV: {acc.mssv}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-pink-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
